package api

import (
	"errors"
	"net/http"
	"net/url"
	"regexp"
	"time"

	"blog.hloth.dev/backend/internal/store"
	"blog.hloth.dev/backend/internal/webpush"
)

const (
	maxEndpointLength = 2000
	// ValidKeys ignores '=' padding, so only this bounds the stored key;
	// 88 fits a padded 65-byte point.
	maxPaddedKeyLength = 88
	// 9999-12-31T23:59:59.999Z: a later time cannot be written to the state file.
	maxExpirationTime = 253_402_300_799_999
)

var pushHosts = regexp.MustCompile(`^(fcm\.googleapis\.com|jmt17\.google\.com|updates\.push\.services\.mozilla\.com|web\.push\.apple\.com|[a-z0-9-]+\.notify\.windows\.com)$`)

type subscribeRequest struct {
	Endpoint string `json:"endpoint"`
	Keys     struct {
		P256dh string `json:"p256dh"`
		Auth   string `json:"auth"`
	} `json:"keys"`
	ExpirationTime *float64 `json:"expirationTime"`
}

func (b *subscribeRequest) valid() bool {
	return validEndpoint(b.Endpoint) &&
		len(b.Keys.P256dh) <= maxPaddedKeyLength && len(b.Keys.Auth) <= maxPaddedKeyLength &&
		webpush.ValidKeys(b.Keys.P256dh, b.Keys.Auth) &&
		validExpiration(b.ExpirationTime)
}

func validEndpoint(raw string) bool {
	endpoint, err := url.Parse(raw)
	return err == nil && len(raw) <= maxEndpointLength &&
		endpoint.Scheme == "https" && endpoint.User == nil && pushHosts.MatchString(endpoint.Host)
}

func validExpiration(ms *float64) bool {
	return ms == nil || (*ms > float64(time.Now().UnixMilli()) && *ms <= maxExpirationTime)
}

func (s *server) subscribe(w http.ResponseWriter, r *http.Request) {
	var body subscribeRequest
	if !decode(w, r, &body) {
		return
	}
	sub := store.Subscription{P256dh: body.Keys.P256dh, Auth: body.Keys.Auth}
	if body.ExpirationTime != nil {
		expiresAt := time.UnixMilli(int64(*body.ExpirationTime))
		sub.ExpiresAt = &expiresAt
	}
	switch err := s.store.Subscribe(body.Endpoint, sub); {
	case errors.Is(err, store.ErrFull):
		fail(w, http.StatusServiceUnavailable, "Service Unavailable")
	case err != nil:
		internalError(w, r, err)
	default:
		respond(w, http.StatusOK, result{OK: true})
	}
}

func (s *server) unsubscribe(w http.ResponseWriter, r *http.Request) {
	switch existed, err := s.store.Unsubscribe(r.PathValue("id")); {
	case err != nil:
		internalError(w, r, err)
	case !existed:
		respond(w, http.StatusNotFound, result{})
	default:
		respond(w, http.StatusOK, result{OK: true})
	}
}
