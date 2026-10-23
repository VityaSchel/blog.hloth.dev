package store

import (
	"errors"
	"maps"
	"time"
)

const maxSubscriptions = 1_000

var ErrFull = errors.New("store: too many subscriptions")

type Subscription struct {
	P256dh    string     `json:"p256dh"`
	Auth      string     `json:"auth"`
	ExpiresAt *time.Time `json:"expiresAt"`
}

func (s *Store) Subscribe(endpoint string, sub Subscription) error {
	full := false
	err := s.mutate(func() bool {
		if _, exists := s.state.Subscriptions[endpoint]; exists {
			return false
		}
		if full = len(s.state.Subscriptions) >= maxSubscriptions; full {
			return false
		}
		s.state.Subscriptions[endpoint] = sub.clone()
		return true
	})
	if full {
		return ErrFull
	}
	return err
}

func (s *Store) Unsubscribe(endpoint string) (bool, error) {
	existed := false
	err := s.mutate(func() bool {
		_, existed = s.state.Subscriptions[endpoint]
		delete(s.state.Subscriptions, endpoint)
		return existed
	})
	return existed, err
}

func (s *Store) Subscription(endpoint string) (Subscription, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	sub, ok := s.state.Subscriptions[endpoint]
	return sub.clone(), ok
}

func (sub Subscription) clone() Subscription {
	if sub.ExpiresAt != nil {
		expiresAt := storedTime(*sub.ExpiresAt)
		sub.ExpiresAt = &expiresAt
	}
	return sub
}

func (st *state) dropExpiredSubscriptions(now time.Time) {
	maps.DeleteFunc(st.Subscriptions, func(_ string, sub Subscription) bool {
		return sub.ExpiresAt != nil && sub.ExpiresAt.Before(now)
	})
}
