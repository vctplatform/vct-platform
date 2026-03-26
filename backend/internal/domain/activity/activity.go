package activity

import (
	"time"
)

// ActivityItem represents a single activity event formatted for the Portal Hub.
type ActivityItem struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Timestamp   time.Time `json:"timestamp"`
	Type        string    `json:"type"` // Example: 'alert' | 'update' | 'match'
}

// ActivityFeedResponse defines the structure of the API response.
type ActivityFeedResponse struct {
	Items []ActivityItem `json:"items"`
}
