package api

import (
	"encoding/base64"
	"fmt"
	"maps"
	"slices"
	"strings"
	"testing"
	"time"

	"blog.hloth.dev/backend/internal/store"
	"blog.hloth.dev/backend/internal/testkit"
)

func encodeURIComponent(s string) string {
	var b strings.Builder
	for _, c := range []byte(s) {
		if c >= 'a' && c <= 'z' || c >= 'A' && c <= 'Z' || c >= '0' && c <= '9' || strings.IndexByte("-_.!~*'()", c) >= 0 {
			b.WriteByte(c)
		} else {
			fmt.Fprintf(&b, "%%%02X", c)
		}
	}
	return b.String()
}

func TestSubscribeValidation(t *testing.T) {
	a := newAPI(t, testkit.NewFakeFeed(t))
	p256dh, auth := testkit.SubscriberKeys(t)
	future := float64(time.Now().Add(time.Hour).UnixMilli())
	body := func(endpoint string, changes map[string]any) string {
		doc := subscription(endpoint, p256dh, auth)
		maps.Copy(doc, changes)
		return jsonBody(doc)
	}
	keys := func(p256dh, auth any) map[string]any {
		return map[string]any{"keys": map[string]any{"p256dh": p256dh, "auth": auth}}
	}
	const good = "https://fcm.googleapis.com/fcm/send/"
	tests := []struct {
		name   string
		body   string
		status int
	}{
		{"FCM", body(good+"a", nil), 200},
		{"FCM alternative host", body("https://jmt17.google.com/fcm/send/a", nil), 200},
		{"Mozilla", body("https://updates.push.services.mozilla.com/wpush/v2/gAAA", nil), 200},
		{"Apple", body("https://web.push.apple.com/QGh", nil), 200},
		{"Windows", body("https://db5p.notify.windows.com/w/?token=AwYAAAC%2bx%3d", nil), 200},
		{"null expirationTime", body(good+"c", map[string]any{"expirationTime": nil}), 200},
		{"future expirationTime", body(good+"d", map[string]any{"expirationTime": future}), 200},
		{"padded keys", body(good+"e", keys(p256dh+"=", auth+"==")), 200},
		{"unknown fields are ignored", body(good+"f", map[string]any{"options": map[string]any{}}), 200},

		{"http", body("http://fcm.googleapis.com/fcm/send/a", nil), 400},
		{"other host", body("https://example.com/fcm/send/a", nil), 400},
		{"allowed host as a suffix", body("https://fcm.googleapis.com.evil.example/a", nil), 400},
		{"allowed host as a prefix label", body("https://evil.example/fcm.googleapis.com", nil), 400},
		{"dot of an exact host replaced", body("https://fcmxgoogleapis.com/a", nil), 400},
		{"dot of the windows domain replaced", body("https://db5pxnotify.windows.com/a", nil), 400},
		{"dot of the apple host replaced", body("https://web.push.applexcom/a", nil), 400},
		{"subdomain of an exact host", body("https://x.fcm.googleapis.com/a", nil), 400},
		{"nested windows subdomain", body("https://a.b.notify.windows.com/a", nil), 400},
		{"bare windows domain", body("https://notify.windows.com/a", nil), 400},
		{"uppercase host", body("https://FCM.googleapis.com/a", nil), 400},
		{"userinfo", body("https://user@fcm.googleapis.com/a", nil), 400},
		{"host in userinfo", body("https://fcm.googleapis.com@evil.example/a", nil), 400},
		{"other port", body("https://fcm.googleapis.com:8443/a", nil), 400},
		{"explicit default port", body("https://fcm.googleapis.com:443/fcm/send/b", nil), 400},
		{"loopback", body("https://127.0.0.1/a", nil), 400},
		{"no scheme", body("fcm.googleapis.com/a", nil), 400},
		{"opaque", body("https:fcm.googleapis.com/a", nil), 400},
		{"NUL", body(good+"a\x00b", nil), 400},
		{"newline", body(good+"a\nb", nil), 400},
		{"over 2000 chars", body(good+strings.Repeat("a", 2000), nil), 400},
		{"endpoint of the wrong type", body("", map[string]any{"endpoint": 1}), 400},
		{"missing endpoint", jsonBody(keys(p256dh, auth)), 400},
		{"missing keys", jsonBody(map[string]any{"endpoint": good + "a"}), 400},
		{"p256dh not a point", body(good+"a", keys(base64.RawURLEncoding.EncodeToString(make([]byte, 65)), auth)), 400},
		{"p256dh not base64url", body(good+"a", keys("!!!", auth)), 400},
		{"auth too short", body(good+"a", keys(p256dh, "AAAA")), 400},
		{"auth too long", body(good+"a", keys(p256dh, base64.RawURLEncoding.EncodeToString(make([]byte, 17)))), 400},
		{"auth of the wrong type", body(good+"a", keys(p256dh, 5)), 400},
		{"p256dh padded beyond 88 chars", body(good+"a", keys(p256dh+"==", auth)), 400},
		{"auth padded beyond 88 chars", body(good+"a", keys(p256dh, auth+strings.Repeat("=", 67))), 400},
		{"past expirationTime", body(good+"a", map[string]any{"expirationTime": float64(time.Now().Add(-time.Second).UnixMilli())}), 400},
		{"zero expirationTime", body(good+"a", map[string]any{"expirationTime": 0}), 400},
		{"negative expirationTime", body(good+"a", map[string]any{"expirationTime": -1}), 400},
		{"expirationTime beyond year 9999", body(good+"a", map[string]any{"expirationTime": 1e300}), 400},
		{"expirationTime just beyond year 9999", body(good+"a", map[string]any{"expirationTime": maxExpirationTime + 1}), 400},
		{"string expirationTime", body(good+"a", map[string]any{"expirationTime": "tomorrow"}), 400},
	}
	accepted := 0
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			res := a.send(t, "POST", "/notifications/web-push", test.body, "Origin", testOrigin, "Content-Type", "application/json")
			if test.status == 200 {
				accepted++
				res.expect(t, 200, succeeded)
			} else {
				res.expect(t, 400, badRequest)
			}
		})
	}
	a.send(t, "POST", "/notifications/web-push", `{"endpoint":`, "Origin", testOrigin).expect(t, 400, malformed)

	stored := testkit.ReadState(t, a.path).Subscriptions
	if len(stored) != accepted {
		t.Fatalf("%d subscriptions stored, want %d", len(stored), accepted)
	}
	if sub := stored[good+"a"]; sub.P256dh != p256dh || sub.Auth != auth || sub.ExpiresAt != nil {
		t.Fatalf("stored subscription = %+v", sub)
	}
	if sub := stored[good+"d"]; sub.ExpiresAt == nil || sub.ExpiresAt.UnixMilli() != int64(future) {
		t.Fatalf("stored expiry = %v, want %v", sub.ExpiresAt, time.UnixMilli(int64(future)))
	}
}

func TestSubscribeLatestExpirationTimeStaysWritable(t *testing.T) {
	a := newAPI(t, testkit.NewFakeFeed(t))
	p256dh, auth := testkit.SubscriberKeys(t)
	const endpoint = "https://web.push.apple.com/a"
	doc := subscription(endpoint, p256dh, auth)
	doc["expirationTime"] = int64(maxExpirationTime)
	a.send(t, "POST", "/notifications/web-push", jsonBody(doc), "Origin", testOrigin).expect(t, 200, succeeded)
	if sub, ok := testkit.OpenStore(t, a.path).Subscription(endpoint); !ok || sub.ExpiresAt.Year() != 9999 {
		t.Fatalf("subscription after reopen = %+v, %v", sub, ok)
	}
}

func TestSubscribeKeepsTheFirstSubscription(t *testing.T) {
	a := newAPI(t, testkit.NewFakeFeed(t))
	const endpoint = "https://web.push.apple.com/a"
	subscribe := func() (p256dh string) {
		p256dh, auth := testkit.SubscriberKeys(t)
		a.send(t, "POST", "/notifications/web-push", subscribeBody(endpoint, p256dh, auth), "Origin", testOrigin).expect(t, 200, succeeded)
		return p256dh
	}
	first := subscribe()
	subscribe()
	if sub, _ := a.store.Subscription(endpoint); sub.P256dh != first {
		t.Fatal("a repeated subscribe replaced the stored keys")
	}
}

func TestUnsubscribeWithEncodedEndpoint(t *testing.T) {
	a := newAPI(t, testkit.NewFakeFeed(t))
	if got := encodeURIComponent("https://fcm.googleapis.com/fcm/send/abc:x"); got != "https%3A%2F%2Ffcm.googleapis.com%2Ffcm%2Fsend%2Fabc%3Ax" {
		t.Fatalf("encodeURIComponent helper is wrong: %s", got)
	}
	p256dh, auth := testkit.SubscriberKeys(t)
	endpoints := []string{
		"https://fcm.googleapis.com/fcm/send/abc:x",
		"https://fcm.googleapis.com/fcm/send/dQw4:APA91b-_Hx/y//z",
		"https://updates.push.services.mozilla.com/wpush/v2/gAAAA-_x=?a=1&b=%2F#frag",
		"https://web.push.apple.com/QGh+k/../%2e%2e/a b",
		"https://db5p.notify.windows.com/w/?token=AwYAAAC%2bx%3d%3d",
		"https://web.push.apple.com/./..",
	}
	for _, endpoint := range endpoints {
		a.send(t, "POST", "/notifications/web-push", subscribeBody(endpoint, p256dh, auth), "Origin", testOrigin).expect(t, 200, succeeded)
	}
	for _, endpoint := range endpoints {
		t.Run(endpoint, func(t *testing.T) {
			target := "/notifications/web-push/" + encodeURIComponent(endpoint)
			a.sendRaw(t, "DELETE", target).expect(t, 200, succeeded)
			if _, ok := a.store.Subscription(endpoint); ok {
				t.Fatal("the subscription is still stored")
			}
			a.sendRaw(t, "DELETE", target).expect(t, 404, rejected)
		})
	}
	if left := testkit.ReadState(t, a.path).Subscriptions; len(left) != 0 {
		t.Fatalf("subscriptions left in the state file: %v", slices.Collect(maps.Keys(left)))
	}

	if err := a.store.Subscribe(endpoints[0], store.Subscription{P256dh: p256dh, Auth: auth}); err != nil {
		t.Fatal(err)
	}
	if res := a.sendRaw(t, "DELETE", "/notifications/web-push/"+endpoints[0]); res.status == 200 {
		t.Fatalf("an endpoint that is not percent-encoded was accepted: %s", res.body)
	}
	if _, ok := a.store.Subscription(endpoints[0]); !ok {
		t.Fatal("an endpoint that is not percent-encoded removed the subscription")
	}
}
