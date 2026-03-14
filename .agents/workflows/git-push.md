---
description: Workflow tự động commit, push code và cập nhật lên GitHub cho VCT Platform
---

# /git-push — Đẩy Code Lên GitHub

> Sử dụng khi cần commit và push toàn bộ thay đổi lên GitHub.
> Tự động: stage → commit message chuẩn → push → verify.

// turbo-all

---

## Bước 1: Kiểm Tra Trạng Thái

```bash
cd d:\VCT PLATFORM\vct-platform
git status
git diff --stat
```

Đánh giá:
- [ ] Có files nào KHÔNG nên commit? (`.env`, debug logs, scratch files)
- [ ] Có files nào bị conflict?
- [ ] Thay đổi có thuộc cùng 1 mục đích logic?

---

## Bước 2: Quality Check Trước Khi Commit

### Build verification (bắt buộc):
```bash
cd backend && go build ./...
cd backend && go vet ./...
npm run typecheck
```

> ⚠️ **KHÔNG push nếu build fail.** Fix trước, push sau.

### Quick checks:
```bash
# Debug logs còn sót?
git diff --cached | grep -i "console.log\|fmt.Println\|TODO\|FIXME" | head -10

# Secrets vô tình add?
git diff --cached --name-only | grep -i "\.env$\|\.key$\|\.pem$\|secret"
```

---

## Bước 3: Stage & Commit

### 3.1 Stage files
```bash
# Stage tất cả
git add -A

# Hoặc stage chọn lọc (nếu cần tách commits)
git add backend/
git add packages/
git add .agent/
```

### 3.2 Commit message convention

#### Format:
```
<type>(<scope>): <description>

[optional body]
```

#### Types:
| Type | Khi nào |
|------|---------|
| `feat` | Feature mới |
| `fix` | Bug fix |
| `refactor` | Refactoring (no behavior change) |
| `docs` | Documentation only |
| `style` | Formatting, no code change |
| `test` | Adding/updating tests |
| `chore` | Build, deps, config changes |
| `perf` | Performance improvement |
| `ci` | CI/CD changes |
| `wip` | Work in progress (tránh dùng trên main) |

#### Scopes phổ biến:
```
backend, frontend, ui, auth, federation, athlete, 
tournament, club, i18n, db, docker, deps, skills, workflows
```

#### Ví dụ:
```bash
git commit -m "feat(federation): add regulations CRUD pages"
git commit -m "fix(sidebar): correct active state for nested routes"
git commit -m "chore(workflows): add 6 meta-learning workflows"
git commit -m "refactor(backend): extract validation to separate service"
git commit -m "docs(api): update federation API documentation"
```

### 3.3 Multi-scope commits (nhiều thay đổi lớn):
```bash
# Tách thành nhiều commits nếu thay đổi thuộc nhiều mục đích
git add backend/
git commit -m "feat(backend): implement belt ranking service"

git add packages/
git commit -m "feat(frontend): add belt ranking page"

git add .agent/
git commit -m "chore(workflows): add new development workflows"
```

---

## Bước 4: Push Lên GitHub

```bash
# Push to current branch
git push origin main

# Nếu branch mới chưa có trên remote
git push -u origin <branch-name>

# Force push (CHỈ KHI THẬT SỰ CẦN THIẾT)
# git push --force-with-lease origin <branch-name>
```

### Xử lý conflicts:
```bash
# Nếu push bị reject
git pull origin main --rebase
# Resolve conflicts nếu có
git push origin main
```

---

## Bước 5: Verify Push

```bash
# Kiểm tra commit đã lên remote
git log origin/main --oneline -5

# Kiểm tra remote status
git remote -v
git status
```

Checklist:
- [ ] Build pass trước khi commit
- [ ] Không có secrets trong commit
- [ ] Không có debug logs trong commit
- [ ] Commit message đúng convention
- [ ] Push thành công
- [ ] Remote branch up-to-date

---

## Quick Push (Shortcut cho thay đổi nhỏ)

Khi thay đổi nhỏ, rõ ràng, build đã pass:

```bash
cd d:\VCT PLATFORM\vct-platform
git add -A
git commit -m "<type>(<scope>): <description>"
git push origin main
```
