---
description: Workflow retrospective sau khi hoàn thành task — rút kinh nghiệm và cải thiện skills/workflows
---

# /retrospective — Retrospective & Tự Cải Thiện

> Sử dụng sau khi hoàn thành một feature lớn, sprint, hoặc khi phát hiện pattern lặp lại.
> Đây là workflow quan trọng nhất cho continuous improvement.

// turbo-all

---

## Bước 1: Thu Thập Dữ Liệu

### Về task vừa hoàn thành:
```
□ Task/feature gì? Scope ra sao?
□ Mất bao lâu? (so với estimate)
□ Có bug/issue nào phát sinh không?
□ Có chỗ nào phải làm lại?
□ User feedback ra sao?
```

### Về quy trình:
```
□ Workflow nào đã dùng?
□ Workflow có bị skip bước nào không?
□ Skill nào hữu ích nhất?
□ Skill nào thiếu / không đủ chi tiết?
□ Có bước nào mất thời gian không cần thiết?
```

---

## Bước 2: Phân Tích — What Went Well / Wrong

### ✅ What Went Well (Giữ lại)
```markdown
| # | Gì tốt | Tại sao | Action |
|---|--------|---------|--------|
| 1 | [pattern/practice tốt] | [lý do thành công] | Giữ nguyên + document |
| 2 | ... | ... | ... |
```

### ❌ What Went Wrong (Cải thiện)
```markdown
| # | Vấn đề | Root Cause | Action |
|---|--------|-----------|--------|
| 1 | [vấn đề gặp phải] | [nguyên nhân gốc] | [upgrade skill/workflow] |
| 2 | ... | ... | ... |
```

### 🔄 What Patterns Repeat (Tự động hóa)
```markdown
| # | Pattern lặp lại | Tần suất | Action |
|---|-----------------|---------|--------|
| 1 | [thao tác lặp lại] | [mỗi feature / hàng ngày] | [tạo workflow mới] |
| 2 | ... | ... | ... |
```

---

## Bước 3: Quyết Định Actions

### Action Types:
| Action | Workflow dùng | Khi nào |
|--------|-------------|---------|
| Upgrade skill đã có | `/upgrade-skill` | Skill thiếu hướng dẫn |
| Upgrade workflow đã có | `/upgrade-workflow` | Workflow thiếu bước |
| Tạo skill mới | `/create-skill` | Chuyên môn mới cần |
| Tạo workflow mới | `/create-workflow` | Pattern lặp lại cần chuẩn hóa |
| Fix code convention | `/code-review` | Convention sai trong skill |
| Update documentation | `/documentation` | Docs outdated |

### Ưu tiên actions:
```
🔴 Critical: Causes bugs/failures → Fix ngay
🟠 High: Wastes significant time → Fix trong tuần
🟡 Medium: Minor inefficiency → Fix khi có thời gian
🟢 Low: Nice to have → Backlog
```

---

## Bước 4: Thực Hiện Improvements

### Cho mỗi action item:
1. Xác định file cần sửa (skill hoặc workflow)
2. Đọc file hiện tại
3. Thực hiện thay đổi targeted
4. Verify thay đổi không break gì
5. Log thay đổi

### Template thay đổi:
```markdown
## Retrospective Update — [Date]

### Trigger: [Feature/Sprint/Issue nào trigger]

### Improvements Made:
| File | Change | Reason |
|------|--------|--------|
| .agent/skills/vct-{name}/SKILL.md | [mô tả] | [lý do] |
| .agent/workflows/{name}.md | [mô tả] | [lý do] |

### New Files Created:
| File | Purpose |
|------|---------|
| .agent/skills/vct-{name}/SKILL.md | [mục đích] |
| .agent/workflows/{name}.md | [mục đích] |
```

---

## Bước 5: Verify & Share

1. Verify các file đã sửa:
   ```bash
   # Kiểm tra YAML frontmatter
   head -5 .agent/skills/*/SKILL.md
   head -5 .agent/workflows/*.md
   ```

2. Tạo summary cho user:
   ```markdown
   ## 📊 Retrospective Summary
   
   ### ✅ Giữ lại: [N] patterns tốt
   ### 🔧 Cải thiện: [N] skills/workflows updated
   ### ➕ Tạo mới: [N] skills/workflows created
   ### 📈 Expected Impact: [mô tả]
   ```

3. Set reminder cho next retrospective
