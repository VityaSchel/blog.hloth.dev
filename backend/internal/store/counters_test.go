package store

import (
	"maps"
	"slices"
	"testing"
	"time"
)

func TestAddReaction(t *testing.T) {
	path := statePath(t)
	s := open(t, path)
	for _, reaction := range []string{"👍", "👍", "❤️"} {
		_, err := s.AddReaction("post", reaction)
		must(t, err)
	}
	counts, err := s.AddReaction("other", "👍")
	must(t, err)
	if want := map[string]int{"👍": 1}; !maps.Equal(counts, want) {
		t.Errorf("AddReaction = %v, want %v", counts, want)
	}

	want := map[string]int{"👍": 2, "❤️": 1}
	if got := s.Reactions("post"); !maps.Equal(got, want) {
		t.Errorf("Reactions = %v, want %v", got, want)
	}
	if got := open(t, path).Reactions("post"); !maps.Equal(got, want) {
		t.Errorf("Reactions after reopen = %v, want %v", got, want)
	}
}

func TestReactionMapsAreCopies(t *testing.T) {
	s := open(t, statePath(t))
	added, err := s.AddReaction("post", "👍")
	must(t, err)
	added["👍"] = 100
	read := s.Reactions("post")
	read["👍"] = 100
	read["❤️"] = 100
	if got, want := s.Reactions("post"), map[string]int{"👍": 1}; !maps.Equal(got, want) {
		t.Errorf("Reactions = %v after callers changed their copies, want %v", got, want)
	}
}

func TestAddView(t *testing.T) {
	path := statePath(t)
	s := open(t, path)
	lateEvening := time.Date(2026, 10, 2, 23, 59, 59, 0, time.UTC)
	nextDayInUTC := time.Date(2026, 10, 2, 22, 30, 0, 0, time.FixedZone("UTC-2", -2*60*60))

	steps := []struct {
		name          string
		post, visitor string
		now           time.Time
		want          int
		day           string
		seen          []string
	}{
		{"first visitor", "post", "a", noon, 1, "2026-10-02", []string{"a"}},
		{"same visitor again", "post", "a", lateEvening, 1, "2026-10-02", []string{"a"}},
		{"second visitor", "post", "b", lateEvening, 2, "2026-10-02", []string{"a", "b"}},
		{"another post", "other", "c", lateEvening, 1, "2026-10-02", []string{"a", "b", "c"}},
		{"day rollover in UTC", "post", "a", nextDayInUTC, 3, "2026-10-03", []string{"a"}},
		{"same visitor on the new day", "post", "a", nextDayInUTC.Add(time.Hour), 3, "2026-10-03", []string{"a"}},
	}
	for _, step := range steps {
		got, err := s.AddView(step.post, step.visitor, step.now)
		if err != nil || got != step.want {
			t.Fatalf("%s: AddView = %d, %v, want %d", step.name, got, err, step.want)
		}
		onDisk := stateOnDisk(t, path)
		if onDisk.Views[step.post] != step.want || onDisk.Visitors.Day != step.day || !slices.Equal(onDisk.Visitors.Seen, step.seen) {
			t.Fatalf("%s: on disk views %d, visitors %s %v; want %d, %s %v", step.name,
				onDisk.Views[step.post], onDisk.Visitors.Day, onDisk.Visitors.Seen, step.want, step.day, step.seen)
		}
	}
	if got := s.Views("other"); got != 1 {
		t.Errorf("Views(other) = %d, want 1", got)
	}
}

func TestRepeatViewDoesNotWrite(t *testing.T) {
	path := statePath(t)
	s := open(t, path)
	_, err := s.AddView("post", "a", noon)
	must(t, err)
	s.write = func(string, []byte) error {
		t.Error("a repeat view wrote the state file")
		return nil
	}
	if got, err := s.AddView("post", "a", noon); got != 1 || err != nil {
		t.Errorf("AddView = %d, %v, want 1, nil", got, err)
	}
}

func TestVisitorCap(t *testing.T) {
	s := open(t, statePath(t))
	s.write = func(string, []byte) error { return nil }
	s.state.Visitors = visitors{Day: "2026-10-02", Seen: make([]string, maxVisitorsPerDay-1), set: map[string]struct{}{}}
	s.state.Views["post"] = maxVisitorsPerDay - 1

	steps := []struct {
		visitor string
		now     time.Time
		want    int
	}{
		{"last counted", noon, maxVisitorsPerDay},
		{"over the cap", noon, maxVisitorsPerDay},
		{"also over the cap", noon, maxVisitorsPerDay},
		{"next day", noon.AddDate(0, 0, 1), maxVisitorsPerDay + 1},
	}
	for _, step := range steps {
		if got, err := s.AddView("post", step.visitor, step.now); got != step.want || err != nil {
			t.Fatalf("AddView(%q) = %d, %v, want %d", step.visitor, got, err, step.want)
		}
	}
}
