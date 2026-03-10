package util

import (
	"regexp"
	"testing"
)

func TestNewUUIDv7_Format(t *testing.T) {
	id := NewUUIDv7()

	// Must match UUID format
	uuidRegex := regexp.MustCompile(`^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$`)
	if !uuidRegex.MatchString(id) {
		t.Errorf("UUID v7 format invalid: %s", id)
	}
}

func TestNewUUIDv7_Uniqueness(t *testing.T) {
	seen := make(map[string]bool)
	for i := 0; i < 10000; i++ {
		id := NewUUIDv7()
		if seen[id] {
			t.Fatalf("duplicate UUID v7 at iteration %d: %s", i, id)
		}
		seen[id] = true
	}
}

func TestNewUUIDv7_Ordering(t *testing.T) {
	prev := NewUUIDv7()
	for i := 0; i < 100; i++ {
		next := NewUUIDv7()
		// UUID v7 should be lexicographically sortable by time
		// Within the same millisecond, random bits may not be ordered,
		// but across milliseconds they should be
		if next < prev {
			// Only fail if timestamps differ (first 12 hex chars = 48 bits)
			if next[:13] < prev[:13] {
				t.Errorf("UUID v7 not time-ordered: %s > %s", prev, next)
			}
		}
		prev = next
	}
}

func TestNewUUIDv7_VersionBit(t *testing.T) {
	for i := 0; i < 100; i++ {
		id := NewUUIDv7()
		// Position 14 (0-indexed) should be '7' (version nibble)
		if id[14] != '7' {
			t.Errorf("expected version nibble '7', got '%c' in %s", id[14], id)
		}
	}
}
