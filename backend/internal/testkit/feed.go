package testkit

import (
	"bytes"
	"encoding/xml"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"slices"
	"strings"
	"sync"
	"testing"

	"blog.hloth.dev/backend/internal/feed"
)

type FakeFeed struct {
	*httptest.Server
	mu    sync.Mutex
	posts []feed.Post
	down  bool
}

func NewFakeFeed(t *testing.T, posts ...feed.Post) *FakeFeed {
	t.Helper()
	f := &FakeFeed{posts: posts}
	f.Server = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		f.mu.Lock()
		defer f.mu.Unlock()
		if f.down || r.URL.Path != "/rss.xml" {
			http.Error(w, "down", http.StatusBadGateway)
			return
		}
		io.WriteString(w, renderFeed(f.posts))
	}))
	t.Cleanup(f.Close)
	return f
}

func (f *FakeFeed) Publish(posts ...feed.Post) {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.posts = append(f.posts, posts...)
}

func (f *FakeFeed) SetDown(down bool) {
	f.mu.Lock()
	defer f.mu.Unlock()
	f.down = down
}

func (f *FakeFeed) Feed() *feed.Feed { return feed.New(f.URL, nil) }

func renderFeed(oldestFirst []feed.Post) string {
	escape := func(s string) string {
		var b bytes.Buffer
		xml.EscapeText(&b, []byte(s))
		return b.String()
	}
	var b strings.Builder
	b.WriteString(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>hloth blog</title>`)
	for _, post := range slices.Backward(oldestFirst) {
		fmt.Fprintf(&b, `<item><title>%s</title><description>%s</description><post-id>%s</post-id>`+
			`<enclosure url="%s" length="0" type="image/avif"/></item>`,
			escape(post.Title), escape(post.Description), escape(post.ID), escape(post.ImageURL))
	}
	b.WriteString(`</channel></rss>`)
	return b.String()
}

func Post(id string) feed.Post {
	return feed.Post{ID: id, Title: "Title of " + id, Description: "About " + id, ImageURL: "https://blog.example/" + id + ".webp"}
}
