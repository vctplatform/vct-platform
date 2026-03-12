'use client'
import React, { useState } from 'react'
import { VCT_Icons } from '../components/vct-icons'
import { VCT_PageContainer, VCT_SectionCard, VCT_EmptyState, VCT_Badge } from '../components/vct-ui'
import { ELearningCourse, CourseCertificate } from '@vct/shared-types'

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — ATHLETE E-LEARNING
// Học tập trực tuyến cho VĐV — courses, modules, certificates
// ═══════════════════════════════════════════════════════════════

const CATEGORY_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    quyen: { label: 'Bài quyền', color: '#ef4444', icon: <VCT_Icons.Award size={16} /> },
    ky_thuat: { label: 'Kỹ thuật', color: '#3b82f6', icon: <VCT_Icons.Activity size={16} /> },
    luat: { label: 'Luật thi đấu', color: '#f59e0b', icon: <VCT_Icons.Book size={16} /> },
    the_luc: { label: 'Thể lực', color: '#22c55e', icon: <VCT_Icons.TrendingUp size={16} /> },
    ly_thuyet: { label: 'Lý thuyết', color: '#8b5cf6', icon: <VCT_Icons.FileText size={16} /> },
}

const LEVEL_LABELS: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
    basic: { label: 'Cơ bản', variant: 'success' },
    intermediate: { label: 'Trung cấp', variant: 'warning' },
    advanced: { label: 'Nâng cao', variant: 'danger' },
}

// Mock courses data (in production would come from API)
const MOCK_COURSES: ELearningCourse[] = [
    {
        id: 'C-001', title: 'Bài quyền Thái Cực 1', description: 'Hướng dẫn chi tiết 24 động tác bài quyền Thái Cực Quyền cơ bản',
        category: 'quyen', level: 'basic', progress: 75, total_modules: 8, completed_modules: 6, instructor: 'Võ sư Nguyễn Văn An',
        modules: [
            { id: 'M1', title: 'Giới thiệu Thái Cực Quyền', type: 'video', duration_minutes: 12, completed: true },
            { id: 'M2', title: 'Tư thế chuẩn bị', type: 'video', duration_minutes: 8, completed: true },
            { id: 'M3', title: 'Động tác 1-6', type: 'video', duration_minutes: 15, completed: true },
            { id: 'M4', title: 'Động tác 7-12', type: 'video', duration_minutes: 15, completed: true },
            { id: 'M5', title: 'Tài liệu kỹ thuật', type: 'document', completed: true },
            { id: 'M6', title: 'Động tác 13-18', type: 'video', duration_minutes: 15, completed: true },
            { id: 'M7', title: 'Động tác 19-24', type: 'video', duration_minutes: 18, completed: false },
            { id: 'M8', title: 'Bài kiểm tra', type: 'quiz', completed: false },
        ],
    },
    {
        id: 'C-002', title: 'Luật thi đấu Vovinam 2024', description: 'Cập nhật quy định thi đấu mới nhất theo Luật 128/2024',
        category: 'luat', level: 'intermediate', progress: 40, total_modules: 5, completed_modules: 2, instructor: 'Trọng tài Trần Minh',
        modules: [
            { id: 'M1', title: 'Tổng quan luật mới', type: 'document', completed: true },
            { id: 'M2', title: 'Hệ thống tính điểm', type: 'video', duration_minutes: 20, completed: true },
            { id: 'M3', title: 'Lỗi và phạt', type: 'video', duration_minutes: 25, completed: false },
            { id: 'M4', title: 'Quy cách sàn đấu', type: 'document', completed: false },
            { id: 'M5', title: 'Bài thi cuối khóa', type: 'quiz', completed: false },
        ],
    },
    {
        id: 'C-003', title: 'Kỹ thuật đá chiến đấu', description: 'Nâng cao kỹ thuật đá đối kháng cho VĐV cấp tỉnh trở lên',
        category: 'ky_thuat', level: 'advanced', progress: 10, total_modules: 10, completed_modules: 1, instructor: 'HLV Lê Thanh Tùng',
        modules: [
            { id: 'M1', title: 'Đá tống trước', type: 'video', duration_minutes: 14, completed: true },
            { id: 'M2', title: 'Đá vòng cầu', type: 'video', duration_minutes: 16, completed: false },
            { id: 'M3', title: 'Đá cắt kéo', type: 'video', duration_minutes: 18, completed: false },
            { id: 'M4', title: 'Đá lướt', type: 'video', duration_minutes: 15, completed: false },
            { id: 'M5', title: 'Phân tích đòn phối hợp', type: 'document', completed: false },
            { id: 'M6', title: 'Quét chân', type: 'video', duration_minutes: 12, completed: false },
            { id: 'M7', title: 'Bay đá 2 chân', type: 'video', duration_minutes: 20, completed: false },
            { id: 'M8', title: 'Chiến thuật thi đấu', type: 'document', completed: false },
            { id: 'M9', title: 'Video phân tích trận đấu', type: 'video', duration_minutes: 30, completed: false },
            { id: 'M10', title: 'Bài thi tổng hợp', type: 'quiz', completed: false },
        ],
    },
    {
        id: 'C-004', title: 'Thể lực chuyên biệt VĐV', description: 'Chương trình tập luyện thể lực dành riêng cho VĐV thi đấu',
        category: 'the_luc', level: 'intermediate', progress: 60, total_modules: 6, completed_modules: 3, instructor: 'HLV Phạm Văn Dũng',
        modules: [
            { id: 'M1', title: 'Đánh giá thể lực ban đầu', type: 'quiz', completed: true },
            { id: 'M2', title: 'Bài tập sức bền', type: 'video', duration_minutes: 25, completed: true },
            { id: 'M3', title: 'Bài tập tốc độ', type: 'video', duration_minutes: 20, completed: true },
            { id: 'M4', title: 'Bài tập sức mạnh', type: 'video', duration_minutes: 22, completed: false },
            { id: 'M5', title: 'Chế độ dinh dưỡng', type: 'document', completed: false },
            { id: 'M6', title: 'Đánh giá cuối khóa', type: 'quiz', completed: false },
        ],
    },
]

const MOCK_CERTS: CourseCertificate[] = [
    { id: 'CERT-001', course_id: 'C-000', course_title: 'Bài quyền cơ bản nhập môn', issued_date: '2024-06-15', grade: 'Xuất sắc' },
    { id: 'CERT-002', course_id: 'C-000B', course_title: 'Luật thi đấu cơ bản 2023', issued_date: '2024-09-20', grade: 'Giỏi' },
]

const MODULE_ICON: Record<string, React.ReactNode> = {
    video: <VCT_Icons.Video size={14} />,
    document: <VCT_Icons.FileText size={14} />,
    quiz: <VCT_Icons.CheckCircle size={14} />,
}

/* ── Course Card ──────────────────────────────────────────── */

function CourseCard({ course, onSelect }: { course: ELearningCourse; onSelect: (c: ELearningCourse) => void }) {
    const cat = CATEGORY_CONFIG[course.category] ?? { label: course.category, color: '#8b5cf6', icon: <VCT_Icons.Book size={16} /> }
    const level = LEVEL_LABELS[course.level] ?? { label: course.level, variant: 'neutral' as const }

    return (
        <div onClick={() => onSelect(course)}
            className="p-5 rounded-2xl border border-vct-border bg-vct-elevated hover:border-vct-border-strong transition-all cursor-pointer group">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: `${cat.color}15`, color: cat.color }}>{cat.icon}</div>
                    <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: cat.color }}>{cat.label}</span>
                    </div>
                </div>
                <VCT_Badge variant={level.variant}>{level.label}</VCT_Badge>
            </div>

            {/* Title */}
            <h3 className="text-sm font-black text-vct-text m-0 mb-1 group-hover:text-vct-accent transition-colors">{course.title}</h3>
            <p className="text-[11px] text-vct-text-muted line-clamp-2 mb-3">{course.description}</p>

            {/* Progress */}
            <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-vct-text-muted">{course.completed_modules}/{course.total_modules} bài</span>
                <span className={`text-[10px] font-bold ${course.progress >= 100 ? 'text-emerald-500' : 'text-vct-text-muted'}`}>{course.progress}%</span>
            </div>
            <div className="h-1.5 bg-vct-border rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${course.progress}%`, background: course.progress >= 100 ? '#22c55e' : cat.color }} />
            </div>

            {/* Instructor */}
            <div className="flex items-center gap-1.5 mt-3 text-[10px] text-vct-text-muted">
                <VCT_Icons.User size={10} />
                <span>{course.instructor}</span>
            </div>
        </div>
    )
}

/* ── Main Component ────────────────────────────────────────── */

export function Page_athlete_elearning() {
    const [selectedCourse, setSelectedCourse] = useState<ELearningCourse | null>(null)
    const [filterCategory, setFilterCategory] = useState('all')

    const courses = MOCK_COURSES
    const certs = MOCK_CERTS

    const filteredCourses = filterCategory === 'all' ? courses : courses.filter(c => c.category === filterCategory)

    const totalProgress = courses.length > 0 ? Math.round(courses.reduce((sum, c) => sum + c.progress, 0) / courses.length) : 0

    return (
        <VCT_PageContainer size="wide" animated>
            {/* ══ HEADER ══ */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-vct-border">
                        <VCT_Icons.Laptop size={24} className="text-[#8b5cf6]" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-vct-text m-0">E-Learning</h1>
                        <p className="text-sm text-vct-text-muted mt-0.5">Học bài quyền, kỹ thuật và kiến thức võ thuật</p>
                    </div>
                </div>
            </div>

            {/* ══ OVERVIEW STATS ══ */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="p-4 rounded-2xl border border-vct-border bg-vct-elevated">
                    <div className="text-[10px] font-bold text-vct-text-muted uppercase tracking-wider mb-1">Khóa học</div>
                    <div className="text-2xl font-black text-vct-text">{courses.length}</div>
                </div>
                <div className="p-4 rounded-2xl border border-vct-border bg-vct-elevated">
                    <div className="text-[10px] font-bold text-vct-text-muted uppercase tracking-wider mb-1">Tiến độ TB</div>
                    <div className="text-2xl font-black text-[#8b5cf6]">{totalProgress}%</div>
                </div>
                <div className="p-4 rounded-2xl border border-vct-border bg-vct-elevated">
                    <div className="text-[10px] font-bold text-vct-text-muted uppercase tracking-wider mb-1">Hoàn thành</div>
                    <div className="text-2xl font-black text-emerald-500">{courses.filter(c => c.progress >= 100).length}</div>
                </div>
                <div className="p-4 rounded-2xl border border-vct-border bg-vct-elevated">
                    <div className="text-[10px] font-bold text-vct-text-muted uppercase tracking-wider mb-1">Chứng chỉ</div>
                    <div className="text-2xl font-black text-amber-500">{certs.length}</div>
                </div>
            </div>

            {/* ══ CATEGORY FILTER ══ */}
            <div className="flex flex-wrap gap-2 mb-6">
                {[{ key: 'all', label: 'Tất cả' }, ...Object.entries(CATEGORY_CONFIG).map(([key, v]) => ({ key, label: v.label }))].map(f => (
                    <button key={f.key} onClick={() => setFilterCategory(f.key)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filterCategory === f.key
                            ? 'bg-vct-accent text-white shadow-sm' : 'bg-vct-elevated border border-vct-border text-vct-text-muted hover:text-vct-text hover:border-vct-border-strong'
                            }`}>{f.label}
                    </button>
                ))}
            </div>

            {/* ══ COURSE GRID ══ */}
            {selectedCourse ? (
                /* ── Course Detail View ── */
                <div className="mb-6">
                    <button onClick={() => setSelectedCourse(null)}
                        className="flex items-center gap-1.5 text-xs font-bold text-vct-accent mb-4 hover:underline">
                        <VCT_Icons.Chevron size={14} style={{ transform: 'rotate(90deg)' }} /> Quay lại danh sách
                    </button>

                    <VCT_SectionCard
                        title={selectedCourse.title}
                        icon={CATEGORY_CONFIG[selectedCourse.category]?.icon || <VCT_Icons.Book size={20} />}
                        accentColor={CATEGORY_CONFIG[selectedCourse.category]?.color || '#8b5cf6'}
                        className="border border-vct-border"
                    >
                        <p className="text-sm text-vct-text-muted mb-4">{selectedCourse.description}</p>

                        {/* Progress */}
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-vct-text-muted">{selectedCourse.completed_modules}/{selectedCourse.total_modules} bài hoàn thành</span>
                            <span className="text-xs font-bold text-vct-text">{selectedCourse.progress}%</span>
                        </div>
                        <div className="h-2 bg-vct-border rounded-full overflow-hidden mb-6">
                            <div className="h-full rounded-full transition-all duration-700"
                                style={{ width: `${selectedCourse.progress}%`, background: CATEGORY_CONFIG[selectedCourse.category]?.color || '#8b5cf6' }} />
                        </div>

                        {/* Module List */}
                        <div className="space-y-2">
                            {selectedCourse.modules.map((m, idx) => (
                                <div key={m.id} className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer hover:border-vct-border-strong ${m.completed ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-vct-bg border-vct-border'}`}>
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${m.completed ? 'bg-emerald-500 text-white' : 'bg-vct-border text-vct-text-muted'}`}>
                                        {m.completed ? <VCT_Icons.Check size={14} /> : idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className={`text-xs font-bold ${m.completed ? 'text-emerald-600' : 'text-vct-text'}`}>{m.title}</div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className="text-[10px] text-vct-text-muted flex items-center gap-1">{MODULE_ICON[m.type]} {m.type === 'video' ? 'Video' : m.type === 'quiz' ? 'Bài thi' : 'Tài liệu'}</span>
                                            {m.duration_minutes && <span className="text-[10px] text-vct-text-muted">{m.duration_minutes} phút</span>}
                                        </div>
                                    </div>
                                    {m.completed && <VCT_Icons.CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />}
                                </div>
                            ))}
                        </div>

                        {/* Instructor */}
                        <div className="mt-4 pt-4 border-t border-vct-border flex items-center gap-2 text-xs text-vct-text-muted">
                            <VCT_Icons.User size={14} />
                            <span>Giảng viên: <span className="font-bold text-vct-text">{selectedCourse.instructor}</span></span>
                        </div>
                    </VCT_SectionCard>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {filteredCourses.map(c => <CourseCard key={c.id} course={c} onSelect={setSelectedCourse} />)}
                    {filteredCourses.length === 0 && (
                        <div className="col-span-full py-8">
                            <VCT_EmptyState icon={<VCT_Icons.Book size={48} />} title="Không có khóa học" description="Chưa có khóa học nào trong danh mục này." />
                        </div>
                    )}
                </div>
            )}

            {/* ══ CERTIFICATES ══ */}
            <VCT_SectionCard
                title="Chứng chỉ đã đạt"
                icon={<VCT_Icons.Award size={20} />}
                accentColor="#f59e0b"
                className="border border-vct-border"
            >
                {certs.length === 0 ? (
                    <VCT_EmptyState icon={<VCT_Icons.Award size={40} />} title="Chưa có chứng chỉ" description="Hoàn thành khóa học để nhận chứng chỉ." />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {certs.map(cert => (
                            <div key={cert.id} className="flex items-center gap-4 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40 transition-all">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/30 to-yellow-500/30 flex items-center justify-center text-2xl flex-shrink-0">🏅</div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-bold text-vct-text truncate">{cert.course_title}</div>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] text-vct-text-muted">{cert.issued_date}</span>
                                        {cert.grade && <VCT_Badge variant="success">{cert.grade}</VCT_Badge>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </VCT_SectionCard>
        </VCT_PageContainer>
    )
}
