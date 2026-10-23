package testkit

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"

	"blog.hloth.dev/backend/internal/store"
)

func OpenStore(t *testing.T, path string) *store.Store {
	t.Helper()
	s, err := store.Open(path)
	if err != nil {
		t.Fatal(err)
	}
	return s
}

func StatePath(t *testing.T) string {
	t.Helper()
	return filepath.Join(t.TempDir(), "state.json")
}

type StateDocument struct {
	Reactions     map[string]map[string]int     `json:"reactions"`
	Views         map[string]int                `json:"views"`
	Challenges    map[string][]int64            `json:"challenges"`
	Subscriptions map[string]store.Subscription `json:"subscriptions"`
	Notified      map[string]int                `json:"notified"`
	Broadcasts    []store.Broadcast             `json:"broadcasts"`
}

func ReadState(t *testing.T, path string) StateDocument {
	t.Helper()
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	var doc StateDocument
	if err := json.Unmarshal(data, &doc); err != nil {
		t.Fatalf("state file is not valid JSON: %v", err)
	}
	return doc
}
