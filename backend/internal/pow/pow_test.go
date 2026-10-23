package pow

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"maps"
	"regexp"
	"slices"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"blog.hloth.dev/backend/internal/testkit"
)

const (
	testIP       = "203.0.113.7"
	testPost     = "hello-world"
	testReaction = "👍"
	noneHeader   = `{"alg":"none","typ":"JWT"}`
)

var (
	testSecret = []byte("0123456789abcdef0123456789abcdef")
	testPepper = []byte("pepper0123456789abcdef0123456789")
)

type clock struct{ at time.Time }

func (c *clock) advance(d time.Duration) { c.at = c.at.Add(d) }

type history struct {
	mu     sync.Mutex
	issued map[string][]time.Time
}

func (h *history) IssueChallenge(key string, now time.Time) int {
	h.mu.Lock()
	defer h.mu.Unlock()
	recent := len(h.issued[key])
	h.issued[key] = append(h.issued[key], now)
	return recent
}

type historyFunc func(key string, now time.Time) int

func (f historyFunc) IssueChallenge(key string, now time.Time) int { return f(key, now) }

func newService() (*Service, *clock) {
	return newServiceWith(&history{issued: map[string][]time.Time{}})
}

func newServiceWith(h History) (*Service, *clock) {
	c := &clock{at: time.Date(2026, 10, 2, 12, 0, 0, 0, time.UTC)}
	s := New(testSecret, testPepper, h)
	s.now = func() time.Time { return c.at }
	return s, c
}

func issue(t *testing.T, s *Service, ip, postID, reaction string) (string, challenge) {
	t.Helper()
	token := s.Challenge(ip, postID, reaction)
	return token, testkit.TokenPayload[challenge](t, token)
}

func solve(c challenge) []uint64 { return testkit.Solve(c.Rounds, c.Difficulty) }

func encode(data []byte) string { return base64.RawURLEncoding.EncodeToString(data) }

func TestChallengeFormat(t *testing.T) {
	s, clock := newService()
	token, _ := issue(t, s, testIP, testPost, testReaction)
	parts := strings.Split(token, ".")

	if parts[0] != "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" {
		t.Errorf("header = %q", parts[0])
	}
	mac := hmac.New(sha256.New, testSecret)
	mac.Write([]byte(parts[0] + "." + parts[1]))
	if signature, err := base64.RawURLEncoding.DecodeString(parts[2]); err != nil || !hmac.Equal(signature, mac.Sum(nil)) {
		t.Errorf("signature is not HMAC-SHA256 over header.payload (decode error: %v)", err)
	}

	raw, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		t.Fatal(err)
	}
	var payload map[string]any
	decoder := json.NewDecoder(bytes.NewReader(raw))
	decoder.UseNumber()
	if err := decoder.Decode(&payload); err != nil {
		t.Fatalf("payload %s: %v", raw, err)
	}
	wantKeys := []string{"clientId", "difficulty", "exp", "id", "reaction", "rounds"}
	if keys := slices.Sorted(maps.Keys(payload)); !slices.Equal(keys, wantKeys) {
		t.Errorf("payload keys = %v, want %v", keys, wantKeys)
	}
	id, _ := payload["id"].(string)
	if id == "" {
		t.Errorf("id = %v", payload["id"])
	}
	for key, want := range map[string]any{
		"reaction":   testReaction,
		"difficulty": json.Number("8"),
		"exp":        json.Number(strconv.FormatInt(clock.at.Add(time.Minute).Unix(), 10)),
		"clientId":   clientID(testIP, testPost, testReaction),
	} {
		if payload[key] != want {
			t.Errorf("%s = %#v, want %#v", key, payload[key], want)
		}
	}
	rounds, _ := payload["rounds"].([]any)
	if len(rounds) != 50 {
		t.Fatalf("got %d rounds, want 50", len(rounds))
	}
	hexRound := regexp.MustCompile(`^[0-9a-f]{32}$`)
	seen := map[string]bool{}
	for _, value := range rounds {
		round, _ := value.(string)
		if !hexRound.MatchString(round) || seen[round] {
			t.Errorf("round %#v is malformed or repeated", value)
		}
		seen[round] = true
	}

	_, next := issue(t, s, testIP, testPost, testReaction)
	if next.ID == id || seen[next.Rounds[0]] {
		t.Error("two challenges share an id or a round")
	}
}

type submission struct {
	token                string
	solutions            []uint64
	ip, postID, reaction string
}

func (sub submission) verify(s *Service) bool {
	return s.Verify(sub.token, sub.solutions, sub.ip, sub.postID, sub.reaction)
}

func TestVerify(t *testing.T) {
	s, _ := newService()
	token, c := issue(t, s, testIP, testPost, testReaction)
	valid := submission{token, solve(c), testIP, testPost, testReaction}
	parts := strings.Split(token, ".")
	resign := func(edit func(*challenge)) []byte {
		edited := c
		edit(&edited)
		payload, err := json.Marshal(edited)
		if err != nil {
			t.Fatal(err)
		}
		return payload
	}
	insufficient := uint64(0)
	for testkit.LeadingZeroBits(c.Rounds[0], insufficient) >= c.Difficulty {
		insufficient++
	}

	rejected := []struct {
		name  string
		alter func(*submission)
	}{
		{"wrong reaction", func(sub *submission) { sub.reaction = "👎" }},
		{"wrong ip", func(sub *submission) { sub.ip = "198.51.100.1" }},
		{"wrong post", func(sub *submission) { sub.postID = "other-post" }},
		{"signed for another reaction", func(sub *submission) {
			sub.token = s.sign(resign(func(c *challenge) { c.Reaction = "👎" }))
		}},
		{"tampered payload", func(sub *submission) {
			easier := resign(func(c *challenge) { c.Difficulty = 0 })
			sub.token = parts[0] + "." + encode(easier) + "." + parts[2]
		}},
		{"tampered signature", func(sub *submission) {
			flipped := "A"
			if parts[2][0] == 'A' {
				flipped = "B"
			}
			sub.token = parts[0] + "." + parts[1] + "." + flipped + parts[2][1:]
		}},
		{"signed with another secret", func(sub *submission) {
			sub.token = New([]byte("fedcba9876543210fedcba9876543210"), testPepper, s.history).sign(resign(func(*challenge) {}))
		}},
		{"alg none without signature", func(sub *submission) {
			sub.token = encode([]byte(noneHeader)) + "." + parts[1] + "."
		}},
		{"alg none with a valid mac", func(sub *submission) {
			message := encode([]byte(noneHeader)) + "." + parts[1]
			sub.token = message + "." + s.mac(message)
		}},
		{"signature stripped", func(sub *submission) { sub.token = parts[0] + "." + parts[1] }},
		{"empty token", func(sub *submission) { sub.token = "" }},
		{"missing solution", func(sub *submission) { sub.solutions = sub.solutions[:len(sub.solutions)-1] }},
		{"extra solution", func(sub *submission) { sub.solutions = append(sub.solutions, 0) }},
		{"no solutions", func(sub *submission) { sub.solutions = nil }},
		{"insufficient solution", func(sub *submission) { sub.solutions[0] = insufficient }},
		{"solution above 2^53-1", func(sub *submission) {
			sub.solutions[0] = testkit.Grind(c.Rounds[0], c.Difficulty, MaxSolution+1)
		}},
	}
	for _, test := range rejected {
		t.Run(test.name, func(t *testing.T) {
			sub := valid
			sub.solutions = slices.Clone(valid.solutions)
			test.alter(&sub)
			if sub.verify(s) {
				t.Error("accepted")
			}
		})
	}

	if !valid.verify(s) {
		t.Fatal("valid submission rejected")
	}
	if valid.verify(s) {
		t.Error("replay accepted")
	}
}

func TestVerifyExpiry(t *testing.T) {
	for _, test := range []struct {
		name    string
		elapsed time.Duration
		want    bool
	}{
		{"immediately", 0, true},
		{"last second", time.Minute - time.Second, true},
		{"at expiry", time.Minute, false},
		{"long after", time.Hour, false},
	} {
		t.Run(test.name, func(t *testing.T) {
			s, clock := newService()
			token, c := issue(t, s, testIP, testPost, testReaction)
			clock.advance(test.elapsed)
			if got := s.Verify(token, solve(c), testIP, testPost, testReaction); got != test.want {
				t.Errorf("Verify = %v, want %v", got, test.want)
			}
		})
	}
}

func TestDifficultyRampsPerClient(t *testing.T) {
	s, clock := newService()
	for i, step := range []struct {
		wait                 time.Duration
		ip, postID, reaction string
		want                 int
	}{
		{0, testIP, testPost, testReaction, 8},
		{time.Hour, testIP, testPost, testReaction, 9},
		{0, "198.51.100.1", testPost, testReaction, 8},
		{0, testIP, "other-post", testReaction, 8},
		{0, testIP, testPost, "👎", 8},
		{23 * time.Hour, testIP, testPost, testReaction, 10},
	} {
		clock.advance(step.wait)
		if _, c := issue(t, s, step.ip, step.postID, step.reaction); c.Difficulty != step.want {
			t.Errorf("step %d: difficulty = %d, want %d", i, c.Difficulty, step.want)
		}
	}
}

func TestDifficultyFollowsHistory(t *testing.T) {
	for _, test := range []struct {
		recent, want int
	}{
		{0, 8},
		{1, 9},
		{24, 32},
		{200, 208},
		{247, 255},
		{248, 256},
		{249, 256},
		{1 << 20, 256},
	} {
		t.Run(strconv.Itoa(test.recent), func(t *testing.T) {
			var calls int
			var issuedAt time.Time
			s, clock := newServiceWith(historyFunc(func(_ string, now time.Time) int {
				calls++
				issuedAt = now
				return test.recent
			}))
			if _, c := issue(t, s, testIP, testPost, testReaction); c.Difficulty != test.want {
				t.Errorf("difficulty = %d, want %d", c.Difficulty, test.want)
			}
			if calls != 1 || !issuedAt.Equal(clock.at) {
				t.Errorf("history called %d times at %v, want once at %v", calls, issuedAt, clock.at)
			}
		})
	}
}

func TestHistoryKey(t *testing.T) {
	var keys []string
	s, _ := newServiceWith(historyFunc(func(key string, _ time.Time) int {
		keys = append(keys, key)
		return 0
	}))
	inputs := [][3]string{
		{testIP, testPost, testReaction},
		{testIP, testPost, testReaction},
		{"198.51.100.1", testPost, testReaction},
		{testIP, "other-post", testReaction},
		{testIP, testPost, "👎"},
		{"2001:db8:1:2::", testPost, testReaction},
	}
	for _, in := range inputs {
		issue(t, s, in[0], in[1], in[2])
	}

	if keys[0] != keys[1] {
		t.Errorf("the same client got the keys %q and %q", keys[0], keys[1])
	}
	if unique := len(slices.Compact(slices.Sorted(slices.Values(keys)))); unique != len(inputs)-1 {
		t.Errorf("keys %q: %d distinct, want %d", keys, unique, len(inputs)-1)
	}
	for i, key := range keys {
		raw, err := base64.RawURLEncoding.DecodeString(key)
		if err != nil || len(raw) != 16 {
			t.Errorf("key %q is not 16 base64url bytes", key)
		}
		ip, postID, reaction := inputs[i][0], inputs[i][1], inputs[i][2]
		client := clientID(ip, postID, reaction)
		mac := hmac.New(sha256.New, testPepper)
		mac.Write([]byte(client))
		if want := encode(mac.Sum(nil)[:16]); key != want {
			t.Errorf("key %q, want HMAC-SHA256(pepper, client ID) %q", key, want)
		}
		if strings.Contains(client, hex.EncodeToString(raw)) || strings.Contains(key, ip) {
			t.Errorf("key %q reveals client %s or IP %s", key, client, ip)
		}
	}

	other := New(testSecret, []byte("another pepper 0123456789abcdef!"), historyFunc(func(key string, _ time.Time) int {
		if key == keys[0] {
			t.Error("another pepper gave the same key")
		}
		return 0
	}))
	other.Challenge(testIP, testPost, testReaction)
}

func TestConcurrentReplay(t *testing.T) {
	s, _ := newService()
	token, c := issue(t, s, testIP, testPost, testReaction)
	solutions := solve(c)

	var accepted atomic.Int32
	var wg sync.WaitGroup
	for range 64 {
		wg.Go(func() {
			if s.Verify(token, solutions, testIP, testPost, testReaction) {
				accepted.Add(1)
			}
		})
	}
	wg.Wait()
	if accepted.Load() != 1 {
		t.Errorf("%d submissions accepted, want exactly 1", accepted.Load())
	}
}

func TestConcurrentChallenges(t *testing.T) {
	s, _ := newService()
	var wg sync.WaitGroup
	tokens := make([]string, 40)
	for i := range tokens {
		wg.Go(func() { tokens[i] = s.Challenge(testIP, testPost, testReaction) })
	}
	wg.Wait()

	difficulties := make([]int, len(tokens))
	for i, token := range tokens {
		difficulties[i] = testkit.TokenPayload[challenge](t, token).Difficulty
	}
	slices.Sort(difficulties)
	for i, difficulty := range difficulties {
		if difficulty != 8+i {
			t.Fatalf("difficulties = %v, want each of 8..47 once", difficulties)
		}
	}
}

func TestRedeemedIDsAreDroppedAfterExpiry(t *testing.T) {
	s, clock := newService()
	token, c := issue(t, s, testIP, testPost, testReaction)
	solutions := solve(c)
	if !s.Verify(token, solutions, testIP, testPost, testReaction) || len(s.redeemed) != 1 {
		t.Fatalf("redeemed = %v after a valid submission", s.redeemed)
	}
	clock.advance(2 * time.Minute)
	issue(t, s, "198.51.100.1", testPost, testReaction)
	if len(s.redeemed) != 0 {
		t.Errorf("redeemed = %v, want empty", s.redeemed)
	}
	if s.Verify(token, solutions, testIP, testPost, testReaction) {
		t.Error("replay accepted after the id was dropped")
	}
}

func TestClientID(t *testing.T) {
	const want = "253683713a7a6c79a03e95065615a5056f57beb8211797630cbba071b18adcf1"
	id := clientID(testIP, testPost, testReaction)
	if !regexp.MustCompile(`^[0-9a-f]{64}$`).MatchString(id) {
		t.Errorf("clientID = %q is not 64 lowercase hex digits", id)
	}
	if id != want {
		t.Errorf("clientID = %s, want %s", id, want)
	}
}

func TestSolves(t *testing.T) {
	const round = "00112233445566778899aabbccddeeff"
	for _, nonce := range []uint64{0, 1, 2, testkit.Grind(round, 8, 0), testkit.Grind(round, 13, 0), MaxSolution} {
		zeros := testkit.LeadingZeroBits(round, nonce)
		if !solves(round, nonce, 0) || !solves(round, nonce, zeros) || solves(round, nonce, zeros+1) {
			t.Errorf("nonce %d with %d leading zero bits is misjudged", nonce, zeros)
		}
	}
}
