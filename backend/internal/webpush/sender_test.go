package webpush

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strings"
	"sync/atomic"
	"testing"
	"time"

	"blog.hloth.dev/backend/internal/testkit"
)

type pushRequest struct {
	method, path string
	header       http.Header
	length       int64
	body         []byte
}

type pushService struct {
	*httptest.Server
	requests chan pushRequest
}

func newPushService(t *testing.T, status int, answer string) *pushService {
	t.Helper()
	service := &pushService{requests: make(chan pushRequest, 16)}
	service.Server = httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		body, _ := io.ReadAll(r.Body)
		service.requests <- pushRequest{r.Method, r.URL.RequestURI(), r.Header.Clone(), r.ContentLength, body}
		w.WriteHeader(status)
		io.WriteString(w, answer)
	}))
	t.Cleanup(service.Close)
	return service
}

func (p *pushService) received(t *testing.T) pushRequest {
	t.Helper()
	select {
	case request := <-p.requests:
		return request
	default:
		t.Fatal("the push service received no request")
		return pushRequest{}
	}
}

func newTestSender(t *testing.T) (*Sender, string) {
	t.Helper()
	public, private := testkit.VAPIDKeys(t)
	sender, err := NewSender(public, private, testSubject, 5*time.Second)
	if err != nil {
		t.Fatal(err)
	}
	return sender, public
}

func TestSendRequest(t *testing.T) {
	service := newPushService(t, http.StatusCreated, "")
	sender, public := newTestSender(t)
	now := time.Date(2026, 10, 2, 12, 0, 0, 0, time.UTC)
	sender.now = func() time.Time { return now }
	sub := newSubscriber(t)
	payload := []byte(`{"id":"hello-world","title":"Hello, world","description":"…","image":{"url":"https://blog.example/a.avif"}}`)

	for _, topic := range []string{"cG9zdC1oZWxsby13b3JsZA", ""} {
		t.Run("topic="+topic, func(t *testing.T) {
			if err := sender.Send(t.Context(), service.URL+"/push/abc?token=1", sub.p256dh, sub.auth, payload, topic); err != nil {
				t.Fatal(err)
			}
			request := service.received(t)
			if request.method != http.MethodPost || request.path != "/push/abc?token=1" {
				t.Fatalf("request line = %s %s", request.method, request.path)
			}
			headers := map[string]string{
				"Content-Encoding": "aes128gcm",
				"Content-Type":     "application/octet-stream",
				"TTL":              "2419200",
				"Urgency":          "normal",
			}
			for name, want := range headers {
				if got := request.header.Values(name); len(got) != 1 || got[0] != want {
					t.Errorf("%s = %q, want %q", name, got, want)
				}
			}
			if got := request.header.Values("Topic"); (topic == "" && got != nil) || (topic != "" && (len(got) != 1 || got[0] != topic)) {
				t.Errorf("Topic = %q, want %q", got, topic)
			}
			if _, ok := request.header["Crypto-Key"]; ok {
				t.Error("Crypto-Key belongs to the legacy aesgcm coding")
			}

			claims := verifyAuthorization(t, request.header.Get("Authorization"), public)
			if claims["aud"] != service.URL || claims["sub"] != testSubject || claims["exp"] != float64(now.Add(12*time.Hour).Unix()) {
				t.Errorf("claims = %v", claims)
			}

			body := request.body
			if want := int64(headerSize + len(payload) + delimiterSize + tagSize); request.length != want || int64(len(body)) != want {
				t.Fatalf("Content-Length %d, body %d bytes, want %d", request.length, len(body), want)
			}
			if !bytes.Equal(body[16:21], []byte{0, 0, 0x10, 0, 65}) || body[21] != 4 {
				t.Fatalf("header after the salt = %x", body[16:22])
			}
			got, err := sub.decrypt(body)
			if err != nil {
				t.Fatal(err)
			}
			if !bytes.Equal(got, payload) {
				t.Fatalf("subscriber decrypted %q", got)
			}
		})
	}
}

func TestSendUsesFreshKeyAndSalt(t *testing.T) {
	service := newPushService(t, http.StatusCreated, "")
	sender, _ := newTestSender(t)
	sub := newSubscriber(t)

	var bodies [2][]byte
	for i := range bodies {
		if err := sender.Send(t.Context(), service.URL, sub.p256dh, sub.auth, []byte("same"), ""); err != nil {
			t.Fatal(err)
		}
		bodies[i] = service.received(t).body
	}
	if bytes.Equal(bodies[0][:16], bodies[1][:16]) {
		t.Error("salt reused across messages")
	}
	if bytes.Equal(bodies[0][21:86], bodies[1][21:86]) {
		t.Error("ephemeral key reused across messages")
	}
	if bytes.Equal(bodies[0][86:], bodies[1][86:]) {
		t.Error("identical ciphertext for two messages")
	}
}

func TestSendStatus(t *testing.T) {
	tests := []struct {
		status int
		answer string
		ok     bool
	}{
		{http.StatusOK, "", true},
		{http.StatusCreated, "ignored", true},
		{http.StatusNoContent, "", true},
		{http.StatusBadRequest, "UnauthorizedRegistration", false},
		{http.StatusForbidden, `{"reason":"BadJwtToken"}`, false},
		{http.StatusNotFound, "", false},
		{http.StatusGone, "push subscription has unsubscribed or expired.\n", false},
		{http.StatusRequestEntityTooLarge, "", false},
		{http.StatusTooManyRequests, "slow down", false},
		{http.StatusInternalServerError, "oops", false},
		{http.StatusServiceUnavailable, "", false},
	}
	for _, test := range tests {
		t.Run(fmt.Sprint(test.status), func(t *testing.T) {
			service := newPushService(t, test.status, test.answer)
			sender, _ := newTestSender(t)
			sub := newSubscriber(t)

			err := sender.Send(t.Context(), service.URL, sub.p256dh, sub.auth, []byte("{}"), "")
			service.received(t)
			if test.ok {
				if err != nil {
					t.Fatalf("err = %v", err)
				}
				return
			}
			status, ok := errors.AsType[*StatusError](err)
			if !ok {
				t.Fatalf("err = %v (%T), want *StatusError", err, err)
			}
			if status.Code != test.status || status.Body != test.answer {
				t.Fatalf("StatusError = %+v", status)
			}
			if gone := test.status == http.StatusNotFound || test.status == http.StatusGone; status.SubscriptionGone() != gone {
				t.Fatalf("SubscriptionGone() = %v, want %v", status.SubscriptionGone(), gone)
			}
			if !strings.Contains(err.Error(), fmt.Sprint(test.status)) {
				t.Fatalf("Error() = %q", err.Error())
			}
		})
	}
}

func TestSendCapsErrorBody(t *testing.T) {
	service := newPushService(t, http.StatusBadGateway, strings.Repeat("x", 1024)+strings.Repeat("y", 100_000))
	sender, _ := newTestSender(t)
	sub := newSubscriber(t)

	err := sender.Send(t.Context(), service.URL, sub.p256dh, sub.auth, nil, "")
	status, ok := errors.AsType[*StatusError](err)
	if !ok {
		t.Fatalf("err = %v", err)
	}
	if status.Body != strings.Repeat("x", 1024) {
		t.Fatalf("body is %d bytes, want the first 1024", len(status.Body))
	}
}

func TestSendDoesNotFollowRedirects(t *testing.T) {
	var followed atomic.Int32
	elsewhere := httptest.NewServer(http.HandlerFunc(func(http.ResponseWriter, *http.Request) {
		followed.Add(1)
	}))
	t.Cleanup(elsewhere.Close)

	for _, code := range []int{301, 302, 303, 307, 308} {
		t.Run(fmt.Sprint(code), func(t *testing.T) {
			var hits atomic.Int32
			service := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				hits.Add(1)
				http.Redirect(w, r, elsewhere.URL+"/stolen", code)
			}))
			t.Cleanup(service.Close)

			sender, _ := newTestSender(t)
			sub := newSubscriber(t)

			err := sender.Send(t.Context(), service.URL, sub.p256dh, sub.auth, []byte("{}"), "")
			if status, ok := errors.AsType[*StatusError](err); !ok || status.Code != code {
				t.Fatalf("err = %v, want StatusError %d", err, code)
			}
			if hits.Load() != 1 || followed.Load() != 0 {
				t.Fatalf("push service hit %d times, redirect target %d times", hits.Load(), followed.Load())
			}
		})
	}
}

func TestSendRejectsBeforeContactingPushService(t *testing.T) {
	service := newPushService(t, http.StatusCreated, "")
	sender, _ := newTestSender(t)
	sub := newSubscriber(t)

	tests := []struct {
		name         string
		p256dh, auth string
		payload      []byte
		want         error
	}{
		{"oversize payload", sub.p256dh, sub.auth, make([]byte, MaxPayloadBytes+1), errPayloadTooLarge},
		{"invalid p256dh", sub.auth, sub.auth, []byte("{}"), errInvalidKeys},
		{"invalid auth", sub.p256dh, sub.p256dh, []byte("{}"), errInvalidKeys},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			err := sender.Send(t.Context(), service.URL, test.p256dh, test.auth, test.payload, "")
			if !errors.Is(err, test.want) {
				t.Fatalf("err = %v, want %v", err, test.want)
			}
			if len(service.requests) != 0 {
				t.Fatal("a request reached the push service")
			}
		})
	}

	if err := sender.Send(t.Context(), service.URL, sub.p256dh, sub.auth, make([]byte, MaxPayloadBytes), ""); err != nil {
		t.Fatalf("%d bytes: %v", MaxPayloadBytes, err)
	}
	if body := service.received(t).body; len(body) != 4096 {
		t.Fatalf("largest message is %d bytes, want 4096", len(body))
	}
}

func TestSendTransportErrors(t *testing.T) {
	sub := newSubscriber(t)

	t.Run("canceled context", func(t *testing.T) {
		service := newPushService(t, http.StatusCreated, "")
		sender, _ := newTestSender(t)
		ctx, cancel := context.WithCancel(t.Context())
		cancel()
		err := sender.Send(ctx, service.URL, sub.p256dh, sub.auth, []byte("{}"), "")
		if !errors.Is(err, context.Canceled) {
			t.Fatalf("err = %v, want context.Canceled", err)
		}
		if len(service.requests) != 0 {
			t.Fatal("a request reached the push service")
		}
	})

	t.Run("unreachable push service", func(t *testing.T) {
		service := httptest.NewServer(http.NotFoundHandler())
		endpoint := service.URL + "/push/secret-token"
		service.Close()
		sender, _ := newTestSender(t)
		err := sender.Send(t.Context(), endpoint, sub.p256dh, sub.auth, []byte("{}"), "")
		if _, isStatus := errors.AsType[*StatusError](err); err == nil || isStatus {
			t.Fatalf("err = %v, want a network error", err)
		}
		if strings.Contains(err.Error(), "secret-token") {
			t.Fatalf("err = %q reveals the endpoint", err)
		}
	})

	t.Run("malformed endpoint", func(t *testing.T) {
		sender, _ := newTestSender(t)
		err := sender.Send(t.Context(), "://nowhere/secret-token", sub.p256dh, sub.auth, []byte("{}"), "")
		if err == nil {
			t.Fatal("no error")
		}
		if strings.Contains(err.Error(), "nowhere") || strings.Contains(err.Error(), "secret-token") {
			t.Fatalf("err = %q reveals the endpoint", err)
		}
	})
}

func TestRedactHidesTheEndpoint(t *testing.T) {
	const endpoint = "https://fcm.googleapis.com/fcm/send/secret-token"
	cause := errors.New("connection refused")
	err := fmt.Errorf("send: %w", &url.Error{Op: "Post", URL: endpoint, Err: cause})
	if got := redact(err); strings.Contains(got.Error(), "secret-token") || !errors.Is(got, cause) {
		t.Fatalf("redacted error = %q", got)
	}
	status := &StatusError{Code: 500, Body: "busy"}
	if got := redact(status); got != error(status) {
		t.Fatalf("a status error was changed: %v", got)
	}
}

func TestSendConcurrently(t *testing.T) {
	service := newPushService(t, http.StatusCreated, "")
	sender, _ := newTestSender(t)
	sub := newSubscriber(t)

	errs := make(chan error, 8)
	for range cap(errs) {
		go func() {
			errs <- sender.Send(t.Context(), service.URL, sub.p256dh, sub.auth, []byte("concurrent"), "")
		}()
	}
	for range cap(errs) {
		if err := <-errs; err != nil {
			t.Fatal(err)
		}
		got, err := sub.decrypt(service.received(t).body)
		if err != nil || string(got) != "concurrent" {
			t.Fatalf("decrypt = %q, %v", got, err)
		}
	}
}
