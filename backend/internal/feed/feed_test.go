package feed

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"slices"
	"strings"
	"sync"
	"testing"
	"testing/synctest"
	"time"
)

const siteOrigin = "https://blog.example"

type site struct {
	mu     sync.Mutex
	status int
	body   string
	hits   int
	gate   chan struct{}
}

func (s *site) RoundTrip(req *http.Request) (*http.Response, error) {
	s.mu.Lock()
	s.hits++
	status, body, gate := s.status, s.body, s.gate
	s.mu.Unlock()
	if gate != nil {
		select {
		case <-gate:
		case <-req.Context().Done():
			return nil, req.Context().Err()
		}
	}
	return &http.Response{StatusCode: status, Body: io.NopCloser(strings.NewReader(body)), Request: req}, nil
}

func (s *site) serve(status int, body string) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.status, s.body = status, body
}

func (s *site) fetched() int {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.hits
}

func (s *site) feed() *Feed {
	return New(siteOrigin, &http.Client{Transport: s})
}

func rssOf(newestFirst ...string) string {
	var b strings.Builder
	b.WriteString(`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>hloth blog</title>`)
	for _, id := range newestFirst {
		fmt.Fprintf(&b, `<item><title>Title of %[1]s</title><description>About %[1]s</description><post-id>%[1]s</post-id>`+
			`<enclosure url="https://blog.example/_astro/%[1]s.webp" length="0" type="image/avif"/></item>`, id)
	}
	b.WriteString(`</channel></rss>`)
	return b.String()
}

func mustHave(t *testing.T, f *Feed, id string, want bool) {
	t.Helper()
	got, err := f.Has(t.Context(), id)
	if err != nil {
		t.Fatalf("Has(%q): %v", id, err)
	}
	if got != want {
		t.Fatalf("Has(%q) = %v, want %v", id, got, want)
	}
}

func mustHaveFetched(t *testing.T, s *site, want int) {
	t.Helper()
	if got := s.fetched(); got != want {
		t.Fatalf("feed fetched %d times, want %d", got, want)
	}
}

func TestRefreshOverHTTPKeepsCacheOnFailure(t *testing.T) {
	s := &site{}
	s.serve(http.StatusOK, fixture)
	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodGet || r.URL.Path != "/rss.xml" {
			http.Error(w, "unexpected request", http.StatusBadRequest)
			return
		}
		s.mu.Lock()
		status, body := s.status, s.body
		s.mu.Unlock()
		w.Header().Set("Content-Type", "application/xml")
		w.WriteHeader(status)
		io.WriteString(w, body)
	}))
	defer srv.Close()

	f := New(srv.URL, nil)
	posts, err := f.Refresh(t.Context())
	if err != nil {
		t.Fatal(err)
	}
	if !slices.Equal(posts, fixturePosts) {
		t.Fatalf("posts:\n got %+v\nwant %+v", posts, fixturePosts)
	}

	failures := []struct {
		name   string
		status int
		body   string
	}{
		{"server error with a valid body", http.StatusInternalServerError, fixture},
		{"not found", http.StatusNotFound, fixture},
		{"no content", http.StatusNoContent, ""},
		{"html page", http.StatusOK, "<!doctype html><html><body>maintenance</body></html>"},
		{"truncated", http.StatusOK, fixture[:len(fixture)/2]},
		{"wrong channel", http.StatusOK, strings.ReplaceAll(fixture, "<title>hloth blog</title>", "<title>renamed</title>")},
	}
	for _, failure := range failures {
		t.Run(failure.name, func(t *testing.T) {
			s.serve(failure.status, failure.body)
			if posts, err := f.Refresh(t.Context()); err == nil {
				t.Fatalf("refresh succeeded with %+v", posts)
			}
			for _, post := range fixturePosts {
				mustHave(t, f, post.ID, true)
			}
		})
	}
}

func TestHasRefreshesOnMissAtMostEvery15Seconds(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		s := &site{}
		s.serve(http.StatusOK, rssOf("a"))
		f := s.feed()
		if _, err := f.Refresh(t.Context()); err != nil {
			t.Fatal(err)
		}

		s.serve(http.StatusOK, rssOf("b", "a"))
		mustHave(t, f, "a", true)
		mustHave(t, f, "b", false)
		time.Sleep(missRefreshInterval - time.Nanosecond)
		mustHave(t, f, "b", false)
		mustHaveFetched(t, s, 1)

		time.Sleep(time.Nanosecond)
		mustHave(t, f, "b", true)
		mustHaveFetched(t, s, 2)

		for range 100 {
			mustHave(t, f, "garbage", false)
			mustHave(t, f, "b", true)
		}
		mustHaveFetched(t, s, 2)

		time.Sleep(missRefreshInterval)
		mustHave(t, f, "garbage", false)
		mustHave(t, f, "garbage", false)
		mustHaveFetched(t, s, 3)
	})
}

func TestHasBeforeAnyLoad(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		s := &site{}
		s.serve(http.StatusServiceUnavailable, "")
		f := s.feed()

		for range 3 {
			if ok, err := f.Has(t.Context(), "a"); err == nil {
				t.Fatalf("Has = %v without a loaded feed, want an error", ok)
			}
		}
		mustHaveFetched(t, s, 1)

		s.serve(http.StatusOK, rssOf("a"))
		time.Sleep(missRefreshInterval)
		mustHave(t, f, "a", true)
		mustHaveFetched(t, s, 2)

		s.serve(http.StatusBadGateway, "")
		time.Sleep(missRefreshInterval)
		mustHave(t, f, "missing", false)
		mustHaveFetched(t, s, 3)
		mustHave(t, f, "a", true)
	})
}

func TestConcurrentCallersShareOneRefresh(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		s := &site{gate: make(chan struct{})}
		s.serve(http.StatusOK, rssOf("b", "a"))
		f := s.feed()

		const callers = 16
		refreshed := make([][]Post, callers)
		found := make([]bool, callers)
		errs := make([]error, callers)
		var wg sync.WaitGroup
		for i := range callers {
			wg.Go(func() {
				if i%2 == 0 {
					refreshed[i], errs[i] = f.Refresh(t.Context())
				} else {
					found[i], errs[i] = f.Has(t.Context(), "b")
				}
			})
		}
		synctest.Wait()
		close(s.gate)
		wg.Wait()

		mustHaveFetched(t, s, 1)
		for i := range callers {
			switch {
			case errs[i] != nil:
				t.Fatalf("caller %d: %v", i, errs[i])
			case i%2 == 0 && (len(refreshed[i]) != 2 || refreshed[i][0].ID != "a" || refreshed[i][1].ID != "b"):
				t.Fatalf("caller %d refreshed %+v", i, refreshed[i])
			case i%2 == 1 && !found[i]:
				t.Fatalf("caller %d did not find the post", i)
			}
			if i%2 == 0 {
				refreshed[i][0].ID = "overwritten by a caller"
			}
		}
	})
}

func TestRefreshOutlivesCanceledCaller(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		s := &site{gate: make(chan struct{})}
		s.serve(http.StatusOK, rssOf("a"))
		f := s.feed()

		ctx, cancel := context.WithCancel(t.Context())
		gaveUp := make(chan error, 1)
		go func() {
			_, err := f.Refresh(ctx)
			gaveUp <- err
		}()
		synctest.Wait()

		found := make(chan bool, 1)
		go func() {
			ok, _ := f.Has(t.Context(), "a")
			found <- ok
		}()
		synctest.Wait()

		cancel()
		synctest.Wait()
		select {
		case err := <-gaveUp:
			if !errors.Is(err, context.Canceled) {
				t.Fatalf("canceled caller got %v", err)
			}
		default:
			t.Fatal("canceled caller is still waiting for the fetch")
		}

		close(s.gate)
		if !<-found {
			t.Fatal("the shared refresh died with the caller that started it")
		}
		mustHaveFetched(t, s, 1)
	})
}

func TestFetchTimesOut(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		s := &site{gate: make(chan struct{})}
		f := s.feed()

		start := time.Now()
		_, err := f.Refresh(t.Context())
		if !errors.Is(err, context.DeadlineExceeded) {
			t.Fatalf("got %v, want a deadline error", err)
		}
		if waited := time.Since(start); waited != fetchTimeout {
			t.Fatalf("gave up after %v, want %v", waited, fetchTimeout)
		}
	})
}

type repeated byte

func (b repeated) Read(p []byte) (int, error) {
	for i := range p {
		p[i] = byte(b)
	}
	return len(p), nil
}

type countingBody struct {
	io.Reader
	read int
}

func (c *countingBody) Read(p []byte) (int, error) {
	n, err := c.Reader.Read(p)
	c.read += n
	return n, err
}

func (*countingBody) Close() error { return nil }

func TestRefreshCapsBody(t *testing.T) {
	synctest.Test(t, func(t *testing.T) {
		body := &countingBody{Reader: io.MultiReader(
			strings.NewReader(`<rss version="2.0"><channel><title>hloth blog</title><item><post-id>a</post-id><description>`),
			io.LimitReader(repeated('x'), maxBodyBytes),
			strings.NewReader(`</description></item></channel></rss>`),
		)}
		f := New(siteOrigin, &http.Client{Transport: transport(func(req *http.Request) (*http.Response, error) {
			return &http.Response{StatusCode: http.StatusOK, Body: body, Request: req}, nil
		})})

		if posts, err := f.Refresh(t.Context()); err == nil {
			t.Fatalf("accepted an oversized feed with %d posts", len(posts))
		}
		if body.read > maxBodyBytes {
			t.Fatalf("read %d bytes, cap is %d", body.read, maxBodyBytes)
		}
	})
}

type transport func(*http.Request) (*http.Response, error)

func (t transport) RoundTrip(req *http.Request) (*http.Response, error) { return t(req) }
