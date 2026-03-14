---
description: Workflow tạo API endpoint backend mới cho VCT Platform
---

# /add-api — Tạo API Endpoint Backend

> Sử dụng khi cần tạo endpoint API mới trong Go backend.

// turbo-all

---

## Bước 1: Thiết Kế API Contract

1. Xác định endpoint:
   - Method: `GET`, `POST`, `PUT`, `DELETE`
   - Path: `/api/v1/{module}/{resource}`
   - Auth required? Role nào có quyền?
2. Thiết kế Request/Response:
   ```
   Request:
     - URL params: /api/v1/module/{id}
     - Query params: ?page=1&limit=20
     - Body (JSON): { field1, field2, ... }
   
   Response:
     - 200: { data: {...} }
     - 201: { data: {...} } (created)
     - 400: { error: "validation message" }
     - 401: { error: "unauthorized" }
     - 404: { error: "not found" }
     - 500: { error: "internal error" }
   ```
3. Kiểm tra endpoint có conflicts với routes đã có không

---

## Bước 2: Domain Model & Service

### 2.1 Model (`backend/internal/domain/{module}/model.go`)
```go
type Entity struct {
    ID        string    `json:"id"`
    Name      string    `json:"name"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}
```

### 2.2 Repository Interface (`backend/internal/domain/{module}/repository.go`)
```go
type Repository interface {
    Create(ctx context.Context, entity *Entity) error
    GetByID(ctx context.Context, id string) (*Entity, error)
    List(ctx context.Context, limit, offset int) ([]Entity, error)
    Update(ctx context.Context, entity *Entity) error
    Delete(ctx context.Context, id string) error
}
```

### 2.3 Service (`backend/internal/domain/{module}/service.go`)
```go
type Service struct {
    repo Repository
}

func NewService(repo Repository) *Service {
    return &Service{repo: repo}
}
```
- **Business logic ở đây**, KHÔNG ở handler
- Validate input ở service layer
- Wrap errors: `fmt.Errorf("service.Create: %w", err)`

---

## Bước 3: Repository Adapter

File: `backend/internal/adapter/{module}_pg_repos.go`

Quy tắc:
- Dùng `pgx/v5` trực tiếp — **KHÔNG dùng ORM**
- Parameterized queries only (`$1`, `$2`, ...)
- **TUYỆT ĐỐI KHÔNG** string concatenation cho SQL
- Wrap errors với context
- Sử dụng `pgx.Row.Scan()` để map results

```go
func (r *PgRepo) GetByID(ctx context.Context, id string) (*domain.Entity, error) {
    var e domain.Entity
    err := r.pool.QueryRow(ctx,
        `SELECT id, name, created_at, updated_at FROM entities WHERE id = $1`, id,
    ).Scan(&e.ID, &e.Name, &e.CreatedAt, &e.UpdatedAt)
    if err != nil {
        return nil, fmt.Errorf("pg.GetByID: %w", err)
    }
    return &e, nil
}
```

---

## Bước 4: HTTP Handler

File: `backend/internal/httpapi/{module}_handler.go`

Quy tắc:
- Handler chỉ: **parse request → call service → write response**
- KHÔNG đặt business logic trong handler
- KHÔNG access database trực tiếp từ handler
- Input validation trước khi gọi service

```go
func (h *Handler) HandleCreate(w http.ResponseWriter, r *http.Request) {
    var req CreateRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "invalid request body", http.StatusBadRequest)
        return
    }
    // Validate
    if req.Name == "" {
        http.Error(w, "name is required", http.StatusBadRequest)
        return
    }
    // Call service
    result, err := h.service.Create(r.Context(), &req)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
    // Response
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(result)
}
```

---

## Bước 5: Route Registration & Middleware

### 5.1 Đăng ký route
Trong `backend/internal/httpapi/server.go`, thêm route:
```go
mux.HandleFunc("GET /api/v1/{module}/", h.HandleList)
mux.HandleFunc("POST /api/v1/{module}/", h.HandleCreate)
mux.HandleFunc("GET /api/v1/{module}/{id}", h.HandleGet)
mux.HandleFunc("PUT /api/v1/{module}/{id}", h.HandleUpdate)
mux.HandleFunc("DELETE /api/v1/{module}/{id}", h.HandleDelete)
```

### 5.2 Middleware
- `authMiddleware` cho protected routes
- Rate limiting cho sensitive endpoints (auth: 5/min, API: 100/min)
- Body size limit (1MB default)

---

## Bước 6: Verify

```bash
# Build
cd backend && go build ./...

# Vet
cd backend && go vet ./...

# Test endpoint (nếu server đang chạy)
# curl -X GET http://localhost:18080/api/v1/{module}/
```

Checklist:
- [ ] `go build` thành công
- [ ] `go vet` không warning
- [ ] Endpoint trả đúng status code
- [ ] Auth middleware hoạt động
- [ ] Error responses có format chuẩn
- [ ] Shared types đồng bộ với Go structs
