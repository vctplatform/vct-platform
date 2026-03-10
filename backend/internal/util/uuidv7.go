package util

import (
	"crypto/rand"
	"fmt"
	"time"
)

// NewUUIDv7 generates a RFC 9562 UUID v7 (time-ordered).
//
// Layout (128 bits):
//
//	[48-bit unix_ts_ms][4-bit ver=0111][12-bit rand_a][2-bit var=10][62-bit rand_b]
//
// Benefits over UUID v4:
//   - Sortable by creation time (natural ORDER BY on id)
//   - Better B-tree index locality (sequential inserts → less page splits)
//   - K-sortable for distributed systems
//   - Same 128-bit UUID type — fully compatible
func NewUUIDv7() string {
	var buf [16]byte

	// 1) Fill with random bytes
	if _, err := rand.Read(buf[:]); err != nil {
		panic(fmt.Sprintf("uuid v7: crypto/rand failed: %v", err))
	}

	// 2) Timestamp: Unix milliseconds in first 48 bits (big-endian)
	ms := uint64(time.Now().UnixMilli())
	buf[0] = byte(ms >> 40)
	buf[1] = byte(ms >> 32)
	buf[2] = byte(ms >> 24)
	buf[3] = byte(ms >> 16)
	buf[4] = byte(ms >> 8)
	buf[5] = byte(ms)

	// 3) Version: set bits 48-51 to 0111 (version 7)
	buf[6] = (buf[6] & 0x0F) | 0x70

	// 4) Variant: set bits 64-65 to 10 (RFC 9562)
	buf[8] = (buf[8] & 0x3F) | 0x80

	// 5) Format as UUID string
	return fmt.Sprintf(
		"%08x-%04x-%04x-%04x-%012x",
		buf[0:4],
		buf[4:6],
		buf[6:8],
		buf[8:10],
		buf[10:16],
	)
}
