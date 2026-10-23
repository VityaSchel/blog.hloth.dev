package webpush

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"math/big"
	"net/url"
	"reflect"
	"strings"
	"testing"
	"time"

	"blog.hloth.dev/backend/internal/testkit"
)

const testSubject = "https://blog.example"

func verifyAuthorization(t *testing.T, authorization, publicKey string) map[string]any {
	t.Helper()
	token, ok := strings.CutPrefix(authorization, "vapid t=")
	if !ok {
		t.Fatalf("Authorization = %q", authorization)
	}
	token, k, ok := strings.Cut(token, ", k=")
	if !ok || k != publicKey {
		t.Fatalf("k = %q, want %q", k, publicKey)
	}
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		t.Fatalf("JWT has %d segments", len(parts))
	}

	var header map[string]any
	if err := json.Unmarshal(b64(t, parts[0]), &header); err != nil {
		t.Fatal(err)
	}
	if want := map[string]any{"typ": "JWT", "alg": "ES256"}; !reflect.DeepEqual(header, want) {
		t.Fatalf("JWT header = %v", header)
	}

	signature := b64(t, parts[2])
	if len(signature) != 64 {
		t.Fatalf("signature is %d bytes, want raw r||s of 64", len(signature))
	}
	key, err := ecdsa.ParseUncompressedPublicKey(elliptic.P256(), b64(t, publicKey))
	if err != nil {
		t.Fatal(err)
	}
	digest := sha256.Sum256([]byte(parts[0] + "." + parts[1]))
	r, s := new(big.Int).SetBytes(signature[:32]), new(big.Int).SetBytes(signature[32:])
	if !ecdsa.Verify(key, digest[:], r, s) {
		t.Fatal("JWT signature does not verify with the VAPID public key")
	}

	var claims map[string]any
	if err := json.Unmarshal(b64(t, parts[1]), &claims); err != nil {
		t.Fatal(err)
	}
	return claims
}

func TestAuthorization(t *testing.T) {
	sender, public := newTestSender(t)
	now := time.Date(2026, 10, 2, 12, 0, 0, 0, time.UTC)

	tests := []struct{ endpoint, audience string }{
		{"https://fcm.googleapis.com/fcm/send/abc:def?x=1#frag", "https://fcm.googleapis.com"},
		{"https://web.push.apple.com/QGk3", "https://web.push.apple.com"},
		{"http://127.0.0.1:8080/push/1", "http://127.0.0.1:8080"},
	}
	for _, test := range tests {
		t.Run(test.audience, func(t *testing.T) {
			endpoint, err := url.Parse(test.endpoint)
			if err != nil {
				t.Fatal(err)
			}
			authorization, err := sender.vapid.authorization(endpoint, now)
			if err != nil {
				t.Fatal(err)
			}
			claims := verifyAuthorization(t, authorization, public)
			want := map[string]any{
				"aud": test.audience,
				"exp": float64(now.Add(12 * time.Hour).Unix()),
				"sub": testSubject,
			}
			if !reflect.DeepEqual(claims, want) {
				t.Fatalf("claims = %v, want %v", claims, want)
			}
		})
	}
}

func TestNewSender(t *testing.T) {
	public, private := testkit.VAPIDKeys(t)
	otherPublic, _ := testkit.VAPIDKeys(t)
	order := elliptic.P256().Params().N.Bytes()
	encode := base64.RawURLEncoding.EncodeToString

	tests := []struct {
		name                     string
		public, private, subject string
		ok                       bool
	}{
		{"matching pair", public, private, testSubject, true},
		{"mailto subject", public, private, "mailto:admin@blog.example", true},
		{"padded keys", public + "=", private + "=", testSubject, true},
		{"public key of another pair", otherPublic, private, testSubject, false},
		{"keys swapped", private, public, testSubject, false},
		{"public key not base64", "!" + public[1:], private, testSubject, false},
		{"private key not base64", public, "!" + private[1:], testSubject, false},
		{"empty public key", "", private, testSubject, false},
		{"empty private key", public, "", testSubject, false},
		{"short private key", public, encode(b64(t, private)[:31]), testSubject, false},
		{"zero private key", public, encode(make([]byte, 32)), testSubject, false},
		{"private key equal to the group order", public, encode(order), testSubject, false},
		{"truncated public key", public[:len(public)-2], private, testSubject, false},
		{"empty subject", public, private, "", false},
		{"http subject", public, private, "http://blog.example", false},
		{"bare host subject", public, private, "blog.example", false},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			sender, err := NewSender(test.public, test.private, test.subject, 5*time.Second)
			if (err == nil) != test.ok {
				t.Fatalf("err = %v, want ok = %v", err, test.ok)
			}
			if (sender != nil) != test.ok {
				t.Fatalf("sender = %v", sender)
			}
			if err != nil && strings.Contains(err.Error(), private) {
				t.Fatal("error leaks the private key")
			}
		})
	}
}
