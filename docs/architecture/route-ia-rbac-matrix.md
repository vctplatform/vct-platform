# Route IA + RBAC Matrix (Admin/BTC)

## IA groups

- `trung_tam_dieu_hanh`: Trung tâm điều hành
- `chuan_bi_giai`: Chuẩn bị giải
- `dang_ky_kiem_tra`: Đăng ký & kiểm tra
- `dieu_hanh_thi_dau`: Điều hành thi đấu
- `ket_qua_tong_hop`: Kết quả & tổng hợp
- `he_thong`: Hệ thống

## Action vocabulary

- `view`: xem màn hình/dữ liệu
- `create`: tạo mới bản ghi
- `update`: cập nhật dữ liệu
- `delete`: xóa dữ liệu
- `approve`: duyệt dữ liệu hoặc bước nghiệp vụ
- `publish`: công bố dữ liệu chính thức
- `assign`: phân công nhân sự/tài nguyên
- `import`: nhập dữ liệu lô
- `export`: xuất dữ liệu/báo cáo
- `monitor`: giám sát realtime, tác nghiệp trực ca
- `manage`: quản trị hệ thống và phân quyền
- `lock`: khóa cấu hình hoặc đóng giai đoạn nghiệp vụ

## Admin/BTC matrix

| Route | Group | Admin | BTC |
| --- | --- | --- | --- |
| `/` | Trung tâm điều hành | `view monitor export` | `view monitor export` |
| `/giai-dau` | Chuẩn bị giải | `view create update approve publish lock` | `view update approve publish` |
| `/noi-dung` | Chuẩn bị giải | `view create update delete approve publish` | `view create update approve publish` |
| `/san-dau` | Chuẩn bị giải | `view create update delete assign approve monitor` | `view create update assign monitor` |
| `/referees` | Chuẩn bị giải | `view create update delete assign approve export` | `view create update assign approve` |
| `/teams` | Đăng ký & kiểm tra | `view create update delete approve import export` | `view create update approve import export` |
| `/athletes` | Đăng ký & kiểm tra | `view create update delete approve import export` | `view create update approve import export` |
| `/registration` | Đăng ký & kiểm tra | `view create update delete approve import export` | `view create update approve import export` |
| `/hop-chuyen-mon` | Điều hành thi đấu | `view create update approve publish` | `view create update approve publish` |
| `/boc-tham` | Điều hành thi đấu | `view create update approve publish` | `view create update approve publish` |
| `/weigh-in` | Điều hành thi đấu | `view create update approve monitor export` | `view create update approve monitor export` |
| `/schedule` | Điều hành thi đấu | `view create update delete approve publish export` | `view create update approve publish export` |
| `/referee-assignments` | Điều hành thi đấu | `view create update delete assign approve publish` | `view create update assign approve publish` |
| `/combat` | Điều hành thi đấu | `view create update approve monitor publish` | `view update approve monitor publish` |
| `/forms` | Điều hành thi đấu | `view create update approve monitor publish` | `view update approve monitor publish` |
| `/bracket` | Điều hành thi đấu | `view create update approve publish export` | `view update approve publish export` |
| `/results` | Kết quả & tổng hợp | `view create update delete approve publish export` | `view create update approve publish export` |
| `/medals` | Kết quả & tổng hợp | `view update approve publish export` | `view update approve publish export` |
| `/appeals` | Kết quả & tổng hợp | `view create update approve publish export` | `view create update approve publish export` |
| `/reports` | Kết quả & tổng hợp | `view export publish` | `view export publish` |
| `/users/[userId]` | Hệ thống | `view create update delete manage` | `-` |

## Refactor starting point

1. Dùng `canPerformRouteAction(path, role, action)` để khóa action theo nút hành động trong từng module.
2. Ưu tiên module bắt đầu: `teams`, `athletes`, `registration`, `schedule`, `results`.
3. Chuẩn hóa guard action-level trước khi bật adapter `api` cho từng module.
