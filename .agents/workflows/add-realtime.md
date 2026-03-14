---
description: Workflow thêm tính năng real-time (WebSocket) cho VCT Platform — scoring live, notifications
---

# /add-realtime — Thêm Tính Năng Real-time

> Sử dụng khi cần thêm WebSocket, live updates, hoặc real-time notifications.
> Đặc biệt cho: scoring live tournament, real-time brackets, notifications.

// turbo-all

---

## Bước 1: Xác Định Use Case

| Use Case | Pattern | Ví dụ |
|----------|---------|------|
| **Live Scoring** | Server → All clients | Điểm thay đổi → broadcast cho tất cả viewers |
| **Notifications** | Server → Specific user | Kết quả bốc thăm → gửi cho VĐV liên quan |
| **Match Updates** | Server → Room subscribers | Trận đấu update → gửi cho viewers của trận đó |
| **Chat** | Client ↔ Client (qua server) | Tin nhắn trong group/community |
| **Presence** | Client → Server → Clients | Online status, typing indicator |

### Xác định:
1. **Ai gửi?** Server push / Client push / Both
2. **Ai nhận?** All / Room / Specific user
3. **Dữ liệu?** Event type + payload
4. **Tần suất?** Low (notifications) / High (scoring real-time)

---

## Bước 2: Backend — WebSocket Hub

### Architecture
```
Client ←→ WebSocket Handler ←→ Hub ←→ Service (EventBus)
                                ↕
                          Room Manager
                          (tournament_123, match_456)
```

### Event Flow
```go
// Domain events flow:
Handler → Service → EventBus.Publish(event) → Hub.Broadcast(room, event) → Clients
```

### Hub Pattern
File: `backend/internal/realtime/hub.go`

```go
type Hub struct {
    rooms      map[string]map[*Client]bool  // room → clients
    broadcast  chan BroadcastMessage
    register   chan *Client
    unregister chan *Client
}

type BroadcastMessage struct {
    Room    string          // e.g., "tournament:abc123"
    Event   string          // e.g., "score_updated"
    Payload json.RawMessage
}
```

### Room Naming Convention:
```
tournament:{id}     — All events for a tournament
match:{id}          — Specific match updates
user:{id}           — User-specific notifications
scoring:{match_id}  — Live scoring for a match
```

---

## Bước 3: Backend — WebSocket Handler

File: `backend/internal/httpapi/ws_handler.go`

### Connection Endpoint
```
GET /api/v1/ws?token={jwt_token}&room={room_name}
```

### Quy tắc:
- ✅ JWT authentication trước khi upgrade connection
- ✅ Rate limiting trên số connections per user
- ✅ Heartbeat/ping-pong để detect dead connections
- ✅ Graceful disconnect handling
- ✅ Room-based subscriptions (join/leave)
- ❌ KHÔNG gửi sensitive data qua WebSocket mà không auth
- ❌ KHÔNG broadcast tất cả events cho tất cả clients

### WebSocket Library
```go
// Sử dụng gorilla/websocket (approved trong tech stack)
import "github.com/gorilla/websocket"

var upgrader = websocket.Upgrader{
    ReadBufferSize:  1024,
    WriteBufferSize: 1024,
    CheckOrigin: func(r *http.Request) bool {
        // CORS check
        return true // Configure per environment
    },
}
```

---

## Bước 4: Backend — Event Types

### Define Event Types
```go
// backend/internal/realtime/events.go
const (
    EventScoreUpdated    = "score_updated"
    EventMatchStarted    = "match_started"
    EventMatchEnded      = "match_ended"
    EventBracketUpdated  = "bracket_updated"
    EventNotification    = "notification"
)

type ScoreEvent struct {
    MatchID    string `json:"match_id"`
    AthleteID  string `json:"athlete_id"`
    Points     int    `json:"points"`
    Category   string `json:"category"` // "quyen" | "doi_khang"
    JudgeID    string `json:"judge_id"`
    Timestamp  int64  `json:"timestamp"`
}
```

---

## Bước 5: Frontend — WebSocket Client

### Hook Pattern
```tsx
// packages/app/features/{module}/hooks/useWebSocket.ts
function useWebSocket(room: string) {
  const [connected, setConnected] = useState(false)
  const [lastEvent, setLastEvent] = useState<WSEvent | null>(null)

  useEffect(() => {
    const token = getAuthToken()
    const ws = new WebSocket(
      `${WS_URL}/api/v1/ws?token=${token}&room=${room}`
    )

    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onmessage = (e) => {
      const event = JSON.parse(e.data)
      setLastEvent(event)
    }

    return () => ws.close()
  }, [room])

  return { connected, lastEvent }
}
```

### UI Integration
```tsx
function LiveScoreBoard({ matchId }: { matchId: string }) {
  const { connected, lastEvent } = useWebSocket(`match:${matchId}`)
  
  return (
    <div>
      <VCT_StatusBadge status={connected ? 'live' : 'offline'} />
      {/* Render scores from lastEvent */}
    </div>
  )
}
```

---

## Bước 6: Shared Types

```typescript
// packages/shared-types/src/realtime/events.ts
export interface WSEvent {
  event: string
  room: string
  payload: unknown
  timestamp: number
}

export interface ScoreEvent {
  match_id: string
  athlete_id: string
  points: number
  category: 'quyen' | 'doi_khang'
}
```

---

## Bước 7: Verify

### Backend
```bash
cd backend && go build ./...
cd backend && go vet ./...
```

### Connection Test
```bash
# Test WebSocket connection (nếu có wscat)
wscat -c "ws://localhost:18080/api/v1/ws?token=xxx&room=test"
```

### Checklist
- [ ] WebSocket upgrade thành công với valid JWT
- [ ] WebSocket reject với invalid/missing JWT
- [ ] Room join/leave hoạt động
- [ ] Events broadcast đúng room
- [ ] Reconnection handling trên frontend
- [ ] Dead connection cleanup (heartbeat)
- [ ] Performance: < 100ms WebSocket latency (SLO)
- [ ] Shared types đồng bộ
