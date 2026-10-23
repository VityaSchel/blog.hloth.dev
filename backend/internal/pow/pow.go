package pow

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"maps"
	"math/bits"
	"strconv"
	"sync"
	"time"

	"blog.hloth.dev/backend/internal/fieldhash"
)

const (
	roundCount      = 50
	roundSeedBytes  = 16
	historyKeyBytes = 16
	minDifficulty   = 8
	maxDifficulty   = sha256.Size * 8
	// Number.MAX_SAFE_INTEGER: the browser solver counts in JavaScript numbers.
	MaxSolution           = 1<<53 - 1
	challengeLifetime     = time.Minute
	redeemedSweepInterval = time.Minute
	clientSalt            = "pow-reaction"
)

type challenge struct {
	ID         string   `json:"id"`
	Reaction   string   `json:"reaction"`
	Difficulty int      `json:"difficulty"`
	Expiry     int64    `json:"exp"`
	ClientID   string   `json:"clientId"`
	Rounds     []string `json:"rounds"`
}

type History interface {
	IssueChallenge(key string, now time.Time) (recentIssues int)
}

type Service struct {
	secret  []byte
	pepper  []byte
	history History
	now     func() time.Time

	mu       sync.Mutex
	redeemed map[string]int64
	swept    time.Time
}

func New(secret, pepper []byte, history History) *Service {
	return &Service{
		secret:   secret,
		pepper:   pepper,
		history:  history,
		now:      time.Now,
		redeemed: map[string]int64{},
	}
}

func (s *Service) Challenge(ip, postID, reaction string) string {
	now := s.now()
	s.sweepRedeemed(now)
	client := clientID(ip, postID, reaction)
	rounds := make([]string, roundCount)
	for i := range rounds {
		var seed [roundSeedBytes]byte
		rand.Read(seed[:])
		rounds[i] = hex.EncodeToString(seed[:])
	}
	payload, _ := json.Marshal(challenge{
		ID:         rand.Text(),
		Reaction:   reaction,
		Difficulty: s.difficulty(client, now),
		Expiry:     now.Add(challengeLifetime).Unix(),
		ClientID:   client,
		Rounds:     rounds,
	})
	return s.sign(payload)
}

func (s *Service) Verify(token string, solutions []uint64, ip, postID, reaction string) bool {
	c, ok := s.parse(token)
	if !ok || c.Reaction != reaction || c.ClientID != clientID(ip, postID, reaction) || len(solutions) != len(c.Rounds) {
		return false
	}
	for i, round := range c.Rounds {
		if solutions[i] > MaxSolution || !solves(round, solutions[i], c.Difficulty) {
			return false
		}
	}
	return s.redeem(c)
}

func (s *Service) difficulty(client string, now time.Time) int {
	return min(minDifficulty+s.history.IssueChallenge(s.historyKey(client), now), maxDifficulty)
}

// redeem reads the clock under the lock so that a sweep can never forget an id
// that a slower concurrent submission still considers unexpired.
func (s *Service) redeem(c challenge) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, done := s.redeemed[c.ID]; done || s.now().Unix() >= c.Expiry {
		return false
	}
	s.redeemed[c.ID] = c.Expiry
	return true
}

func (s *Service) sweepRedeemed(now time.Time) {
	s.mu.Lock()
	defer s.mu.Unlock()
	if now.Sub(s.swept) < redeemedSweepInterval {
		return
	}
	s.swept = now
	cutoff := now.Unix()
	maps.DeleteFunc(s.redeemed, func(_ string, exp int64) bool { return exp <= cutoff })
}

func clientID(ip, postID, reaction string) string {
	sum := fieldhash.Sum(clientSalt, ip, postID, reaction)
	return hex.EncodeToString(sum[:])
}

// The client ID is salted with a public constant, so trying every IPv4 address reverses it;
// the history, which reaches the state file, is keyed with the secret pepper instead.
func (s *Service) historyKey(client string) string {
	return base64.RawURLEncoding.EncodeToString(hmacSHA256(s.pepper, client)[:historyKeyBytes])
}

func solves(round string, solution uint64, difficulty int) bool {
	sum := sha256.Sum256([]byte(round + "." + strconv.FormatUint(solution, 10)))
	zeros := 0
	for _, b := range sum {
		zeros += bits.LeadingZeros8(b)
		if b != 0 {
			break
		}
	}
	return zeros >= difficulty
}
