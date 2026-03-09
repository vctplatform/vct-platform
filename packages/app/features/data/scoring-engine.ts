/**
 * VCT Scoring Engine
 * 
 * Combat scoring (đối kháng) and Forms scoring (quyền)
 * following official Vovinam tournament rules.
 */

// ══════════════════════════════════════════════════════════════
// TYPES
// ══════════════════════════════════════════════════════════════

export interface CombatScoringRules {
    roundCount: number         // Default 3
    roundDuration: number      // 120 seconds
    breakDuration: number      // 60 seconds
    judgeCount: 3 | 5

    bodyKick: number           // +1
    headKick: number           // +2
    spinning: number           // +3

    caution: number            // 0 (warning only)
    gamjeom: number            // -1 per penalty
    gapStopThreshold: number   // 12 point gap → RSC
}

export interface RoundScore {
    round: number
    red: number
    blue: number
    penaltiesRed: number
    penaltiesBlue: number
}

export type MatchEndReason = 'points' | 'TKO' | 'RSC' | 'DSQ' | 'WDR'

export interface CombatResult {
    winnerId: string | null
    winnerCorner: 'red' | 'blue' | 'draw'
    reason: MatchEndReason
    totalRed: number
    totalBlue: number
    rounds: RoundScore[]
    penaltyTotalRed: number
    penaltyTotalBlue: number
}

export interface FormsScoreResult {
    judgeScores: number[]
    trimmedHigh: number
    trimmedLow: number
    average: number
    totalScore: number
    penalties: number
    finalScore: number
}

export interface DrawConfig {
    athletes: Array<{ id: string; teamId: string; seed?: number }>
    separateTeams: boolean
    seedCount: number
}

export interface BracketMatch {
    position: number
    round: string
    athleteRedId: string | null
    athleteBlueId: string | null
    isBye: boolean
}

// ══════════════════════════════════════════════════════════════
// DEFAULT RULES
// ══════════════════════════════════════════════════════════════

export const DEFAULT_COMBAT_RULES: CombatScoringRules = {
    roundCount: 3,
    roundDuration: 120,
    breakDuration: 60,
    judgeCount: 3,
    bodyKick: 1,
    headKick: 2,
    spinning: 3,
    caution: 0,
    gamjeom: -1,
    gapStopThreshold: 12,
}

// ══════════════════════════════════════════════════════════════
// COMBAT SCORING ENGINE
// ══════════════════════════════════════════════════════════════

/**
 * Calculate combat match result from round scores
 */
export function calculateCombatResult(
    rounds: RoundScore[],
    athleteRedId: string,
    athleteBlueId: string,
    earlyEnd?: { reason: MatchEndReason; winnerId: string }
): CombatResult {
    // Early end (TKO, RSC, DSQ, WDR)
    if (earlyEnd) {
        const totalRed = rounds.reduce((s, r) => s + r.red, 0)
        const totalBlue = rounds.reduce((s, r) => s + r.blue, 0)
        const penR = rounds.reduce((s, r) => s + r.penaltiesRed, 0)
        const penB = rounds.reduce((s, r) => s + r.penaltiesBlue, 0)

        return {
            winnerId: earlyEnd.winnerId,
            winnerCorner: earlyEnd.winnerId === athleteRedId ? 'red' : 'blue',
            reason: earlyEnd.reason,
            totalRed,
            totalBlue,
            rounds,
            penaltyTotalRed: penR,
            penaltyTotalBlue: penB,
        }
    }

    // Calculate totals
    const totalRed = rounds.reduce((s, r) => s + r.red, 0)
    const totalBlue = rounds.reduce((s, r) => s + r.blue, 0)
    const penR = rounds.reduce((s, r) => s + r.penaltiesRed, 0)
    const penB = rounds.reduce((s, r) => s + r.penaltiesBlue, 0)

    // Apply penalty deductions
    const finalRed = totalRed + penB  // opponent's penalty = your points
    const finalBlue = totalBlue + penR

    let winnerCorner: 'red' | 'blue' | 'draw' = 'draw'
    let winnerId: string | null = null

    if (finalRed > finalBlue) {
        winnerCorner = 'red'
        winnerId = athleteRedId
    } else if (finalBlue > finalRed) {
        winnerCorner = 'blue'
        winnerId = athleteBlueId
    }

    return {
        winnerId,
        winnerCorner,
        reason: 'points',
        totalRed: finalRed,
        totalBlue: finalBlue,
        rounds,
        penaltyTotalRed: penR,
        penaltyTotalBlue: penB,
    }
}

/**
 * Check if the point gap triggers RSC (Referee Stops Contest)
 */
export function shouldTriggerGapRSC(
    currentRedScore: number,
    currentBlueScore: number,
    threshold = DEFAULT_COMBAT_RULES.gapStopThreshold
): { triggered: boolean; leadingCorner: 'red' | 'blue' } | null {
    const diff = Math.abs(currentRedScore - currentBlueScore)
    if (diff >= threshold) {
        return {
            triggered: true,
            leadingCorner: currentRedScore > currentBlueScore ? 'red' : 'blue',
        }
    }
    return null
}

// ══════════════════════════════════════════════════════════════
// FORMS SCORING ENGINE (Quyền)
// ══════════════════════════════════════════════════════════════

/**
 * Calculate forms score with trimmed mean (high/low removal).
 * 
 * 5 judges: remove 1 highest, 1 lowest → average 3
 * 7 judges: remove 2 highest, 2 lowest → average 3
 */
export function calculateFormsScore(
    judgeScores: number[],
    judgeCount: 5 | 7,
    penalties = 0
): FormsScoreResult {
    if (judgeScores.length !== judgeCount) {
        throw new Error(`Expected ${judgeCount} scores, got ${judgeScores.length}`)
    }

    const sorted = [...judgeScores].sort((a, b) => a - b)
    let trimmedHigh: number
    let trimmedLow: number
    let trimmed: number[]

    if (judgeCount === 5) {
        // Remove 1 highest, 1 lowest
        trimmedLow = sorted[0] ?? 0
        trimmedHigh = sorted[sorted.length - 1] ?? 0
        trimmed = sorted.slice(1, -1) // 3 middle scores
    } else {
        // Remove 2 highest, 2 lowest
        trimmedLow = (sorted[0] ?? 0) + (sorted[1] ?? 0)
        trimmedHigh = (sorted[sorted.length - 1] ?? 0) + (sorted[sorted.length - 2] ?? 0)
        trimmed = sorted.slice(2, -2) // 3 middle scores
    }

    const average = trimmed.reduce((s, v) => s + v, 0) / trimmed.length
    const roundedAvg = Math.round(average * 100) / 100
    const finalScore = Math.max(0, Math.round((roundedAvg - penalties) * 100) / 100)

    return {
        judgeScores,
        trimmedHigh,
        trimmedLow,
        average: roundedAvg,
        totalScore: roundedAvg,
        penalties,
        finalScore,
    }
}

/**
 * Compare two forms scores for tiebreaking
 * Returns: -1 (a wins), 0 (tie), 1 (b wins)
 */
export function compareFormsScores(a: FormsScoreResult, b: FormsScoreResult): -1 | 0 | 1 {
    // 1. Compare final score
    if (a.finalScore > b.finalScore) return -1
    if (a.finalScore < b.finalScore) return 1

    // 2. Compare raw total (before trimming)
    const rawA = a.judgeScores.reduce((s, v) => s + v, 0)
    const rawB = b.judgeScores.reduce((s, v) => s + v, 0)
    if (rawA > rawB) return -1
    if (rawA < rawB) return 1

    // 3. Compare highest single score
    const maxA = a.judgeScores.length > 0 ? Math.max(...a.judgeScores) : 0
    const maxB = b.judgeScores.length > 0 ? Math.max(...b.judgeScores) : 0
    if (maxA > maxB) return -1
    if (maxA < maxB) return 1

    // Still tied
    return 0
}

// ══════════════════════════════════════════════════════════════
// DRAW / BRACKET ALGORITHM
// ══════════════════════════════════════════════════════════════

/**
 * Generate elimination bracket with seeding and team separation
 */
export function generateDraw(config: DrawConfig): BracketMatch[] {
    const { athletes, separateTeams, seedCount } = config

    // 1. Pad to nearest power of 2
    const bracketSize = nextPowerOf2(athletes.length)
    const byeCount = bracketSize - athletes.length

    // 2. Separate seeds and non-seeds
    const seeds = athletes
        .filter((a) => a.seed != null && a.seed > 0 && a.seed <= seedCount)
        .sort((a, b) => (a.seed ?? 0) - (b.seed ?? 0))

    const nonSeeds = athletes.filter(
        (a) => a.seed == null || a.seed <= 0 || a.seed > seedCount
    )

    // 3. Shuffle non-seeds (Fisher-Yates)
    const shuffled = [...nonSeeds]
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const temp = shuffled[j]
        if (temp) {
            shuffled[j] = shuffled[i]!
            shuffled[i] = temp
        }
    }

    // 4. If team separation, try to separate same-team athletes
    if (separateTeams) {
        separateByTeam(shuffled)
    }

    // 5. Place seeds at standard bracket positions
    const slots: (string | null)[] = new Array(bracketSize).fill(null)
    const seedPositions = getSeedPositions(bracketSize, seedCount)

    seeds.forEach((seed, idx) => {
        if (idx < seedPositions.length) {
            const pos = seedPositions[idx]
            if (pos !== undefined) slots[pos] = seed.id
        }
    })

    // 6. Fill remaining slots with shuffled athletes
    let shuffleIdx = 0
    for (let i = 0; i < slots.length; i++) {
        if (slots[i] === null && shuffleIdx < shuffled.length) {
            const shuffledAthlete = shuffled[shuffleIdx]
            if (shuffledAthlete) {
                slots[i] = shuffledAthlete.id
            }
            shuffleIdx++
        }
    }

    // 7. Generate matches
    const matches: BracketMatch[] = []
    for (let i = 0; i < bracketSize; i += 2) {
        const redId = slots[i] ?? null
        const blueId = slots[i + 1] ?? null

        matches.push({
            position: Math.floor(i / 2) + 1,
            round: 'R1',
            athleteRedId: redId,
            athleteBlueId: blueId,
            isBye: redId === null || blueId === null,
        })
    }

    return matches
}

// ── Helpers ─────────────────────────────────────────────────

function nextPowerOf2(n: number): number {
    let p = 1
    while (p < n) p *= 2
    return p
}

function getSeedPositions(bracketSize: number, seedCount: number): number[] {
    // Standard seeding: seed 1 at top, seed 2 at bottom
    // seed 3/4 in opposite halves, etc.
    if (seedCount === 0) return []

    const positions: number[] = [0, bracketSize - 1] // seed 1, seed 2

    if (seedCount >= 4) {
        const half = bracketSize / 2
        positions.push(half - 1, half) // seed 3, seed 4
    }

    if (seedCount >= 8) {
        const quarter = bracketSize / 4
        positions.push(
            quarter - 1,
            quarter,
            bracketSize - quarter - 1,
            bracketSize - quarter
        )
    }

    return positions.slice(0, seedCount)
}

function separateByTeam(athletes: Array<{ id: string; teamId: string }>): void {
    // Simple greedy team separation: try to not have same-team adjacent
    for (let i = 0; i < athletes.length - 1; i += 2) {
        const current = athletes[i]
        const next = athletes[i + 1]
        if (!current || !next) continue

        if (current.teamId === next.teamId) {
            // Find a swap partner further in the list
            for (let j = i + 2; j < athletes.length; j++) {
                const temp = athletes[j]
                if (temp) {
                    athletes[j] = athletes[i + 1]!
                    athletes[i + 1] = temp
                    break
                }
            }
        }
    }
}

// ══════════════════════════════════════════════════════════════
// VALIDATION RULES (Business Logic)
// ══════════════════════════════════════════════════════════════

export interface ValidationResult {
    valid: boolean
    errors: string[]
}

export function validateRegistration(
    athleteAge: number,
    athleteGender: 'nam' | 'nu',
    athleteWeight: number,
    eventGender: 'nam' | 'nu' | 'chung',
    ageGroupMin: number,
    ageGroupMax: number,
    weightMin?: number,
    weightMax?: number,
    currentRegCount = 0,
    maxEventsPerAthlete = 3,
    athleteStatus = 'da_duyet'
): ValidationResult {
    const errors: string[] = []

    // 1. Age vs age group
    if (athleteAge < ageGroupMin || athleteAge > ageGroupMax) {
        errors.push(`VĐV ${athleteAge} tuổi, hạng tuổi yêu cầu ${ageGroupMin}-${ageGroupMax}`)
    }

    // 2. Gender check
    if (eventGender !== 'chung' && eventGender !== athleteGender) {
        errors.push(`Nội dung chỉ dành cho ${eventGender === 'nam' ? 'Nam' : 'Nữ'}`)
    }

    // 3. Weight check (for combat)
    if (weightMin != null && weightMax != null) {
        if (athleteWeight < weightMin || athleteWeight > weightMax) {
            errors.push(`Cân nặng ${athleteWeight}kg không thuộc hạng ${weightMin}-${weightMax}kg`)
        }
    }

    // 4. Event quota
    if (currentRegCount >= maxEventsPerAthlete) {
        errors.push(`VĐV đã đăng ký tối đa ${maxEventsPerAthlete} nội dung`)
    }

    // 5. Athlete status
    if (athleteStatus !== 'da_duyet' && athleteStatus !== 'du_dieu_kien') {
        errors.push('VĐV chưa đủ điều kiện (thiếu hồ sơ)')
    }

    return { valid: errors.length === 0, errors }
}

export function validateWeighIn(
    actualWeight: number,
    weightMin: number,
    weightMax: number,
    tolerance = 0.5
): { passed: boolean; deviation: number } {
    const passed = actualWeight >= weightMin - tolerance && actualWeight <= weightMax + tolerance
    const midpoint = (weightMin + weightMax) / 2
    return { passed, deviation: Math.round((actualWeight - midpoint) * 10) / 10 }
}

// ══════════════════════════════════════════════════════════════
// STATE MACHINE
// ══════════════════════════════════════════════════════════════

type TransitionDef<S extends string> = {
    target: S
    guard?: (ctx: Record<string, unknown>) => true | string
}

type StateMachineDef<S extends string, A extends string> = Record<S, Partial<Record<A, TransitionDef<S>>>>

export function transition<S extends string, A extends string>(
    machine: StateMachineDef<S, A>,
    current: S,
    action: A,
    context: Record<string, unknown> = {}
): { next: S } | { error: string } {
    const stateTransitions = machine[current]
    if (!stateTransitions) return { error: `Trạng thái "${current}" không tồn tại` }

    const def = stateTransitions[action]
    if (!def) return { error: `Hành động "${action}" không hợp lệ ở trạng thái "${current}"` }

    if (def.guard) {
        const result = def.guard(context)
        if (result !== true) return { error: typeof result === 'string' ? result : 'Không thỏa điều kiện' }
    }

    return { next: def.target }
}

// ── Pre-defined State Machines ─────────────────────────────

export const teamStateMachine = {
    nhap: { submit: { target: 'cho_duyet' as const } },
    cho_duyet: { approve: { target: 'da_xac_nhan' as const }, reject: { target: 'tu_choi' as const }, supplement: { target: 'yeu_cau_bo_sung' as const } },
    yeu_cau_bo_sung: { resubmit: { target: 'cho_duyet' as const } },
    da_xac_nhan: { checkin: { target: 'da_checkin' as const } },
    da_checkin: {},
    tu_choi: { resubmit: { target: 'nhap' as const } },
} as const

export const matchStateMachine = {
    chua_dau: { start: { target: 'dang_dau' as const } },
    dang_dau: { end: { target: 'ket_thuc' as const }, pause: { target: 'tam_dung' as const } },
    tam_dung: { resume: { target: 'dang_dau' as const }, end: { target: 'ket_thuc' as const } },
    ket_thuc: {},
} as const

export const athleteStateMachine = {
    nhap: { submit: { target: 'cho_duyet' as const } },
    cho_duyet: { approve: { target: 'da_duyet' as const }, reject: { target: 'tu_choi' as const }, supplement: { target: 'yeu_cau_bo_sung' as const } },
    yeu_cau_bo_sung: { resubmit: { target: 'cho_duyet' as const } },
    da_duyet: { qualify: { target: 'du_dieu_kien' as const } },
    du_dieu_kien: {},
    tu_choi: { resubmit: { target: 'nhap' as const } },
} as const

export const appealStateMachine = {
    moi: { process: { target: 'dang_xu_ly' as const } },
    dang_xu_ly: { resolve: { target: 'da_xu_ly' as const }, reject: { target: 'tu_choi' as const } },
    da_xu_ly: {},
    tu_choi: {},
} as const
