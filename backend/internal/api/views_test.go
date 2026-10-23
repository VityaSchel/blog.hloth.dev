package api

import (
	"encoding/base64"
	"testing"
	"time"

	"blog.hloth.dev/backend/internal/testkit"
)

func TestViewsCountEachVisitorOncePerPost(t *testing.T) {
	a := newAPI(t, testkit.NewFakeFeed(t, testkit.Post("first"), testkit.Post("second")))
	view := func(postID string, headers ...string) response {
		return a.send(t, "POST", "/posts/"+postID+"/views", "", append(headers, "Origin", testOrigin)...)
	}
	a.send(t, "GET", "/posts/first/views", "").expect(t, 200, "0")
	view("missing").expect(t, 404, postNotFound)

	view("first", "X-Forwarded-For", "198.51.100.1").expect(t, 200, `{"ok":true,"value":1}`)
	view("first", "X-Forwarded-For", "198.51.100.1").expect(t, 200, `{"ok":true,"value":1}`)
	view("first", "X-Forwarded-For", "10.0.0.1, 198.51.100.1").expect(t, 200, `{"ok":true,"value":1}`)
	view("first", "X-Forwarded-For", "198.51.100.1, 198.51.100.2").expect(t, 200, `{"ok":true,"value":2}`)
	view("first").expect(t, 200, `{"ok":true,"value":3}`)
	view("first").expect(t, 200, `{"ok":true,"value":3}`)
	view("second", "X-Forwarded-For", "198.51.100.1").expect(t, 200, `{"ok":true,"value":1}`)

	a.send(t, "GET", "/posts/first/views", "").expect(t, 200, "3")
	a.send(t, "GET", "/posts/second/views", "", "Origin", testOrigin).expect(t, 200, "1")

	a.expectStateOmits(t, "198.51.100", "127.0.0.1")
	if got := testkit.OpenStore(t, a.path).Views("first"); got != 3 {
		t.Fatalf("after reopening the state file the count is %d, want 3", got)
	}
}

func TestVisitorHash(t *testing.T) {
	s := &server{pepper: "pepper"}
	day := time.Date(2026, 10, 2, 23, 59, 59, 0, time.UTC)
	base := s.visitorHash("post", "198.51.100.1", day)
	if raw, err := base64.RawURLEncoding.DecodeString(base); err != nil || len(raw) != 12 {
		t.Fatalf("visitor hash %q is not 12 base64url bytes", base)
	}
	if want := "qU0AlmbpAJFNYTj2"; base != want {
		t.Errorf("visitor hash = %s, want %s", base, want)
	}
	same := map[string]string{
		"same inputs":              s.visitorHash("post", "198.51.100.1", day),
		"same UTC day":             s.visitorHash("post", "198.51.100.1", day.Add(-23*time.Hour)),
		"same instant, other zone": s.visitorHash("post", "198.51.100.1", day.In(time.FixedZone("east", 5*3600))),
	}
	for name, id := range same {
		if id != base {
			t.Errorf("%s: id changed", name)
		}
	}
	different := map[string]string{
		"other ip":        s.visitorHash("post", "198.51.100.2", day),
		"other post":      s.visitorHash("post2", "198.51.100.1", day),
		"next UTC day":    s.visitorHash("post", "198.51.100.1", day.Add(time.Second)),
		"other pepper":    (&server{pepper: "pepper2"}).visitorHash("post", "198.51.100.1", day),
		"shifted post/ip": s.visitorHash("post1", "98.51.100.1", day),
	}
	for name, id := range different {
		if id == base {
			t.Errorf("%s: id did not change", name)
		}
	}
}
