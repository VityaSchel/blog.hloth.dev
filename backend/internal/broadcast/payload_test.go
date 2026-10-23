package broadcast

import (
	"encoding/json"
	"strings"
	"testing"
	"time"
	"unicode/utf8"

	"blog.hloth.dev/backend/internal/feed"
	"blog.hloth.dev/backend/internal/testkit"
	"blog.hloth.dev/backend/internal/webpush"
)

func TestPayloadFitsThePushLimit(t *testing.T) {
	tests := []struct {
		name        string
		description string
		truncated   bool
	}{
		{"short", "A short description.", false},
		{"empty", "", false},
		{"long ASCII", strings.Repeat("lorem ipsum ", 500), true},
		{"multi-byte runes", strings.Repeat("Привет, мир 🏳️‍🌈 ", 300), true},
		{"four-byte runes only", strings.Repeat("🚀", 2000), true},
		{"characters that JSON escapes", strings.Repeat(`<a href="x">&</a>`+"\n\t\\", 400), true},
		{"line separators", strings.Repeat("a\u2028b\u2029", 1500), true},
		{"escapes after the cut", strings.Repeat("a", 3800) + strings.Repeat(`"`, 400), true},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			post := feed.Post{ID: "new", Title: `Title with "quotes" & <tags>`, Description: test.description, ImageURL: "https://blog.example/a.webp?x=1&y=2"}
			encoded, err := payloadFor(post)
			if err != nil {
				t.Fatal(err)
			}
			limit := webpush.MaxPayloadBytes
			if len(encoded) > limit {
				t.Fatalf("payload is %d bytes, limit %d", len(encoded), limit)
			}
			var decoded notification
			if err := json.Unmarshal(encoded, &decoded); err != nil {
				t.Fatalf("payload is not valid JSON: %v", err)
			}
			if decoded.ID != post.ID || decoded.Title != post.Title || decoded.Image.URL != post.ImageURL {
				t.Fatalf("decoded = %+v", decoded)
			}
			if !utf8.ValidString(decoded.Description) || strings.ContainsRune(decoded.Description, utf8.RuneError) {
				t.Fatal("the description was cut inside a rune")
			}
			if !strings.HasPrefix(post.Description, decoded.Description) {
				t.Fatal("the description is not a prefix of the original")
			}
			if truncated := decoded.Description != post.Description; truncated != test.truncated {
				t.Fatalf("truncated = %v, want %v", truncated, test.truncated)
			}
			if test.truncated && len(encoded) <= limit-6 {
				t.Fatalf("payload is only %d bytes: another rune would have fit", len(encoded))
			}

			s := testkit.OpenStore(t, testkit.StatePath(t))
			if queued, err := s.Enqueue(post.ID, encoded, time.Now()); err != nil || !queued {
				t.Fatal(queued, err)
			}
			if stored := s.Broadcasts()[0].Payload; string(stored) != string(encoded) {
				t.Fatalf("the store changed the payload: %d bytes became %d", len(encoded), len(stored))
			}
		})
	}

	oversized := feed.Post{ID: "new", Title: strings.Repeat("t", 5000), Description: "d"}
	if encoded, err := payloadFor(oversized); err != nil || !json.Valid(encoded) {
		t.Fatalf("a title beyond the limit must still end the loop with valid JSON: %v", err)
	}
}
