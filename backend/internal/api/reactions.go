package api

import (
	"net/http"
	"slices"

	"blog.hloth.dev/backend/internal/pow"
)

var reactions = [...]string{
	"👍",
	"❤️",
	"🔥",
	"👀",
	"😮",
	"🤔",
	"🚀",
	"🎉",
	"🤯",
	"💀",
	"🙏",
	"🌚",
	"🆒",
	"🏳️‍🌈",
}

func validReaction(reaction string) bool {
	return slices.Contains(reactions[:], reaction)
}

func reactionCounts(stored map[string]int) map[string]int {
	counts := make(map[string]int, len(reactions))
	for _, reaction := range reactions {
		counts[reaction] = stored[reaction]
	}
	return counts
}

type challengeRequest struct {
	Reaction string `json:"reaction"`
}

func (b *challengeRequest) valid() bool { return validReaction(b.Reaction) }

type challengeResult struct {
	Challenge string `json:"challenge"`
}

type reactionRequest struct {
	Challenge string   `json:"challenge"`
	Solutions []uint64 `json:"solutions"`
	Reaction  string   `json:"reaction"`
}

func (b *reactionRequest) valid() bool {
	return b.Challenge != "" && b.Solutions != nil && validReaction(b.Reaction) &&
		!slices.ContainsFunc(b.Solutions, func(solution uint64) bool { return solution > pow.MaxSolution })
}

type reactionResult struct {
	OK        bool           `json:"ok"`
	Reactions map[string]int `json:"reactions"`
}

func (s *server) getReactions(w http.ResponseWriter, r *http.Request) {
	respond(w, http.StatusOK, reactionCounts(s.store.Reactions(r.PathValue("id"))))
}

func (s *server) issueChallenge(w http.ResponseWriter, r *http.Request) {
	var body challengeRequest
	if !decode(w, r, &body) {
		return
	}
	respond(w, http.StatusOK, challengeResult{Challenge: s.pow.Challenge(clientIP(r), r.PathValue("id"), body.Reaction)})
}

func (s *server) addReaction(w http.ResponseWriter, r *http.Request) {
	var body reactionRequest
	if !decode(w, r, &body) {
		return
	}
	postID := r.PathValue("id")
	if !s.pow.Verify(body.Challenge, body.Solutions, clientIP(r), postID, body.Reaction) {
		respond(w, http.StatusBadRequest, result{})
		return
	}
	counts, err := s.store.AddReaction(postID, body.Reaction)
	if err != nil {
		internalError(w, r, err)
		return
	}
	respond(w, http.StatusOK, reactionResult{OK: true, Reactions: reactionCounts(counts)})
}
