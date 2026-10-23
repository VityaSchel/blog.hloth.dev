package testkit

import (
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"math/big"
	"strings"
	"testing"
)

func TokenPayload[T any](t *testing.T, token string) T {
	t.Helper()
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		t.Fatalf("token %q has %d parts, want 3", token, len(parts))
	}
	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		t.Fatal(err)
	}
	var decoded T
	if err := json.Unmarshal(payload, &decoded); err != nil {
		t.Fatal(err)
	}
	return decoded
}

func LeadingZeroBits(round string, nonce uint64) int {
	sum := sha256.Sum256(fmt.Appendf(nil, "%s.%d", round, nonce))
	return len(sum)*8 - new(big.Int).SetBytes(sum[:]).BitLen()
}

func Grind(round string, difficulty int, from uint64) uint64 {
	for nonce := from; ; nonce++ {
		if LeadingZeroBits(round, nonce) >= difficulty {
			return nonce
		}
	}
}

func Solve(rounds []string, difficulty int) []uint64 {
	solutions := make([]uint64, len(rounds))
	for i, round := range rounds {
		solutions[i] = Grind(round, difficulty, 0)
	}
	return solutions
}
