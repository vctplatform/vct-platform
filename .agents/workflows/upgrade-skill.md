---
description: Workflow nâng cấp skill AI đã có dựa trên bài học và technology updates
---

# /upgrade-skill — Nâng Cấp Skill Hiện Có

> Sử dụng khi cần cập nhật một skill AI đã có với kiến thức mới, patterns mới, hoặc sửa lỗi trong skill.
> Đọc skill **vct-skill-evolver** (`/.agent/skills/vct-skill-evolver/SKILL.md`) trước khi bắt đầu.

// turbo-all

---

## Bước 1: Đánh Giá Skill Hiện Tại

1. Đọc toàn bộ SKILL.md hiện tại cần upgrade
2. Phân tích:
   - [ ] Có thông tin nào **outdated** không? (version cũ, API deprecated)
   - [ ] Có **patterns mới** nào tốt hơn không?
   - [ ] Có **bài học** từ các conversation gần đây cần bổ sung không?
   - [ ] Có **thiếu sót** nào đã phát hiện khi sử dụng skill?
   - [ ] Cross-references tới skills khác còn chính xác không?

### Trigger Upgrade:
| Trigger | Ví dụ | Ưu tiên |
|---------|------|---------|
| Technology update | Go 1.27 released | 🟠 High |
| Bug found in skill | Sai convention, sai pattern | 🔴 Critical |
| Lesson learned | Cách tốt hơn phát hiện khi code | 🟡 Medium |
| New best practice | Industry standard thay đổi | 🟡 Medium |
| Missing content | Thiếu hướng dẫn cho case phổ biến | 🟡 Medium |

---

## Bước 2: Nghiên Cứu Updates

1. **Framework/Library updates**: 
   - Kiểm tra changelog/release notes
   - Tìm migration guides
   ```bash
   # Kiểm tra Go version
   go version
   
   # Kiểm tra npm packages
   npm outdated
   ```

2. **Project-specific lessons**:
   - Review conversation history gần đây
   - Xem bugs/issues nào liên quan tới skill
   - Patterns nào đã work well / không tốt

3. **Industry best practices**:
   - Tìm kiếm web cho "[technology] best practices 2026"
   - Xem guide chính thức (go.dev, react.dev, nextjs.org)

---

## Bước 3: Lên Plan Upgrade

```markdown
## Skill Upgrade Plan

### Skill: {skill-name}  
### Reason: [Tại sao cần upgrade]

### Changes:
| # | Section | Current | Updated | Reason |
|---|---------|---------|---------|--------|
| 1 | [section] | [hiện tại] | [mới] | [lý do] |
| 2 | ... | ... | ... | ... |

### Affected Skills: [list skills cần update theo]
### Risk: [Low/Medium/High]
```

Hiển thị plan cho user review trước khi thực hiện.

---

## Bước 4: Thực Hiện Upgrade

### Quy tắc update SKILL.md:
- ✅ **Targeted changes** — sửa phần cụ thể, KHÔNG rewrite toàn bộ
- ✅ **Backward compatible** — không break workflow hiện có
- ✅ **YAML frontmatter** — giữ nguyên format `---` header
- ✅ **Cross-references** — update nếu skill name thay đổi
- ✅ **Examples** — update code examples nếu syntax thay đổi
- ✅ **Version numbers** — cập nhật version references
- ❌ **KHÔNG** xoá sections quan trọng mà chỉ rewrite
- ❌ **KHÔNG** thay đổi `name:` trong frontmatter (sẽ break references)

---

## Bước 5: Verify & Cross-Check

```bash
# Kiểm tra YAML frontmatter hợp lệ
head -5 .agent/skills/{skill-name}/SKILL.md

# Kiểm tra cross-references
grep -rn "{skill-name}" .agent/skills/*/SKILL.md
grep -rn "{skill-name}" .agent/workflows/*.md
```

Checklist:
- [ ] YAML frontmatter valid (`---` header)
- [ ] Nội dung chính xác, không contradictions
- [ ] Cross-references tới skills khác vẫn đúng
- [ ] Examples code chạy được
- [ ] Orchestrator routing vẫn chính xác
- [ ] Không có conflicting advice giữa skills

---

## Bước 6: Log Thay Đổi

Ghi lại upgrade cho tracking:
```markdown
## Skill Upgrade Log — [Date]

| Skill | Change | Reason | Impact |
|-------|--------|--------|--------|
| {name} | [mô tả thay đổi] | [lý do] | [ảnh hưởng] |
```
