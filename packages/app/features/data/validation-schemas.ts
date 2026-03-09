/**
 * VCT Zod Validation Schemas
 * 
 * Centralized validation for all VCT entities.
 * Uses enum arrays from @vct/shared-types for type safety.
 * Used with React Hook Form via @hookform/resolvers/zod.
 */

import { z } from 'zod'

const toZodEnum = <T extends string>(arr: readonly T[]): [T, ...T[]] => arr as unknown as [T, ...T[]]

import {
    TRANG_THAI_GIAI_VALUES,
    TRANG_THAI_DOAN_VALUES,
    TRANG_THAI_VDV_VALUES,
    LOAI_SAN_VALUES,
    CAP_BAC_TT_VALUES,
    CHUYEN_MON_TT_VALUES,
    VONG_DAU_VALUES,
    TRANG_THAI_TRAN_DAU_VALUES,
    TRANG_THAI_KN_VALUES,
    LOAI_NOI_DUNG_VALUES,
    GIOI_TINH_VALUES,
    KET_QUA_CAN_VALUES,
} from '@vct/shared-types'

/* ═══════════════════════════════════════════════════════════════
   SHARED VALIDATORS
   ═══════════════════════════════════════════════════════════════ */

const requiredString = (field: string) =>
    z.string().min(1, `${field} là bắt buộc`).trim()

const phoneVN = z
    .string()
    .regex(/^(0|\+84)\d{9,10}$/, 'Số điện thoại không hợp lệ')
    .optional()
    .or(z.literal(''))

const emailOptional = z
    .string()
    .email('Email không hợp lệ')
    .optional()
    .or(z.literal(''))

/* ═══════════════════════════════════════════════════════════════
   TOURNAMENT (Giải đấu)
   ═══════════════════════════════════════════════════════════════ */

export const tournamentSchema = z.object({
    name: requiredString('Tên giải đấu'),
    shortName: z.string().max(20, 'Tối đa 20 ký tự').optional(),
    startDate: z.string().min(1, 'Ngày bắt đầu là bắt buộc'),
    endDate: z.string().min(1, 'Ngày kết thúc là bắt buộc'),
    location: requiredString('Địa điểm'),
    organizerName: requiredString('Đơn vị tổ chức'),
    status: z.enum(toZodEnum(TRANG_THAI_GIAI_VALUES)),
    maxTeams: z.number().min(2, 'Tối thiểu 2 đoàn').max(100, 'Tối đa 100 đoàn').optional(),
    description: z.string().max(2000, 'Tối đa 2000 ký tự').optional(),
}).refine((d) => d.endDate >= d.startDate, {
    message: 'Ngày kết thúc phải sau ngày bắt đầu',
    path: ['endDate'],
})

export type TournamentFormData = z.infer<typeof tournamentSchema>

/* ═══════════════════════════════════════════════════════════════
   TEAM (Đoàn / CLB)
   ═══════════════════════════════════════════════════════════════ */

export const teamSchema = z.object({
    name: requiredString('Tên đoàn'),
    shortName: z.string().max(10, 'Tối đa 10 ký tự').optional(),
    province: requiredString('Tỉnh/Thành'),
    coachName: requiredString('Tên HLV trưởng'),
    coachPhone: phoneVN,
    coachEmail: emailOptional,
    managerName: z.string().optional(),
    managerPhone: phoneVN,
    status: z.enum(toZodEnum(TRANG_THAI_DOAN_VALUES)).default('nhap'),
})

export type TeamFormData = z.infer<typeof teamSchema>

/* ═══════════════════════════════════════════════════════════════
   ATHLETE (Vận động viên)
   ═══════════════════════════════════════════════════════════════ */

export const athleteSchema = z.object({
    fullName: requiredString('Họ tên VĐV'),
    dateOfBirth: z.string().min(1, 'Ngày sinh là bắt buộc'),
    gender: z.enum(toZodEnum(GIOI_TINH_VALUES), { message: 'Chọn giới tính' }),
    weight: z.number().min(20, 'Cân nặng tối thiểu 20kg').max(200, 'Cân nặng tối đa 200kg'),
    height: z.number().min(100, 'Chiều cao tối thiểu 100cm').max(250, 'Chiều cao tối đa 250cm').optional(),
    idNumber: z.string().min(9, 'CCCD tối thiểu 9 số').max(12, 'CCCD tối đa 12 số').optional(),
    teamId: requiredString('Đoàn'),
    photoUrl: z.string().url('URL ảnh không hợp lệ').optional().or(z.literal('')),
    status: z.enum(toZodEnum(TRANG_THAI_VDV_VALUES)).default('nhap'),
    medicalClearance: z.boolean().default(false),
    insuranceDoc: z.boolean().default(false),
})

export type AthleteFormData = z.infer<typeof athleteSchema>

/* ═══════════════════════════════════════════════════════════════
   EVENT / CATEGORY (Nội dung thi đấu)
   ═══════════════════════════════════════════════════════════════ */

export const eventSchema = z.object({
    name: requiredString('Tên nội dung'),
    type: z.enum(toZodEnum([...LOAI_NOI_DUNG_VALUES, 'song_luyen', 'dong_luyen', 'binh_khi', 'tu_chon']), {
        message: 'Chọn loại nội dung',
    }),
    gender: z.enum(toZodEnum([...GIOI_TINH_VALUES, 'chung']), { message: 'Chọn giới tính' }),
    ageGroupMin: z.number().min(6, 'Tuổi tối thiểu 6').max(99),
    ageGroupMax: z.number().min(6).max(99),
    weightMin: z.number().min(0).optional(),
    weightMax: z.number().min(0).optional(),
    maxParticipants: z.number().min(2, 'Tối thiểu 2 VĐV').optional(),
    judgingType: z.enum(['score_combat', 'score_forms']).default('score_combat'),
}).refine((d) => d.ageGroupMax >= d.ageGroupMin, {
    message: 'Tuổi tối đa phải >= tuổi tối thiểu',
    path: ['ageGroupMax'],
}).refine((d) => {
    if (d.weightMin != null && d.weightMax != null) {
        return d.weightMax >= d.weightMin
    }
    return true
}, {
    message: 'Cân nặng tối đa phải >= cân nặng tối thiểu',
    path: ['weightMax'],
})

export type EventFormData = z.infer<typeof eventSchema>

/* ═══════════════════════════════════════════════════════════════
   MATCH (Trận đấu)
   ═══════════════════════════════════════════════════════════════ */

export const matchSchema = z.object({
    eventId: requiredString('Nội dung'),
    athleteRedId: requiredString('VĐV góc đỏ'),
    athleteBlueId: requiredString('VĐV góc xanh'),
    round: z.enum(toZodEnum([...VONG_DAU_VALUES, 'tranh_3']), {
        message: 'Chọn vòng đấu',
    }),
    arenaId: z.string().optional(),
    scheduledTime: z.string().optional(),
    status: z.enum(toZodEnum(TRANG_THAI_TRAN_DAU_VALUES)).default('chua_dau'),
}).refine((d) => d.athleteRedId !== d.athleteBlueId, {
    message: 'Hai VĐV phải khác nhau',
    path: ['athleteBlueId'],
})

export type MatchFormData = z.infer<typeof matchSchema>

/* ═══════════════════════════════════════════════════════════════
   SCORE (Điểm)
   ═══════════════════════════════════════════════════════════════ */

export const combatRoundScoreSchema = z.object({
    round: z.number().min(1).max(5),
    red: z.number().min(0, 'Điểm không được âm'),
    blue: z.number().min(0, 'Điểm không được âm'),
    penaltiesRed: z.number().min(0).default(0),
    penaltiesBlue: z.number().min(0).default(0),
})

export const formsScoreSchema = z.object({
    judgeId: requiredString('Trọng tài'),
    score: z.number().min(0, 'Điểm tối thiểu 0').max(10, 'Điểm tối đa 10'),
    penalties: z.number().min(0).default(0),
})

export type CombatRoundScoreData = z.infer<typeof combatRoundScoreSchema>
export type FormsScoreData = z.infer<typeof formsScoreSchema>

/* ═══════════════════════════════════════════════════════════════
   ARENA (Sân đấu)
   ═══════════════════════════════════════════════════════════════ */

export const arenaSchema = z.object({
    name: requiredString('Tên sân đấu'),
    type: z.enum(toZodEnum(LOAI_SAN_VALUES)),
    location: z.string().optional(),
    capacity: z.number().min(0).optional(),
})

export type ArenaFormData = z.infer<typeof arenaSchema>

/* ═══════════════════════════════════════════════════════════════
   REFEREE (Trọng tài)
   ═══════════════════════════════════════════════════════════════ */

export const refereeSchema = z.object({
    fullName: requiredString('Họ tên trọng tài'),
    level: z.enum(toZodEnum(CAP_BAC_TT_VALUES), { message: 'Chọn cấp bậc' }),
    phone: phoneVN,
    email: emailOptional,
    specialization: z.enum(toZodEnum(CHUYEN_MON_TT_VALUES)).default('ca_hai'),
})

export type RefereeFormData = z.infer<typeof refereeSchema>

/* ═══════════════════════════════════════════════════════════════
   APPEAL (Khiếu nại)
   ═══════════════════════════════════════════════════════════════ */

export const appealSchema = z.object({
    matchId: requiredString('Trận đấu'),
    teamId: requiredString('Đoàn khiếu nại'),
    reason: requiredString('Lý do').min(10, 'Lý do phải ít nhất 10 ký tự'),
    evidence: z.string().optional(),
    depositPaid: z.boolean().refine((v) => v === true, 'Phải nộp phí khiếu nại'),
    status: z.enum(toZodEnum(TRANG_THAI_KN_VALUES)).default('moi'),
})

export type AppealFormData = z.infer<typeof appealSchema>

/* ═══════════════════════════════════════════════════════════════
   WEIGH-IN (Cân ký)
   ═══════════════════════════════════════════════════════════════ */

export const weighInSchema = z.object({
    athleteId: requiredString('VĐV'),
    eventId: requiredString('Nội dung'),
    actualWeight: z.number().min(20, 'Cân nặng tối thiểu 20kg').max(200, 'Cân nặng tối đa 200kg'),
    weigInTime: z.string().optional(),
    passed: z.boolean(),
    notes: z.string().max(500).optional(),
})

export type WeighInFormData = z.infer<typeof weighInSchema>

/* ═══════════════════════════════════════════════════════════════
   SCHEDULE (Lịch thi đấu)
   ═══════════════════════════════════════════════════════════════ */

export const scheduleSlotSchema = z.object({
    matchId: requiredString('Trận đấu'),
    arenaId: requiredString('Sân đấu'),
    startTime: z.string().min(1, 'Giờ bắt đầu là bắt buộc'),
    endTime: z.string().min(1, 'Giờ kết thúc là bắt buộc'),
}).refine((d) => d.endTime > d.startTime, {
    message: 'Giờ kết thúc phải sau giờ bắt đầu',
    path: ['endTime'],
})

export type ScheduleSlotData = z.infer<typeof scheduleSlotSchema>

/* ═══════════════════════════════════════════════════════════════
   TRAINING (Đào tạo)
   ═══════════════════════════════════════════════════════════════ */

export const trainingPlanSchema = z.object({
    name: requiredString('Tên kế hoạch'),
    startDate: z.string().min(1, 'Ngày bắt đầu là bắt buộc'),
    endDate: z.string().min(1, 'Ngày kết thúc là bắt buộc'),
    status: z.enum(['draft', 'active', 'completed', 'paused']).default('draft'),
    sessionsPerWeek: z.number().min(1, 'Tối thiểu 1 buổi/tuần').max(14, 'Tối đa 14 buổi/tuần'),
}).refine((d) => d.endDate >= d.startDate, {
    message: 'Ngày kết thúc phải sau ngày bắt đầu',
    path: ['endDate'],
})

export type TrainingPlanFormData = z.infer<typeof trainingPlanSchema>

export const beltExamSchema = z.object({
    date: z.string().min(1, 'Ngày thi là bắt buộc'),
    targetBelt: requiredString('Cấp đai mục tiêu'),
    location: z.string().optional(),
    status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).default('scheduled'),
})

export type BeltExamFormData = z.infer<typeof beltExamSchema>

/* ═══════════════════════════════════════════════════════════════
   HERITAGE (Di sản / Môn phái)
   ═══════════════════════════════════════════════════════════════ */

export const martialSchoolSchema = z.object({
    name_vi: requiredString('Tên môn phái'),
    founder: z.string().optional(),
    founding_year: z.number().min(1000).max(new Date().getFullYear()).optional(),
    origin_location: z.string().optional(),
    isActive: z.boolean().default(true),
})

export type MartialSchoolFormData = z.infer<typeof martialSchoolSchema>

/* ═══════════════════════════════════════════════════════════════
   COMMUNITY (Cộng đồng)
   ═══════════════════════════════════════════════════════════════ */

export const groupSchema = z.object({
    name: requiredString('Tên nhóm'),
    category: z.enum(['mon_phai', 'vung', 'so_thich', 'giai_dau', 'other']),
    description: z.string().max(2000).optional(),
    isPublic: z.boolean().default(true),
})

export type GroupFormData = z.infer<typeof groupSchema>

export const marketplaceListingSchema = z.object({
    title: requiredString('Tiêu đề'),
    description: requiredString('Mô tả'),
    category: z.enum(['trang_phuc', 'dung_cu', 'tai_lieu', 'khac']),
    condition: z.enum(['moi', 'nhu_moi', 'da_su_dung', 'can_sua']),
    price: z.number().min(0, 'Giá không được âm'),
    isNegotiable: z.boolean().default(false),
})

export type MarketplaceListingFormData = z.infer<typeof marketplaceListingSchema>

/* ═══════════════════════════════════════════════════════════════
   FINANCE (Tài chính)
   ═══════════════════════════════════════════════════════════════ */

export const feeScheduleSchema = z.object({
    name: requiredString('Tên khoản phí'),
    type: z.enum(['hoc_phi', 'le_phi_giai', 'thi_dai', 'bao_hiem', 'other']),
    amount: z.number().min(0, 'Số tiền không được âm'),
    currency: z.string().default('VND'),
    period: z.enum(['monthly', 'quarterly', 'yearly', 'one_time']).optional(),
    effectiveFrom: z.string().min(1, 'Ngày áp dụng là bắt buộc'),
})

export type FeeScheduleFormData = z.infer<typeof feeScheduleSchema>

export const paymentSchema = z.object({
    amount: z.number().min(0, 'Số tiền không được âm'),
    method: z.enum(['cash', 'bank_transfer', 'momo', 'vnpay', 'zalopay', 'other']),
    referenceNumber: z.string().optional(),
    notes: z.string().optional(),
})

export type PaymentFormData = z.infer<typeof paymentSchema>

/* ═══════════════════════════════════════════════════════════════
   LOGIN
   ═══════════════════════════════════════════════════════════════ */

export const loginSchema = z.object({
    username: requiredString('Tên đăng nhập').min(3, 'Tối thiểu 3 ký tự'),
    password: requiredString('Mật khẩu').min(6, 'Mật khẩu tối thiểu 6 ký tự'),
})

export type LoginFormData = z.infer<typeof loginSchema>

export const registerSchema = z.object({
    username: requiredString('Tên đăng nhập').min(3, 'Tối thiểu 3 ký tự').max(30),
    password: requiredString('Mật khẩu').min(8, 'Mật khẩu tối thiểu 8 ký tự'),
    confirmPassword: requiredString('Xác nhận mật khẩu'),
    fullName: requiredString('Họ tên'),
    email: z.string().email('Email không hợp lệ'),
    role: z.enum(['admin', 'referee', 'team_lead', 'medical', 'spectator']),
}).refine((d) => d.password === d.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
})

export type RegisterFormData = z.infer<typeof registerSchema>
