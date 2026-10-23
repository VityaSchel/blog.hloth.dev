package broadcast

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"maps"
	"net/http"
	"net/http/httptest"
	"os"
	"slices"
	"strings"
	"sync"
	"testing"
	"time"

	"blog.hloth.dev/backend/internal/feed"
	"blog.hloth.dev/backend/internal/store"
	"blog.hloth.dev/backend/internal/testkit"
	"blog.hloth.dev/backend/internal/webpush"
)

func TestMain(m *testing.M) {
	log.SetOutput(io.Discard)
	os.Exit(m.Run())
}

func writeState(t *testing.T, path string, doc testkit.StateDocument) {
	t.Helper()
	data, err := json.Marshal(doc)
	if err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(path, data, 0o600); err != nil {
		t.Fatal(err)
	}
}

type pushService struct {
	*httptest.Server
	mu       sync.Mutex
	answers  map[string]int
	hits     map[string]int
	topics   map[string]bool
	largest  int64
	onRecord func(total int)
}

func newPushService(t *testing.T) *pushService {
	t.Helper()
	p := &pushService{answers: map[string]int{}, hits: map[string]int{}, topics: map[string]bool{}}
	p.Server = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		io.Copy(io.Discard, r.Body)
		p.mu.Lock()
		p.hits[r.URL.Path]++
		p.topics[r.Header.Get("Topic")] = true
		p.largest = max(p.largest, r.ContentLength)
		status, total, onRecord := p.answers[r.URL.Path], p.total(), p.onRecord
		p.mu.Unlock()
		if onRecord != nil {
			onRecord(total)
		}
		if status == 0 {
			status = http.StatusCreated
		}
		w.WriteHeader(status)
	}))
	t.Cleanup(p.Close)
	return p
}

func (p *pushService) total() int {
	total := 0
	for _, count := range p.hits {
		total += count
	}
	return total
}

func (p *pushService) answer(endpoint string, status int) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.answers[strings.TrimPrefix(endpoint, p.URL)] = status
}

func (p *pushService) delivered() map[string]int {
	p.mu.Lock()
	defer p.mu.Unlock()
	delivered := make(map[string]int, len(p.hits))
	for path, count := range p.hits {
		delivered[p.URL+path] = count
	}
	return delivered
}

func (p *pushService) setOnRecord(f func(total int)) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.onRecord = f
}

func (p *pushService) topicsSeen() map[string]bool {
	p.mu.Lock()
	defer p.mu.Unlock()
	return maps.Clone(p.topics)
}

func (p *pushService) largestBody() int64 {
	p.mu.Lock()
	defer p.mu.Unlock()
	return p.largest
}

func (p *pushService) endpoints(count int) []string {
	endpoints := make([]string, count)
	for i := range endpoints {
		endpoints[i] = fmt.Sprintf("%s/push/%03d", p.URL, i)
	}
	return endpoints
}

type broadcastFixture struct {
	t     *testing.T
	path  string
	feed  *testkit.FakeFeed
	push  *pushService
	store *store.Store
	*broadcaster
}

func newBroadcastFixture(t *testing.T, posts ...feed.Post) *broadcastFixture {
	t.Helper()
	f := &broadcastFixture{t: t, path: testkit.StatePath(t), feed: testkit.NewFakeFeed(t, posts...), push: newPushService(t)}
	f.reopen()
	return f
}

func (f *broadcastFixture) reopen() {
	f.t.Helper()
	public, private := testkit.VAPIDKeys(f.t)
	sender, err := webpush.NewSender(public, private, "https://blog.example", 5*time.Second)
	if err != nil {
		f.t.Fatal(err)
	}
	f.store = testkit.OpenStore(f.t, f.path)
	f.broadcaster = &broadcaster{feed: f.feed.Feed(), store: f.store, sender: sender}
}

func (f *broadcastFixture) subscribe(endpoints ...string) {
	f.t.Helper()
	p256dh, auth := testkit.SubscriberKeys(f.t)
	for _, endpoint := range endpoints {
		if err := f.store.Subscribe(endpoint, store.Subscription{P256dh: p256dh, Auth: auth}); err != nil {
			f.t.Fatal(err)
		}
	}
}

func (f *broadcastFixture) expectDelivered(want map[string]int) {
	f.t.Helper()
	if got := f.push.delivered(); !maps.Equal(got, want) {
		f.t.Fatalf("pushes per endpoint:\n got %v\nwant %v", got, want)
	}
}

func once(endpoints []string) map[string]int {
	counts := make(map[string]int, len(endpoints))
	for _, endpoint := range endpoints {
		counts[endpoint] = 1
	}
	return counts
}

func TestFreshStateSeedsWithoutSending(t *testing.T) {
	f := newBroadcastFixture(t, testkit.Post("old-1"), testkit.Post("old-2"))
	f.subscribe(f.push.endpoints(3)...)

	f.cycle(t.Context())
	f.cycle(t.Context())

	f.expectDelivered(map[string]int{})
	state := testkit.ReadState(t, f.path)
	if !maps.Equal(state.Notified, map[string]int{"old-1": 0, "old-2": 0}) || len(state.Broadcasts) != 0 {
		t.Fatalf("notified = %v, broadcasts = %v", state.Notified, state.Broadcasts)
	}
}

func TestEmptyFeedDoesNotSeed(t *testing.T) {
	f := newBroadcastFixture(t)
	f.subscribe(f.push.endpoints(2)...)

	f.cycle(t.Context())
	if state := testkit.ReadState(t, f.path); state.Notified != nil {
		t.Fatalf("an empty feed seeded notified = %v", state.Notified)
	}

	f.feed.Publish(testkit.Post("old-1"), testkit.Post("old-2"))
	f.cycle(t.Context())
	f.expectDelivered(map[string]int{})
	if state := testkit.ReadState(t, f.path); len(state.Notified) != 2 {
		t.Fatalf("notified = %v", state.Notified)
	}
}

func TestNewPostReachesEverySubscriberOnce(t *testing.T) {
	f := newBroadcastFixture(t, testkit.Post("old"))
	endpoints := f.push.endpoints(25)
	f.subscribe(endpoints...)
	f.cycle(t.Context())

	f.feed.Publish(testkit.Post("new"))
	f.cycle(t.Context())
	f.cycle(t.Context())

	f.expectDelivered(once(endpoints))
	state := testkit.ReadState(t, f.path)
	if !maps.Equal(state.Notified, map[string]int{"old": 0, "new": 25}) || len(state.Broadcasts) != 0 {
		t.Fatalf("notified = %v, broadcasts = %v", state.Notified, state.Broadcasts)
	}
	if len(state.Subscriptions) != 25 {
		t.Fatalf("%d subscriptions left, want 25", len(state.Subscriptions))
	}
	if topics, want := f.push.topicsSeen(), map[string]bool{topicFor("new"): true}; !maps.Equal(topics, want) {
		t.Fatalf("Topic headers = %v, want %v", topics, want)
	}
}

func TestSeveralNewPostsAreSentOldestFirst(t *testing.T) {
	f := newBroadcastFixture(t, testkit.Post("old"))
	endpoints := f.push.endpoints(3)
	f.subscribe(endpoints...)
	f.cycle(t.Context())

	f.feed.Publish(testkit.Post("new-1"), testkit.Post("new-2"))
	if err := f.enqueueNewPosts(t.Context()); err != nil {
		t.Fatal(err)
	}
	queued := f.store.Broadcasts()
	if len(queued) != 2 || queued[0].PostID != "new-1" || queued[1].PostID != "new-2" {
		t.Fatalf("queue = %+v", queued)
	}
	want := `{"id":"new-1","title":"Title of new-1","description":"About new-1","image":{"url":"https://blog.example/new-1.webp"}}`
	if string(queued[0].Payload) != want {
		t.Fatalf("payload = %s\nwant      %s", queued[0].Payload, want)
	}

	f.cycle(t.Context())
	f.expectDelivered(map[string]int{endpoints[0]: 2, endpoints[1]: 2, endpoints[2]: 2})
	if state := testkit.ReadState(t, f.path); state.Notified["new-1"] != 3 || state.Notified["new-2"] != 3 {
		t.Fatalf("notified = %v", state.Notified)
	}
}

func TestCanceledBroadcastResumesAfterReopen(t *testing.T) {
	f := newBroadcastFixture(t, testkit.Post("old"))
	endpoints := f.push.endpoints(60)
	f.subscribe(endpoints...)
	f.cycle(t.Context())
	f.feed.Publish(testkit.Post("new"))

	ctx, cancel := context.WithCancel(t.Context())
	f.push.setOnRecord(func(total int) {
		if total == 7 {
			cancel()
		}
	})
	f.cycle(ctx)
	if ctx.Err() == nil {
		t.Fatal("the push service never canceled the drain")
	}

	sentBeforeStop := len(f.push.delivered())
	if sentBeforeStop < 7 || sentBeforeStop > 7+2*concurrentSends {
		t.Fatalf("%d pushes went out before the drain stopped, want 7 plus at most the sends in flight", sentBeforeStop)
	}
	state := testkit.ReadState(t, f.path)
	if len(state.Broadcasts) != 1 || state.Broadcasts[0].Sent != sentBeforeStop || len(state.Broadcasts[0].Pending) != 60-sentBeforeStop {
		t.Fatalf("persisted queue after cancel = %+v, %d pushes were answered", state.Broadcasts, sentBeforeStop)
	}
	for _, endpoint := range state.Broadcasts[0].Pending {
		if f.push.delivered()[endpoint] != 0 {
			t.Fatalf("%s was pushed but is still pending", endpoint)
		}
	}
	if _, notified := state.Notified["new"]; notified {
		t.Fatal("the interrupted broadcast is already marked as notified")
	}

	f.push.setOnRecord(nil)
	f.feed.SetDown(true)
	f.reopen()
	f.cycle(t.Context())

	f.expectDelivered(once(endpoints))
	state = testkit.ReadState(t, f.path)
	if state.Notified["new"] != 60 || len(state.Broadcasts) != 0 {
		t.Fatalf("after resume: notified = %v, broadcasts = %v", state.Notified, state.Broadcasts)
	}
}

func TestPushServiceAnswers(t *testing.T) {
	tests := []struct {
		status      int
		unsubscribe bool
	}{
		{http.StatusNotFound, true},
		{http.StatusGone, true},
		{http.StatusBadRequest, false},
		{http.StatusForbidden, false},
		{http.StatusRequestEntityTooLarge, false},
		{http.StatusTooManyRequests, false},
		{http.StatusInternalServerError, false},
		{http.StatusServiceUnavailable, false},
		{http.StatusMovedPermanently, false},
	}
	for _, test := range tests {
		t.Run(fmt.Sprint(test.status), func(t *testing.T) {
			f := newBroadcastFixture(t, testkit.Post("old"))
			endpoints := f.push.endpoints(12)
			failing := endpoints[5]
			f.subscribe(endpoints...)
			f.cycle(t.Context())
			f.feed.Publish(testkit.Post("new"))
			f.push.answer(failing, test.status)

			f.cycle(t.Context())

			f.expectDelivered(once(endpoints))
			state := testkit.ReadState(t, f.path)
			_, subscribed := state.Subscriptions[failing]
			if subscribed == test.unsubscribe {
				t.Fatalf("subscribed after %d = %v", test.status, subscribed)
			}
			if test.unsubscribe {
				if len(state.Broadcasts) != 0 || state.Notified["new"] != 11 || len(state.Subscriptions) != 11 {
					t.Fatalf("notified = %v, broadcasts = %+v, %d subscriptions", state.Notified, state.Broadcasts, len(state.Subscriptions))
				}
				return
			}
			if len(state.Broadcasts) != 1 || state.Broadcasts[0].Sent != 11 || !slices.Equal(state.Broadcasts[0].Pending, []string{failing}) {
				t.Fatalf("queue after a transient failure = %+v", state.Broadcasts)
			}
			if _, notified := state.Notified["new"]; notified {
				t.Fatal("the broadcast finished with an endpoint still pending")
			}

			f.push.answer(failing, http.StatusCreated)
			f.cycle(t.Context())

			want := once(endpoints)
			want[failing] = 2
			f.expectDelivered(want)
			state = testkit.ReadState(t, f.path)
			if len(state.Broadcasts) != 0 || state.Notified["new"] != 12 || len(state.Subscriptions) != 12 {
				t.Fatalf("after recovery: notified = %v, broadcasts = %+v", state.Notified, state.Broadcasts)
			}
		})
	}
}

func TestUnreachablePushServiceKeepsSubscription(t *testing.T) {
	f := newBroadcastFixture(t, testkit.Post("old"))
	closed := httptest.NewServer(http.NotFoundHandler())
	unreachable := closed.URL + "/push/secret-token"
	closed.Close()
	f.subscribe(unreachable)
	f.cycle(t.Context())
	f.feed.Publish(testkit.Post("new"))

	f.cycle(t.Context())

	state := testkit.ReadState(t, f.path)
	if _, subscribed := state.Subscriptions[unreachable]; !subscribed || len(state.Broadcasts) != 1 || !slices.Equal(state.Broadcasts[0].Pending, []string{unreachable}) {
		t.Fatalf("subscriptions = %v, broadcasts = %+v", state.Subscriptions, state.Broadcasts)
	}
}

func TestQueuedState(t *testing.T) {
	p256dh, auth := testkit.SubscriberKeys(t)
	sub := store.Subscription{P256dh: p256dh, Auth: auth}
	payload := json.RawMessage(`{"id":"new","title":"t","description":"d","image":{"url":"https://blog.example/a.webp"}}`)

	t.Run("feed down at startup still drains the queue", func(t *testing.T) {
		f := newBroadcastFixture(t)
		endpoints := f.push.endpoints(3)
		writeState(t, f.path, testkit.StateDocument{
			Subscriptions: map[string]store.Subscription{endpoints[0]: sub, endpoints[1]: sub, endpoints[2]: sub},
			Notified:      map[string]int{"old": 0},
			Broadcasts:    []store.Broadcast{{PostID: "new", Payload: payload, StartedAt: time.Now().Add(-23 * time.Hour), Sent: 1, Pending: endpoints[1:]}},
		})
		f.feed.SetDown(true)
		f.reopen()

		f.cycle(t.Context())

		f.expectDelivered(once(endpoints[1:]))
		if state := testkit.ReadState(t, f.path); state.Notified["new"] != 3 || len(state.Broadcasts) != 0 {
			t.Fatalf("notified = %v, broadcasts = %+v", state.Notified, state.Broadcasts)
		}
	})

	t.Run("a broadcast older than 24 h gets one last attempt, then drops who still fails", func(t *testing.T) {
		f := newBroadcastFixture(t)
		endpoints := f.push.endpoints(3)
		f.push.answer(endpoints[1], http.StatusInternalServerError)
		writeState(t, f.path, testkit.StateDocument{
			Subscriptions: map[string]store.Subscription{endpoints[0]: sub, endpoints[1]: sub, endpoints[2]: sub},
			Notified:      map[string]int{"old": 0},
			Broadcasts:    []store.Broadcast{{PostID: "new", Payload: payload, StartedAt: time.Now().Add(-24*time.Hour - time.Minute), Sent: 1, Pending: endpoints[1:]}},
		})
		f.reopen()

		f.cycle(t.Context())

		f.expectDelivered(once(endpoints[1:]))
		state := testkit.ReadState(t, f.path)
		_, failing := state.Subscriptions[endpoints[1]]
		if state.Notified["new"] != 2 || len(state.Broadcasts) != 0 || len(state.Subscriptions) != 2 || failing {
			t.Fatalf("notified = %v, broadcasts = %+v, subscriptions = %v", state.Notified, state.Broadcasts, slices.Collect(maps.Keys(state.Subscriptions)))
		}
	})

	t.Run("an endpoint that unsubscribed is skipped", func(t *testing.T) {
		f := newBroadcastFixture(t)
		endpoints := f.push.endpoints(2)
		writeState(t, f.path, testkit.StateDocument{
			Subscriptions: map[string]store.Subscription{endpoints[0]: sub},
			Notified:      map[string]int{"old": 0},
			Broadcasts:    []store.Broadcast{{PostID: "new", Payload: payload, StartedAt: time.Now(), Pending: endpoints}},
		})
		f.reopen()

		f.cycle(t.Context())

		f.expectDelivered(once(endpoints[:1]))
		if state := testkit.ReadState(t, f.path); state.Notified["new"] != 1 || len(state.Broadcasts) != 0 {
			t.Fatalf("notified = %v, broadcasts = %+v", state.Notified, state.Broadcasts)
		}
	})

	t.Run("a broadcast without subscribers finishes at once", func(t *testing.T) {
		f := newBroadcastFixture(t, testkit.Post("old"))
		f.cycle(t.Context())
		f.feed.Publish(testkit.Post("new"))

		f.cycle(t.Context())

		if state := testkit.ReadState(t, f.path); !maps.Equal(state.Notified, map[string]int{"old": 0, "new": 0}) || len(state.Broadcasts) != 0 {
			t.Fatalf("notified = %v, broadcasts = %+v", state.Notified, state.Broadcasts)
		}
	})
}

func TestLongDescriptionIsDelivered(t *testing.T) {
	f := newBroadcastFixture(t, testkit.Post("old"))
	endpoints := f.push.endpoints(1)
	f.subscribe(endpoints...)
	f.cycle(t.Context())
	long := testkit.Post("new")
	long.Description = strings.Repeat("Długi opis <b>&</b> 🚀\u2028", 400)
	f.feed.Publish(long)

	f.cycle(t.Context())

	f.expectDelivered(once(endpoints))
	if largest := f.push.largestBody(); largest <= 4096-6 || largest > 4096 {
		t.Fatalf("largest push body = %d bytes, want a record filled up to 4096 bytes", largest)
	}
}

func TestRunDrainsAtStartupAndStopsOnCancel(t *testing.T) {
	f := newBroadcastFixture(t, testkit.Post("old"))
	endpoints := f.push.endpoints(2)
	f.subscribe(endpoints...)
	f.cycle(t.Context())
	f.feed.Publish(testkit.Post("new"))

	ctx, cancel := context.WithCancel(t.Context())
	defer cancel()
	delivered := make(chan struct{})
	f.push.setOnRecord(func(total int) {
		if total == len(endpoints) {
			close(delivered)
		}
	})
	stopped := make(chan struct{})
	go func() {
		defer close(stopped)
		Run(ctx, f.broadcaster.feed, f.store, f.sender)
	}()
	for _, step := range []struct {
		name string
		done <-chan struct{}
	}{{"deliver at startup", delivered}, {"return after cancel", stopped}} {
		select {
		case <-step.done:
			cancel()
		case <-time.After(10 * time.Second):
			t.Fatalf("run did not %s", step.name)
		}
	}
	f.expectDelivered(once(endpoints))
}

func TestTopic(t *testing.T) {
	seen := map[string]string{}
	for _, postID := range []string{"", "a", "taken-on-grindr-hack", strings.Repeat("long", 100), "пост", "a/b c"} {
		topic := topicFor(postID)
		if len(topic) == 0 || len(topic) > 32 || strings.Trim(topic, "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_") != "" {
			t.Errorf("topic for %q = %q: not a base64url token of at most 32 characters", postID, topic)
		}
		if other, taken := seen[topic]; taken {
			t.Errorf("%q and %q share a topic", postID, other)
		}
		seen[topic] = postID
	}
}
