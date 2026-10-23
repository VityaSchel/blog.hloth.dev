package api

import (
	"encoding/base64"
	"net/http"
	"time"

	"blog.hloth.dev/backend/internal/fieldhash"
)

const visitorHashBytes = 12

type viewResult struct {
	OK    bool `json:"ok"`
	Value int  `json:"value"`
}

func (s *server) getViews(w http.ResponseWriter, r *http.Request) {
	respond(w, http.StatusOK, s.store.Views(r.PathValue("id")))
}

func (s *server) addView(w http.ResponseWriter, r *http.Request) {
	postID, now := r.PathValue("id"), time.Now()
	views, err := s.store.AddView(postID, s.visitorHash(postID, clientIP(r), now), now)
	if err != nil {
		internalError(w, r, err)
		return
	}
	respond(w, http.StatusOK, viewResult{OK: true, Value: views})
}

func (s *server) visitorHash(postID, ip string, now time.Time) string {
	sum := fieldhash.Sum(s.pepper, postID, now.UTC().Format(time.DateOnly), ip)
	return base64.RawURLEncoding.EncodeToString(sum[:visitorHashBytes])
}
