package store

import (
	"fmt"
	"maps"
	"os"
	"reflect"
	"slices"
	"strconv"
	"strings"
	"sync"
	"testing"
	"time"
)

func addClients(s *Store, prefix string, n, issues int, first time.Time, step time.Duration) {
	for i := range n {
		s.state.setIssues(prefix+strconv.Itoa(i), slices.Repeat([]int64{first.Add(time.Duration(i) * step).UnixNano()}, issues))
	}
}

func fillIssues(s *Store, prefix string, n int, at time.Time) {
	for i := 0; n > 0; i++ {
		count := min(n, maxIssuesPerClient)
		s.state.setIssues(prefix+strconv.Itoa(i), slices.Repeat([]int64{at.UnixNano()}, count))
		n -= count
	}
}

func expectStoredIssues(t *testing.T, s *Store, want int) {
	t.Helper()
	recount := 0
	for _, issued := range s.state.Challenges {
		recount += len(issued)
	}
	if s.state.storedIssues != recount || recount != want {
		t.Errorf("stored issues = %d, recount %d, want %d", s.state.storedIssues, recount, want)
	}
}

func expectClients(t *testing.T, s *Store, clients int, kept, evicted []string) {
	t.Helper()
	if len(s.state.Challenges) != clients {
		t.Errorf("tracking %d clients, want %d", len(s.state.Challenges), clients)
	}
	for _, key := range kept {
		if _, ok := s.state.Challenges[key]; !ok {
			t.Errorf("%s was evicted", key)
		}
	}
	for _, key := range evicted {
		if _, ok := s.state.Challenges[key]; ok {
			t.Errorf("%s was kept", key)
		}
	}
}

func TestIssueChallengeRampAndDecay(t *testing.T) {
	s := open(t, statePath(t))
	now := noon
	for i, step := range []struct {
		wait time.Duration
		key  string
		want int
	}{
		{0, "client", 0},
		{time.Hour, "client", 1},
		{0, "other", 0},
		{23 * time.Hour, "client", 2},
		{time.Nanosecond, "client", 2},
		{48 * time.Hour, "client", 0},
	} {
		now = now.Add(step.wait)
		if got := s.IssueChallenge(step.key, now); got != step.want {
			t.Errorf("step %d: IssueChallenge = %d, want %d", i, got, step.want)
		}
	}
}

func TestIssueChallengeCap(t *testing.T) {
	s := open(t, statePath(t))
	now := noon
	for i := range 100 {
		if got := s.IssueChallenge("client", now); got != min(i, 24) {
			t.Fatalf("challenge %d: IssueChallenge = %d, want %d", i, got, min(i, 24))
		}
		now = now.Add(time.Second)
	}
	if kept := len(s.state.Challenges["client"]); kept != 24 {
		t.Errorf("kept %d issue times, want 24", kept)
	}

	now = now.Add(24*time.Hour - 10*time.Second)
	if got := s.IssueChallenge("client", now); got != 10 {
		t.Errorf("IssueChallenge with 10 issues left in the window = %d, want 10", got)
	}
}

func TestChallengesStayBounded(t *testing.T) {
	t.Run("idle clients are swept", func(t *testing.T) {
		s := open(t, statePath(t))
		s.IssueChallenge("client", noon)
		s.IssueChallenge("other", noon.Add(24*time.Hour+time.Nanosecond))
		expectClients(t, s, 1, []string{"other"}, []string{"client"})
		expectStoredIssues(t, s, 1)
	})

	t.Run("a known client at the client cap evicts nobody", func(t *testing.T) {
		s := open(t, statePath(t))
		s.IssueChallenge("client", noon)
		addClients(s, "c", maxChallengeClients-1, 1, noon, 0)
		if got := s.IssueChallenge("client", noon); got != 1 {
			t.Errorf("IssueChallenge = %d, want 1", got)
		}
		expectClients(t, s, maxChallengeClients, nil, nil)
		expectStoredIssues(t, s, maxChallengeClients+1)
	})

	t.Run("one below the issue cap takes one more", func(t *testing.T) {
		s := open(t, statePath(t))
		s.IssueChallenge("client", noon)
		fillIssues(s, "c", maxStoredIssues-2, noon)
		if got := s.IssueChallenge("client", noon); got != 1 {
			t.Errorf("IssueChallenge = %d, want 1", got)
		}
		expectStoredIssues(t, s, maxStoredIssues)
	})
}

func TestChallengeEviction(t *testing.T) {
	t.Run("the client cap evicts the least recently active", func(t *testing.T) {
		s := open(t, statePath(t))
		addClients(s, "c", maxChallengeClients, 1, noon.Add(-time.Hour), time.Millisecond)
		if got := s.IssueChallenge("new", noon); got != 0 {
			t.Errorf("IssueChallenge = %d, want 0", got)
		}
		expectClients(t, s, 90_001, []string{"new", "c10000", "c99999"}, []string{"c0", "c9999"})
		expectStoredIssues(t, s, 90_001)
		if got := s.IssueChallenge("c0", noon); got != 0 {
			t.Errorf("an evicted client came back with %d issues, want 0", got)
		}
	})

	t.Run("the issue cap keeps the issuer even when it is the least recently active", func(t *testing.T) {
		s := open(t, statePath(t))
		for range 16 {
			s.IssueChallenge("client", noon.Add(-2*time.Hour))
		}
		addClients(s, "c", 41_666, 24, noon.Add(-time.Hour), time.Millisecond)
		expectStoredIssues(t, s, maxStoredIssues)
		if got := s.IssueChallenge("client", noon); got != 16 {
			t.Errorf("IssueChallenge = %d, want 16", got)
		}
		expectClients(t, s, 37_500, []string{"client", "c4167"}, []string{"c0", "c4166"})
		expectStoredIssues(t, s, 899_992+1)
	})

	t.Run("eviction goes on until both targets are met", func(t *testing.T) {
		s := open(t, statePath(t))
		addClients(s, "light", 10_000, 1, noon.Add(-2*time.Hour), time.Millisecond)
		addClients(s, "heavy", 90_000, 11, noon.Add(-time.Hour), time.Millisecond)
		s.IssueChallenge("new", noon)
		expectClients(t, s, 81_819, []string{"new", "heavy8182"}, []string{"light9999", "heavy8181"})
		expectStoredIssues(t, s, 899_999)
	})

	t.Run("expiry that frees enough evicts nobody", func(t *testing.T) {
		s := open(t, statePath(t))
		addClients(s, "expired", 20_000, 1, noon.Add(-25*time.Hour), time.Millisecond)
		addClients(s, "active", 80_000, 1, noon.Add(-time.Hour), time.Millisecond)
		s.state.challengesSwept = noon
		s.IssueChallenge("new", noon)
		expectClients(t, s, 80_001, []string{"new", "active0"}, []string{"expired19999"})
		expectStoredIssues(t, s, 80_001)
	})

	t.Run("expiry that frees too little is topped up to the target", func(t *testing.T) {
		s := open(t, statePath(t))
		addClients(s, "expired", 5_000, 1, noon.Add(-25*time.Hour), time.Millisecond)
		addClients(s, "active", 95_000, 1, noon.Add(-time.Hour), time.Millisecond)
		s.state.challengesSwept = noon
		s.IssueChallenge("new", noon)
		expectClients(t, s, 90_001, []string{"new", "active5000"}, []string{"expired0", "active4999"})
		expectStoredIssues(t, s, 90_001)
	})

	t.Run("ties are evicted in key order", func(t *testing.T) {
		s := open(t, statePath(t))
		addClients(s, "c", maxChallengeClients, 1, noon, 0)
		keys := slices.Sorted(maps.Keys(s.state.Challenges))
		s.IssueChallenge("new", noon)
		expectClients(t, s, 90_001, keys[10_000:], keys[:10_000])
	})
}

func TestEvictionKeepsAnActiveClientClimbing(t *testing.T) {
	s := open(t, statePath(t))
	now := noon
	evictions := 0
	for i := range 130_000 {
		before := len(s.state.Challenges)
		s.IssueChallenge("flood"+strconv.Itoa(i), now)
		if len(s.state.Challenges) < before {
			evictions++
		}
		if i%5_000 == 0 {
			if got, want := s.IssueChallenge("active", now), min(i/5_000, 24); got != want {
				t.Fatalf("after %d flood clients: active IssueChallenge = %d, want %d", i, got, want)
			}
		}
		now = now.Add(time.Millisecond)
	}
	if evictions != 4 {
		t.Errorf("%d evictions, want 4", evictions)
	}
	expectStoredIssues(t, s, len(s.state.Challenges)-1+24)
}

func TestStoredIssuesStayExact(t *testing.T) {
	path := statePath(t)
	s := open(t, path)
	issue := func(key string, at time.Time, times int) {
		for range times {
			s.IssueChallenge(key, at)
		}
	}
	later := noon.Add(24*time.Hour + time.Second)
	last := noon.Add(25 * time.Hour)
	steps := []struct {
		name string
		do   func()
		want int
	}{
		{"append", func() {
			issue("a", noon, 3)
			issue("b", noon, 1)
			issue("mixed", noon, 2)
			issue("mixed", noon.Add(2*time.Hour), 1)
		}, 7},
		{"per-client cap", func() { issue("full", noon, 30) }, 31},
		{"prune within one client", func() {
			s.state.challengesSwept = later
			issue("a", later, 1)
		}, 29},
		{"sweep trims and drops clients", func() { issue("c", last, 1) }, 3},
		{"reopen", func() {
			must(t, s.Flush())
			s = open(t, path)
		}, 3},
		{"issue cap evicts", func() {
			fillIssues(s, "x", maxStoredIssues-3, last)
			issue("a", last, 1)
		}, 899_991},
		{"client cap evicts", func() {
			addClients(s, "f", maxChallengeClients-len(s.state.Challenges), 1, last, 0)
			issue("new", last, 1)
		}, 900_001},
		{"reopen after evictions", func() {
			must(t, s.Flush())
			s = open(t, path)
		}, 900_001},
	}
	for _, step := range steps {
		step.do()
		t.Run(step.name, func(t *testing.T) { expectStoredIssues(t, s, step.want) })
	}
}

func TestOpenBoundsChallenges(t *testing.T) {
	document := func(clients, issues int) map[string][]int64 {
		challenges := make(map[string][]int64, clients)
		for i := range clients {
			times := make([]int64, issues)
			for j := range times {
				times[j] = int64(i)*1_000 + int64(j)
			}
			challenges[strconv.Itoa(i)] = times
		}
		return challenges
	}
	atCap := document(41_666, 24)
	atCap["rest"] = make([]int64, maxStoredIssues-41_666*24)

	tests := []struct {
		name            string
		stored          map[string][]int64
		clients, issues int
		kept, evicted   []string
	}{
		{"at the issue cap", atCap, 41_667, maxStoredIssues, []string{"rest", "0"}, nil},
		{"over the issue cap", document(41_667, 24), 37_500, 900_000, []string{"4167", "41666"}, []string{"0", "4166"}},
		{"over the issue cap before the per-client trim", document(41_666, 30), 41_666, 41_666 * 24, []string{"0"}, nil},
		{"at the client cap", document(maxChallengeClients, 1), maxChallengeClients, maxChallengeClients, []string{"0"}, nil},
		{"over the client cap", document(maxChallengeClients+1, 1), 90_000, 90_000, []string{"10001", "100000"}, []string{"0", "10000"}},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			t.Parallel()
			path := statePath(t)
			writeState(t, path, map[string]any{"challenges": test.stored})
			s := open(t, path)
			expectClients(t, s, test.clients, test.kept, test.evicted)
			expectStoredIssues(t, s, test.issues)
			if kept := s.state.Challenges["0"]; len(kept) > 0 && kept[len(kept)-1] != int64(len(test.stored["0"])-1) {
				t.Errorf("client 0 kept %v, want its newest times", kept)
			}
		})
	}
}

func TestChallengesSurviveReopen(t *testing.T) {
	for _, issued := range []int{1, 5, 24, 30} {
		t.Run(strconv.Itoa(issued), func(t *testing.T) {
			path := statePath(t)
			s := open(t, path)
			now := noon
			for range issued {
				s.IssueChallenge("client", now)
				now = now.Add(time.Second)
			}
			s.IssueChallenge("other", now)
			must(t, s.Flush())

			reopened := open(t, path)
			for key, want := range map[string]int{"client": min(issued, 24), "other": 1, "new": 0} {
				if got := reopened.IssueChallenge(key, now); got != want {
					t.Errorf("%s after reopen: IssueChallenge = %d, want %d", key, got, want)
				}
			}
		})
	}
}

func TestChallengesAreWrittenWithTheNextChange(t *testing.T) {
	path := statePath(t)
	s := open(t, path)
	writes := 0
	s.write = func(path string, data []byte) error {
		writes++
		return writeFile(path, data)
	}
	expect := func(step string, wantWrites int, want map[string][]int64) {
		t.Helper()
		if writes != wantWrites {
			t.Fatalf("%s: %d writes, want %d", step, writes, wantWrites)
		}
		if onDisk := stateOnDisk(t, path); !reflect.DeepEqual(onDisk.Challenges, want) {
			t.Fatalf("%s: challenges on disk = %v, want %v", step, onDisk.Challenges, want)
		}
	}
	at := noon.UnixNano()

	s.IssueChallenge("client", noon)
	s.IssueChallenge("client", noon)
	if writes != 0 {
		t.Fatalf("challenges wrote the state file %d times", writes)
	}
	_, err := s.AddView("post", "v1", noon)
	must(t, err)
	expect("the next change", 1, map[string][]int64{"client": {at, at}})

	s.IssueChallenge("other", noon)
	must(t, s.Flush())
	expect("Flush", 2, map[string][]int64{"client": {at, at}, "other": {at}})
	must(t, s.Flush())
	expect("Flush without changes", 2, map[string][]int64{"client": {at, at}, "other": {at}})
}

func TestStaleChallengesAreNotWritten(t *testing.T) {
	path := statePath(t)
	s := open(t, path)
	s.IssueChallenge("stale", noon)
	s.IssueChallenge("client", noon)
	s.IssueChallenge("client", noon)
	s.IssueChallenge("partly", noon)
	s.IssueChallenge("partly", noon.Add(2*time.Hour))
	must(t, s.Flush())

	later := noon.Add(25 * time.Hour)
	if got := s.IssueChallenge("client", later); got != 0 {
		t.Errorf("IssueChallenge 25 hours later = %d, want 0", got)
	}
	must(t, s.Flush())
	onDisk := stateOnDisk(t, path)
	want := map[string][]int64{"client": {later.UnixNano()}, "partly": {noon.Add(2 * time.Hour).UnixNano()}}
	if !reflect.DeepEqual(onDisk.Challenges, want) {
		t.Errorf("challenges on disk = %v, want %v", onDisk.Challenges, want)
	}
	if strings.Contains(readFile(t, path), "stale") {
		t.Error("the state file still holds the stale client")
	}
}

func TestStateWithoutChallengesLoads(t *testing.T) {
	documents := map[string]string{
		"written before challenges were kept": strings.Replace(populated, `"challenges":{"client":[1790942400000000000]},`, "", 1),
		"migration export":                    `{"views": {}, "notified": {}, "visitors": {"day": "", "seen": []}, "reactions": {}, "broadcasts": [], "subscriptions": {}}`,
		"null challenges":                     `{"challenges":null}`,
		"empty issue lists":                   `{"challenges":{"client":null,"other":[]}}`,
	}
	for name, document := range documents {
		t.Run(name, func(t *testing.T) {
			if strings.Contains(name, "before") && strings.Contains(document, "challenges") {
				t.Fatal("the old document still has challenges")
			}
			path := statePath(t)
			must(t, os.WriteFile(path, []byte(document), 0o600))
			s := open(t, path)
			for _, key := range []string{"client", "other"} {
				if got := s.IssueChallenge(key, noon); got != 0 {
					t.Errorf("IssueChallenge(%s) = %d, want 0", key, got)
				}
			}
			must(t, s.Flush())
			want := map[string][]int64{"client": {noon.UnixNano()}, "other": {noon.UnixNano()}}
			if onDisk := stateOnDisk(t, path); !reflect.DeepEqual(onDisk.Challenges, want) {
				t.Errorf("challenges on disk = %v, want %v", onDisk.Challenges, want)
			}
		})
	}
}

func TestChallengesRoundTrip(t *testing.T) {
	at := noon.UnixNano()
	many := make([]int64, 300)
	for i := range many {
		many[i] = at + int64(i)
	}
	tests := []struct {
		name           string
		stored, loaded map[string][]int64
	}{
		{"as written", map[string][]int64{"client": {at, at + 1}, "other": {at}}, map[string][]int64{"client": {at, at + 1}, "other": {at}}},
		{"unsorted", map[string][]int64{"client": {at + 2, at, at + 1}}, map[string][]int64{"client": {at, at + 1, at + 2}}},
		{"over the cap", map[string][]int64{"client": many}, map[string][]int64{"client": many[300-24:]}},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			path := statePath(t)
			writeState(t, path, map[string]any{"challenges": test.stored})
			_, err := open(t, path).AddReaction("post", "👍")
			must(t, err)
			if onDisk := stateOnDisk(t, path); !reflect.DeepEqual(onDisk.Challenges, test.loaded) {
				t.Errorf("challenges on disk = %v, want %v", onDisk.Challenges, test.loaded)
			}
			if got, want := open(t, path).IssueChallenge("client", noon.Add(time.Hour)), len(test.loaded["client"]); got != want {
				t.Errorf("IssueChallenge after reopen = %d, want %d", got, want)
			}
		})
	}
}

func TestConcurrentChallenges(t *testing.T) {
	const workers, rounds = 12, 20
	path := statePath(t)
	s := open(t, path)
	shared := make([][]int, workers)
	var wg sync.WaitGroup
	for i := range workers {
		wg.Go(func() {
			own := fmt.Sprint("client-", i)
			for j := range rounds {
				shared[i] = append(shared[i], s.IssueChallenge("shared", noon))
				if got := s.IssueChallenge(own, noon.Add(time.Duration(j)*time.Second)); got != j {
					t.Errorf("%s: IssueChallenge = %d, want %d", own, got, j)
				}
				if j%4 == 0 {
					if err := s.Flush(); err != nil {
						t.Error(err)
					}
				}
			}
			if _, err := s.AddView("post", own, noon); err != nil {
				t.Error(err)
			}
		})
	}
	wg.Wait()

	counts := slices.Concat(shared...)
	slices.Sort(counts)
	for i, count := range counts {
		if count != min(i, 24) {
			t.Fatalf("shared counts = %v, want each of 0..23 once, then 24", counts)
		}
	}
	expectStoredIssues(t, s, 24+workers*rounds)
	must(t, s.Flush())
	reopened := open(t, path)
	if got := reopened.IssueChallenge("shared", noon); got != 24 {
		t.Errorf("shared after reopen: IssueChallenge = %d, want 24", got)
	}
	for i := range workers {
		if got := reopened.IssueChallenge(fmt.Sprint("client-", i), noon.Add(rounds*time.Second)); got != rounds {
			t.Errorf("client-%d after reopen: IssueChallenge = %d, want %d", i, got, rounds)
		}
	}
}
