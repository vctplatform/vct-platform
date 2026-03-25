---
description: Checklists and processes to avoid frequent issues during development (Defensive Programming)
---

# /avoid-common-pitfalls — Phòng Ngừa Lỗi Thường Gặp

> Sử dụng như một quá trình tự kiểm tra (Self-Review Checklist) trước khi commit/Push code, hoặc khi đang thiết kế tính năng mới, nhằm tránh các lỗi kinh điển ở Backend và Frontend.

// turbo-all

---

## 1. Checkout Branch & Git Hygiene

- [ ] Lấy code mới nhất từ nhánh chính: `git pull origin main`
- [ ] Tên nhánh rõ ràng: `feature/XXX`, `bugfix/XXX`

---

## 2. Frontend Pre-Commit Checklist (Next.js/React)

### React Render & Performance
- [ ] **No Infinite Loops**: Các `useEffect` có dependency array chuẩn xác chưa? Có vô tình update state đang dùng làm dependency không?
- [ ] **Stable References**: Mảng `[]` hay object `{}` truyền vào prop đã được đưa ra ngoài component hoặc memoize (`useMemo`) chưa?
- [ ] **Stale Closures**: Nếu dùng `setInterval` hay `setTimeout` sử dụng state, hãy đảm bảo dùng callback form: `setState(prev => prev + 1)` hoặc dùng `useRef`.

### API & Data Fetching
- [ ] **Error Handling**: API calls có được bọc trong `try/catch` hoặc xử lý `.catch` chưa? Đã show Toast/Banner báo lỗi cho user chưa?
- [ ] **Loading States**: Trong lúc đợi API trả về, UI đã có skeleton/spinner chưa?
- [ ] **Types**: Dữ liệu từ API trả về đã đúng với Interface/Type định nghĩa trong TypeScript chưa?

---

## 3. Backend Pre-Commit Checklist (Go)

### Concurrency & Panics
- [ ] **Nil Pointers**: Đã check `nil` pointer trước khi truy cập properties của struct chưa?
- [ ] **Array/Slice Bounds**: Đã check độ dài slice/array trước khi truy cập index 0 chưa?
- [ ] **Map Concurrency**: Có đọc/ghi vào chung một `map` từ nhiều goroutine không? Nếu có, phải đổi sang `sync.RWMutex` hoặc `sync.Map`.

### Lỗi & Resource Leaks
- [ ] **Error Wrapping**: Có `return err` trần trụi không? Luôn wrap với context: `fmt.Errorf("doX: %w", err)`.
- [ ] **Response Body & Rows**: Đã gọi `defer req.Body.Close()` hay `defer rows.Close()` ngay sau khi check error chưa?
- [ ] **Standard HTTP Errors**: Có copy/paste cứng string báo lỗi không? Hãy dùng các hàm helper như `validationErr` từ `apierror.go`.

---

## 4. Database Pre-Commit Checklist (PostgreSQL)

### Performance & Schema
- [ ] **N+1 Queries**: GET list có loop qua từng item để gọi DB không? Chuyển sang dùng mệnh đề `IN (...)` hoặc `JOIN`.
- [ ] **Foreign Key Indexes**: Đã tạo index (chỉ mục) cho các cột Foreign Key chưa? Nếu không, khi xóa dữ liệu sẽ bị full table scan rất chậm.
- [ ] **`SELECT *`**: Không được dùng `SELECT *` trong production. Chỉ query các cột cần thiết để tiết kiệm memory.

---

## 5. Security & Architecture Checklist

### Security
- [ ] **IDOR (Direct Object Reference)**: Các query UPDATE/DELETE đã check điều kiện `user_id` hoặc `tenant_id` cẩn thận chưa? Đừng chỉ tin tưởng `id` truyền từ client.
- [ ] **Secret Leaks**: Các file frontend tuyệt đối không chứa Secret Keys. Các biến public phải có tiền tố `NEXT_PUBLIC_`.

### Clean Architecture
- [ ] **Layer Isolation**: Tầng Domain/Service có đang chứa object của framework (`*http.Request` hay `gin.Context`) không? Phải gỡ ra ngay.
- [ ] **DTO Mapping**: Đã map Entity sang Response DTO trước khi trả về API chưa (giấu đi password, soft-delete info)?

---

## 6. Mobile Checklist (React Native)

- [ ] **FlatList Perf**: Danh sách có `keyExtractor` và `initialNumToRender` chưa? Component item đã được `memo` chưa?
- [ ] **Navigation Params**: Có chuyển nguyên một object to làm param qua các màn hình không? Chỉ nên pass `id` và fetch lại/dùng cache để đọc data.

---

## 7. Advanced Checklist (Database, Workers, Caching, Tests)

- [ ] **Zero-Downtime Migrations**: Có đang `ALTER TABLE ADD COLUMN` kèm giá trị `DEFAULT` trên một bảng lớn không? Nếu có, hãy tách query để tránh khóa bảng (Table Rewrite Lock).
- [ ] **Message Queues (NATS)**: Worker có bọc `recover()` và chủ động `Ack()` khi bị lỗi format data để tránh "Poison Pill" (lặp lại vô tận) không?
- [ ] **Frontend State Mutation**: Khi Update/Delete dữ liệu thành công qua API, giao diện có gọi `mutate` (SWR/React Query) để rũ bỏ Cache cũ (Stale State) chưa?
- [ ] **Testing & Mocking**: Có lạm dụng mock Database Framework (`sqlmock`) thay vì tạo Test Double cho Interface chuẩn không? Có viết test theo dạng Table-Driven Tests (`[]struct`) để tối ưu và tránh lặp code không?
- [ ] **Flaky Tests**: Test có dùng `time.Sleep` không? Hãy chuyển sang cơ chế Retry/Polling (ví dụ `waitForSelector` trong Playwright hoặc `assert.Eventually` trong Go) để đảm bảo độ ổn định CI/CD.

---

## 8. Cuối Cùng (The Golden Rule)

**"Code chưa test là code lỗi."**
- Chạy thử backend: `go build ./...` và `go vet ./...`
- Chạy thử frontend: `npm run typecheck`
- **Tự chạy luồng nghiệp vụ trên UI (Happy path + Sad path)** trước khi kết thúc công việc.

> Đọc thêm kỹ năng: `vct-troubleshooting`, `vct-cto`, `vct-error-handling`.
