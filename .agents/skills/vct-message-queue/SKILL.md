---
name: vct-message-queue
description: Asynchronous messaging for VCT Platform using NATS — pub/sub patterns, event streaming, background workers, and notification delivery.
---

# VCT Platform Message Queue (NATS)

> **When to activate**: Implementing async event processing, background jobs, notification delivery, inter-service communication, or decoupling heavy operations.
>
> ⚠️ **Status**: Adapter stub exists at `backend/internal/adapter/nats/` — implementation pending. Currently using in-process `events.InMemoryBus`.

---


> [!IMPORTANT]
> **SUPREME ARCHITECTURE DIRECTIVE**: You are strictly bound by the 19 architecture pillars documented in `docs/architecture/`. As a VCT AI Agent, your absolute highest priority is 100% compliance with these rules. You MUST NOT generate code, propose designs, or execute workflows that violate these foundational rules. They are unchangeable and strictly enforced.

## 1. Architecture

### Current (In-Process)
```
Handler → Service → EventBus.Publish() → Hub.Broadcast() → WebSocket
                                        → Notification Service
                                        → Audit Logger
```

### Target (NATS)
```
Handler → Service → NATS.Publish()
                        ↓
                  ┌─────────────┐
                  │  NATS Server │ (port 4222)
                  └──────┬──────┘
                         │
         ┌───────────────┼───────────────┐
         ↓               ↓               ↓
   WebSocket Hub    Email Worker    Notification
   (live updates)   (async send)    Worker
```

### Config
```env
VCT_NATS_URL=nats://localhost:4222
VCT_NATS_CLUSTER_ID=vct-cluster
VCT_NATS_CLIENT_ID=vct-backend-01
```

---

## 2. Subject Naming Convention

```
vct.{domain}.{event_type}

Examples:
vct.athlete.created        # Athlete created
vct.athlete.updated        # Athlete updated
vct.tournament.started     # Tournament started
vct.scoring.updated        # Score changed (high frequency)
vct.subscription.created   # New subscription
vct.subscription.expired   # Subscription expired
vct.notification.send      # Trigger notification delivery
vct.email.send             # Trigger email delivery
```

---

## 3. Event Message Format

```go
type Event struct {
    ID         string         `json:"id"`          // UUID
    Subject    string         `json:"subject"`     // vct.athlete.created
    Type       string         `json:"type"`        // created, updated, deleted
    EntityType string         `json:"entity_type"` // athlete, tournament
    EntityID   string         `json:"entity_id"`
    ActorID    string         `json:"actor_id"`    // User who triggered
    TenantID   string         `json:"tenant_id"`
    Payload    map[string]any `json:"payload"`
    Timestamp  time.Time      `json:"timestamp"`
}
```

---

## 4. Use Cases

| Use Case | Subject | Consumer | Priority |
|----------|---------|----------|----------|
| Live scoring broadcast | `vct.scoring.updated` | WebSocket Hub | High |
| Email notifications | `vct.email.send` | Email Worker | Medium |
| Push notifications | `vct.notification.send` | Notification Worker | Medium |
| Audit logging | `vct.*.created/updated/deleted` | Audit Worker | Low |
| Search index sync | `vct.*.created/updated/deleted` | Meilisearch Worker | Low |
| Subscription expiry check | `vct.cron.daily` | Subscription Worker | Low |

---

## 5. Publisher Pattern

```go
// In domain service
func (s *Service) Create(ctx context.Context, input CreateInput) (Entity, error) {
    entity, err := s.repo.Create(ctx, input)
    if err != nil { return Entity{}, err }
    
    // Publish event (fire-and-forget)
    s.eventBus.Publish(events.Event{
        Subject:    "vct.athlete.created",
        Type:       "created",
        EntityType: "athlete",
        EntityID:   entity.ID,
        Payload:    map[string]any{"name": entity.Name},
    })
    
    return entity, nil
}
```

---

## 6. Subscriber Pattern

```go
// Background worker subscribing to events
func (w *EmailWorker) Start(ctx context.Context) {
    w.nats.Subscribe("vct.email.send", func(msg *nats.Msg) {
        var event Event
        json.Unmarshal(msg.Data, &event)
        
        // Process async
        if err := w.emailSvc.Send(event.Payload); err != nil {
            log.Printf("email worker error: %v", err)
            // Retry logic
        }
    })
}
```

---

## 7. Migration Path (InMemoryBus → NATS)

### Phase 1: Current (in-process)
- `events.InMemoryBus` handles all events
- Direct function calls to WebSocket hub
- Synchronous notification delivery

### Phase 2: NATS adapter
- Implement `adapter/nats/publisher.go` and `adapter/nats/subscriber.go`
- `EventBus` interface remains the same
- Swap `InMemoryBus` → `NATSBus` in server wiring

### Phase 3: Workers
- Extract email, notification, audit into separate workers
- Workers subscribe to NATS subjects
- Horizontal scaling: multiple worker instances

---

## 8. Docker Setup

```yaml
# docker-compose.yml
services:
  nats:
    image: nats:2-alpine
    ports:
      - "4222:4222"   # Client connections
      - "8222:8222"   # HTTP monitoring
    command: ["--jetstream", "--store_dir", "/data"]
    volumes:
      - nats-data:/data
```

---

## 9. Implementation Checklist

1. [ ] Implement NATS adapter in `backend/internal/adapter/nats/`
2. [ ] Create `EventBus` interface (already exists in `events/`)
3. [ ] Implement `NATSPublisher` and `NATSSubscriber`
4. [ ] Add NATS connection setup in `server.go`
5. [ ] Create background workers for async processing
6. [ ] Add NATS to `docker-compose.yml`
7. [ ] Migrate `InMemoryBus` → `NATSBus` (behind feature flag)
8. [ ] Add retry logic for failed message processing
9. [ ] Add dead letter queue for unprocessable messages
10. [ ] Monitoring: NATS HTTP endpoint at `:8222`

---

## 10. Anti-Patterns

1. ❌ **NEVER** use NATS for synchronous request/reply in handlers
2. ❌ **NEVER** publish events before the database transaction commits
3. ❌ **NEVER** skip error handling in subscribers (silent data loss)
4. ❌ **NEVER** process events out of order without idempotency checks
5. ❌ **NEVER** put large payloads (>1MB) in messages — use references
