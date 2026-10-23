package api

import (
	"encoding/json"
	"errors"
	"io/fs"
	"maps"
	"os"
	"regexp"
	"slices"
	"testing"

	"blog.hloth.dev/backend/internal/testkit"
)

func TestReactionsMatchSharedPackage(t *testing.T) {
	const path = "../../../shared/src/reactions.ts"
	source, err := os.ReadFile(path)
	if errors.Is(err, fs.ErrNotExist) {
		t.Skipf("%s is absent: cannot compare the reactions with the frontend's list", path)
	}
	if err != nil {
		t.Fatal(err)
	}
	list := regexp.MustCompile(`(?s)export const reactions = \[(.*?)\] as const;`).FindSubmatch(source)
	if list == nil {
		t.Fatalf("%s has no reactions array", path)
	}
	var shared []string
	for _, entry := range regexp.MustCompile(`"([^"]+)"`).FindAllSubmatch(list[1], -1) {
		shared = append(shared, string(entry[1]))
	}
	if len(shared) != 14 {
		t.Fatalf("parsed %d reactions from %s, want 14", len(shared), path)
	}
	if !slices.Equal(shared, reactions[:]) {
		t.Fatalf("reactions differ from %s:\n got %q\nwant %q", path, reactions, shared)
	}
}

func TestReactionCounts(t *testing.T) {
	counted := reactions[2]
	counts := reactionCounts(map[string]int{counted: 3, "not a reaction": 9})
	if len(counts) != len(reactions) {
		t.Fatalf("got %d keys, want %d", len(counts), len(reactions))
	}
	for _, reaction := range reactions {
		want := 0
		if reaction == counted {
			want = 3
		}
		if got, ok := counts[reaction]; !ok || got != want {
			t.Errorf("counts[%q] = %d, %v; want %d", reaction, got, ok, want)
		}
	}
	if validReaction("not a reaction") || validReaction("") || !validReaction(reactions[len(reactions)-1]) {
		t.Fatal("validReaction accepts or rejects the wrong strings")
	}
}

type claims struct {
	Difficulty int      `json:"difficulty"`
	ClientID   string   `json:"clientId"`
	Rounds     []string `json:"rounds"`
}

func (a *api) challenge(t *testing.T, postID, reaction, ip string) string {
	t.Helper()
	body := jsonBody(map[string]string{"reaction": reaction})
	res := a.send(t, "POST", "/posts/"+postID+"/reactions/challenge", body, "Origin", testOrigin, "X-Forwarded-For", ip)
	var answer struct {
		Challenge string `json:"challenge"`
	}
	if err := json.Unmarshal([]byte(res.body), &answer); err != nil || res.status != 200 || answer.Challenge == "" {
		t.Fatalf("challenge: %d %s", res.status, res.body)
	}
	return answer.Challenge
}

func reactionBody(challenge string, solutions []uint64, reaction string) string {
	return jsonBody(map[string]any{"challenge": challenge, "solutions": solutions, "reaction": reaction})
}

func TestReactionsDefaultToZero(t *testing.T) {
	a := newAPI(t, testkit.NewFakeFeed(t, testkit.Post("first")))
	res := a.send(t, "GET", "/posts/not-in-the-feed/reactions", "")
	var counts map[string]int
	if err := json.Unmarshal([]byte(res.body), &counts); err != nil || res.status != 200 {
		t.Fatalf("%d %s", res.status, res.body)
	}
	want := map[string]int{}
	for _, reaction := range reactions {
		want[reaction] = 0
	}
	if !maps.Equal(counts, want) {
		t.Fatalf("got %v, want all 14 reactions at 0", counts)
	}
}

func TestReactionFlow(t *testing.T) {
	a := newAPI(t, testkit.NewFakeFeed(t, testkit.Post("first"), testkit.Post("second")))
	reaction, other := reactions[1], reactions[13]
	const ip = "203.0.113.7"
	react := func(postID, body, ip string) response {
		return a.send(t, "POST", "/posts/"+postID+"/reactions", body, "Origin", testOrigin, "Content-Type", "application/json", "X-Forwarded-For", ip)
	}

	token := a.challenge(t, "first", reaction, ip)
	c := testkit.TokenPayload[claims](t, token)
	solutions := testkit.Solve(c.Rounds, c.Difficulty)
	body := reactionBody(token, solutions, reaction)

	react("first", body, "203.0.113.8").expect(t, 400, rejected)
	react("second", body, ip).expect(t, 400, rejected)
	react("first", reactionBody(token, solutions, other), ip).expect(t, 400, rejected)
	react("first", reactionBody(token, solutions[1:], reaction), ip).expect(t, 400, rejected)
	tooSmall := slices.Clone(solutions)
	tooSmall[slices.IndexFunc(tooSmall, func(solution uint64) bool { return solution > 0 })]--
	react("first", reactionBody(token, tooSmall, reaction), ip).expect(t, 400, rejected)
	react("first", reactionBody(token[:len(token)-2]+"AA", solutions, reaction), ip).expect(t, 400, rejected)
	if a.store.Reactions("first")[reaction] != 0 {
		t.Fatal("a rejected submission was counted")
	}

	res := react("first", body, ip)
	var accepted struct {
		OK        bool           `json:"ok"`
		Reactions map[string]int `json:"reactions"`
	}
	if err := json.Unmarshal([]byte(res.body), &accepted); err != nil || res.status != 200 || !accepted.OK {
		t.Fatalf("%d %s", res.status, res.body)
	}
	if len(accepted.Reactions) != len(reactions) || accepted.Reactions[reaction] != 1 || accepted.Reactions[other] != 0 {
		t.Fatalf("reactions = %v", accepted.Reactions)
	}
	react("first", body, ip).expect(t, 400, rejected)

	var listed map[string]int
	json.Unmarshal([]byte(a.send(t, "GET", "/posts/first/reactions", "").body), &listed)
	if !maps.Equal(listed, accepted.Reactions) {
		t.Fatalf("GET returned %v, POST returned %v", listed, accepted.Reactions)
	}
	if got := testkit.OpenStore(t, a.path).Reactions("first")[reaction]; got != 1 {
		t.Fatalf("after reopening the state file the count is %d, want 1", got)
	}
	if got := a.store.Reactions("second"); len(got) != 0 {
		t.Fatalf("another post was changed: %v", got)
	}
}

func TestChallengeDifficultySurvivesRestart(t *testing.T) {
	posts := testkit.NewFakeFeed(t, testkit.Post("first"))
	a := newAPI(t, posts)
	const ip = "203.0.113.7"
	reaction := reactions[0]
	var clientID string
	for want := 8; want <= 10; want++ {
		c := testkit.TokenPayload[claims](t, a.challenge(t, "first", reaction, ip))
		if c.Difficulty != want {
			t.Fatalf("difficulty = %d, want %d", c.Difficulty, want)
		}
		clientID = c.ClientID
	}
	if err := a.store.Flush(); err != nil {
		t.Fatal(err)
	}

	restarted := openAPI(t, posts, a.path)
	for _, step := range []struct {
		ip   string
		want int
	}{
		{ip, 11},
		{"203.0.113.8", 8},
		{ip, 12},
	} {
		if c := testkit.TokenPayload[claims](t, restarted.challenge(t, "first", reaction, step.ip)); c.Difficulty != step.want {
			t.Errorf("%s after the restart: difficulty = %d, want %d", step.ip, c.Difficulty, step.want)
		}
	}
	if err := restarted.store.Flush(); err != nil {
		t.Fatal(err)
	}

	a.expectStateOmits(t, clientID, clientID[:16], "203.0.113")
	var issued []int
	for _, times := range testkit.ReadState(t, a.path).Challenges {
		issued = append(issued, len(times))
	}
	slices.Sort(issued)
	if !slices.Equal(issued, []int{1, 5}) {
		t.Errorf("issue counts on disk = %v, want [1 5]", issued)
	}
}
