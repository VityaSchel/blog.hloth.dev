package store

import (
	"bytes"
	"encoding/json"
	"fmt"
	"maps"
	"slices"
	"time"
)

type Broadcast struct {
	PostID    string          `json:"postId"`
	Payload   json.RawMessage `json:"payload"`
	StartedAt time.Time       `json:"startedAt"`
	Sent      int             `json:"sent"`
	Pending   []string        `json:"pending"`
}

func (s *Store) SeedNotified(postIDs []string) (bool, error) {
	seeded := false
	err := s.mutate(func() bool {
		if s.state.Notified != nil {
			return false
		}
		s.state.Notified = make(map[string]int, len(postIDs))
		for _, postID := range postIDs {
			s.state.Notified[postID] = 0
		}
		seeded = true
		return true
	})
	return seeded, err
}

func (s *Store) Enqueue(postID string, payload json.RawMessage, now time.Time) (bool, error) {
	stored, err := encode(payload)
	if err != nil {
		return false, fmt.Errorf("store: broadcast payload: %w", err)
	}
	stored = bytes.TrimSuffix(stored, []byte("\n"))
	queued := false
	err = s.mutate(func() bool {
		if _, notified := s.state.Notified[postID]; notified || s.queueIndex(postID) >= 0 {
			return false
		}
		s.state.dropExpiredSubscriptions(now)
		pending := slices.AppendSeq(make([]string, 0, len(s.state.Subscriptions)), maps.Keys(s.state.Subscriptions))
		slices.Sort(pending)
		s.state.Broadcasts = append(s.state.Broadcasts, Broadcast{
			PostID:    postID,
			Payload:   stored,
			StartedAt: storedTime(now),
			Pending:   pending,
		})
		queued = true
		return true
	})
	return queued, err
}

func (s *Store) Broadcasts() []Broadcast {
	s.mu.RLock()
	defer s.mu.RUnlock()
	broadcasts := make([]Broadcast, len(s.state.Broadcasts))
	for i, b := range s.state.Broadcasts {
		b.Payload = slices.Clone(b.Payload)
		b.Pending = slices.Clone(b.Pending)
		broadcasts[i] = b
	}
	return broadcasts
}

func (s *Store) Settle(postID, endpoint string, sent bool) error {
	return s.mutate(func() bool {
		i := s.queueIndex(postID)
		if i < 0 {
			return false
		}
		b := &s.state.Broadcasts[i]
		j := slices.Index(b.Pending, endpoint)
		if j < 0 {
			return false
		}
		b.Pending = slices.Delete(b.Pending, j, j+1)
		if sent {
			b.Sent++
		}
		return true
	})
}

func (s *Store) Finish(postID string) error {
	return s.mutate(func() bool {
		i := s.queueIndex(postID)
		if i < 0 {
			return false
		}
		if s.state.Notified == nil {
			s.state.Notified = map[string]int{}
		}
		b := s.state.Broadcasts[i]
		// Endpoints still pending failed every attempt for the whole lifetime;
		// if nothing was sent at all the fault is ours, so nobody is dropped.
		if b.Sent > 0 {
			for _, endpoint := range b.Pending {
				delete(s.state.Subscriptions, endpoint)
			}
		}
		s.state.Notified[postID] = b.Sent
		s.state.Broadcasts = slices.Delete(s.state.Broadcasts, i, i+1)
		return true
	})
}

func (s *Store) queueIndex(postID string) int {
	return slices.IndexFunc(s.state.Broadcasts, func(b Broadcast) bool { return b.PostID == postID })
}
