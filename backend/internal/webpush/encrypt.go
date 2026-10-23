package webpush

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/ecdh"
	"crypto/hkdf"
	"crypto/sha256"
	"encoding/base64"
	"encoding/binary"
	"errors"
	"fmt"
	"strings"
)

const (
	recordSize          = 4096
	saltSize            = 16
	authSecretSize      = 16
	recordSizeFieldSize = 4
	keyIDLengthSize     = 1
	publicKeySize       = 65
	headerSize          = saltSize + recordSizeFieldSize + keyIDLengthSize + publicKeySize
	delimiterSize       = 1
	tagSize             = 16
	cekSize             = 16
	nonceSize           = 12
	MaxPayloadBytes     = recordSize - headerSize - delimiterSize - tagSize
	delimiter           = 0x02
)

var (
	errInvalidKeys     = errors.New("webpush: invalid subscription keys")
	errPayloadTooLarge = fmt.Errorf("webpush: payload exceeds %d bytes", MaxPayloadBytes)
)

func ValidKeys(p256dh, auth string) bool {
	_, _, err := decodeKeys(p256dh, auth)
	return err == nil
}

func decodeBase64URL(s string) ([]byte, error) {
	return base64.RawURLEncoding.DecodeString(strings.TrimRight(s, "="))
}

func decodeKeys(p256dh, auth string) (*ecdh.PublicKey, []byte, error) {
	point, err := decodeBase64URL(p256dh)
	if err != nil {
		return nil, nil, errInvalidKeys
	}
	receiver, err := ecdh.P256().NewPublicKey(point)
	if err != nil {
		return nil, nil, errInvalidKeys
	}
	secret, err := decodeBase64URL(auth)
	if err != nil || len(secret) != authSecretSize {
		return nil, nil, errInvalidKeys
	}
	return receiver, secret, nil
}

func encrypt(plaintext []byte, receiver *ecdh.PublicKey, auth []byte, ephemeral *ecdh.PrivateKey, salt []byte) ([]byte, error) {
	if len(plaintext) > MaxPayloadBytes {
		return nil, errPayloadTooLarge
	}
	shared, err := ephemeral.ECDH(receiver)
	if err != nil {
		return nil, err
	}
	sender := ephemeral.PublicKey().Bytes()
	keyInfo := "WebPush: info\x00" + string(receiver.Bytes()) + string(sender)
	ikm, err := hkdf.Key(sha256.New, shared, auth, keyInfo, sha256.Size)
	if err != nil {
		return nil, err
	}
	prk, err := hkdf.Extract(sha256.New, ikm, salt)
	if err != nil {
		return nil, err
	}
	cek, err := hkdf.Expand(sha256.New, prk, "Content-Encoding: aes128gcm\x00", cekSize)
	if err != nil {
		return nil, err
	}
	nonce, err := hkdf.Expand(sha256.New, prk, "Content-Encoding: nonce\x00", nonceSize)
	if err != nil {
		return nil, err
	}
	block, err := aes.NewCipher(cek)
	if err != nil {
		return nil, err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return nil, err
	}

	body := make([]byte, 0, headerSize+len(plaintext)+delimiterSize+tagSize)
	body = append(body, salt...)
	body = binary.BigEndian.AppendUint32(body, recordSize)
	body = append(body, publicKeySize)
	body = append(body, sender...)
	record := append(append(make([]byte, 0, len(plaintext)+delimiterSize), plaintext...), delimiter)
	return gcm.Seal(body, nonce, record, nil), nil
}
