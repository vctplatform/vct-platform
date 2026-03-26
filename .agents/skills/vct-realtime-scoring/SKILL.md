---
name: vct-realtime-scoring
description: Real-time scoring patterns for VCT Platform — match event processing, đối kháng vs quyền thuật scoring rules, WebSocket live updates, offline-first PWA scoring, penalty system (6-step), and bracket generation.
---

# VCT Platform Real-time Scoring

> **When to activate**: Any task involving match scoring, live event processing, bracket generation, referee scoring tablets, or real-time competition updates.

---


> [!IMPORTANT]
> **SUPREME ARCHITECTURE DIRECTIVE**: You are strictly bound by the 19 architecture pillars documented in `docs/architecture/`. As a VCT AI Agent, your absolute highest priority is 100% compliance with these rules. You MUST NOT generate code, propose designs, or execute workflows that violate these foundational rules. They are unchangeable and strictly enforced.

## 1. Scoring Architecture

```
Referee Tablet (PWA)
    │
    ▼
WebSocket ──→ Backend ──→ EventBus ──→ WebSocket Hub
    │            │                         │
    │            ▼                         ▼
    │       Score Calculator          Spectator UI
    │            │                    Admin Dashboard
    ▼            ▼
IndexedDB    PostgreSQL
(offline)    (persisted)
```

---

## 2. Match Types & Scoring Rules

### Đối Kháng (Combat) — Luật 2024
| Action | Points |
|--------|--------|
| Đòn tay vào vùng hợp lệ | 1 điểm |
| Đòn chân vào thân | 2 điểm |
| Đòn chân vào đầu / quật ngã | 3 điểm |

### Quyền Thuật (Forms)
| Category | Score Range |
|----------|-------------|
| Technical accuracy | 0.0 – 10.0 |
| Power & speed | 0.0 – 10.0 |
| Artistic expression | 0.0 – 10.0 |
| Final = weighted avg | trimmed mean (drop highest/lowest) |

---

## 3. Match Event Model

```go
type MatchEvent struct {
    ID         string    `json:"id"`
    MatchID    string    `json:"match_id"`
    Type       string    `json:"type"`       // "score", "penalty", "card", "timeout", "medical"
    AthleteID  string    `json:"athlete_id"`
    Points     int       `json:"points"`
    Round      int       `json:"round"`
    Timestamp  time.Time `json:"timestamp"`
    RefereeID  string    `json:"referee_id"`
    Metadata   map[string]any `json:"metadata"`
}
```

### Event Types
```
score        — Point awarded
penalty      — Penalty (lỗi nhẹ / lỗi nặng / cấm)
card         — Yellow/Red card
timeout      — Timeout request
medical      — Medical stop
round_start  — Round begins
round_end    — Round ends
result       — Final result
```

---

## 4. Penalty System (6-Step Escalation)

```
1. Nhắc nhở lần 1 (Verbal warning 1)
2. Nhắc nhở lần 2 (Verbal warning 2)
3. Trừ 1 điểm   (Deduct 1 point)
4. Trừ 2 điểm   (Deduct 2 points)
5. Truất quyền hiệp (Disqualify round)
6. Truất quyền trận (Disqualify match)
```

---

## 5. State Machine

Uses `domain.MatchTransitions`:
```
scheduled → ready → in_progress ↔ paused → completed → confirmed → published
                                     ↓
                                  cancelled
```

---

## 6. WebSocket Protocol

```json
// Referee sends score event
{ "action": "match_event", "data": { "match_id": "...", "type": "score", "points": 2 } }

// Server broadcasts to subscribers
{ "channel": "match:{matchId}", "event": "score_update", "data": { "scores": {...} } }

// Subscribe to match updates
{ "action": "subscribe", "channel": "match:abc123" }
```

---

## 7. Offline-First Pattern (PWA)

```
1. Event created on tablet → save to IndexedDB
2. Show event immediately in local UI (optimistic)
3. Queue event for sync when online
4. On reconnect → replay queued events to backend
5. Backend resolves conflicts (timestamp-based)
```

---

## 8. Calculator Service

Located at `internal/domain/scoring/calculator.go`:

```go
// ComputeMatchState aggregates all events into current state
func (c *Calculator) ComputeMatchState(events []MatchEvent) MatchState

// MatchState contains derived scoreboard
type MatchState struct {
    ScoreRed   int
    ScoreBlue  int
    Penalties  map[string][]Penalty
    CurrentRound int
    Status     string
    Winner     string // empty if ongoing
}
```

---

## 9. Anti-Patterns

1. ❌ **NEVER** trust client-submitted scores without server validation
2. ❌ **NEVER** allow score modification after match is `confirmed`
3. ❌ **NEVER** broadcast events without referee authentication
4. ❌ **NEVER** store derived state — always compute from events (event sourcing)
5. ❌ **NEVER** skip the state machine validation for match transitions
