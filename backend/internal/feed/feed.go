package feed

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"slices"
	"sync"
	"time"
)

const (
	feedPath            = "/rss.xml"
	fetchTimeout        = 10 * time.Second
	maxBodyBytes        = 10 << 20
	missRefreshInterval = 15 * time.Second
)

type Feed struct {
	url    string
	client *http.Client

	mu        sync.Mutex
	ids       map[string]struct{}
	err       error
	attempted time.Time
	inflight  *refresh
}

type refresh struct {
	done  chan struct{}
	posts []Post
	err   error
}

func New(origin string, client *http.Client) *Feed {
	if client == nil {
		client = http.DefaultClient
	}
	return &Feed{url: origin + feedPath, client: client}
}

func (f *Feed) Refresh(ctx context.Context) ([]Post, error) {
	f.mu.Lock()
	r := f.inflight
	if r == nil {
		r = &refresh{done: make(chan struct{})}
		f.inflight = r
		f.attempted = time.Now()
		// Other callers share this fetch, so it must outlive the one that started it.
		go f.run(context.WithoutCancel(ctx), r)
	}
	f.mu.Unlock()

	select {
	case <-r.done:
		return slices.Clone(r.posts), r.err
	case <-ctx.Done():
		return nil, ctx.Err()
	}
}

func (f *Feed) Has(ctx context.Context, id string) (bool, error) {
	f.mu.Lock()
	_, ok := f.ids[id]
	err := f.err
	throttled := f.inflight == nil && time.Since(f.attempted) < missRefreshInterval
	f.mu.Unlock()
	if ok {
		return true, nil
	}
	if !throttled {
		_, err = f.Refresh(ctx)
	}

	f.mu.Lock()
	defer f.mu.Unlock()
	if f.ids == nil {
		return false, err
	}
	_, ok = f.ids[id]
	return ok, nil
}

func (f *Feed) run(ctx context.Context, r *refresh) {
	r.posts, r.err = f.fetch(ctx)

	f.mu.Lock()
	if r.err == nil {
		f.ids = make(map[string]struct{}, len(r.posts))
		for _, post := range r.posts {
			f.ids[post.ID] = struct{}{}
		}
	}
	f.err = r.err
	f.inflight = nil
	f.mu.Unlock()
	close(r.done)
}

func (f *Feed) fetch(ctx context.Context) ([]Post, error) {
	ctx, cancel := context.WithTimeout(ctx, fetchTimeout)
	defer cancel()
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, f.url, nil)
	if err != nil {
		return nil, err
	}
	res, err := f.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer res.Body.Close()
	if res.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("feed: unexpected status %d", res.StatusCode)
	}
	return parse(io.LimitReader(res.Body, maxBodyBytes))
}
