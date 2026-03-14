# Đề Xuất Xây Dựng Bộ Dữ Liệu Mặc Định — VCT Platform

## Tổng Quan

Phân tích hiện trạng seed data của VCT Platform và đề xuất mở rộng bộ dữ liệu mặc định để hệ thống sẵn sàng **demo, dev, và triển khai thực tế**.

---

## Hiện Trạng Dữ Liệu Đã Có

| # | Loại dữ liệu | File | Mức độ |
|---|---|---|---|
| 1 | Tournaments, Teams, Athletes (60 VĐV) | `seed.go`, `0002_seed_relational_core.sql` | ✅ Đầy đủ |
| 2 | Content Categories (22 nội dung) | `seed.go` | ✅ Đầy đủ |
| 3 | Referees, Assignments (10 TT) | `seed.go`, `0002_seed_relational_core.sql` | ✅ Tốt |
| 4 | Combat Matches, Form Performances | `seed.go` | ✅ Tốt |
| 5 | 34 Tỉnh/TP (sau sáp nhập 2025) | `seed_federation.go`, `0040_federation_seed_data.sql` | ✅ Đầy đủ |
| 6 | Federation Units + Personnel | `seed_federation.go` | ✅ Tốt |
| 7 | Certifications, Discipline Cases | `seed_federation.go` | ⚠️ Ít (5 cert, 3 case) |
| 8 | Official Documents | `seed_federation.go` | ⚠️ Ít (5 docs) |
| 9 | Martial Schools + Techniques | `0003_seed_training_heritage.sql` | ✅ Tốt |
| 10 | International Partners, Events | `seed_federation.go` | ⚠️ Ít |

---

## 🔴 Nhóm 1: Dữ Liệu Hành Chính (Ưu tiên cao)

### 1.1. Bảng `administrative_divisions` — Đơn vị hành chính Việt Nam

> [!IMPORTANT]
> Đây là nền tảng cho tất cả tính năng địa lý: auto-fill địa chỉ, thống kê theo vùng, quản lý CLB/VĐV.

**Cấu trúc (theo NĐ sáp nhập 2025, có hiệu lực 07/2025):**

| Cấp | Số lượng | Ghi chú |
|---|---|---|
| Tỉnh/TP | 34 | 5 TPTW + 29 tỉnh |
| Đơn vị cấp dưới (huyện/xã gộp) | ~600 | Cấu trúc 2 cấp theo API mới |

**Nguồn dữ liệu:** API `provinces.open-api.vn/api/v2` (đã có tool `fetch_vietnam_divisions.go`)

**Lưu trữ:** File JSON tĩnh `data/vietnam_divisions.json` + bảng DB lookup

### 1.2. Bảng `system_configs` — Cấu hình hệ thống mặc định

```
- Đai/đẳng cấp (Đai trắng → Đai đen 9 đẳng)
- Đơn vị tiền tệ: VND
- Múi giờ: Asia/Ho_Chi_Minh (UTC+7)
- Ngôn ngữ mặc định: vi-VN
- Format ngày: DD/MM/YYYY
```

---

## 🟡 Nhóm 2: Dữ Liệu Nghiệp Vụ Võ Thuật (Đề xuất thêm)

### 2.1. Hệ thống Đai/Đẳng cấp (`belt_ranks`)

| STT | Tên | Mã | Màu | Thứ tự |
|---|---|---|---|---|
| 1 | Đai trắng | white | #FFFFFF | 1 |
| 2 | Đai vàng | yellow | #FFD700 | 2 |
| 3 | Đai xanh lá | green | #228B22 | 3 |
| 4 | Đai xanh dương | blue | #0066CC | 4 |
| 5 | Đai nâu | brown | #8B4513 | 5 |
| 6 | Đai đen sơ đẳng | black_1 | #000000 | 6 |
| 7 | Đai đen nhị đẳng | black_2 | #000000 | 7 |
| … | … đến Cửu đẳng | black_9 | #000000 | 14 |

### 2.2. Hạng cân chuẩn (`standard_weight_classes`)

Theo quy định Liên đoàn VCT:

**Nam:** 48, 52, 55, 60, 65, 70, 75, 80, 85, +85 kg
**Nữ:** 42, 45, 48, 52, 56, 60, 65, +65 kg

### 2.3. Nhóm lứa tuổi chuẩn (`standard_age_groups`)

| Tên | Tuổi min | Tuổi max |
|---|---|---|
| Thiếu nhi A | 8 | 10 |
| Thiếu nhi B | 11 | 13 |
| Thiếu niên | 14 | 16 |
| Thanh niên | 17 | 35 |
| Trung niên | 36 | 50 |
| Cao niên | 51+ | — |

### 2.4. Danh mục bài quyền chuẩn (`standard_forms`)

```
── Quyền tay không ──
  Ngọc Trản quyền, Lão Mai quyền, Hùng Kê quyền,
  Tứ hải quyền, Lão hổ thượng sơn quyền,
  Thần đồng quyền, Bát quái côn...

── Binh khí ──
  Roi (Thuận Truyền, Bình Định), Kiếm (Song kiếm, Đơn kiếm),
  Đao (Tứ linh đao, Song đao), Thương, Côn nhị khúc...

── Song luyện ──
  Song luyện tay không, Song luyện vũ khí,
  Đối luyện côn, Đối luyện kiếm...

── Đồng đội ──
  Đồng đội quyền nam/nữ/hỗn hợp
```

---

## 🟢 Nhóm 3: Dữ Liệu Tham Chiếu Nền Tảng (Đề xuất bổ sung)

### 3.1. Vai trò & Quyền (`roles_permissions`)

Seed dữ liệu RBAC đầy đủ cho các role:

```
system_admin, federation_admin, province_admin,
club_admin, referee, coach, athlete, parent, spectator
```

### 3.2. Notification Templates (`notification_templates`)

Template thông báo cho các sự kiện:

```
- Đăng ký thành công
- Duyệt đăng ký
- Lịch thi đấu
- Kết quả trận đấu
- Thông báo cân kỹ thuật
- Khiếu nại/kỷ luật
```

### 3.3. Email Templates (`email_templates`)

```
- Xác nhận tài khoản
- Reset mật khẩu
- Thông báo giải đấu
- Mời tham gia đoàn
- Cấp chứng chỉ
```

### 3.4. Danh mục loại hình vi phạm (`violation_types`)

```
- Khai gian cân nặng
- Hành vi phi thể thao
- Sử dụng doping
- Vi phạm quy chế thi đấu
- Vi phạm hành chính
- Xúc phạm trọng tài
```

---

## 🔵 Nhóm 4: Mở Rộng Dữ Liệu Demo (Nice to have)

### 4.1. Câu lạc bộ mẫu (`sample_clubs`)

Thêm 20-30 CLB mẫu thuộc các tỉnh/TP lớn:
- CLB Bình Định Quyền (Bình Định)
- CLB Lý Gia Quyền (TP.HCM)
- CLB Võ Thăng Long (Hà Nội)
- ...

### 4.2. Lịch sử giải đấu (`tournament_history`)

2-3 giải đấu đã kết thúc với kết quả đầy đủ, để demo:
- Biểu đồ thống kê
- Bảng xếp hạng
- Medalboard

### 4.3. Training Logs mẫu

Dữ liệu luyện tập mẫu để demo module Training.

---

## Kiến Trúc Lưu Trữ Đề Xuất

```
backend/
├── data/
│   ├── vietnam_divisions.json      ← Hành chính VN (từ API)
│   ├── belt_ranks.json             ← Hệ thống đai/đẳng
│   ├── weight_classes.json         ← Hạng cân chuẩn
│   ├── age_groups.json             ← Nhóm lứa tuổi
│   ├── standard_forms.json         ← Bài quyền chuẩn
│   └── notification_templates.json ← Template thông báo
├── sql/seeds/
│   ├── 0001_seed_entity_records.sql
│   ├── 0002_seed_relational_core.sql
│   ├── 0003_seed_training_heritage.sql
│   ├── 0004_seed_administrative.sql    ← [NEW] Hành chính
│   ├── 0005_seed_reference_data.sql    ← [NEW] Dữ liệu tham chiếu
│   └── 0006_seed_demo_expanded.sql     ← [NEW] Mở rộng demo
```

---

## Thứ Tự Ưu Tiên Triển Khai

| Pha | Nội dung | Ước lượng |
|---|---|---|
| **Pha 1** | Hành chính VN (divisions) + Cấu hình hệ thống | 1 ngày |
| **Pha 2** | Đai/đẳng + Hạng cân + Lứa tuổi + Bài quyền chuẩn | 1 ngày |
| **Pha 3** | RBAC permissions + Notification/Email templates | 1-2 ngày |
| **Pha 4** | CLB mẫu + Lịch sử giải đấu mở rộng | 2-3 ngày |

---

## Câu Hỏi Để Xác Nhận

1. **Hành chính:** Bạn muốn dùng cấu trúc 2 cấp mới (Tỉnh → Đơn vị) hay giữ 3 cấp cũ (Tỉnh → Huyện → Xã)?
2. **Bài quyền:** Bạn có danh sách các bài quyền chính thức theo quy định LĐ VCT không? Hay tôi tổng hợp từ nguồn mở?
3. **Thứ tự ưu tiên:** Bạn muốn bắt đầu từ Pha nào?
4. **Số lượng demo data:** Muốn giữ mức hiện tại (~60 VĐV, 20 đoàn) hay tăng lên nhiều hơn?
