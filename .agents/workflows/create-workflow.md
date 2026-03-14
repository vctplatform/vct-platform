---
description: Workflow tạo workflow mới khi phát hiện pattern lặp lại cần chuẩn hóa
---

# /create-workflow — Tạo Workflow Mới

> Sử dụng khi phát hiện một pattern công việc lặp đi lặp lại cần chuẩn hóa thành workflow.

// turbo-all

---

## Bước 1: Xác Định Nhu Cầu

### Khi nào cần workflow mới?
```
□ Có pattern công việc lặp lại ≥ 3 lần?
□ Pattern có ≥ 3 bước cần follow theo thứ tự?
□ Pattern dễ thiếu bước nếu không có checklist?
□ Không workflow hiện tại nào cover?
□ Nhiều conversations đã thực hiện pattern này?
```

### Kiểm tra trước khi tạo:
```
□ Kiểm tra 21 workflows hiện có — có workflow nào cover chưa?
□ Có thể mở rộng workflow hiện tại thay vì tạo mới?
  → Nếu CÓ: dùng /upgrade-workflow
□ Pattern có đủ cụ thể để chuẩn hóa?
  → Nếu KHÔNG: chờ thêm ít nhất 2 lần practice
```

---

## Bước 2: Thiết Kế Workflow

### 2.1 Xác định metadata
```
Slash command: /{name}
Description: [mô tả 1 câu khi nào dùng]
Category: Core Dev / Fix / Quality / Operations / Meta
Số bước: [ước lượng]
Skills tham chiếu: [list skills liên quan]
```

### 2.2 Phác thảo các bước
```markdown
1. [Bước chuẩn bị] — thu thập thông tin, xác định scope
2. [Bước phân tích] — đánh giá, lên plan
3. [Bước thực hiện] — code, config, implement
4. [Bước verify] — build, test, checklist
5. [Bước document] — log kết quả (nếu cần)
```

### 2.3 Pattern chuẩn cho mỗi bước:
| Phần | Mục đích |
|------|---------|
| Mô tả bước | WHY — tại sao cần bước này |
| Checklist / Commands | WHAT — cần làm gì cụ thể |
| Quy tắc ⚠️ | HOW — conventions phải follow |
| Examples | Ví dụ minh hoạ |

---

## Bước 3: Viết Workflow File

### File structure bắt buộc:
```markdown
---
description: [mô tả ngắn, chứa keywords trigger]
---

# /{name} — [Tiêu đề]

> [Mô tả khi nào sử dụng. 1-2 câu.]

// turbo-all

---

## Bước 1: [Tên bước]
[Nội dung]

---

## Bước N: Verify
[Checklist cuối]
```

### Quy tắc format:
- ✅ **YAML frontmatter** — `---` header với `description:`
- ✅ **`// turbo-all`** — cho phép auto-run commands
- ✅ **Heading levels** — `##` cho bước, `###` cho sub-sections
- ✅ **Checklists** — `- [ ]` cho verify items
- ✅ **Code blocks** — ` ```bash ` cho commands, ` ```markdown ` cho templates
- ✅ **Tables** — cho structured info (quy tắc, so sánh)
- ✅ **VCT-specific** — conventions, paths, naming đúng với project

### File location:
```
.agent/workflows/{name}.md
```

---

## Bước 4: Register & Cross-Reference

1. **Kiểm tra consistency** với workflows hiện có:
   - Không overlap quá nhiều
   - Không contradict workflows khác
   - Naming convention nhất quán

2. **Thêm cross-references** nếu workflow mới liên quan workflows khác:
   - "Xem thêm: `/related-workflow`"

---

## Bước 5: Verify

```bash
# Kiểm tra file tồn tại
ls .agent/workflows/{name}.md

# Kiểm tra frontmatter
head -5 .agent/workflows/{name}.md

# Kiểm tra tổng số workflows
ls .agent/workflows/*.md | wc -l
```

Checklist:
- [ ] File `.md` tồn tại trong `.agent/workflows/`
- [ ] YAML frontmatter valid (`description:`)
- [ ] `// turbo-all` annotation có
- [ ] Tất cả bước có numbering đúng
- [ ] Verify step ở cuối
- [ ] Code examples chính xác
- [ ] Skill references đúng
- [ ] Không overlap với workflows hiện có
- [ ] Thông báo user về workflow mới
