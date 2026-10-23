package store

import (
	"maps"
	"time"
)

const maxVisitorsPerDay = 200_000

type visitors struct {
	Day  string   `json:"day"`
	Seen []string `json:"seen"`
	set  map[string]struct{}
}

func newVisitors(day string) visitors {
	return visitors{Day: day, Seen: []string{}, set: map[string]struct{}{}}
}

func (v *visitors) normalize() {
	if v.Seen == nil {
		v.Seen = []string{}
	}
	v.set = make(map[string]struct{}, len(v.Seen))
	for _, visitor := range v.Seen {
		v.set[visitor] = struct{}{}
	}
}

func (s *Store) Reactions(postID string) map[string]int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	counts := make(map[string]int, len(s.state.Reactions[postID]))
	maps.Copy(counts, s.state.Reactions[postID])
	return counts
}

func (s *Store) AddReaction(postID, reaction string) (map[string]int, error) {
	var counts map[string]int
	err := s.mutate(func() bool {
		if s.state.Reactions[postID] == nil {
			s.state.Reactions[postID] = map[string]int{}
		}
		s.state.Reactions[postID][reaction]++
		counts = maps.Clone(s.state.Reactions[postID])
		return true
	})
	return counts, err
}

func (s *Store) Views(postID string) int {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.state.Views[postID]
}

func (s *Store) AddView(postID, visitor string, now time.Time) (int, error) {
	day := now.UTC().Format(time.DateOnly)
	var views int
	err := s.mutate(func() bool {
		v := &s.state.Visitors
		changed := v.Day != day
		if changed {
			*v = newVisitors(day)
		}
		if _, seen := v.set[visitor]; !seen && len(v.Seen) < maxVisitorsPerDay {
			v.Seen = append(v.Seen, visitor)
			v.set[visitor] = struct{}{}
			s.state.Views[postID]++
			changed = true
		}
		views = s.state.Views[postID]
		return changed
	})
	return views, err
}
