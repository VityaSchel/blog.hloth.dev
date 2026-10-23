package store

import (
	"cmp"
	"slices"
	"strings"
	"time"
)

const (
	challengeWindow        = 24 * time.Hour
	challengeSweepInterval = time.Minute
	maxChallengeClients    = 100_000
	// pow starts at 8 bits, so 24 more reach 32 bits: over a day of work for a browser.
	maxIssuesPerClient = 24
	// About 20 MB of JSON: the whole file is encoded on every write.
	maxStoredIssues = 1_000_000
	// Evicting down to 90% means a flood sorts at most once per 10,000 new clients
	// or 100,000 new issues.
	clientsAfterEviction = maxChallengeClients * 9 / 10
	issuesAfterEviction  = maxStoredIssues * 9 / 10
)

// A challenge costs its client nothing, so writing the file for each one would let
// anyone make the server rewrite it at will: the history goes with the next change or Flush.
func (s *Store) IssueChallenge(key string, now time.Time) int {
	var recent int
	s.apply(func() bool {
		recent = s.state.issueChallenge(key, now)
		return true
	})
	return recent
}

func (st *state) issueChallenge(key string, now time.Time) int {
	if now.Sub(st.challengesSwept) >= challengeSweepInterval {
		st.sweepChallenges(now)
	}
	if st.challengesAtCap(key) {
		st.sweepChallenges(now)
		st.evictChallenges(key)
	}
	issued := st.expireIssues(key, now)
	recent := len(issued)
	if recent == maxIssuesPerClient {
		issued = slices.Delete(issued, 0, 1)
	}
	st.setIssues(key, append(issued, now.UnixNano()))
	return recent
}

func (st *state) sweepChallenges(now time.Time) {
	st.challengesSwept = now
	for key := range st.Challenges {
		st.expireIssues(key, now)
	}
}

func (st *state) expireIssues(key string, now time.Time) []int64 {
	cutoff := now.Add(-challengeWindow).UnixNano()
	kept := slices.DeleteFunc(st.Challenges[key], func(at int64) bool { return at < cutoff })
	st.setIssues(key, kept)
	return kept
}

func (st *state) setIssues(key string, issued []int64) {
	st.storedIssues += len(issued) - len(st.Challenges[key])
	if len(issued) == 0 {
		delete(st.Challenges, key)
		return
	}
	st.Challenges[key] = issued
}

func (st *state) challengesAtCap(key string) bool {
	_, known := st.Challenges[key]
	return (!known && len(st.Challenges) >= maxChallengeClients) || st.storedIssues >= maxStoredIssues
}

func (st *state) challengesHaveHeadroom() bool {
	return len(st.Challenges) <= clientsAfterEviction && st.storedIssues <= issuesAfterEviction
}

func (st *state) evictChallenges(keep string) {
	if st.challengesHaveHeadroom() {
		return
	}
	type client struct {
		key    string
		newest int64
	}
	clients := make([]client, 0, len(st.Challenges))
	for key, issued := range st.Challenges {
		if key != keep {
			clients = append(clients, client{key, issued[len(issued)-1]})
		}
	}
	slices.SortFunc(clients, func(a, b client) int {
		return cmp.Or(cmp.Compare(a.newest, b.newest), strings.Compare(a.key, b.key))
	})
	for _, c := range clients {
		if st.challengesHaveHeadroom() {
			return
		}
		st.setIssues(c.key, nil)
	}
}

func (st *state) normalizeChallenges() {
	if st.Challenges == nil {
		st.Challenges = map[string][]int64{}
	}
	st.storedIssues = 0
	for key, issued := range st.Challenges {
		if len(issued) == 0 {
			delete(st.Challenges, key)
			continue
		}
		slices.Sort(issued)
		issued = issued[max(len(issued)-maxIssuesPerClient, 0):]
		st.Challenges[key] = issued
		st.storedIssues += len(issued)
	}
	if len(st.Challenges) > maxChallengeClients || st.storedIssues > maxStoredIssues {
		st.evictChallenges("")
	}
}
