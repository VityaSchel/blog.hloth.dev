package webpush

import (
	"bytes"
	"context"
	"crypto/ecdh"
	"crypto/rand"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strconv"
	"time"
)

const (
	pushTTL           = 4 * 7 * 24 * time.Hour
	maxErrorBodyBytes = 1024
)

type StatusError struct {
	Code int
	Body string
}

func (e *StatusError) Error() string {
	return fmt.Sprintf("webpush: push service answered %d: %q", e.Code, e.Body)
}

func (e *StatusError) SubscriptionGone() bool {
	return e.Code == http.StatusNotFound || e.Code == http.StatusGone
}

type Sender struct {
	vapid  vapid
	client *http.Client
	now    func() time.Time
}

func NewSender(publicKey, privateKey, subject string, timeout time.Duration) (*Sender, error) {
	v, err := newVAPID(publicKey, privateKey, subject)
	if err != nil {
		return nil, err
	}
	return &Sender{
		vapid: v,
		client: &http.Client{
			Timeout: timeout,
			// A redirect would send the push to a host the endpoint allowlist never checked.
			CheckRedirect: func(*http.Request, []*http.Request) error { return http.ErrUseLastResponse },
		},
		now: time.Now,
	}, nil
}

func (s *Sender) Send(ctx context.Context, endpoint, p256dh, auth string, payload []byte, topic string) error {
	return redact(s.send(ctx, endpoint, p256dh, auth, payload, topic))
}

func (s *Sender) send(ctx context.Context, endpoint, p256dh, auth string, payload []byte, topic string) error {
	receiver, secret, err := decodeKeys(p256dh, auth)
	if err != nil {
		return err
	}
	ephemeral, err := ecdh.P256().GenerateKey(rand.Reader)
	if err != nil {
		return err
	}
	salt := make([]byte, saltSize)
	rand.Read(salt)
	body, err := encrypt(payload, receiver, secret, ephemeral, salt)
	if err != nil {
		return err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(body))
	if err != nil {
		return err
	}
	authorization, err := s.vapid.authorization(req.URL, s.now())
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", authorization)
	req.Header.Set("Content-Encoding", "aes128gcm")
	req.Header.Set("Content-Type", "application/octet-stream")
	req.Header.Set("TTL", strconv.FormatInt(int64(pushTTL/time.Second), 10))
	req.Header.Set("Urgency", "normal")
	if topic != "" {
		req.Header.Set("Topic", topic)
	}

	res, err := s.client.Do(req)
	if err != nil {
		return err
	}
	defer res.Body.Close()
	answer, _ := io.ReadAll(io.LimitReader(res.Body, maxErrorBodyBytes))
	if res.StatusCode >= 200 && res.StatusCode < 300 {
		return nil
	}
	return &StatusError{Code: res.StatusCode, Body: string(answer)}
}

// The text of a *url.Error contains the subscriber's endpoint, which is a capability.
func redact(err error) error {
	if failed, ok := errors.AsType[*url.Error](err); ok {
		return failed.Err
	}
	return err
}
