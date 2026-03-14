---
description: Workflow tự học hỏi từ codebase, documentation, và external resources để nâng cao kiến thức
---

# /learn — Học Hỏi & Nâng Cao Kiến Thức

> Sử dụng khi cần nghiên cứu technology mới, học patterns từ codebase, hoặc cập nhật kiến thức từ docs.
> Đọc skill **vct-skill-evolver** (`/.agent/skills/vct-skill-evolver/SKILL.md`) cho research methodology.

// turbo-all

---

## Bước 1: Xác Định Chủ Đề Học

### Nguồn học:
| Nguồn | Cách tiếp cận | Ví dụ |
|-------|-------------|------|
| **Codebase hiện tại** | Đọc code, tìm patterns | Architecture patterns, utility functions |
| **Project docs** | Đọc `docs/`, README | Regulations, setup guides |
| **External docs** | Web search, official docs | Go docs, React docs, PostgreSQL docs |
| **Conversations trước** | Đọc conversation history | Lessons learned, decisions made |
| **Skills/Workflows** | Đọc `.agent/skills/` | Existing knowledge base |
| **Dependencies** | Đọc library docs | pgx API, gorilla/websocket |

---

## Bước 2: Nghiên Cứu

### 2.1 Từ Codebase (Internal Learning)
```bash
# Tìm patterns trong backend
find backend/internal -name "*.go" -type f | head -20

# Tìm patterns trong frontend
find packages/app/features -name "*.tsx" -type f | head -20

# Tìm conventions đang dùng
grep -rn "VCT_" packages/ui/src/
grep -rn "useI18n" packages/app/features/
```

**Mục tiêu**: Hiểu patterns thực tế đang dùng trong project, không chỉ dựa vào skills/docs.

### 2.2 Từ External Resources
```
1. Web search: "[topic] best practices 2026"
2. Official docs: go.dev, react.dev, nextjs.org, postgresql.org
3. Firebase MCP: search_documents cho Google developer docs
4. GitHub: Release notes, migration guides
5. Community: Stack Overflow, GitHub Discussions
```

### 2.3 Từ Conversation History
```
□ Đọc conversation summaries gần đây
□ Tìm patterns/decisions đã được tạm quyết
□ Tìm bugs/issues đã giải quyết → lessons learned
□ Tìm architectural decisions → update knowledge
```

---

## Bước 3: Tổng Hợp Kiến Thức

### Format Knowledge Summary:
```markdown
## Learning Summary: [Chủ đề]

### Key Findings:
1. [Finding 1] — [impact on VCT Platform]
2. [Finding 2] — [impact on VCT Platform]

### Patterns Discovered:
- [Pattern 1]: [mô tả + khi nào dùng]
- [Pattern 2]: [mô tả + khi nào dùng]

### Áp dụng cho VCT:
- [Cách apply finding 1 vào project]
- [Cách apply finding 2 vào project]

### Cần update:
- [ ] Skill: [tên skill] — [phần cần update]
- [ ] Workflow: [tên workflow] — [phần cần update]
```

---

## Bước 4: Apply Knowledge

### Quyết định action:
| Kiến thức mới | Action | Workflow dùng |
|--------------|--------|-------------|
| Best practice mới | Update skill | `/upgrade-skill` |
| Pattern lặp lại | Tạo workflow | `/create-workflow` |
| Bug pattern | Update checklist | `/upgrade-workflow` |
| Chuyên môn mới | Tạo skill | `/create-skill` |
| Convention mới | Update CTO skill | `/upgrade-skill` |
| Chỉ ghi nhận | Lưu notes | Không cần action |

### Thực hiện:
1. Xác định files cần update
2. Dùng workflow tương ứng (upgrade-skill / upgrade-workflow / create-*)
3. Verify changes
4. Log what was learned

---

## Bước 5: Document & Share

### Learning Log Entry:
```markdown
## 📚 Learning Log — [Date]

### Topic: [Chủ đề]
### Source: [Từ đâu]
### Key Takeaways:
1. [Takeaway 1]
2. [Takeaway 2]

### Actions Taken:
- Updated [skill/workflow] with [change]

### Next Steps:
- [Cần tìm hiểu thêm gì]
```

### Checklist:
- [ ] Kiến thức đã được tổng hợp rõ ràng
- [ ] Applicable findings đã apply vào skills/workflows
- [ ] Không có contradictions với knowledge hiện tại
- [ ] Learning log documented
