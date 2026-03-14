---
description: Workflow rà soát toàn diện, phản biện, và đề xuất nâng cấp cho project VCT Platform
---

# /audit — Rà Soát, Phản Biện & Đề Xuất Nâng Cấp

> Sử dụng để thực hiện audit toàn diện cho project, module, hoặc hệ thống AI (skills + workflows).
> Đọc skill **vct-auditor** (`/.agent/skills/vct-auditor/SKILL.md`) cho 12-point framework chi tiết.
> Đây là workflow QUAN TRỌNG NHẤT cho continuous improvement — tìm vấn đề TRƯỚC KHI chúng trở thành khủng hoảng.

// turbo-all

---

## Bước 1: Xác Định Scope & Loại Audit

### 1.1 Chọn scope:
| Scope | Khi nào | Thời gian |
|-------|---------|----------|
| **Full Project Audit** | Monthly / pre-release | 30-60 phút |
| **Module Audit** | Sau khi hoàn thành module | 15-20 phút |
| **Code Audit** | Trước merge/deploy | 10-15 phút |
| **AI System Audit** | Skills + Workflows + Orchestrator | 20-30 phút |
| **Post-incident Audit** | Sau sự cố production | 15 phút |

### 1.2 Chọn loại audit:
| Loại | Focus | Khi nào |
|------|-------|---------|
| 🏗️ **Architecture** | Clean Architecture compliance, layer boundaries | Sau thêm module/feature lớn |
| 💻 **Code Quality** | Conventions, patterns, duplication, dead code | Mỗi sprint |
| 🔒 **Security** | Auth, RBAC, SQL injection, secrets | Bi-weekly + sau update deps |
| ⚡ **Performance** | Query speed, bundle size, API response time | Trước release |
| 🧪 **Test Coverage** | Tests thiếu, flaky tests, coverage gaps | Mỗi sprint |
| 📄 **Documentation** | Docs outdated, API docs match code, README stale | Mỗi tháng |
| 🧬 **AI System** | Skills outdated, workflows thiếu, orchestrator gaps | Mỗi tháng |

---

## Bước 2: Rà Soát Có Hệ Thống (12-Point Framework)

### 2.1 Code Quality — Build & Static Analysis
```bash
# Build check
cd backend && go build ./...
cd backend && go vet ./...
npm run typecheck

# Tìm vấn đề code
grep -rn "TODO\|FIXME\|HACK\|WORKAROUND" backend/internal/ packages/
grep -rn "console.log\|fmt.Println" backend/internal/ packages/ --include="*.go" --include="*.ts" --include="*.tsx" | grep -v "_test\."
```

Checklist:
- [ ] Zero compilation errors
- [ ] Zero TypeScript strict errors
- [ ] Unused imports dọn sạch
- [ ] TODO/FIXME tracked hoặc resolved
- [ ] Không debug logs còn sót

### 2.2 Architecture Compliance
```bash
# Kiểm tra layer violations
grep -rn "httpapi" backend/internal/domain/ 
grep -rn "net/http" backend/internal/domain/
```

Checklist:
- [ ] Domain packages KHÔNG import httpapi/adapter
- [ ] Handlers KHÔNG chứa business logic
- [ ] Services implement domain interfaces
- [ ] Feature code trong `packages/app/features/` (không `apps/next/pages/`)
- [ ] Components dùng `VCT_` prefix

### 2.3 Security Check
```bash
# Secrets scan
grep -rn "password\|secret\|api_key\|token" --include="*.go" --include="*.ts" --include="*.env" | grep -v node_modules | grep -v "_test\." | grep -v ".env.example" | grep -v "// " | grep -v "<!-- "
```

Checklist:
- [ ] Protected routes có auth middleware
- [ ] SQL queries dùng parameterized ($1, $2)
- [ ] Không secrets trong source code
- [ ] CORS configured đúng

### 2.4 Convention Violations
```bash
# Check VCT_ prefix
grep -rn "function [A-Z]" packages/ --include="*.tsx" | grep -v "VCT_\|Page_\|use\|Provider\|Layout\|App" | head -20

# Check i18n
grep -rn "\"[A-Za-zÀ-ỹ][a-zà-ỹ]*\s[a-zà-ỹ]" packages/app/features/ --include="*.tsx" | grep -v "import\|//\|console\|className\|key=\|id=\|name=\|type=\|data-" | head -20
```

Checklist:
- [ ] All components: `VCT_` prefix
- [ ] All text: `useI18n()` / `t('key')`
- [ ] All icons: `VCT_Icons` only
- [ ] CSS: tokens only (no hardcoded colors)
- [ ] SQL: snake_case, migration pairs

---

## Bước 3: Phản Biện — Devil's Advocate Analysis

> Đây là phần QUAN TRỌNG NHẤT — tư duy phản biện, thách thức mọi giả định.

### 3.1 Architecture Challenges
```
Cho mỗi module/service, hỏi:
□ Module này có đang làm quá nhiều việc? (Single Responsibility)
□ Nếu requirements thay đổi, module nào cần sửa? (Coupling)
□ Có thể test module này độc lập không? (Testability)
□ Scale lên 1000 users → có vấn đề gì? (Scalability)
□ Scale lên 10 modules → cùng pattern này có OK? (Consistency)
□ Nếu developer mới đọc code → hiểu được không? (Readability)
```

### 3.2 Code Design Challenges
```
□ Function có quá dài? (>50 lines → nên tách)
□ Có quá nhiều parameters? (>4 → nên dùng struct)
□ Error handling đủ chi tiết? (Stack trace, context)
□ Edge cases có được xử lý? (nil, empty, concurrent)
□ Naming có rõ ràng? (Đọc tên → hiểu function làm gì)
□ Có technical debt ẩn? (Workarounds thành permanent)
```

### 3.3 UX/UI Challenges
```
□ User flow có intuitive? (3-click rule)
□ Loading states có smooth? (skeleton, not spinner)
□ Error states có helpful? (not "Something went wrong")
□ Empty states có actionable? (not just "No data")
□ Responsive trên mobile? (sidebar, tables, forms)
□ Accessible? (contrast, keyboard nav, screen reader)
```

### 3.4 Process Challenges
```
□ Workflows có thực sự được follow? Hay bị skip?
□ Skills có đủ chi tiết cho task phức tạp?
□ Có blind spots nào trong coverage?
□ Orchestrator routing có đúng cho mọi case?
□ Knowledge có bị lost giữa conversations?
```

---

## Bước 4: Đề Xuất Nâng Cấp

### 4.1 Phân loại findings:

| Severity | Tiêu chí | Action Required |
|----------|---------|----------------|
| 🔴 **Critical** | Bug, security hole, data loss risk | Fix ngay (/hotfix) |
| 🟠 **High** | Architecture violation, major tech debt | Fix trong sprint |
| 🟡 **Medium** | Convention violation, minor tech debt | Fix khi touch code |
| 🟢 **Low** | Cosmetic, nice-to-have improvement | Backlog |
| 💡 **Enhancement** | Ý tưởng mới, feature proposal | Evaluate |

### 4.2 Template đề xuất nâng cấp:

```markdown
### Đề Xuất #[N]: [Tiêu đề]

**Problem**: [Mô tả vấn đề phát hiện]
**Evidence**: [File/line/example cụ thể]
**Impact**: [Ảnh hưởng nếu không fix]
**Proposed Fix**: [Giải pháp cụ thể]
**Effort**: S/M/L
**Priority**: 🔴/🟠/🟡/🟢
**Workflow**: /{workflow-to-use}
**Affected Files**: [list files]
```

### 4.3 Nâng cấp AI System (Skills + Workflows):

```markdown
### AI System Upgrade Proposals:
| # | Loại | Tên | Vấn đề | Đề xuất |
|---|------|-----|--------|---------|
| 1 | Upgrade Skill | vct-{name} | [thiếu gì] | [thêm gì] |
| 2 | Upgrade Workflow | /{name} | [thiếu bước] | [thêm bước] |
| 3 | New Skill | vct-{name} | [gap nào] | [cover gì] |
| 4 | New Workflow | /{name} | [pattern nào] | [chuẩn hóa gì] |
```

---

## Bước 5: Tạo Audit Report

### Report Structure:
```markdown
# 📋 VCT Audit Report — [Date]

## Scope: [Full / Module / AI System]

## Executive Summary
[1-2 đoạn tổng quan sức khỏe project]

## Health Score: [X]/100
| Dimension | Score | Status | Trend |
|---|---|---|---|
| Code Quality | /10 | 🟢🟡🔴 | ⬆️⬇️➡️ |
| Architecture | /10 | 🟢🟡🔴 | ⬆️⬇️➡️ |
| Security | /10 | 🟢🟡🔴 | ⬆️⬇️➡️ |
| Conventions | /10 | 🟢🟡🔴 | ⬆️⬇️➡️ |
| Documentation | /10 | 🟢🟡🔴 | ⬆️⬇️➡️ |
| AI System | /10 | 🟢🟡🔴 | ⬆️⬇️➡️ |

## 🔴 Critical Findings (Fix ngay)
[Table findings]

## 🟠 High Priority (Fix trong sprint)
[Table findings]

## 🟡 Medium Priority (Fix khi touch code)
[Table findings]

## 💡 Enhancement Proposals
[Table proposals]

## 🧬 AI System Upgrade Proposals
[Table skill/workflow upgrades]

## ✅ Action Plan (ưu tiên)
1. [Action 1] — /{workflow} — Effort: [S/M/L]
2. [Action 2] — /{workflow} — Effort: [S/M/L]
3. [Action 3] — /{workflow} — Effort: [S/M/L]
```

---

## Bước 6: Execute Upgrades

Với user approval, thực hiện theo thứ tự ưu tiên:

| Priority | Workflow | Timing |
|----------|---------|--------|
| 🔴 Critical | `/hotfix` hoặc `/fix-bug` | Ngay lập tức |
| 🟠 High (Code) | `/refactor`, `/code-review` | Sprint hiện tại |
| 🟠 High (AI) | `/upgrade-skill`, `/upgrade-workflow` | Sprint hiện tại |
| 🟡 Medium | `/refactor`, `/documentation` | Khi touch code |
| 💡 Enhancement | `/new-feature`, `/create-skill` | Backlog |

---

## Bước 7: Verify & Schedule Next Audit

1. Verify fixes đã applied:
   ```bash
   cd backend && go build ./...
   npm run typecheck
   ```

2. So sánh health score trước vs sau audit

3. Schedule next audit:
   | Loại | Tần suất |
   |------|---------|
   | Full Project | Monthly |
   | Module | Sau mỗi module complete |
   | Security | Bi-weekly |
   | AI System | Monthly |
   | Pre-release | Trước mỗi release |
