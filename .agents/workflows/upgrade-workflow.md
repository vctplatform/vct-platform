---
description: Workflow nâng cấp workflow AI đã có dựa trên feedback và kinh nghiệm sử dụng
---

# /upgrade-workflow — Nâng Cấp Workflow Hiện Có

> Sử dụng khi phát hiện workflow hiện tại thiếu bước, sai quy trình, hoặc cần cải thiện hiệu quả.

// turbo-all

---

## Bước 1: Thu Thập Feedback

1. **Từ kinh nghiệm sử dụng**:
   - Workflow nào hay bị bỏ qua bước?
   - Bước nào không cần thiết / thừa?
   - Bước nào thiếu chi tiết, gây nhầm lẫn?
   - Có case nào workflow không cover?

2. **Từ kết quả thực tế**:
   - Bugs nào xảy ra vì workflow thiếu check?
   - Build failures nào lặp lại vì thiếu verify step?
   - Review feedback nào thường xuyên nhắc lại?

3. **Từ conventions mới**:
   - Project conventions có thay đổi không?
   - Có tools/commands mới cần thêm vào?
   - Có skills mới cần tham chiếu?

---

## Bước 2: Phân Tích Workflow Hiện Tại

Đọc workflow file cần upgrade và đánh giá:

| Tiêu chí | Đánh giá |
|----------|---------|
| **Completeness** | Có đủ bước không? Thiếu edge case nào? |
| **Accuracy** | Các bước có chính xác không? Commands đúng? |
| **Order** | Thứ tự bước có logic không? |
| **Clarity** | Mỗi bước có rõ ràng, dễ follow không? |
| **Efficiency** | Có bước nào thừa, có thể gộp/bỏ? |
| **Convention** | Có khớp với conventions hiện tại? |
| **Cross-refs** | Tham chiếu skills còn đúng? |

---

## Bước 3: Lên Plan Thay Đổi

```markdown
## Workflow Upgrade Plan

### Workflow: /[name]
### File: .agent/workflows/[name].md

### Issues Found:
1. [Issue 1] — [mô tả vấn đề]
2. [Issue 2] — [mô tả vấn đề]

### Proposed Changes:
| # | Type | Current | Changed To | Reason |
|---|------|---------|-----------|--------|
| 1 | Add step | — | Bước X: [mô tả] | [lý do thiếu] |
| 2 | Update step | Bước Y cũ | Bước Y mới | [lý do sửa] |
| 3 | Remove step | Bước Z | — | [lý do bỏ] |
| 4 | Reorder | A→B→C | B→A→C | [lý do đổi thứ tự] |
```

---

## Bước 4: Thực Hiện Upgrade

### Quy tắc:
- ✅ **Giữ format nhất quán** — YAML frontmatter, heading levels, checklist format
- ✅ **`// turbo-all`** annotation — giữ nguyên nếu đã có
- ✅ **Backward compatible** — không break quy trình đang hoạt động
- ✅ **Targeted edits** — sửa phần cụ thể, không rewrite toàn bộ
- ✅ **Test examples** — đảm bảo code examples và commands chính xác
- ✅ **Cross-references** — update references tới skills/workflows khác

### Workflow File Structure (giữ nhất quán):
```markdown
---
description: [mô tả ngắn]
---
# /[name] — [Tiêu đề]
> [Khi nào dùng]
// turbo-all
---
## Bước 1: [Tên bước]
...
## Bước N: Verify
...
```

---

## Bước 5: Verify

```bash
# Kiểm tra frontmatter
head -5 .agent/workflows/{name}.md

# Kiểm tra cross-references tới skills
grep -n "skill" .agent/workflows/{name}.md

# Kiểm tra commands đúng
grep -n "```bash" .agent/workflows/{name}.md
```

Checklist:
- [ ] YAML frontmatter valid
- [ ] Description rõ ràng
- [ ] Tất cả bước có numbering đúng
- [ ] Code examples chính xác
- [ ] Bash commands chạy được
- [ ] Skill references chính xác
- [ ] Không mâu thuẫn với workflows khác
