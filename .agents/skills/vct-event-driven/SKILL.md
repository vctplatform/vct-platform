---
name: vct-event-driven
description: Event-driven architecture for VCT Platform — domain events, in-process event bus, event sourcing for scoring, CQRS read models, and event-driven integration patterns.
---

# VCT Platform Event-Driven Architecture

> **When to activate**: Implementing domain events, event sourcing for scoring, building read models (CQRS), publishing notifications on state changes, or creating event-driven integrations.

---

## 1. Architecture Overview

```
Domain Layer                    Infrastructure
┌───────────┐                  ┌──────────────┐
│ Service   │──publish──→      │  EventBus    │
│ Layer     │                  │  (in-process)│
└───────────┘                  └──────┬───────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ↓                 ↓                  ↓
             ┌──────────┐     ┌──────────┐      ┌──────────┐
             │Notifier  │     │ReadModel │      │ Audit    │
             │(email/ws)│     │Updater   │      │ Logger   │
             └──────────┘     └──────────┘      └──────────┘
```

---

## 2. Domain Events

```go
// DomainEvent is the base event envelope
type DomainEvent struct {
    ID        string         `json:"id"`
    Type      string         `json:"type"`
    EntityType string        `json:"entity_type"`
    EntityID  string         `json:"entity_id"`
    Payload   map[string]any `json:"payload"`
    UserID    string         `json:"user_id"`
    Timestamp time.Time      `json:"timestamp"`
}
```

### Standard Event Types
| Event Type | When | Payload |
|------------|------|---------|
| `entity.created` | New entity inserted | Full entity data |
| `entity.updated` | Entity modified | Changed fields |
| `entity.deleted` | Entity removed | Entity ID only |
| `status.changed` | State machine transition | `{ from, to }` |
| `score.recorded` | Match scoring event | Score details |
| `match.completed` | Match finished | Final result |
| `belt.promoted` | Belt advancement | New belt level |
| `registration.approved` | Approval granted | Approval metadata |

---

## 3. In-Process Event Bus

```go
// EventBus for decoupled communication
type EventBus struct {
    handlers map[string][]EventHandler
    mu       sync.RWMutex
}

type EventHandler func(event DomainEvent)

func (b *EventBus) Subscribe(eventType string, handler EventHandler) {
    b.mu.Lock()
    defer b.mu.Unlock()
    b.handlers[eventType] = append(b.handlers[eventType], handler)
}

func (b *EventBus) Publish(event DomainEvent) {
    b.mu.RLock()
    defer b.mu.RUnlock()
    event.ID = uuid.NewString()
    event.Timestamp = time.Now().UTC()
    for _, h := range b.handlers[event.Type] {
        go h(event)  // Async handlers
    }
    // Also dispatch to wildcard subscribers
    for _, h := range b.handlers["*"] {
        go h(event)
    }
}
```

---

## 4. Event Sourcing (Scoring)

For match scoring, events are the source of truth:

```
Match Events (append-only log)
├── { type: "round_start", round: 1 }
├── { type: "score", athlete: "red", points: 2 }
├── { type: "penalty", athlete: "blue", step: 1 }
├── { type: "score", athlete: "blue", points: 1 }
├── { type: "round_end", round: 1 }
├── { type: "round_start", round: 2 }
├── ...
└── { type: "result", winner: "red" }

Current State = fold(all events)
```

### Database Schema (Migration 0021)
```sql
CREATE TABLE scoring_events (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id    UUID NOT NULL REFERENCES matches(id),
    event_type  TEXT NOT NULL,
    athlete_id  UUID,
    points      INT DEFAULT 0,
    round       INT,
    referee_id  UUID NOT NULL,
    metadata    JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_scoring_events_match ON scoring_events(match_id, created_at);
```

---

## 5. CQRS Read Models

Separate read-optimized views from write models:

```
Write Side (Commands)          Read Side (Queries)
┌──────────────┐              ┌──────────────────┐
│ Service.Create│──event──→   │ MaterializedView │
│ Service.Update│              │ (dashboard stats)│
│ Service.Delete│              │ (leaderboards)   │
└──────────────┘              │ (search indexes) │
                              └──────────────────┘
```

### Materialized Counters (Migration 0013)
```sql
-- Pre-computed dashboard stats
CREATE MATERIALIZED VIEW mv_federation_stats AS
SELECT
    f.id AS federation_id,
    count(DISTINCT c.id) AS club_count,
    count(DISTINCT a.id) AS athlete_count,
    count(DISTINCT t.id) AS tournament_count
FROM federations f
LEFT JOIN clubs c ON c.federation_id = f.id
LEFT JOIN athletes a ON a.club_id = c.id
LEFT JOIN tournaments t ON t.federation_id = f.id
GROUP BY f.id;

-- Refresh on data change (via event handler)
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_federation_stats;
```

---

## 6. Publishing Events from Services

```go
func (s *TournamentService) UpdateStatus(id, newStatus string) error {
    tournament, err := s.repo.GetByID(id)
    if err != nil { return err }

    oldStatus := tournament.Status
    if err := domain.ValidateTransition(domain.TournamentTransitions, oldStatus, newStatus); err != nil {
        return err
    }

    tournament.Status = newStatus
    if err := s.repo.Update(tournament); err != nil {
        return err
    }

    // Publish domain event  
    s.eventBus.Publish(DomainEvent{
        Type:       "status.changed",
        EntityType: "tournament",
        EntityID:   tournament.ID,
        Payload:    map[string]any{"from": oldStatus, "to": newStatus},
    })
    return nil
}
```

---

## 7. Event Handlers (Side Effects)

```go
// Wire up event handlers at server startup
func (s *Server) setupEventHandlers() {
    // Notification on approval
    s.eventBus.Subscribe("status.changed", func(e DomainEvent) {
        if e.Payload["to"] == "da_duyet" {
            s.notifier.SendApprovalNotification(e.EntityID)
        }
    })

    // Audit logging
    s.eventBus.Subscribe("*", func(e DomainEvent) {
        s.auditLog.Record(e)
    })

    // Refresh materialized views on data changes
    s.eventBus.Subscribe("entity.created", func(e DomainEvent) {
        s.store.RefreshMaterializedView("mv_federation_stats")
    })
}
```

---

## 8. Anti-Patterns

1. ❌ **NEVER** put side effects directly in service methods — use events
2. ❌ **NEVER** make event handlers block the main request — use `go` routines
3. ❌ **NEVER** depend on event handler execution order — handlers are independent
4. ❌ **NEVER** mutate events after publishing — events are immutable
5. ❌ **NEVER** use events for synchronous request-response flows — use direct calls
6. ❌ **NEVER** skip error handling in event handlers — log and continue
