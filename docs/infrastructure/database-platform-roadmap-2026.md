# Database Platform Roadmap (2026)

## Mục tiêu

- Dùng PostgreSQL mới nhất năm 2026 cho toàn bộ dữ liệu nghiệp vụ.
- Cho phép chạy linh hoạt theo 3 mode:
  - Self-host (chi phí thấp, toàn quyền vận hành).
  - Neon (serverless Postgres, phù hợp preview/branch environment).
  - Supabase (managed Postgres + hệ sinh thái auth/storage/realtime).
- Giữ nguyên contract backend hiện tại để không khóa chặt vào 1 nhà cung cấp.

## Baseline kỹ thuật đề xuất

- PostgreSQL baseline: **18.x** (đang là major line mới nhất trong 2026).
- Engine runtime backend: Go 1.26.
- Driver: `pgx/v5`.
- Migration strategy: SQL migration versioned trong `backend/migrations`.
- Data access: `DataStore` interface + `PostgresStore` + `CachedStore`.

## Kiến trúc hybrid (khuyến nghị)

1. Production chính:
- Dùng 1 cụm Postgres self-host (hoặc managed VM) làm nguồn dữ liệu chính.
- Bật backup WAL + PITR.

2. Preview/staging:
- Dùng Neon cho môi trường branch preview để giảm chi phí test tính năng.

3. Dịch vụ bổ trợ:
- Supabase có thể dùng selective:
  - Auth bên ngoài (nếu cần B2C/SSO nhanh),
  - Storage (upload file),
  - Realtime channel cho module cần broadcast cấp cao.

4. Ứng dụng:
- Backend chỉ đọc `VCT_POSTGRES_URL` + `VCT_POSTGRES_PROVIDER`.
- Frontend chỉ dùng `EntityRepository` + `ApiAdapter`, không phụ thuộc provider.

## Lộ trình triển khai

### Phase 1: Production-ready core

- Hoàn thiện schema chính thức (teams, athletes, registration, results, schedule, arenas, referees).
- Seed dữ liệu mẫu theo tournament code.
- Bật `VCT_STORAGE_DRIVER=postgres`.
- Thiết lập backup hằng ngày + restore rehearsal.

### Phase 2: Multi-provider rollout

- Tách biến môi trường theo provider profile:
  - `selfhost`, `neon`, `supabase`.
- Tạo pipeline deploy:
  - dev/staging dùng Neon,
  - production dùng self-host hoặc managed Postgres.
- Đồng bộ observability (query latency, pool saturation, lock waits).

### Phase 3: Scale & resilience

- Thêm read-replica cho báo cáo nặng.
- Chuẩn hóa connection pooling (PgBouncer hoặc pool ngoài).
- Partition/log retention theo mùa giải.
- Tối ưu index theo truy vấn thực tế.

## So sánh lựa chọn nền tảng

### Self-host PostgreSQL

- Ưu điểm:
  - Chi phí tối ưu ở tải lớn.
  - Toàn quyền cấu hình, extension, backup.
- Nhược điểm:
  - Tự vận hành backup, HA, security patching.

### Neon

- Ưu điểm:
  - Serverless workflow, phù hợp preview theo nhánh.
  - Tạo môi trường test nhanh theo CI/CD.
- Nhược điểm:
  - Phụ thuộc giới hạn plan theo compute/storage.
  - Chi phí tăng theo workload liên tục.

### Supabase

- Ưu điểm:
  - Postgres managed + auth + storage + realtime.
  - Tốc độ triển khai feature nhanh cho team nhỏ.
- Nhược điểm:
  - Dễ phụ thuộc hệ sinh thái nếu dùng sâu nhiều dịch vụ.
  - Cần kiểm soát chi phí khi tăng user/storage.

## Chiến lược chi phí (thực dụng)

- Bắt đầu:
  - Dev cá nhân: local self-host.
  - Staging/preview: Neon free tier.
  - Dự án nhỏ: Supabase free tier.
- Khi tăng tải:
  - Giữ production chính trên self-host hoặc managed Postgres cố định.
  - Chỉ giữ Neon/Supabase cho staging hoặc module phù hợp.
- Tránh lock-in:
  - Mọi business logic đi qua backend Go.
  - Không để frontend gọi trực tiếp provider-specific SQL/API.

## Quy ước môi trường

- `VCT_STORAGE_DRIVER=postgres`
- `VCT_POSTGRES_URL=<provider connection string>`
- `VCT_POSTGRES_PROVIDER=selfhost|neon|supabase`
- `VCT_DB_AUTO_MIGRATE=true|false`
- `VCT_CACHE_TTL=30s` và `VCT_CACHE_MAX_ENTRIES=2000` (cache API layer)

## Nguồn tham khảo chính thức

- PostgreSQL release notes: https://www.postgresql.org/docs/release/
- Neon docs: https://neon.tech/docs/introduction
- Neon pricing: https://neon.tech/pricing
- Supabase pricing: https://supabase.com/pricing
- Supabase docs: https://supabase.com/docs
