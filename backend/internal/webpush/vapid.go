package webpush

import (
	"bytes"
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"net/url"
	"time"
)

const (
	vapidLifetime  = 12 * time.Hour
	p256ScalarSize = 32
)

var jwtHeader = base64.RawURLEncoding.EncodeToString([]byte(`{"typ":"JWT","alg":"ES256"}`))

type vapidClaims struct {
	Audience string `json:"aud"`
	Expiry   int64  `json:"exp"`
	Subject  string `json:"sub"`
}

type vapid struct {
	key       *ecdsa.PrivateKey
	publicKey string
	subject   string
}

func newVAPID(publicKey, privateKey, subject string) (vapid, error) {
	public, err := decodeBase64URL(publicKey)
	if err != nil {
		return vapid{}, errors.New("webpush: VAPID public key is not base64url")
	}
	private, err := decodeBase64URL(privateKey)
	if err != nil {
		return vapid{}, errors.New("webpush: VAPID private key is not base64url")
	}
	key, err := ecdsa.ParseRawPrivateKey(elliptic.P256(), private)
	if err != nil {
		return vapid{}, errors.New("webpush: VAPID private key is not a P-256 scalar")
	}
	derived, err := key.PublicKey.Bytes()
	if err != nil || !bytes.Equal(derived, public) {
		return vapid{}, errors.New("webpush: VAPID public key does not belong to the private key")
	}
	if u, err := url.Parse(subject); err != nil || (u.Scheme != "https" && u.Scheme != "mailto") {
		return vapid{}, errors.New("webpush: VAPID subject must be an https: or mailto: URL")
	}
	return vapid{key: key, publicKey: base64.RawURLEncoding.EncodeToString(public), subject: subject}, nil
}

func (v vapid) authorization(endpoint *url.URL, now time.Time) (string, error) {
	claims, err := json.Marshal(vapidClaims{
		Audience: endpoint.Scheme + "://" + endpoint.Host,
		Expiry:   now.Add(vapidLifetime).Unix(),
		Subject:  v.subject,
	})
	if err != nil {
		return "", err
	}
	signed := jwtHeader + "." + base64.RawURLEncoding.EncodeToString(claims)
	digest := sha256.Sum256([]byte(signed))
	sigR, sigS, err := ecdsa.Sign(rand.Reader, v.key, digest[:])
	if err != nil {
		return "", err
	}
	signature := make([]byte, 2*p256ScalarSize)
	sigR.FillBytes(signature[:p256ScalarSize])
	sigS.FillBytes(signature[p256ScalarSize:])
	return "vapid t=" + signed + "." + base64.RawURLEncoding.EncodeToString(signature) + ", k=" + v.publicKey, nil
}
