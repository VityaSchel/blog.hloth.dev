package store

import (
	"encoding/json"
	"maps"
	"os"
	"path/filepath"
	"reflect"
	"slices"
	"testing"
	"time"
)

var noon = time.Date(2026, 10, 2, 12, 0, 0, 0, time.UTC)

func statePath(t *testing.T) string {
	t.Helper()
	return filepath.Join(t.TempDir(), "state.json")
}

func open(t *testing.T, path string) *Store {
	t.Helper()
	s, err := Open(path)
	if err != nil {
		t.Fatalf("Open: %v", err)
	}
	return s
}

func must(t *testing.T, err error) {
	t.Helper()
	if err != nil {
		t.Fatal(err)
	}
}

func readFile(t *testing.T, path string) string {
	t.Helper()
	data, err := os.ReadFile(path)
	must(t, err)
	return string(data)
}

func writeState(t *testing.T, path string, document any) {
	t.Helper()
	data, err := json.Marshal(document)
	must(t, err)
	must(t, os.WriteFile(path, data, 0o600))
}

func dirEntries(t *testing.T, path string) []string {
	t.Helper()
	entries, err := os.ReadDir(filepath.Dir(path))
	must(t, err)
	names := []string{}
	for _, entry := range entries {
		names = append(names, entry.Name())
	}
	return names
}

func expectOnlyStateFile(t *testing.T, path string) {
	t.Helper()
	if entries := dirEntries(t, path); !slices.Equal(entries, []string{filepath.Base(path)}) {
		t.Errorf("directory holds %v, want only %s", entries, filepath.Base(path))
	}
}

func decodeFile(path string) (state, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return state{}, err
	}
	var st state
	err = st.decode(data)
	return st, err
}

func stateOnDisk(t *testing.T, path string) state {
	t.Helper()
	st, err := decodeFile(path)
	must(t, err)
	return st
}

var testSubscription = Subscription{P256dh: "key", Auth: "secret"}

func subscribe(t *testing.T, s *Store, endpoints ...string) {
	t.Helper()
	for _, endpoint := range endpoints {
		must(t, s.Subscribe(endpoint, testSubscription))
	}
}

func populate(t *testing.T, s *Store) {
	t.Helper()
	expiresAt := time.Date(2027, 1, 1, 0, 0, 0, 0, time.UTC)
	s.IssueChallenge("client", noon)
	_, err := s.AddReaction("post", "👍")
	must(t, err)
	_, err = s.AddView("post", "v1", noon)
	must(t, err)
	must(t, s.Subscribe("https://push.example/a", Subscription{P256dh: "key", Auth: "secret", ExpiresAt: &expiresAt}))
	_, err = s.SeedNotified([]string{"old"})
	must(t, err)
	_, err = s.Enqueue("new", json.RawMessage(`{"id": "new", "title": "<b> & co"}`), noon)
	must(t, err)
}

const populated = `{"reactions":{"post":{"👍":1}},"views":{"post":1},"visitors":{"day":"2026-10-02","seen":["v1"]},` +
	`"challenges":{"client":[1790942400000000000]},` +
	`"subscriptions":{"https://push.example/a":{"p256dh":"key","auth":"secret","expiresAt":"2027-01-01T00:00:00Z"}},` +
	`"notified":{"old":0},` +
	`"broadcasts":[{"postId":"new","payload":{"id":"new","title":"<b> & co"},"startedAt":"2026-10-02T12:00:00Z","sent":0,"pending":["https://push.example/a"]}]}` + "\n"

func TestOpenMissingFileWritesNothingUntilFirstChange(t *testing.T) {
	path := statePath(t)
	s := open(t, path)

	if got := s.Reactions("post"); got == nil || len(got) != 0 {
		t.Errorf("Reactions = %v, want empty non-nil map", got)
	}
	if got := s.Views("post"); got != 0 {
		t.Errorf("Views = %d, want 0", got)
	}
	if got := s.Broadcasts(); len(got) != 0 {
		t.Errorf("Broadcasts = %v, want none", got)
	}
	if _, ok := s.Subscription("https://push.example/a"); ok {
		t.Error("Subscription found in an empty store")
	}

	existed, err := s.Unsubscribe("https://push.example/a")
	if existed || err != nil {
		t.Errorf("Unsubscribe = %v, %v, want false, nil", existed, err)
	}
	must(t, s.Settle("post", "https://push.example/a", true))
	must(t, s.Finish("post"))
	if entries := dirEntries(t, path); len(entries) != 0 {
		t.Fatalf("no-op mutations wrote %v", entries)
	}

	_, err = s.AddReaction("post", "👍")
	must(t, err)
	expectOnlyStateFile(t, path)
}

func TestFileFormat(t *testing.T) {
	path := statePath(t)
	populate(t, open(t, path))
	if got := readFile(t, path); got != populated {
		t.Errorf("state file:\n got %s\nwant %s", got, populated)
	}
}

func TestRoundTripThroughReopen(t *testing.T) {
	path := statePath(t)
	populate(t, open(t, path))
	s := open(t, path)

	if got, want := s.Reactions("post"), map[string]int{"👍": 1}; !maps.Equal(got, want) {
		t.Errorf("Reactions = %v, want %v", got, want)
	}
	if got := s.Views("post"); got != 1 {
		t.Errorf("Views = %d, want 1", got)
	}
	if got, err := s.AddView("post", "v1", noon); got != 1 || err != nil {
		t.Errorf("repeat AddView = %d, %v, want the visitor remembered across the reopen", got, err)
	}
	sub, ok := s.Subscription("https://push.example/a")
	if !ok || sub.P256dh != "key" || sub.Auth != "secret" || sub.ExpiresAt == nil ||
		!sub.ExpiresAt.Equal(time.Date(2027, 1, 1, 0, 0, 0, 0, time.UTC)) {
		t.Errorf("Subscription = %+v, %v", sub, ok)
	}
	if seeded, err := s.SeedNotified([]string{"other"}); seeded || err != nil {
		t.Errorf("SeedNotified after reopen = %v, %v, want false, nil", seeded, err)
	}
	want := []Broadcast{{
		PostID:    "new",
		Payload:   json.RawMessage(`{"id":"new","title":"<b> & co"}`),
		StartedAt: noon,
		Pending:   []string{"https://push.example/a"},
	}}
	if got := s.Broadcasts(); !reflect.DeepEqual(got, want) {
		t.Errorf("Broadcasts = %+v, want %+v", got, want)
	}

	subscribe(t, s, "https://push.example/b")
	_, err := s.Unsubscribe("https://push.example/b")
	must(t, err)
	if got := readFile(t, path); got != populated {
		t.Errorf("file changed after a rewrite of the same state:\n got %s\nwant %s", got, populated)
	}
}

func TestOpenAcceptsSparseDocuments(t *testing.T) {
	documents := map[string]string{
		"empty object": `{}`,
		"nulls":        `{"reactions":{"post":null},"views":null,"visitors":{"day":"","seen":null},"subscriptions":null,"notified":null,"broadcasts":null}`,
		"null pending": `{"broadcasts":[{"postId":"queued","payload":{},"startedAt":"2026-10-02T12:00:00Z","sent":0,"pending":null}]}`,
	}
	for name, document := range documents {
		t.Run(name, func(t *testing.T) {
			path := statePath(t)
			must(t, os.WriteFile(path, []byte(document), 0o600))
			s := open(t, path)
			populate(t, s)
			must(t, s.Settle("new", "https://push.example/a", true))
			must(t, s.Finish("new"))
			must(t, s.Finish("queued"))
			if got := open(t, path).Reactions("post")["👍"]; got != 1 {
				t.Errorf("reaction count after reopen = %d, want 1", got)
			}
		})
	}
}

func TestOpenRefusesCorruptFile(t *testing.T) {
	documents := map[string]string{
		"empty":            "",
		"whitespace":       " \n",
		"zeroed":           "\x00\x00\x00\x00",
		"garbage":          "not json",
		"truncated":        populated[:len(populated)/2],
		"trailing object":  `{} {}`,
		"trailing garbage": `{}x`,
		"null":             `null`,
		"array":            `[]`,
		"unknown field":    `{"subscribtions":{}}`,
		"wrong type":       `{"views":{"post":"many"}}`,
		"non-RFC 3339":     `{"subscriptions":{"https://push.example/a":{"p256dh":"k","auth":"a","expiresAt":"2027-01-01 00:00:00+00"}}}`,
		"challenge list":   `{"challenges":[]}`,
		"challenge time":   `{"challenges":{"client":["2026-10-02T12:00:00Z"]}}`,
		"fractional time":  `{"challenges":{"client":[1.5]}}`,
	}
	for name, document := range documents {
		t.Run(name, func(t *testing.T) {
			path := statePath(t)
			must(t, os.WriteFile(path, []byte(document), 0o600))
			if s, err := Open(path); err == nil {
				t.Fatalf("Open succeeded with %+v", s.state)
			}
			if got := readFile(t, path); got != document {
				t.Errorf("corrupt file was modified: %q", got)
			}
		})
	}
}

func TestOpenRemovesLeftoverTempFile(t *testing.T) {
	path := statePath(t)
	populate(t, open(t, path))
	must(t, os.WriteFile(path+tempSuffix, []byte(`{"views":{"post":9`), 0o644))

	s := open(t, path)
	if got := s.Views("post"); got != 1 {
		t.Errorf("Views = %d, want 1 from the real file", got)
	}
	expectOnlyStateFile(t, path)
}
