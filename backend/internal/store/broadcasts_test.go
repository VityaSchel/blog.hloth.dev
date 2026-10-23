package store

import (
	"encoding/json"
	"maps"
	"reflect"
	"slices"
	"strings"
	"testing"
	"time"
)

func enqueue(t *testing.T, s *Store, postID string, want bool) {
	t.Helper()
	if queued, err := s.Enqueue(postID, json.RawMessage(`{"id":"`+postID+`"}`), noon); queued != want || err != nil {
		t.Fatalf("Enqueue(%s) = %v, %v, want %v, nil", postID, queued, err, want)
	}
}

func TestSeedNotifiedOnlyOnce(t *testing.T) {
	path := statePath(t)
	s := open(t, path)
	if seeded, err := s.SeedNotified([]string{"a", "b"}); !seeded || err != nil {
		t.Fatalf("SeedNotified = %v, %v, want true, nil", seeded, err)
	}
	if seeded, err := s.SeedNotified([]string{"c"}); seeded || err != nil {
		t.Fatalf("second SeedNotified = %v, %v, want false, nil", seeded, err)
	}
	enqueue(t, s, "a", false)
	enqueue(t, s, "c", true)

	onDisk := stateOnDisk(t, path)
	if want := map[string]int{"a": 0, "b": 0}; !maps.Equal(onDisk.Notified, want) {
		t.Errorf("notified on disk = %v, want %v", onDisk.Notified, want)
	}
}

func TestSeedNotifiedWithNoPostsStillSeeds(t *testing.T) {
	path := statePath(t)
	if seeded, err := open(t, path).SeedNotified(nil); !seeded || err != nil {
		t.Fatalf("SeedNotified = %v, %v, want true, nil", seeded, err)
	}
	if seeded, err := open(t, path).SeedNotified([]string{"a"}); seeded || err != nil {
		t.Errorf("SeedNotified after a reopen = %v, %v, want false, nil", seeded, err)
	}
}

func TestEnqueuePurgesExpiredAndSnapshotsSortedEndpoints(t *testing.T) {
	path := statePath(t)
	s := open(t, path)
	expired, current := noon.Add(-time.Second), noon.Add(time.Second)
	subscribe(t, s, "https://push.example/c", "https://push.example/a")
	must(t, s.Subscribe("https://push.example/expired", Subscription{P256dh: "key", Auth: "secret", ExpiresAt: &expired}))
	must(t, s.Subscribe("https://push.example/b", Subscription{P256dh: "key", Auth: "secret", ExpiresAt: &current}))

	enqueue(t, s, "new", true)
	subscribe(t, s, "https://push.example/late")
	enqueue(t, s, "new", false)

	for _, s := range []*Store{s, open(t, path)} {
		want := []string{"https://push.example/a", "https://push.example/b", "https://push.example/c"}
		broadcasts := s.Broadcasts()
		if len(broadcasts) != 1 || !slices.Equal(broadcasts[0].Pending, want) || !broadcasts[0].StartedAt.Equal(noon) {
			t.Fatalf("Broadcasts = %+v, want one started at %v with pending %v", broadcasts, noon, want)
		}
		if _, ok := s.Subscription("https://push.example/expired"); ok {
			t.Error("expired subscription survived Enqueue")
		}
		if _, ok := s.Subscription("https://push.example/b"); !ok {
			t.Error("unexpired subscription was purged")
		}
	}
}

func TestEnqueueWithoutSubscribers(t *testing.T) {
	path := statePath(t)
	s := open(t, path)
	enqueue(t, s, "new", true)
	if got := readFile(t, path); !strings.Contains(got, `"sent":0,"pending":[]}]`) {
		t.Fatalf("state file = %s, want an empty pending array", got)
	}
	must(t, s.Finish("new"))
	onDisk := stateOnDisk(t, path)
	if want := map[string]int{"new": 0}; !maps.Equal(onDisk.Notified, want) || len(onDisk.Broadcasts) != 0 {
		t.Errorf("on disk notified %v, broadcasts %v; want %v and none", onDisk.Notified, onDisk.Broadcasts, want)
	}
}

func TestFinishDropsPendingSubscribersOnlyWhenSomethingWasSent(t *testing.T) {
	for sent, want := range map[bool]int{true: 1, false: 3} {
		path := statePath(t)
		s := open(t, path)
		subscribe(t, s, "https://push.example/a", "https://push.example/b", "https://push.example/c")
		enqueue(t, s, "new", true)
		must(t, s.Settle("new", "https://push.example/a", sent))
		must(t, s.Finish("new"))

		onDisk := stateOnDisk(t, path)
		if _, kept := onDisk.Subscriptions["https://push.example/a"]; len(onDisk.Subscriptions) != want || !kept {
			t.Errorf("sent = %v: subscriptions on disk = %v, want %d including the settled one", sent, onDisk.Subscriptions, want)
		}
	}
}

func TestEnqueueRejectsInvalidPayload(t *testing.T) {
	path := statePath(t)
	s := open(t, path)
	for _, payload := range []string{"", `{"id":`, "not json"} {
		if queued, err := s.Enqueue("new", json.RawMessage(payload), noon); queued || err == nil {
			t.Errorf("Enqueue(%q) = %v, %v, want false and an error", payload, queued, err)
		}
	}
	if got := s.Broadcasts(); len(got) != 0 {
		t.Errorf("Broadcasts = %+v, want none", got)
	}
	_, err := s.AddReaction("post", "👍")
	must(t, err)
}

func TestPayloadIsTheSameInMemoryAndAfterReopen(t *testing.T) {
	payloads := map[string]struct {
		payload   string
		unchanged bool
	}{
		"html characters":            {`{"id":"new","title":"<script> & \"quotes\" é 👍","image":{"url":"https://example.com/?a=1&b=2"}}`, true},
		"what json.Marshal produces": {`{"title":"\u003cb\u003e \u0026 \u2028"}`, true},
		"space and raw separators":   {"{ \"id\": \"new\",\n\"title\": \"a\u2028b\u2029c\" }", false},
	}
	for name, test := range payloads {
		t.Run(name, func(t *testing.T) {
			path := statePath(t)
			s := open(t, path)
			_, err := s.Enqueue("new", json.RawMessage(test.payload), noon)
			must(t, err)
			inMemory := string(s.Broadcasts()[0].Payload)
			if reopened := string(open(t, path).Broadcasts()[0].Payload); reopened != inMemory {
				t.Errorf("payload changed across the reopen:\n got %s\nwant %s", reopened, inMemory)
			}
			if test.unchanged && inMemory != test.payload {
				t.Errorf("stored payload:\n got %s\nwant %s", inMemory, test.payload)
			}
			var got, want any
			must(t, json.Unmarshal([]byte(inMemory), &got))
			must(t, json.Unmarshal([]byte(test.payload), &want))
			if !reflect.DeepEqual(got, want) {
				t.Errorf("stored payload means %v, want %v", got, want)
			}
		})
	}
}

func TestBroadcastsAreCopies(t *testing.T) {
	s := open(t, statePath(t))
	subscribe(t, s, "https://push.example/a", "https://push.example/b")
	payload := json.RawMessage(`{"id":"new"}`)
	_, err := s.Enqueue("new", payload, noon)
	must(t, err)
	payload[2] = 'X'

	broadcasts := s.Broadcasts()
	broadcasts[0].Pending[0] = "changed"
	broadcasts[0].Payload[2] = 'X'
	broadcasts[0].Sent = 100

	want := Broadcast{
		PostID:    "new",
		Payload:   json.RawMessage(`{"id":"new"}`),
		StartedAt: noon,
		Pending:   []string{"https://push.example/a", "https://push.example/b"},
	}
	if got := s.Broadcasts()[0]; !reflect.DeepEqual(got, want) {
		t.Errorf("Broadcasts = %+v after callers changed their copies, want %+v", got, want)
	}
}

func TestQueueResumesAfterReopenMidBroadcast(t *testing.T) {
	path := statePath(t)
	s := open(t, path)
	_, err := s.SeedNotified([]string{"old"})
	must(t, err)
	subscribe(t, s, "https://push.example/a", "https://push.example/b", "https://push.example/c", "https://push.example/d")
	enqueue(t, s, "first", true)
	enqueue(t, s, "second", true)

	must(t, s.Settle("first", "https://push.example/a", true))
	must(t, s.Settle("first", "https://push.example/a", true))
	must(t, s.Settle("first", "https://push.example/b", false))
	must(t, s.Settle("first", "https://push.example/unknown", true))
	must(t, s.Settle("unknown", "https://push.example/c", true))

	s = open(t, path)
	all := []string{"https://push.example/a", "https://push.example/b", "https://push.example/c", "https://push.example/d"}
	broadcasts := s.Broadcasts()
	if len(broadcasts) != 2 ||
		broadcasts[0].PostID != "first" || broadcasts[0].Sent != 1 || !slices.Equal(broadcasts[0].Pending, all[2:]) ||
		broadcasts[1].PostID != "second" || broadcasts[1].Sent != 0 || !slices.Equal(broadcasts[1].Pending, all) {
		t.Fatalf("Broadcasts after reopen = %+v", broadcasts)
	}
	enqueue(t, s, "first", false)

	must(t, s.Settle("first", "https://push.example/c", true))
	must(t, s.Settle("first", "https://push.example/d", true))
	must(t, s.Finish("first"))
	must(t, s.Finish("first"))

	s = open(t, path)
	broadcasts = s.Broadcasts()
	if len(broadcasts) != 1 || broadcasts[0].PostID != "second" || !slices.Equal(broadcasts[0].Pending, all) {
		t.Fatalf("Broadcasts after Finish and reopen = %+v, want only the untouched second one", broadcasts)
	}
	enqueue(t, s, "first", false)
	onDisk := stateOnDisk(t, path)
	if want := map[string]int{"old": 0, "first": 3}; !maps.Equal(onDisk.Notified, want) {
		t.Errorf("notified on disk = %v, want %v", onDisk.Notified, want)
	}

	must(t, s.Finish("second"))
	if got := readFile(t, path); !strings.HasSuffix(got, `"notified":{"first":3,"old":0,"second":0},"broadcasts":[]}`+"\n") {
		t.Errorf("queue not empty at rest: %s", got)
	}
}
