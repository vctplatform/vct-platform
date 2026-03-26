# VCT Platform — Backend Engineering Architecture

> **Mục đích**: Bộ nguyên tắc bảo vệ cấu trúc, thiết kế và định hướng kĩ thuật cho **Backend Go 1.26** của hệ thống VCT Platform. Mọi dòng code backend mới **PHẢI** tuân thủ tuyệt đối tài liệu này. Vi phạm bất kỳ quy tắc nào sẽ bị từ chối khi review.

---

## 1. Core Philosophy & Dependency Rule

### 1.1 Nguyên Tắc Vàng (Inward Dependency)
Mũi tên phụ thuộc **LUÔN LUÔN** hướng vào trong. Lớp bên trong KHÔNG BAO GIỜ biết sự tồn tại của lớp bên ngoài.

```text
┌─────────────────────────────────────────────────────┐
│  HTTP Handlers / WebSocket (Lớp ngoài cùng)         │
│  ┌─────────────────────────────────────────────┐    │
│  │  Adapters / Infrastructure (Redis/Minio/PG) │    │
│  │  ┌─────────────────────────────────────┐    │    │
│  │  │  Application Services (Use Cases)   │    │    │
│  │  │  ┌─────────────────────────────┐    │    │    │
│  │  │  │  Domain (Entities + Rules)  │    │    │    │
│  │  │  └─────────────────────────────┘    │    │    │
│  │  └─────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### 1.2 Lệnh CẤM Tuyệt Đối
| # | Lệnh Cấm | Ví dụ Sai Lầm |
| --- | --- | --- |
| D1 | **Domain cấm import Adapter** | `domain/athlete/service.go` import `internal/adapter` |
| D2 | **Domain cấm import HTTP/Web** | `domain/scoring/` import `net/http` |
| D3 | **Domain cấm SDK bên thứ 3** | Kéo `github.com/jackc/pgx` vào tầng Repository |
| D4 | **Service cấm gọi DB trực tiếp** | `Service.Create()` gọi `sql.DB.Query()` |
| D5 | **Handler cấm chứa Logic** | IF/ELSE tính điểm hoặc kiểm tra quyền bị vứt ngay trong handler |
| D6 | **Cấm dùng Web Frameworks** | Tuyệt đối KHÔNG dùng *Gin, Echo, Fiber*. Chỉ dùng `net/http` thuần |
| D7 | **Cấm dùng ORM** | Tuyệt đối KHÔNG dùng *GORM, Ent*. Chỉ dùng Raw SQL với `pgx/v5` |

---

## 2. Project Structure & Go Module

Base Stack: `Go 1.26`, `pgx/v5`, `gorilla/websocket`, `golang-jwt/v5`, `slog` (Structured Logging).

### 2.1 Cấu Trúc Tổng Quan
```text
backend/
├── cmd/                    # Entry points (cmd/server/main.go)
├── internal/               # Toàn bộ lõi ứng dụng (ẩn với bên ngoài)
│   ├── config/             # Environment biến môi trường (Config struct)
│   ├── auth/               # JWT auth service & OTP
│   ├── domain/             # Business domain (Athlete, Tournament, Scoring...)
│   ├── httpapi/            # Routing, HTTP handlers & Middlewares
│   ├── adapter/            # DB Implementations (PostgreSQL + In-Memory)
│   ├── events/             # Domain in-process Event Bus
│   ├── realtime/           # WebSocket Hub (phục vụ chấm điểm Live)
│   ├── worker/             # Background workers
│   └── logger/             # Slog config
├── migrations/             # SQL Migrations (0001_core.sql -> 0086...)
├── sql/                    # Raw SQL queries được tổ chức rời
└── Dockerfile              # Standard Docker & Dockerfile.render cho Fly/Render
```

---

## 3. Domain Module Pattern

Mỗi một Domain Module (VD: `athlete`, `tournament`) **BẮT BUỘC** phải tuân theo format 3 file căn bản:

### 3.1 `models.go` (Entities)
Các Entity đại diện cho DB. Việc đặt tên field JSON bắt buộc match với API Contract và DB Column. Khuyến khích sử dụng **Vietnamese field names** để bám sát mô hình nghiệp vụ Võ Thuật: `HoTen`, `TrangThai`, `GiaiDauID`.

### 3.2 `repository.go` (Interface)
Quy định Hợp Đồng Adapter. **Tuyệt đối KHÔNG chứa implementation**.
```go
type Repository interface {
    GetByID(ctx context.Context, id string) (*Entity, error)
    Create(ctx context.Context, entity Entity) error
    // Mọi hàm BẮT BUỘC truyền theo context.Context
}
```

### 3.3 `service.go` (Use Cases)
Logic nghiệp vụ sống ở đây. Service nhận Dependency Injection (DI) thông qua constructor.
```go
type Service struct {
    repo Repository
    uuid func() string // Cấp phát random function để dễ Unit Test
}
func NewService(repo Repository, uuid func() string) *Service { ... }

// Ném lỗi thuộc Domain Error, CẤM ném lỗi gán sẵn mã HTTP 400, 404 ở đây
func (s *Service) PhaiHuy(ctx context.Context, id string) error {
    if entity.TrangThai == "DA_DUYET" { return domain.ErrKhongTheHuy }
}
```

---

## 4. Adapters & SQL Migrations

### 4.1 Dual Storage Strategy (Mock First)
Hệ thống được thiết kế để cung cấp `In-Memory` mặc định cho việc phát triển/test, và `Postgres` cho môi trường staging/production.
Trong `internal/adapter/`, file implementation PG luôn kết thúc bằng `_pg.go`.
Khi Server khởi chạy, nó kiểm tra biến `VCT_STORAGE_DRIVER=postgres` để switch Repositories.

### 4.2 Raw SQL Rules
Chỉ sử dụng `database/sql` chung với driver `github.com/jackc/pgx/v5`. SQL phải được format gọn gàng, sử dụng Parameters ( `$1`, `$2` ) để tránh SQL-Injection.

### 4.3 Database Migrations
Mọi file schema thay đổi database phải vứt vào `backend/migrations/` và đánh mã tăng dần (VD: `0086_add_vande.sql`).
> ❌ **CẤM QUÊN**: Mọi script Update Up bắt buộc phải luôn đi kèm File Rollback Down (`0086_add_vande_down.sql`). Migration tự động apply khi start server nếu `VCT_DB_AUTO_MIGRATE=true`.

---

## 5. HTTP API, Routing & Middlewares

### 5.1 Rest Routing (Go 1.22+ ServeMux)
Tận dụng tính năng routing pattern mạnh mẽ của Go 1.22 (`POST /api/v1/athletes/`):
```go
// Quy định đặt routes tại httpapi/server.go
mux.HandleFunc("GET /api/v1/{module}/", s.handleEntityList)
mux.HandleFunc("POST /api/v1/{module}/", s.handleEntityCreate)
```

### 5.2 Middleware Stack Cứng (Theo đúng thứ tự)
Mọi request vào ứng dụng phải xuyên qua chuỗi dây chuyền:
1. `withRecover`: Bắt Panics → 500 lỗi JSON
2. `withRequestID`: Trị inject UUID `X-Request-ID` cho Audit & Tracing
3. `withSecurityHeaders`: Chuẩn hóa headers (`X-Frame-Options`, `Content-Security-Policy`)
4. `withRateLimit`: Ngăn chặn Spam / DDOS ở cấp độ Route
5. `withBodyLimit`: Khống chế tối đa 1-5MB body tránh treo RAM
6. `withAuth`: Kiểm tra Token, gắn quyền vào Context

### 5.3 Unified API Envelope
Mọi Responses (Cả Thành Công và Thất Bại) BẮT BUỘC trả về đúng một Format chung thống nhất (nằm trong `httpapi/helpers.go`).

✅ **Success Response**
```json
{
  "success": true,
  "data": { ... },
  "meta": { "total": 100 }
}
```
❌ **Error Response (`APIError`)**
```json
{
  "success": false,
  "error": {
    "code": "TOURNAMENT_NOT_FOUND",
    "message": "Chi tiết lỗi tiếng việt thân thiện",
    "details": {}
  }
}
```

---

## 6. Enterprise Observability & Operations

### 6.1 Structured JSON Logging (`slog`)
Không bao giờ dùng `fmt.Println` hay `log.Printf` trên Production. Bắt buộc dùng Structured Logging:
```go
// LUÔN LUÔN đính kèm Request ID vào logs
log.InfoContext(ctx, "athlete created", 
    slog.String("athlete_id", id), 
    slog.String("club", clubID),
    slog.Int("duration_ms", 12))
```

### 6.2 Context-Propagation (Sát Thủ Kéo Tàu)
Tham số đầu tiên của CÁC HÀM XUYÊN LỚP (Store, Adapter, Repo, Service) đều phải là `ctx context.Context`. Context mang theo CancellationToken (khi user ngắt rớt HTTP kết nối) và `X-Request-ID` dùng cho logging chuỗi.

### 6.3 Graceful Shutdown
Hệ thống không bao giờ được phép Crash mạnh ngang và ngắt socket.
```go
// cmd/server/main.go
ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
defer stop()

<-ctx.Done() // Chờ tín hiệu SIGTERM / CTRL+C
shutdownCtx := context.WithTimeout(context.Background(), 15*time.Second)
srv.Shutdown(shutdownCtx) // Đợi các Request đang chạy xử lý nốt
server.Close() // Dóng database conn, đóng WS hub.
```

---

## 7. Advanced Enterprise Guard Rails (FAANG Standards)

Để hệ thống VCT Platform chịu được rủi ro cấp độ cao vào những ngày Giải Đấu diễn ra với hàng chục ngàn thao tác đồng thời, 4 bộ quy tắc "thép" sau đây phải được thiết lập:

### 7.1 Concurrency Control & Database Locking
Ngăn chặn thảm họa ghi đè dữ liệu (Lost Updates) khi thao tác Admin và Trọng tài diễn ra cùng lúc.
- **Pessimistic Locking (`SELECT FOR UPDATE`)**: Bắt buộc chỉ dùng riêng cho Module _Chấm Điểm (Scoring)_, khóa dòng ngay tại DB cho đến khi Referee chốt điểm xong để tránh race-condition.
- **Optimistic Locking (Version Tracking)**: Bắt buộc dùng cho _CRUD thông thường_. Mọi bảng (như Athlete, Tournament) phải có trường `version` (hoặc `updated_at`). Nếu 2 Admin cùng sửa Hồ Sơ VĐV, ai `UPDATE` sau mà truyền sai `version` cũ sẽ bị văng lỗi `409 Conflict`.

### 7.2 Tính Lũy Đẳng (Idempotency)
Bảo vệ sự an toàn của các hành động "Không Thể Rút Lại" (Thanh toán phí, Chốt kết quả trận, Tạo Chứng Nhận).
- Bắt buộc Frontend phải đính kèm Header `Idempotency-Key: <uuid>` cho các `POST/PUT/DELETE` nhạy cảm.
- Backend lưu Key này tạm thời vào Redis/DB. Lần 2 (do mạng lag tự retry), nếu phát hiện trùng `Idempotency-Key` → trả ngay kết quả cũ (thường là `200 OK`) thay vì trừ tiền 2 lần hoặc tạo thành 2 VĐV giống nhau.

### 7.3 Transactional Outbox Pattern
CẤM TUYỆT ĐỐI việc nhồi nhét thao tác gọi API bên thứ 3 (Gửi Email Resend, Gửi Zalo/SMS) vào giữa 1 SQL Transaction đang mở. Cấm trường hợp: DB thì Rollback nhưng Email lại bay đi mất.
- **Quy tắc Outbox**: Hàm `Service` sẽ dùng chung DB Transaction để INSERT dữ liệu chính + `INSERT INTO outbox_events (event_type, payload)` vào DB. 
- Ngay sau khi commit thành công 100%, một `Background Worker` chạy ngầm sẽ chồm lên đọc outbox và gọi API Gửi Email. Đảm bảo tính nhất quán cuối cùng (Eventual Consistency).

### 7.4 Background Jobs & PII Data Masking
- **Offloading (Giải Phóng Ram)**: Các hành động tốn hơn **300ms** (Bốc thăm 50 nhánh cho 1000 VĐV, Xuất báo cáo PDF, Sinh loạt chứng chỉ) CẤM ĐƯỢC chặn HTTP Response. API phải lập tức trả về `202 Accepted` kèm `job_id`, đẩy tác vụ xuống `Worker Queue` (Redis/NATS).
- **Data Privacy (PII Masking)**: Các trường Dữ Liệu Định Danh Cá Nhân (PII - Căn cước công dân, Email, SĐT thật của Phụ huynh) TUYỆT ĐỐI CẤM xuất hiện trần trụi dưới dạng Plain-Text trong Terminal Console. Khi `slog.Info()` phải được wrap qua một hàm Masker (ví dụ: `090****123` hoặc `n**@gmail.com`). Tôn trọng dữ liệu người dùng.

### 7.5 Multi-Tenancy & Data Isolation (Kiến trúc Đa Khách Hàng)
Ngăn chặn tuyệt đối việc Câu lạc bộ / Đơn vị thuộc Tỉnh này có thể query lậu và xem trộm dữ liệu Vận động viên của Tỉnh khác.
- **Quy tắc**: Mọi API trả về dữ liệu **phải** được tiêm `TenantID` (Mã đơn vị) từ JWT Token của người gọi.
- **Thực thi**: Nghiêm cấm gõ tay `WHERE tenant_id = ?` ở từng hàm (kẻo dev quên). Bắt buộc phải gắn Middleware ép `TenantID` vào `context.Context`, sau đó tầng Adapter sẽ tự động bọc câu query hoặc sử dụng **Row-Level Security (RLS)** cứng dưới đáy PostgreSQL để từ chối các Record khác TenantID dẫu bằng mọi giá.

### 7.6 Pagination & Large Datasets (Phân Trang $O(1)$)
- **Luật Cấm**: Tuyệt đối **CẤM** dùng `OFFSET` và `LIMIT` (`OFFSET 50000 LIMIT 20`) cho bất kì bảng nào có rủi ro vượt quá 50,000 dòng dữ liệu (ví dụ: Bảng logs Sự kiện trận đấu, Lịch sử Giao dịch điểm). Do đặc thù của Postgres, OFFSET lớn sẽ gây treo CPU vì nó phải cày qua hàng nghìn dòng thừa.
- **Quy định**: Yêu cầu sử dụng **Cursor-based Pagination** (Keyset Pagination) thông qua `WHERE id > last_seen_id ORDER BY id LIMIT 20`. Đảm bảo thời gian query luôn là $O(1)$ dù dữ liệu là 10.000 hay 10 triệu dòng.

### 7.7 Security - Immediate JWT Revocation (Tịch Thu Quyền Lập Tức)
Tránh thảm họa khi tài khoản Admin / Referee bị lộ Pass hoặc thiết bị rơi vào tay người lạ, nhưng JWT cũ cấp ra vẫn còn hạn 24 Tiếng.
- **Quy định Blacklisting**: Không phụ thuộc vào thời gian Expire của JWT. Khi đổi mật khẩu, đăng xuất all devices, hoặc Block User, ID phiên đăng nhập (hoặc JTI) phải bị phiến ngay vào **Revocation List** trên Redis.
- **Ngắt kết nối**: Authentication Middleware bắt buộc phải check Redis chặn cổng lập tức khi phát hiện Token nằm trong Blacklist, ném trả `401 Unauthorized` dẫu Token còn hạn.

### 7.8 Liveness & Readiness Probes (K8s / LB Zero Downtime)
Trong luồng Deploy mới hoặc tự động Auto-Scaling, hệ thống Load Balancer (Render.com / Fly.io / K8s) cấm được nhét user vào Node chưa khởi động xong kết nối DB.
- **`/healthz` (Liveness)**: Chỉ check Go Server có còn đang "thở" (không bị Deadlock) hay không. Trả `200 OK` nhanh nhất có thể.
- **`/readyz` (Readiness)**: Bắt buộc kèm theo lệnh `Ping` chạm sâu tới tận `PostgreSQL` và `Redis`. Nếu DB nghẽn hoặc sập, API này trả về `503 Service Unavailable`, Load Balancer sẽ lập tức cắt luồng tải khỏi Node này để người dùng không bị văng rớt trắng trang.

---

## 8. Ultimate Unicorn-Tier Guard Rails
Để nền tảng tiến đến đẳng cấp của các kỳ lân Công nghệ (Grab/Uber cấp độ System Design), 5 chốt chặn cuối cùng được áp dụng khắt khe:

### 8.1 API Versioning (Cứu Cánh Mobile App)
- **Quy tắc Bắt buộc**: CẤM ĐƯỢC PHÉP tạo Endpoint mà không gắn version (VD: `/api/users`). 
- **Giải Pháp**: Mọi route phải tuân thủ chuẩn URI Versioning (VD: `/api/v1/users`) hoặc Header Versioning (`Accept: application/vnd.vct.v1+json`). Đảm bảo khi VCT Platform release Version 2 với Payload JSON cấu trúc khác, các thiết bị iOS/Android Version 1 lười cập nhật App vẫn chạy mượt mà API `v1` trong 5 năm tiếp theo mà không bị Crash.

### 8.2 Dấu Vết Pháp Lý (Soft Delete & Audit Logs)
Ngăn chặn thảm hoạ mất dấu vết pháp lý khi thao tác trên Hồ Sơ VĐV, Cấp Bậc Đai, hay Kết Quả Trận Đấu.
- **Soft Delete**: CẤM THUỜNG TRÚ lệnh `DELETE FROM ...`. Các bảng Domain bắt buộc phải có `deleted_at`. Gọi hàm xóa chỉ là cập nhật thời gian để ẩn dữ liệu đi.
- **Audit Logging**: Các thao tác quan trọng (Nâng Đai, Sang Nhượng VĐV, Sửa Giờ Thi Đấu) bắt buộc phải tự kích hoạt 1 Event bắn vào bảng `audit_logs` (Bao gồm: `ActorID`, `Action`, `Old_Payload`, `New_Payload`, `IP`). "Admin A vừa sửa Đai của VĐV B từ Xanh sang Đen lúc 20:00".

### 8.3 Ngắt Mạch Tự Động (Circuit Breaker Pattern)
Tránh thảm hoạ Go Server kiệt quệ RAM (Out of Memory) vì phải chờ đối tác bên thứ 3 (Zalo SMS, VNPay, Resend Email).
- **Quy tắc Ngắt Mạch**: Mọi lời gọi API từ Outbox/Worker ra bên thứ 3 phải được bọc trong bộ Circuit Breaker (vd: `gobreaker`). 
- **Cơ chế**: Nếu API của Zalo Timeout quá 5 lần liên tiếp, Circuit Breaker sẽ lập tức "Mở Mạch", từ chối gửi requests tiếp theo và văng ngay lỗi `503 Service Unavailable` trong 0.1s thay vì 30s. Cho phép Go Server giải phóng hàng nghìn Goroutines đang nghẽn.

### 8.4 Distributed Tracing (Soi Rọi Nút Thắt Nguyên Tử - OpenTelemetry)
Khi log `slog` chỉ báo "Lỗi Xử lý chậm", ta không biết 1 request tốn 3s là do Postgres hay do Redis.
- **Quy tắc**: Bắt buộc gắn **OpenTelemetry (OTel)** Tracing vào mọi tầng (HTTP Adapter -> UseCase -> Postgres Store -> Redis Store).
- **Cơ chế**: Khi request chạy qua các hàm, Trace Span sẽ vẽ ra chính xác trên UI Sentry/Jaeger: "Token Auth mất 10ms, Query DB mất 120ms, Call Zalo mất 2.8s". Cho phép Team dev bắt trúng thủ phạm thắt nút của độ trễ.

### 8.5 Quản Trị Bảo Mật Môi Trường (Secrets Management)
Ngăn chặn tận gốc việc lộ Token vào mã nguồn (Mã OTP, Zalo Key, Stripe Secret).
- **Tuyệt đối Cấm**: Cấm hardcode Key, cấm commit `.env` chứa mật khẩu lên Github.
- **Nguyên Tắc KMS**: Mật khẩu Database, Secret JWT phải được Inject thẳng từ RAM (Môi trường máy chủ) thông qua Kubernetes Secrets, Doppler, Vault, hoặc Render Environment Variables. Code chỉ đọc qua `os.Getenv()`.
