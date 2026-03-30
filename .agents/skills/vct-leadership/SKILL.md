---
name: vct-leadership
description: "VCT Platform technical leadership — architecture decisions, code review, design patterns, troubleshooting, complexity reduction, and solution design."
---

# VCT Leadership — Architecture & Technical Excellence

> Consolidated: cto + sa + tech-lead + design-patterns + simplifier + troubleshooting + skill-evolver

## 1. Architecture Decision Making

### Solution Architect (SA) Role
- Design new modules: API surface, DB schema, component boundaries
- Produce ADRs (Architecture Decision Records)
- Evaluate trade-offs: performance vs complexity vs cost
- Ensure alignment with 19 architecture pillars in `docs/architecture/`

### CTO Role
- Final authority on tech stack decisions
- Code quality standards enforcement
- CI/CD and infrastructure strategy
- Tech debt prioritization

## 2. Code Review Standards

### Review Checklist
- [ ] Clean Architecture boundaries respected
- [ ] No circular dependencies
- [ ] Error handling: all errors wrapped with context
- [ ] Security: input validation, auth checks, no SQL injection
- [ ] Performance: no N+1 queries, proper indexing
- [ ] Testing: new code has tests, edge cases covered
- [ ] i18n: no hardcoded strings
- [ ] Accessibility: ARIA labels, keyboard nav

### Severity Levels
| Level | Block? | Example |
|-------|--------|---------|
| 🔴 Critical | Yes | Security vulnerability, data loss risk |
| 🟡 Major | Yes | Architecture violation, missing error handling |
| 🔵 Minor | No | Naming convention, minor refactor opportunity |
| 💡 Suggestion | No | Better pattern, optimization idea |

## 3. Design Patterns (Go + React)

### Go Patterns
- **Repository**: Interface in domain, implementation in store
- **Factory**: `NewService(deps)` for dependency injection
- **Strategy**: Interface-based polymorphism for business rules
- **Observer**: Event bus for cross-module communication
- **Middleware**: Chain of responsibility for HTTP pipeline

### React/Next.js Patterns
- **Custom Hooks**: Encapsulate logic, return state + actions
- **Compound Components**: Related components sharing context
- **Render Props**: Flexible rendering delegation
- **HOC**: Cross-cutting concerns (auth guard, error boundary)
- **Container/Presenter**: Separate data fetching from display

## 4. Simplification (YAGNI/KISS)

### Rules
- Complexity is a **liability**, not an asset
- Favor **deleting code** over writing new code
- Maximum: 200 lines per file, 20 lines per function, 3 parameters
- Ask: "Is there a simpler way?" before every implementation
- Reject: premature abstraction, speculative generality

### Red Flags
- Generic framework for one use case → **Delete, make specific**
- Config-driven behavior with one config → **Hardcode it**
- Abstraction layer with one implementation → **Inline it**
- "We might need this later" → **YAGNI — delete it**

## 5. Systematic Debugging Protocol (Adapted from superpowers)

> `NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST`

### 4 Phases (PHẢI hoàn thành theo thứ tự)

**Phase 1 — Root Cause Investigation** (TRƯỚC mọi fix)
1. Đọc kỹ error messages, stack traces, line numbers — chúng thường chứa lời giải
2. Reproduce: Trigger lỗi đáng tin cậy, ghi steps chính xác
3. Check recent changes: `git diff`, commits gần đây, config/env changes
4. Trace data flow: Giá trị sai bắt đầu ở đâu? Trace ngược tới source

**Phase 2 — Pattern Analysis**
1. Tìm code tương tự ĐANG WORK trong cùng codebase
2. So sánh mọi difference giữa working vs broken (dù nhỏ)
3. Hiểu dependencies: Component này cần gì để hoạt động?

**Phase 3 — Hypothesis & Test**
1. Phát biểu rõ: "X là root cause vì Y"
2. Test với thay đổi NHỎ NHẤT, 1 variable/lần
3. Không work? → Hypothesis MỚI. **KHÔNG** thêm fix chồng lên

**Phase 4 — Implementation**
1. Viết failing test reproduce bug (áp dụng TDD Iron Law)
2. Implement 1 fix duy nhất cho root cause
3. Verify: Test pass, không test khác bị break

### Escalation Rule
**3+ fixes thất bại** → STOP → Question architecture → Discuss với user.
Đây là dấu hiệu vấn đề kiến trúc, không phải vấn đề code.

### Red Flags (STOP và quay lại Phase 1)
- "Quick fix for now, investigate later"
- "Just try changing X and see"
- "I don't understand but this might work"
- Fix nào cũng bật ra vấn đề mới ở chỗ khác

### Common Anti-Patterns to Catch
- Swallowed errors (empty catch blocks)
- Unbounded queries (missing LIMIT/pagination)
- Race conditions (shared mutable state)
- N+1 queries (loop with individual DB calls)

## 5b. Code Review Protocol (Adapted from superpowers)

### 2-Stage Review
| Stage | Focus | Pass Criteria |
|-------|-------|--------------|
| **Stage 1: Spec Compliance** | Code matches spec/requirements? | ✅ Không thiếu requirement, không thêm ngoài spec |
| **Stage 2: Code Quality** | Clean, maintainable, tested? | ✅ Review checklist (Section 2) pass |

### When to Review
- **Bắt buộc**: Sau task lớn, trước merge to main
- **Khuyến khích**: Khi stuck (fresh perspective), trước refactor, sau fix bug phức tạp

### Action on Feedback
| Level | Action |
|-------|--------|
| 🔴 Critical | Fix NGAY, không tiếp tục |
| 🟡 Major | Fix TRƯỚC KHI proceed |
| 🔵 Minor | Note, fix khi phù hợp |
| 💡 Suggestion | Cân nhắc, push back nếu có lý do kỹ thuật |

## 6. Skill Evolution (Self-Improvement)

### Technology Monitoring
- Track Go, React, Next.js, Expo release notes
- Monitor security advisories (CVE)
- Evaluate new tools/libraries quarterly

### Skill Upgrade Process
```
Monitor → Assess Relevance → Draft Upgrade → Test → Apply → Document
```

- Check for deprecated APIs in current skills
- Update code patterns to latest best practices
- Remove obsolete knowledge, add emerging patterns
- Verify updated skills against current codebase

