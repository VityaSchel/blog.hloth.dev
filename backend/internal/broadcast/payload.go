package broadcast

import (
	"encoding/json"
	"sort"
	"unicode/utf8"

	"blog.hloth.dev/backend/internal/feed"
	"blog.hloth.dev/backend/internal/webpush"
)

type notification struct {
	ID          string `json:"id"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Image       struct {
		URL string `json:"url"`
	} `json:"image"`
}

func payloadFor(post feed.Post) (json.RawMessage, error) {
	n := notification{ID: post.ID, Title: post.Title}
	n.Image.URL = post.ImageURL
	encodeWithDescription := func(size int) (json.RawMessage, error) {
		n.Description = truncate(post.Description, size)
		return json.Marshal(n)
	}
	firstOversize := sort.Search(len(post.Description)+1, func(size int) bool {
		encoded, _ := encodeWithDescription(size)
		return len(encoded) > webpush.MaxPayloadBytes
	})
	return encodeWithDescription(max(firstOversize-1, 0))
}

func truncate(s string, size int) string {
	for 0 < size && size < len(s) && !utf8.RuneStart(s[size]) {
		size--
	}
	return s[:size]
}
