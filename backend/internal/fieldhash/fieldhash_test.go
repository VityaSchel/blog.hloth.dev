package fieldhash

import (
	"crypto/sha256"
	"testing"
)

func TestSumIsUnambiguous(t *testing.T) {
	inputs := [][]string{
		{"a", "bc", "d"},
		{"ab", "c", "d"},
		{"a", "b", "cd"},
		{"", "abc", "d"},
		{"abc", "", "d"},
		{"a", "bcd", ""},
		{"pepp", "er"},
		{"pep", "per"},
	}
	seen := map[[sha256.Size]byte][]string{}
	for _, parts := range inputs {
		sum := Sum(parts...)
		if other, dup := seen[sum]; dup {
			t.Errorf("Sum%q collides with Sum%q", parts, other)
		}
		seen[sum] = parts
	}
}
