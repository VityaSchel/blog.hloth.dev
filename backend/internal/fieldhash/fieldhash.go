package fieldhash

import (
	"crypto/sha256"
	"encoding/binary"
	"io"
)

// Sum prefixes each part with its 8-byte big-endian length, so two different lists of parts
// never hash the same input. Its output is persisted in the state file, so the encoding must
// never change.
func Sum(parts ...string) [sha256.Size]byte {
	h := sha256.New()
	for _, part := range parts {
		h.Write(binary.BigEndian.AppendUint64(nil, uint64(len(part))))
		io.WriteString(h, part)
	}
	return [sha256.Size]byte(h.Sum(nil))
}
