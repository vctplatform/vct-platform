---
name: vct-troubleshooting
description: Troubleshooting Expert & Anti-Pattern Catcher. Activate when debugging difficult backend or frontend issues, optimizing code for stability, avoiding common pitfalls, or reviewing code for potential bugs.
---

# VCT Platform Troubleshooting & Anti-Patterns

> **When to activate**: Debugging difficult issues, analyzing root causes, reviewing code for common mistakes (anti-patterns), or establishing defensive programming practices.

---


> [!IMPORTANT]
> **SUPREME ARCHITECTURE DIRECTIVE**: You are strictly bound by the 19 architecture pillars documented in `docs/architecture/`. As a VCT AI Agent, your absolute highest priority is 100% compliance with these rules. You MUST NOT generate code, propose designs, or execute workflows that violate these foundational rules. They are unchangeable and strictly enforced.

## 1. Go Backend Anti-Patterns & Pitfalls

### 1.1 Concurrency & Maps
❌ **Anti-pattern**: Concurrent writes to a `map[string]any` without a mutex. Will cause a fatal panic `fatal error: concurrent map writes`.
✅ **Fix**: Use `sync.RWMutex` or `sync.Map`.
```go
type SafeCache struct {
    mu sync.RWMutex
    data map[string]any
}
```

### 1.2 Nil Pointer Dereference
❌ **Anti-pattern**: Accessing a struct field or slice index without checking for nil or length.
✅ **Fix**: Always check for nil/length.
```go
if len(items) == 0 {
    return nil, fmt.Errorf("no items found")
}
```

### 1.3 Ignoring Errors (Swallowing)
❌ **Anti-pattern**: `_, _ = doSomething()` or `if err != nil { return nil }` without logging.
✅ **Fix**: Always handle or wrap errors using `fmt.Errorf("doSomething: %w", err)` and let the caller/handler log it.

### 1.4 Connection Leaks (Database/HTTP)
❌ **Anti-pattern**: Forgetting to defer `rows.Close()` or `resp.Body.Close()`.
✅ **Fix**: Always defer close immediately after error checking.
```go
resp, err := http.Get(url)
if err != nil { return err }
defer resp.Body.Close()
```

---

## 2. Next.js / React Frontend Anti-Patterns

### 2.1 Missing Dependency Array in useEffect
❌ **Anti-pattern**: `useEffect(() => { doSomething() })` runs on *every* render, potentially causing infinite loops if it updates state.
✅ **Fix**: Always provide a dependency array `[]` or `[deps]`.

### 2.2 Unnecessary Re-renders (Object/Array Literals in Props)
❌ **Anti-pattern**: `<Component style={{ marginTop: 10 }} />` creates a new object every render, causing `Component` to re-render.
✅ **Fix**: Extract static objects outside the component or use `useMemo`.

### 2.3 Stale Closures
❌ **Anti-pattern**: Reading stale state inside a `setTimeout` or event listener.
✅ **Fix**: Use the updater function pattern `setState(prev => prev + 1)` or `useRef` for mutable values that shouldn't trigger re-renders.

### 2.4 Unhandled Promise Rejections
❌ **Anti-pattern**: Calling an async function without `.catch()` or `try/catch`. This causes silent failures.
✅ **Fix**: Wrap API calls in `try/catch` or use structured data fetching hooks.

---

## 3. Database & SQL Pitfalls (PostgreSQL/Neon)

### 3.1 N+1 Query Problem
❌ **Anti-pattern**: Querying a list of items, then looping through them to query their relations individually in a `for` loop.
✅ **Fix**: Use `JOIN` or fetch relations in a single `IN (...)` query.

### 3.2 Missing Indexes on Foreign Keys
❌ **Anti-pattern**: Creating a relation but forgetting to index the foreign key column. This causes full table scans on cascading deletes and joins.
✅ **Fix**: Always add `CREATE INDEX idx_table_fk ON table(fk_id);`.

### 3.3 SELECT * in Production
❌ **Anti-pattern**: `SELECT * FROM users` pulls unnecessary fields (like password hashes) and wastes memory/bandwidth.
✅ **Fix**: Be explicit: `SELECT id, name, email FROM users`.

---

## 4. Troubleshooting Playbook

### 4.1 "Works on my machine, fails in production"
1. **Check Environment Variables**: Are all `VCT_*` env vars set correctly in production?
2. **Database Migrations**: Did you run migrations on production?
3. **CORS**: Is the production URL added to `VCT_CORS_ORIGINS`?
4. **Data Shape**: Does production data have edge cases (e.g., missing fields, nulls) your local DB doesn't?

### 4.2 Memory Leaks
- **Frontend**: Check for uncleared intervals (`setInterval` without `clearInterval`), event listeners not removed on unmount.
- **Backend**: Check for long-lived goroutines not exiting, or caching structs indefinitely without TTL (`vct-caching`).

### 4.3 High CPU / Blocked Event Loop
- **Backend**: Using heavy regex repeatedly instead of compiling once `regexp.MustCompile()`.
- **Frontend**: Heavy calculations on the main thread. Move to Web Workers or use `useMemo`.

---

## 5. Defensive Programming Mindset

1. **Assume the payload is malicious/malformed**: Validate everything via the unified `validation` functions.
2. **Assume the network will fail**: Set timeouts on all external contexts `context.WithTimeout(ctx, 5*time.Second)`.
3. **Assume the database might be slow**: Implement circuit breakers and caching (`CachedStore`).

---

## 6. Mobile (React Native / Expo) Pitfalls

### 6.1 FlatList Performance Killer
❌ **Anti-pattern**: Sử dụng inline arrow functions cho `renderItem` hoặc thiếu `keyExtractor` trong FlatList, chứa dữ liệu lớn nhưng không set `initialNumToRender` / `maxToRenderPerBatch`.
✅ **Fix**: Bọc `renderItem` bằng `useCallback`, cung cấp `keyExtractor` bằng string ID, và dùng `memo` cho item component.

### 6.2 Navigation Data Overload
❌ **Anti-pattern**: Pass toàn bộ object bự (ví dụ cả 1 tournament) thông qua Navigation router params. Lẽ ra chỉ nên pass `id` và fetch/cache dữ liệu sau.
✅ **Fix**: Dùng `router.push('/tournaments/[id]')` và dùng React Query/SWR hoặc Zustand để share state data.

---

## 7. Clean Architecture Violations (Backend)

### 7.1 Leaking HTTP into Domain
❌ **Anti-pattern**: Truyền `*http.Request` hoặc `w http.ResponseWriter` vào tầng Service hoặc Repository.
✅ **Fix**: Dữ liệu từ Request (param, header, body) phải được parse thành **DTO** ngay tại tầng `Handler`, rồi truyền DTO đó xuống `Service`. Service chỉ được nhận thuần túy data struct và trả về struct/error thuần của Go.

### 7.2 Not Returning DTOs
❌ **Anti-pattern**: Trả thẳng Object của Database (GORM/SQLx struct có chứa password hash hoặc deleted_at) ra ngoài JSON API.
✅ **Fix**: Luôn map DB Entity thành API Response DTO trước khi `json.Marshal`. 

---

## 8. Security & Authorization Pitfalls

### 8.1 IDOR (Insecure Direct Object Reference)
❌ **Anti-pattern**: `UPDATE users SET name = $1 WHERE id = $2` (mà không thèm check user đang login có phải là chủ sở hữu cái `$2` đó không, hoặc có phải Admin của hệ thống không).
✅ **Fix**: Queriupdate luôn phải kẹp điều kiện liên quan tới người sở hữu: `WHERE id = $2 AND tenant_id = $3`.

### 8.2 Client-side Secret Leak
❌ **Anti-pattern**: Để lộ API Key (Stripe, Resend...) ở các file Frontend mà không có prefix `NEXT_PUBLIC_` (gây lỗi lúc chạy) HOẶC lại cho vào `NEXT_PUBLIC_` những key bí mật (sẽ bị lộ ra browser source code).
✅ **Fix**: Chỉ Public CÁC KEY public (Supabase Anon Key). Tuyệt đối giấu Service Role Key, JWT Secret ở `.env` backend.

---

## 9. Senior-level Pitfalls: Database Migrations (Zero-Downtime)

### 9.1 Table Lock khi Add Column DEFAULT
❌ **Anti-pattern**: `ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT true;`. Lệnh này trên Postgres cũ sẽ lock và rewrite toàn bộ bảng users, gây sập server nếu bảng to.
✅ **Fix**: Chia làm 3 bước: Thêm cột `is_active BOOLEAN` -> Update data cũ từng batch -> Thêm giá trị DEFAULT cho cột mới.

---

## 10. Senior-level Pitfalls: Message Queues & Background Workers (NATS)

### 10.1 "Poison Pill" (Vòng lặp lỗi vô tận)
❌ **Anti-pattern**: Worker lấy message ra xử lý, gặp lỗi (do data rác) nên sinh Panic hoặc Return Error nhưng không thèm `Ack()` hay `Nak()`. Kết quả là Message lại tiếp tục nhảy vào Queue tạo thành vòng lặp crash hệ thống.
✅ **Fix**: Cần có `try/catch/recover` chặt chẽ trong handler, và nếu parse data sai format thì phải **Ack()** (coi như đã xử lý) hoặc đưa vào Dead Letter Queue, chứ không để nó kẹt mãi trong stream.

---

## 11. Senior-level Pitfalls: Frontend State Cache

### 11.1 Mutation without Invalidation (Data bị thiu - Stale state)
❌ **Anti-pattern**: Gọi API Update/Delete thành công, nhưng giao diện **không đổi**. Phải F5 web mới thấy. Lí do là SWR/React Query/Zustand đang hiển thị bản Cache.
✅ **Fix**: Ngay sau khi API trả về 200 OK, phải gọi `mutate('/api/users')` hoặc update trạng thái cục bộ để đồng bộ lại Cache.

---

## 12. Senior-level Pitfalls: Testing & CI/CD

### 12.1 Flaky Tests do Sleep
❌ **Anti-pattern**: Dùng `time.Sleep(2 * time.Second)` trong Unit Test Go hoặc `page.waitForTimeout(2000)` trong Playwright để chờ một state. Test lúc pass lúc fail (Flaky).
✅ **Fix**: Go: dùng channel hoặc `assert.Eventually`. Playwright: dùng `page.waitForSelector` hoặc `expect(locator).toBeVisible()` (tự động retry và chờ DOM).

---

## 13. Senior-level Pitfalls: Go Testing & Mocking (TDD)

### 13.1 Mocking Database framework thay vì Interface
❌ **Anti-pattern**: Cố gắng dùng `sqlmock` hoặc các thư viện để giả lập (mock) thư viện `pgx` hoặc `gorm`. Test trở nên quá dính chặt vào implementation chi tiết của SQL query.
✅ **Fix**: Clean Architecture: Giả lập (Mock) ở ranh giới của Domain. Tức là tạo Test Double (Mock/Fake) cho `Repository Interface`, chứ KHÔNG mock DB driver. Test logic service không cần biết câu SQL viết ra sao.

### 13.2 Testing Implementation thay vì Behavior (Fragile Tests)
❌ **Anti-pattern**: Viết test luôn `AssertCalled(t, "FindUser", mock.Anything)`, soi xét từng hàm nội bộ bị gọi mấy lần. Khi đổi cách code nội bộ (dù kết quả đúng) test vẫn tèo.
✅ **Fix**: Dùng "Fake Object" có state bộ nhớ thu nhỏ thay vì "Strict Mock" kiểm tra số lần gọi hàm. Chỉ Assert (kiểm chứng) **kết quả trả về** hoặc **side-effect cuối cùng**.

### 13.3 Quên Table-Driven Tests & Parallel Race Conditions
❌ **Anti-pattern**: Copy-paste chục khối `t.Run()` giống hệt nhau hoặc bật `t.Parallel()` nhưng lại dùng chung Database test dùng chung state.
✅ **Fix**: Sử dụng `[]struct{ name, input, expected }` để loop qua các test cases. Bật `t.Parallel()` nhưng mỗi test phải tự sinh ID độc lập hoặc dùng TestContainers để cô lập DB.
