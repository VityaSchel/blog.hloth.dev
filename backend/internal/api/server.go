package api

import (
	"encoding/json"
	"errors"
	"io"
	"log"
	"net"
	"net/http"
	"net/netip"
	"strings"

	"blog.hloth.dev/backend/internal/feed"
	"blog.hloth.dev/backend/internal/pow"
	"blog.hloth.dev/backend/internal/store"
)

const (
	maxBodyBytes = 64 << 10
	// One IPv6 client is a /64, the key of Caddy's ipv6_prefix rate limit.
	ipv6ClientPrefixBits = 64
)

type server struct {
	origin string
	pepper string
	store  *store.Store
	feed   *feed.Feed
	pow    *pow.Service
}

type result struct {
	OK    bool   `json:"ok"`
	Error string `json:"error,omitempty"`
}

func New(origin, pepper string, state *store.Store, posts *feed.Feed, challenges *pow.Service) http.Handler {
	s := &server{origin: origin, pepper: pepper, store: state, feed: posts, pow: challenges}
	mux := http.NewServeMux()
	mux.HandleFunc("GET /posts/{id}/reactions", rejectNUL(s.getReactions))
	mux.HandleFunc("POST /posts/{id}/reactions/challenge", rejectNUL(s.requireKnownPost(s.issueChallenge)))
	mux.HandleFunc("POST /posts/{id}/reactions", rejectNUL(s.requireKnownPost(s.addReaction)))
	mux.HandleFunc("GET /posts/{id}/views", rejectNUL(s.requireKnownPost(s.getViews)))
	mux.HandleFunc("POST /posts/{id}/views", rejectNUL(s.requireKnownPost(s.addView)))
	mux.HandleFunc("POST /notifications/web-push", s.subscribe)
	mux.HandleFunc("DELETE /notifications/web-push/{id}", s.unsubscribe)
	mux.HandleFunc("/", func(w http.ResponseWriter, _ *http.Request) {
		fail(w, http.StatusNotFound, "Not Found")
	})
	return s.guard(mux)
}

func (s *server) guard(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		header := w.Header()
		header.Set("Vary", "Origin")
		origin := r.Header.Get("Origin")
		switch {
		case origin == "" && r.Method != http.MethodGet && r.Method != http.MethodHead:
			fail(w, http.StatusBadRequest, "Origin header is required")
		case origin != "" && origin != s.origin:
			fail(w, http.StatusForbidden, "Cross-site requests are not allowed")
		case r.Method == http.MethodOptions:
			header.Set("Access-Control-Allow-Origin", s.origin)
			header.Set("Access-Control-Allow-Methods", "GET, POST, DELETE")
			header.Set("Access-Control-Allow-Headers", "Content-Type")
			header.Set("Access-Control-Max-Age", "86400")
			w.WriteHeader(http.StatusNoContent)
		default:
			if origin != "" {
				header.Set("Access-Control-Allow-Origin", s.origin)
			}
			r.Body = http.MaxBytesReader(w, r.Body, maxBodyBytes)
			next.ServeHTTP(w, r)
		}
	})
}

func rejectNUL(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if strings.ContainsRune(r.PathValue("id"), 0) {
			fail(w, http.StatusBadRequest, "Bad Request")
			return
		}
		next(w, r)
	}
}

func (s *server) requireKnownPost(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		switch exists, err := s.feed.Has(r.Context(), r.PathValue("id")); {
		case err != nil:
			fail(w, http.StatusServiceUnavailable, "Service Unavailable")
		case !exists:
			fail(w, http.StatusNotFound, "Post not found")
		default:
			next(w, r)
		}
	}
}

func clientIP(r *http.Request) string {
	ip, _, err := net.SplitHostPort(r.RemoteAddr)
	if err != nil {
		ip = r.RemoteAddr
	}
	// Caddy sets the last X-Forwarded-For entry; any earlier ones are client-supplied.
	if forwarded := r.Header.Values("X-Forwarded-For"); len(forwarded) > 0 {
		last := forwarded[len(forwarded)-1]
		if entry := strings.TrimSpace(last[strings.LastIndexByte(last, ',')+1:]); entry != "" {
			ip = entry
		}
	}
	if addr, err := netip.ParseAddr(ip); err == nil && addr.Is6() && !addr.Is4In6() {
		prefix, _ := addr.Prefix(ipv6ClientPrefixBits)
		return prefix.Addr().String()
	}
	return ip
}

func decode(w http.ResponseWriter, r *http.Request, body interface{ valid() bool }) bool {
	data, err := io.ReadAll(r.Body)
	_, tooLarge := errors.AsType[*http.MaxBytesError](err)
	switch {
	case tooLarge:
		fail(w, http.StatusRequestEntityTooLarge, "Payload Too Large")
	case err != nil || !json.Valid(data):
		fail(w, http.StatusBadRequest, "Malformed Request")
	case json.Unmarshal(data, body) != nil || !body.valid():
		fail(w, http.StatusBadRequest, "Bad Request")
	default:
		return true
	}
	return false
}

func respond(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(body)
}

func fail(w http.ResponseWriter, status int, message string) {
	respond(w, status, result{Error: message})
}

func internalError(w http.ResponseWriter, r *http.Request, err error) {
	log.Printf("%s: %v", r.Pattern, err)
	fail(w, http.StatusInternalServerError, "Internal Server Error")
}
