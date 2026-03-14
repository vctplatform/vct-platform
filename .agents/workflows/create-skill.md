---
description: Workflow tạo skill AI mới khi phát hiện gap trong hệ thống skills hiện có
---

# /create-skill — Tạo Skill AI Mới

> Sử dụng khi phát hiện thiếu skill cho một vai trò hoặc chuyên môn cụ thể.

// turbo-all

---

## Bước 1: Xác Định Nhu Cầu

### Khi nào cần skill mới?
| Trigger | Ví dụ |
|---------|------|
| **Vai trò mới** | Thêm role "Trainer" chuyên training content |
| **Chuyên môn mới** | AI/ML integration, blockchain |
| **Technology mới** | Adopt tool mới cần hướng dẫn riêng |
| **Gap phát hiện** | Không skill nào cover đủ cho một task type |
| **Tách skill** | Skill quá lớn → tách thành 2 skills chuyên |

### Kiểm tra trước khi tạo:
```
□ Skill này có thể merge vào skill có sẵn không?
  → Nếu CÓ: dùng /upgrade-skill thay vì tạo mới
□ Skill này có overlap lớn với skill khác không?
  → Nếu CÓ: xác định rõ boundary
□ Skill này cần thiết cho ≥2 use cases không?
  → Nếu KHÔNG: có thể chưa cần tạo riêng
```

---

## Bước 2: Thiết Kế Skill

### 2.1 Xác định thông tin cơ bản
```
Name: vct-{role-name}
Description: [mô tả 1-2 câu khi nào activate]
Tier: Leadership / Specialist / Process / Meta / Execution
Focus: [lĩnh vực chuyên môn chính]
```

### 2.2 Structure chuẩn (follow format hiện có)
```markdown
---
name: vct-{name}
description: [mô tả khi nào activate, keywords trigger]
---

# VCT {Role Name}

> **When to activate**: [scenarios cụ thể]

---

## 1. Role Definition
[Vai trò + Core Principles]

## 2. Domain Knowledge / Expertise
[Kiến thức chuyên môn]

## 3. Workflow / Process
[Quy trình step-by-step]

## 4-N. Specific Sections
[Sections riêng cho skill này]

## N-1. Output Format
[Format output mong đợi]

## N. Cross-Reference to Other Roles
[Khi nào consult skill khác]
```

---

## Bước 3: Viết SKILL.md

### Quy tắc bắt buộc:
- ✅ **YAML frontmatter** với `name:` và `description:`
- ✅ **`name:`** phải match với folder name (vct-{name})
- ✅ **`description:`** phải chứa trigger keywords cho AI
- ✅ **Cross-references** tới skills liên quan
- ✅ **Output Format** section rõ ràng
- ✅ **Checklists** cho quy trình quan trọng
- ✅ **Examples** cụ thể cho project VCT
- ❌ **KHÔNG** copy-paste từ skill khác mà không customize
- ❌ **KHÔNG** quá generic — phải tailored cho VCT Platform

### Description phải chứa keywords trigger:
```yaml
# ❌ SAI — quá chung
description: Helps with coding

# ✅ ĐÚNG — chứa trigger keywords cụ thể
description: QA Engineer role for VCT Platform. Activate when writing tests, 
  setting up E2E automation, performing regression testing, creating test plans, 
  or analyzing code coverage metrics.
```

---

## Bước 4: Tạo Folder & File

```
.agent/skills/vct-{name}/
└── SKILL.md
```

File path: `.agent/skills/vct-{name}/SKILL.md`

---

## Bước 5: Đăng Ký trong Orchestrator

Cập nhật `vct-orchestrator/SKILL.md`:

1. Thêm skill vào bảng roles tương ứng (Leadership/Specialist/Process/Meta)
2. Thêm vào Request Classification matrix nếu cần
3. Cập nhật Orchestration Workflows nếu skill tham gia quy trình

---

## Bước 6: Cập Nhật Skill Evolver

Cập nhật `vct-skill-evolver/SKILL.md`:
- Thêm skill mới vào Skill Health Dashboard
- Set `Last Updated` = ngày tạo
- Set `Health` = 🟢

---

## Bước 7: Verify

```bash
# Kiểm tra file tồn tại
cat .agent/skills/vct-{name}/SKILL.md | head -5

# Kiểm tra frontmatter
grep "^name:" .agent/skills/vct-{name}/SKILL.md
grep "^description:" .agent/skills/vct-{name}/SKILL.md

# Kiểm tra orchestrator đã include
grep "vct-{name}" .agent/skills/vct-orchestrator/SKILL.md
```

Checklist:
- [ ] Folder `vct-{name}/` tồn tại
- [ ] `SKILL.md` có YAML frontmatter hợp lệ
- [ ] Name match folder name
- [ ] Description chứa trigger keywords
- [ ] Cross-references chính xác
- [ ] Orchestrator updated
- [ ] Skill Evolver dashboard updated
- [ ] Không overlap quá nhiều với skills có sẵn
