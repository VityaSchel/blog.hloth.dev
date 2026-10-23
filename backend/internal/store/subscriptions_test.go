package store

import (
	"errors"
	"fmt"
	"testing"
	"time"
)

func TestSubscribeKeepsTheExistingSubscription(t *testing.T) {
	path := statePath(t)
	s := open(t, path)
	must(t, s.Subscribe("https://push.example/a", Subscription{P256dh: "first", Auth: "first"}))
	before := readFile(t, path)

	s.write = func(string, []byte) error {
		t.Error("subscribing an existing endpoint wrote the state file")
		return nil
	}
	must(t, s.Subscribe("https://push.example/a", Subscription{P256dh: "second", Auth: "second"}))

	if sub, ok := s.Subscription("https://push.example/a"); !ok || sub.P256dh != "first" || sub.Auth != "first" {
		t.Errorf("Subscription = %+v, %v, want the first one", sub, ok)
	}
	if after := readFile(t, path); after != before {
		t.Errorf("file changed: %s", after)
	}
}

func TestUnsubscribe(t *testing.T) {
	path := statePath(t)
	s := open(t, path)
	subscribe(t, s, "https://push.example/a")

	for _, want := range []bool{true, false} {
		if existed, err := s.Unsubscribe("https://push.example/a"); existed != want || err != nil {
			t.Errorf("Unsubscribe = %v, %v, want %v, nil", existed, err, want)
		}
	}
	if _, ok := open(t, path).Subscription("https://push.example/a"); ok {
		t.Error("subscription survived Unsubscribe and a reopen")
	}
}

func TestSubscriptionCap(t *testing.T) {
	s := open(t, statePath(t))
	s.write = func(string, []byte) error { return nil }
	for i := range maxSubscriptions - 1 {
		s.state.Subscriptions[fmt.Sprintf("https://push.example/%d", i)] = Subscription{}
	}

	subscribe(t, s, "https://push.example/last")
	if err := s.Subscribe("https://push.example/overflow", testSubscription); !errors.Is(err, ErrFull) {
		t.Fatalf("Subscribe beyond the cap = %v, want ErrFull", err)
	}
	if _, ok := s.Subscription("https://push.example/overflow"); ok {
		t.Error("subscription beyond the cap was stored")
	}
	if err := s.Subscribe("https://push.example/last", testSubscription); err != nil {
		t.Errorf("Subscribe of an existing endpoint at the cap = %v, want nil", err)
	}

	_, err := s.Unsubscribe("https://push.example/0")
	must(t, err)
	if err := s.Subscribe("https://push.example/overflow", testSubscription); err != nil {
		t.Errorf("Subscribe after freeing a slot = %v, want nil", err)
	}
}

func TestSubscriptionExpiryIsCopiedAndStoredInUTC(t *testing.T) {
	path := statePath(t)
	s := open(t, path)
	want := time.Date(2027, 1, 1, 0, 0, 0, 0, time.UTC)
	callers := want.In(time.FixedZone("UTC+2", 2*60*60))
	must(t, s.Subscribe("https://push.example/a", Subscription{P256dh: "key", Auth: "secret", ExpiresAt: &callers}))
	callers = callers.AddDate(1, 0, 0)

	sub, _ := s.Subscription("https://push.example/a")
	if sub.ExpiresAt == nil || !sub.ExpiresAt.Equal(want) {
		t.Fatalf("ExpiresAt = %v after the caller changed its own value, want %v", sub.ExpiresAt, want)
	}
	*sub.ExpiresAt = sub.ExpiresAt.AddDate(1, 0, 0)
	if sub, _ = s.Subscription("https://push.example/a"); !sub.ExpiresAt.Equal(want) {
		t.Errorf("ExpiresAt = %v after the caller changed the returned value, want %v", sub.ExpiresAt, want)
	}

	if got := stateOnDisk(t, path).Subscriptions["https://push.example/a"].ExpiresAt; got == nil || !got.Equal(want) || got.Location() != time.UTC {
		t.Errorf("ExpiresAt on disk = %v, want %v in UTC", got, want)
	}
}
