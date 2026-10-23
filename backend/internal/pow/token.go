package pow

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"io"
	"strings"
)

var jwtHeader = base64.RawURLEncoding.EncodeToString([]byte(`{"alg":"HS256","typ":"JWT"}`))

func (s *Service) sign(payload []byte) string {
	message := jwtHeader + "." + base64.RawURLEncoding.EncodeToString(payload)
	return message + "." + s.mac(message)
}

func (s *Service) mac(message string) string {
	return base64.RawURLEncoding.EncodeToString(hmacSHA256(s.secret, message))
}

func hmacSHA256(key []byte, message string) []byte {
	h := hmac.New(sha256.New, key)
	io.WriteString(h, message)
	return h.Sum(nil)
}

func (s *Service) parse(token string) (challenge, bool) {
	dot := strings.LastIndexByte(token, '.')
	if dot < 0 || !hmac.Equal([]byte(token[dot+1:]), []byte(s.mac(token[:dot]))) {
		return challenge{}, false
	}
	encoded, ok := strings.CutPrefix(token[:dot], jwtHeader+".")
	if !ok {
		return challenge{}, false
	}
	payload, err := base64.RawURLEncoding.DecodeString(encoded)
	if err != nil {
		return challenge{}, false
	}
	var c challenge
	if err := json.Unmarshal(payload, &c); err != nil {
		return challenge{}, false
	}
	return c, true
}
