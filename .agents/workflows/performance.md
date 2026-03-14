---
description: Workflow performance profiling và optimization cho VCT Platform
---

# /performance — Performance Optimization

> Sử dụng khi cần tối ưu hiệu suất backend, frontend, hoặc database.
> Đọc skill **vct-cto** (`/.agent/skills/vct-cto/SKILL.md`) phần Performance Standards.

// turbo-all

---

## Bước 1: Xác Định Bottleneck

### Triệu chứng:
| Vấn đề | Kiểm tra | Tool |
|--------|----------|------|
| API response chậm | Response time > 200ms | Backend logs, timing |
| Page load chậm | FCP > 1.5s, LCP > 2.5s | Browser DevTools |
| Database chậm | Query > 50ms | `EXPLAIN ANALYZE` |
| UI lag/stutter | Jank, frozen UI | React DevTools |
| Bundle quá lớn | Initial > 200KB gz | `npm run build` + analyze |

### Performance SLOs (targets):
| Metric | Target |
|--------|--------|
| API p95 response | < 200ms |
| API p99 response | < 500ms |
| Database query | < 50ms |
| WebSocket latency | < 100ms |
| FCP (First Contentful Paint) | < 1.5s |
| LCP (Largest Contentful Paint) | < 2.5s |
| TTI (Time to Interactive) | < 3.5s |
| CLS (Cumulative Layout Shift) | < 0.1 |
| Initial bundle | < 200KB gzipped |

---

## Bước 2: Backend Optimization

### 2.1 Database Query Optimization
```sql
-- Analyze slow queries
EXPLAIN ANALYZE SELECT ... FROM ... WHERE ...;

-- Check missing indexes
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public';
```

### Checklist:
- [ ] Indexes trên foreign keys
- [ ] Indexes trên frequently filtered columns (status, type, date)
- [ ] Composite indexes cho multi-column queries
- [ ] Không có N+1 query problems
- [ ] Pagination cho list endpoints (limit/offset)
- [ ] `SELECT` chỉ những columns cần thiết (không `SELECT *`)

### 2.2 Caching
```go
// Sử dụng CachedStore cho read-heavy entities
// TTL default: 30s
store := cache.NewCachedStore(pgStore, 30*time.Second)
```

- [ ] Read-heavy entities dùng CachedStore
- [ ] Cache invalidation khi write
- [ ] Redis cho session/shared cache

### 2.3 Connection Pooling
```env
VCT_PG_POOL_MAX_CONNS=25
VCT_PG_POOL_MIN_CONNS=5
```

- [ ] Pool size phù hợp với workload
- [ ] Connection reuse (không tạo mới mỗi request)

---

## Bước 3: Frontend Optimization

### 3.1 Bundle Size
```bash
# Analyze bundle
npm run build
# Check .next/analyze/ hoặc output size
```

- [ ] Code splitting cho routes
- [ ] Lazy loading cho non-critical pages
- [ ] Dynamic imports cho heavy components
- [ ] Tree shaking hoạt động (no barrel file re-exports toàn bộ)

### 3.2 Rendering Performance
- [ ] `useMemo` cho expensive computations
- [ ] `useCallback` cho function props
- [ ] Avoid unnecessary re-renders
- [ ] Virtualized lists cho danh sách dài (> 100 items)
- [ ] Images optimized (`next/image`)

### 3.3 Loading UX
- [ ] Skeleton loading cho data fetch (VCT_PageSkeleton)
- [ ] Optimistic updates cho user actions
- [ ] Debounce cho search inputs
- [ ] Stale-while-revalidate pattern

---

## Bước 4: Đo Lường

### Backend Timing
```go
// Thêm timing log cho critical endpoints
start := time.Now()
result, err := service.DoWork(ctx)
log.Printf("DoWork took %v", time.Since(start))
```

### Frontend Metrics
```
Sử dụng Browser DevTools:
- Performance tab → Record → Analyze
- Network tab → Check response times
- Lighthouse → Performance audit
```

### Database Query Times
```sql
-- Enable query logging (development only)
-- Check pg_stat_statements for slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 20;
```

---

## Bước 5: Apply & Verify

### Apply optimizations:
1. Thực hiện thay đổi (index, cache, code optimization)
2. Measure TRƯỚC và SAU
3. Document improvement

### Build check:
```bash
cd backend && go build ./...
npm run typecheck
```

### Verify improvements:
```markdown
## Performance Improvement Report

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| API /endpoint p95 | 450ms | 120ms | 73% faster |
| Query time | 80ms | 15ms | 81% faster |
| Bundle size | 350KB | 180KB | 49% smaller |
| LCP | 3.2s | 1.8s | 44% faster |
```

### Checklist:
- [ ] Bottleneck identified và fixed
- [ ] Performance metrics improved
- [ ] No regression in functionality
- [ ] Build passes
- [ ] Measurements documented
