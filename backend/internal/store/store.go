package store

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path/filepath"
	"sync"
	"time"
)

type state struct {
	Reactions     map[string]map[string]int `json:"reactions"`
	Views         map[string]int            `json:"views"`
	Visitors      visitors                  `json:"visitors"`
	Challenges    map[string][]int64        `json:"challenges"`
	Subscriptions map[string]Subscription   `json:"subscriptions"`
	Notified      map[string]int            `json:"notified"`
	Broadcasts    []Broadcast               `json:"broadcasts"`

	storedIssues    int
	challengesSwept time.Time
}

type Store struct {
	path  string
	write func(path string, data []byte) error

	mu      sync.RWMutex
	state   state
	version uint64

	flushMu sync.Mutex
	flushed uint64
}

func Open(path string) (*Store, error) {
	if err := checkWritable(filepath.Dir(path)); err != nil {
		return nil, err
	}
	s := &Store{path: path, write: writeFile}
	data, err := os.ReadFile(path)
	switch {
	case errors.Is(err, fs.ErrNotExist):
	case err != nil:
		return nil, err
	default:
		if err := s.state.decode(data); err != nil {
			return nil, fmt.Errorf("store: %s: %w", path, err)
		}
	}
	s.state.normalize()
	os.Remove(path + tempSuffix)
	return s, nil
}

func (st *state) decode(data []byte) error {
	dec := json.NewDecoder(bytes.NewReader(data))
	dec.DisallowUnknownFields()
	var decoded *state
	if err := dec.Decode(&decoded); err != nil {
		return err
	}
	if decoded == nil {
		return errors.New("not a state document")
	}
	if _, err := dec.Token(); err != io.EOF {
		return errors.New("trailing data")
	}
	*st = *decoded
	return nil
}

// The UTC instant without a monotonic reading is what a reopen decodes, so memory and disk agree.
func storedTime(t time.Time) time.Time { return t.UTC().Round(0) }

// HTML escaping would grow a stored broadcast payload past the size its sender measured.
func encode(v any) ([]byte, error) {
	var buf bytes.Buffer
	enc := json.NewEncoder(&buf)
	enc.SetEscapeHTML(false)
	err := enc.Encode(v)
	return buf.Bytes(), err
}

func (st *state) normalize() {
	if st.Reactions == nil {
		st.Reactions = map[string]map[string]int{}
	}
	if st.Views == nil {
		st.Views = map[string]int{}
	}
	if st.Subscriptions == nil {
		st.Subscriptions = map[string]Subscription{}
	}
	st.Visitors.normalize()
	if st.Broadcasts == nil {
		st.Broadcasts = []Broadcast{}
	}
	st.normalizeChallenges()
}
