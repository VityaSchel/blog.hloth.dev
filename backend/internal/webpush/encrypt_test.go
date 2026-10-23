package webpush

import (
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"crypto/ecdh"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/binary"
	"errors"
	"fmt"
	"testing"
)

const (
	rfcPlaintext  = "When I grow up, I want to be a watermelon"
	rfcASPrivate  = "yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw"
	rfcASPublic   = "BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8"
	rfcUAPrivate  = "q1dXpw3UpT5VOmu_cf_v6ih07Aems3njxI-JWgLcM94"
	rfcUAPublic   = "BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4"
	rfcAuthSecret = "BTBZMqHH6r4Tts7J_aSIgg"
	rfcSalt       = "DGv6ra1nlYgDCS1FRnbzlw"
	rfcBody       = "DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN"
)

func b64(t *testing.T, s string) []byte {
	t.Helper()
	raw, err := base64.RawURLEncoding.DecodeString(s)
	if err != nil {
		t.Fatalf("decode %q: %v", s, err)
	}
	return raw
}

func privateKey(t *testing.T, s string) *ecdh.PrivateKey {
	t.Helper()
	key, err := ecdh.P256().NewPrivateKey(b64(t, s))
	if err != nil {
		t.Fatal(err)
	}
	return key
}

type subscriber struct {
	key          *ecdh.PrivateKey
	secret       []byte
	p256dh, auth string
}

func newSubscriber(t *testing.T) subscriber {
	t.Helper()
	key, err := ecdh.P256().GenerateKey(rand.Reader)
	if err != nil {
		t.Fatal(err)
	}
	secret := make([]byte, authSecretSize)
	rand.Read(secret)
	return subscriber{
		key:    key,
		secret: secret,
		p256dh: base64.RawURLEncoding.EncodeToString(key.PublicKey().Bytes()),
		auth:   base64.RawURLEncoding.EncodeToString(secret),
	}
}

func hmacSHA256(key []byte, parts ...[]byte) []byte {
	mac := hmac.New(sha256.New, key)
	for _, part := range parts {
		mac.Write(part)
	}
	return mac.Sum(nil)
}

// Plain HMAC as in RFC 8291 section 3.4, to share no key derivation code with encrypt.
func (s subscriber) decrypt(body []byte) ([]byte, error) {
	if len(body) < headerSize+delimiterSize+tagSize {
		return nil, fmt.Errorf("body of %d bytes is too short", len(body))
	}
	salt := body[:16]
	if rs := binary.BigEndian.Uint32(body[16:20]); rs != 4096 {
		return nil, fmt.Errorf("record size %d", rs)
	}
	if body[20] != 65 {
		return nil, fmt.Errorf("keyid length %d", body[20])
	}
	sender, err := ecdh.P256().NewPublicKey(body[21:86])
	if err != nil {
		return nil, err
	}
	shared, err := s.key.ECDH(sender)
	if err != nil {
		return nil, err
	}
	prkKey := hmacSHA256(s.secret, shared)
	ikm := hmacSHA256(prkKey, []byte("WebPush: info\x00"), s.key.PublicKey().Bytes(), sender.Bytes(), []byte{1})
	prk := hmacSHA256(salt, ikm)
	cek := hmacSHA256(prk, []byte("Content-Encoding: aes128gcm\x00\x01"))[:16]
	nonce := hmacSHA256(prk, []byte("Content-Encoding: nonce\x00\x01"))[:12]
	block, err := aes.NewCipher(cek)
	if err != nil {
		return nil, err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}
	record, err := gcm.Open(nil, nonce, body[86:], nil)
	if err != nil {
		return nil, err
	}
	if record[len(record)-1] != 0x02 {
		return nil, fmt.Errorf("padding delimiter %#x", record[len(record)-1])
	}
	return record[:len(record)-1], nil
}

func TestEncryptRFC8291Vector(t *testing.T) {
	ephemeral := privateKey(t, rfcASPrivate)
	if got := base64.RawURLEncoding.EncodeToString(ephemeral.PublicKey().Bytes()); got != rfcASPublic {
		t.Fatalf("as_public = %s", got)
	}
	receiver, secret, err := decodeKeys(rfcUAPublic, rfcAuthSecret)
	if err != nil {
		t.Fatal(err)
	}
	body, err := encrypt([]byte(rfcPlaintext), receiver, secret, ephemeral, b64(t, rfcSalt))
	if err != nil {
		t.Fatal(err)
	}
	if got := base64.RawURLEncoding.EncodeToString(body); got != rfcBody {
		t.Fatalf("body mismatch\n got %s\nwant %s", got, rfcBody)
	}

	ua := subscriber{key: privateKey(t, rfcUAPrivate), secret: secret}
	plaintext, err := ua.decrypt(b64(t, rfcBody))
	if err != nil {
		t.Fatalf("reference decryption of the RFC body: %v", err)
	}
	if string(plaintext) != rfcPlaintext {
		t.Fatalf("reference decryption = %q", plaintext)
	}
}

func TestEncryptRoundTrip(t *testing.T) {
	for _, size := range []int{0, 1, 41, 1500, MaxPayloadBytes} {
		t.Run(fmt.Sprint(size), func(t *testing.T) {
			sub := newSubscriber(t)
			receiver, secret, err := decodeKeys(sub.p256dh, sub.auth)
			if err != nil {
				t.Fatal(err)
			}
			ephemeral, err := ecdh.P256().GenerateKey(rand.Reader)
			if err != nil {
				t.Fatal(err)
			}
			salt := make([]byte, saltSize)
			rand.Read(salt)
			plaintext := make([]byte, size)
			rand.Read(plaintext)
			original := bytes.Clone(plaintext)

			body, err := encrypt(plaintext, receiver, secret, ephemeral, salt)
			if err != nil {
				t.Fatal(err)
			}
			if want := headerSize + size + delimiterSize + tagSize; len(body) != want {
				t.Fatalf("body is %d bytes, want %d", len(body), want)
			}
			if len(body) > recordSize {
				t.Fatalf("body is %d bytes, above the 4096 a push service must accept", len(body))
			}
			if !bytes.Equal(plaintext, original) {
				t.Fatal("encrypt modified its input")
			}
			got, err := sub.decrypt(body)
			if err != nil {
				t.Fatal(err)
			}
			if !bytes.Equal(got, original) {
				t.Fatal("decrypted plaintext differs")
			}

			stranger := newSubscriber(t)
			if _, err := stranger.decrypt(body); err == nil {
				t.Fatal("another subscriber decrypted the message")
			}
			sub.secret = stranger.secret
			if _, err := sub.decrypt(body); err == nil {
				t.Fatal("decrypted with the wrong auth secret")
			}
		})
	}
}

func TestEncryptLimit(t *testing.T) {
	if MaxPayloadBytes != 3993 {
		t.Fatalf("MaxPayloadBytes = %d, RFC 8291 section 4 says 3993", MaxPayloadBytes)
	}
	sub := newSubscriber(t)
	ephemeral, err := ecdh.P256().GenerateKey(rand.Reader)
	if err != nil {
		t.Fatal(err)
	}
	body, err := encrypt(make([]byte, MaxPayloadBytes+1), sub.key.PublicKey(), sub.secret, ephemeral, make([]byte, saltSize))
	if !errors.Is(err, errPayloadTooLarge) || body != nil {
		t.Fatalf("%d bytes: body %d bytes, err %v", MaxPayloadBytes+1, len(body), err)
	}
}

func TestValidKeys(t *testing.T) {
	sub := newSubscriber(t)
	point := sub.key.PublicKey().Bytes()
	encode := base64.RawURLEncoding.EncodeToString

	offCurve := bytes.Clone(point)
	offCurve[64] ^= 1
	compressed := append([]byte{2 + point[64]&1}, point[1:33]...)
	hybrid := bytes.Clone(point)
	hybrid[0] = 6 + point[64]&1

	tests := []struct {
		name         string
		p256dh, auth string
		want         bool
	}{
		{"browser subscription", sub.p256dh, sub.auth, true},
		{"RFC 8291 subscription", rfcUAPublic, rfcAuthSecret, true},
		{"padded", base64.URLEncoding.EncodeToString(point), base64.URLEncoding.EncodeToString(sub.secret), true},
		{"empty", "", "", false},
		{"empty p256dh", "", sub.auth, false},
		{"empty auth", sub.p256dh, "", false},
		{"not base64", "!" + sub.p256dh[1:], sub.auth, false},
		{"standard alphabet auth", sub.p256dh, "++++++++++++++++++++++", false},
		{"point off the curve", encode(offCurve), sub.auth, false},
		{"compressed point", encode(compressed), sub.auth, false},
		{"hybrid point", encode(hybrid), sub.auth, false},
		{"point at infinity", encode([]byte{0}), sub.auth, false},
		{"truncated point", encode(point[:64]), sub.auth, false},
		{"overlong point", encode(append(bytes.Clone(point), 0)), sub.auth, false},
		{"zero point", encode(make([]byte, 65)), sub.auth, false},
		{"15 byte auth", sub.p256dh, encode(sub.secret[:15]), false},
		{"17 byte auth", sub.p256dh, encode(append(bytes.Clone(sub.secret), 0)), false},
		{"swapped", sub.auth, sub.p256dh, false},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			if got := ValidKeys(test.p256dh, test.auth); got != test.want {
				t.Fatalf("ValidKeys = %v, want %v", got, test.want)
			}
		})
	}
}
