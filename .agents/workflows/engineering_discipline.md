---
description: "Engineering Discipline — 5 Iron Laws adapted từ obra/superpowers. Bắt buộc cho mọi M/L engineering task."
---

# Engineering Discipline — 5 Iron Laws

> **Source**: Adapted từ [obra/superpowers](https://github.com/obra/superpowers) (120k ★)
> **Trigger**: Mọi engineering task mức M/L PHẢI đi qua workflow này.
> **Áp dụng bắt buộc**: Không có exception.

## Law 0: Technical Judgment Quick-Check (TRƯỚC mọi Law khác)

> `ĐÁNH GIÁ TRƯỚC KHI HÀNH ĐỘNG. KỸ NĂNG LÀ BIẾT LÀM. PHÁN ĐOÁN LÀ BIẾT KHI NÀO KHÔNG NÊN LÀM.`

**Trước khi bước vào Law 1-5, Agent PHẢI trả lời 5 câu hỏi này (trong đầu, không cần trình bày cho user trừ khi có red flag):**

| # | Câu hỏi | Red Flag → Action |
|---|---------|-------------------|
| 1 | **YAGNI**: User CÓ THẬT SỰ cần cái này NGAY BÂY GIỜ không? | "Phòng khi cần sau này" → Từ chối hoặc đơn giản hóa |
| 2 | **Blast Radius**: Thay đổi này ảnh hưởng bao nhiêu file/module? | Cross-module hoặc shared types → Nâng mức review |
| 3 | **Reversibility**: Quyết định này có đảo ngược được không? | Irreversible (delete, schema change) → 2x verify + user confirm |
| 4 | **Complexity Budget**: Giải pháp đơn giản hơn đạt 80% kết quả? | >3 files mới + >1 abstraction → BẮT BUỘC justify |
| 5 | **Trade-off**: Gain > Cost? | Gain ≈ Cost → Hỏi user. Gain < Cost → Từ chối |

**Kết quả**: Nếu tất cả 5 câu hỏi đều pass → Tiến vào Law 1. Nếu có red flag → Báo user TRƯỚC KHI thiết kế.

## Law 1: Brainstorming Gate

> `KHÔNG ĐOÁN MÒ. KHÔNG CODE KHI CHƯA CÓ DESIGN ĐƯỢC DUYỆT`

### Process
1. **Explore context (Data-First)** — BẮT BUỘC Check database schema thực tế, đọc cấu trúc file, grep references bằng các commands. 
2. **Deep Interview (Socratic)** — NẾU REQUIREMENT MẬP MỜ: Không "Nhận task làm luôn", Javis phải kích hoạt quyền phỏng vấn nắn gân user (Edge Cases? Security constraints? Data volume?).
3. **Hỏi làm rõ** — Từng câu một, hiểu mục đích/ràng buộc/tiêu chí thành công
3. **Đề xuất 2-3 approaches** — Dựa trên Data có thật. Present trade-offs + recommendation
4. **Present design** — Theo section, user approve từng phần
5. **Ghi spec** — Lưu vào `docs/specs/YYYY-MM-DD-<topic>.md`
6. **User review** — Chờ user approve spec trước khi tiếp

### Anti-Pattern
- ❌ "Đơn giản quá không cần thiết kế" — MỌI M/L task đều cần. Design có thể ngắn nhưng BẮT BUỘC phải có.
- ❌ Đề xuất design dựa trên hallucination/trí nhớ LLM mà chưa check code/DB thực tế (Thiếu Data-First).
- ❌ Code trước, thiết kế sau
- ❌ Skip user approval

---

## Law 2: Plan-First

> `KHÔNG CODE KHI CHƯA CÓ PLAN BITE-SIZED`

### Sau khi design approved
1. Map file structure — Quét files cần tạo/sửa
2. Viết plan với tasks bite-sized (2-5 phút/task)
3. Mỗi task: Files + Steps + Code blocks + Verification commands
4. **No Placeholders**: Không "TBD", "TODO", "implement later", "add appropriate error handling"
5. Self-review: Scan spec coverage, placeholder, type consistency

### Task Format
```markdown
### Task N: [Component Name]
**Files:** Create: `path/to/file` | Modify: `path/to/existing`
- [ ] Step 1: Write failing test (code block)
- [ ] Step 2: Run test, verify FAIL
- [ ] Step 3: Write minimal implementation (code block)
- [ ] Step 4: Run test, verify PASS
- [ ] Step 5: Commit
```

---

## Law 3: TDD Iron Law

> `NO PRODUCTION CODE WITHOUT A FAILING TEST FIRST`

### RED-GREEN-REFACTOR
1. **RED**: Viết 1 test → Chạy → Confirm FAIL (vì feature chưa có, KHÔNG phải typo)
2. **GREEN**: Viết code TỐI THIỂU để pass test → Chạy → Confirm PASS + các test khác vẫn PASS
3. **REFACTOR**: Clean up, remove duplication, improve names → Giữ test GREEN
4. **Commit** → Repeat

### Enforcement
- Code trước test? → **XÓA CODE**. Start over. Không giữ "làm reference"
- Test pass ngay? → Test sai, sửa test
- "Quá đơn giản để test"? → Test mất 30 giây. KHÔNG exception
- Exception duy nhất: Prototype (throwaway), generated code, config — nhưng PHẢI hỏi user

---

## Law 4: Systematic Debugging

> `NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST`

### 4 Phases (PHẢI hoàn thành theo thứ tự)

**Phase 1 — Root Cause Investigation** (TRƯỚC khi fix)
- Đọc kỹ error messages, stack traces, line numbers
- Reproduce: Trigger lỗi đáng tin cậy → Ghi steps chính xác
- Check recent changes: `git diff`, recent commits, config changes
- Trace data flow: Giá trị sai bắt đầu từ đâu? Trace ngược lại source

**Phase 2 — Pattern Analysis**
- Tìm code tương tự đang WORK trong cùng codebase
- So sánh: Khác gì giữa working vs broken?
- Liệt kê MỌI difference, dù nhỏ

**Phase 3 — Hypothesis & Test**
- Phát biểu: "Tôi nghĩ X là root cause vì Y"
- Test với thay đổi NHỎ NHẤT có thể, 1 variable/lần
- Không work? → Hypothesis MỚI, KHÔNG thêm fix chồng lên

**Phase 4 — Implementation**
- Viết failing test reproduce bug (TDD Law 3)
- Implement 1 fix duy nhất cho root cause
- Verify: Test pass, không test khác bị break

### Escalation & Anti-Loop Rule (Adapted from Dexter)
- **Anti-Loop:** TUYỆT ĐỐI KHÔNG thử lại cùng một tool/command/fix (Similarity > 80%) nếu không thay đổi context / tham số.
- **3+ fixes/commands thất bại** → STOP. Dừng ngay vòng lặp vô tận. Question architecture → Discuss với user.

### Red Flags (STOP ngay)
- "Quick fix for now" — STOP, Phase 1
- "Just try changing X" — STOP, Phase 1
- "I don't understand but this might work" — STOP, Phase 1
- Fix nào cũng bật ra vấn đề mới — STOP, question architecture

---

## Law 5: Verification Before Completion

> `NO COMPLETION CLAIMS WITHOUT FRESH VERIFICATION EVIDENCE`

### Gate Function
```
TRƯỚC KHI claim bất kỳ trạng thái nào:
1. IDENTIFY: Lệnh nào chứng minh claim này?
2. RUN: Chạy FULL command (fresh)
3. READ: Đọc TOÀN BỘ output, check exit code, đếm failures
4. VERIFY: Output xác nhận claim?
   - KHÔNG → Báo trạng thái thực + evidence
   - CÓ → Claim KÈM evidence
5. CHỈ KHI ĐÓ: Tuyên bố kết quả
```

### Cấm tuyệt đối
| Claim | Yêu cầu | KHÔNG đủ |
|-------|----------|----------|
| Tests pass | Output: 0 failures | "Should pass", "looks correct" |
| Build clean | Build: exit 0 | Linter passing |
| Bug fixed | Test original symptom: PASS | "Code changed, assumed fixed" |
| Requirements met | Line-by-line checklist | "Tests pass" |

### Từ ngữ cấm (khi chưa verify)
❌ "should work" / "probably" / "seems to" / "looks correct"
❌ "Great!" / "Perfect!" / "Done!" (trước verify)
❌ "I'm confident" (confidence ≠ evidence)
