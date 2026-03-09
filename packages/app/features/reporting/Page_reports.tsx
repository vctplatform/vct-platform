'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    VCT_Text, VCT_Card, VCT_Button, VCT_Badge,
} from 'app/features/components/vct-ui'
import {
    VCT_BarChart, VCT_HorizontalBarChart, VCT_DonutChart,
    VCT_StatCard, VCT_ChartProgressBar,
} from 'app/features/components/vct-charts'
import {
    PrintCertificate, PrintMatchReport, PrintMedalTable,
    PrintAthleteBadge, PrintWeighInReport,
} from 'app/features/reporting/print-templates'

/* ═══════════════════════════════════════════════════════════════
   DEMO DATA
   ═══════════════════════════════════════════════════════════════ */

const STATS_DATA = {
    totalAthletes: 248,
    totalTeams: 18,
    totalMatches: 72,
    matchesCompleted: 45,
    medalGold: 24,
    medalSilver: 24,
    medalBronze: 48,
}

const MEDALS_BY_TEAM = [
    { label: 'TP.HCM', value: 12, color: '#ef4444' },
    { label: 'Hà Nội', value: 10, color: '#3b82f6' },
    { label: 'Bình Định', value: 8, color: '#22c55e' },
    { label: 'Đà Nẵng', value: 6, color: '#f59e0b' },
    { label: 'Bình Dương', value: 5, color: '#8b5cf6' },
    { label: 'Cần Thơ', value: 4, color: '#ec4899' },
]

const ATHLETES_BY_CATEGORY = [
    { label: 'ĐK Nam', value: 48 },
    { label: 'ĐK Nữ', value: 32 },
    { label: 'Quyền', value: 56 },
    { label: 'Song luyện', value: 24 },
    { label: 'Đ.luyện', value: 36 },
    { label: 'Binh khí', value: 28 },
    { label: 'Tự chọn', value: 24 },
]

const MATCH_STATUS_DONUT = [
    { label: 'Hoàn tất', value: 45, color: '#22c55e' },
    { label: 'Đang đấu', value: 4, color: '#00bcd4' },
    { label: 'Chưa đấu', value: 23, color: '#94a3b8' },
]

const MEDAL_TABLE = [
    { rank: 1, team: 'TP. Hồ Chí Minh', gold: 5, silver: 3, bronze: 6, total: 14 },
    { rank: 2, team: 'Hà Nội', gold: 4, silver: 4, bronze: 5, total: 13 },
    { rank: 3, team: 'Bình Định', gold: 3, silver: 3, bronze: 4, total: 10 },
    { rank: 4, team: 'Đà Nẵng', gold: 3, silver: 2, bronze: 3, total: 8 },
    { rank: 5, team: 'Bình Dương', gold: 2, silver: 3, bronze: 4, total: 9 },
    { rank: 6, team: 'Cần Thơ', gold: 2, silver: 2, bronze: 3, total: 7 },
    { rank: 7, team: 'Nghệ An', gold: 1, silver: 3, bronze: 5, total: 9 },
    { rank: 8, team: 'Thanh Hóa', gold: 1, silver: 2, bronze: 4, total: 7 },
    { rank: 9, team: 'Khánh Hòa', gold: 1, silver: 1, bronze: 3, total: 5 },
    { rank: 10, team: 'Đồng Nai', gold: 1, silver: 1, bronze: 2, total: 4 },
]

const DEMO_MATCH_REPORT = {
    matchId: 'DK-M-56-R2-003',
    category: 'Đối kháng Nam',
    weightClass: '56-60kg',
    round: 'Bán kết',
    arena: 'Sân A1',
    date: '09/03/2026',
    athleteRed: 'Nguyễn Văn A',
    teamRed: 'Hà Nội',
    athleteBlue: 'Lê Văn C',
    teamBlue: 'Đà Nẵng',
    rounds: [
        { round: 1, red: 5, blue: 3 },
        { round: 2, red: 4, blue: 4 },
        { round: 3, red: 3, blue: 1 },
    ],
    totalRed: 12,
    totalBlue: 8,
    penaltiesRed: 0,
    penaltiesBlue: 1,
    winner: 'Nguyễn Văn A',
    winnerCorner: 'red' as const,
    reason: 'Thắng điểm',
    referees: ['TT. Trần Minh Đức', 'TT. Nguyễn Hòa Bình', 'TT. Phạm Quốc Hùng'],
}

const DEMO_WEIGH_IN = [
    { stt: 1, name: 'Nguyễn Văn A', team: 'Hà Nội', weightClass: '56-60kg', actualWeight: 58.2, result: 'dat' as const },
    { stt: 2, name: 'Trần Văn B', team: 'TP.HCM', weightClass: '56-60kg', actualWeight: 59.8, result: 'dat' as const },
    { stt: 3, name: 'Lê Văn C', team: 'Đà Nẵng', weightClass: '56-60kg', actualWeight: 60.8, result: 'khong_dat' as const },
    { stt: 4, name: 'Phạm Văn D', team: 'Bình Định', weightClass: '60-65kg', actualWeight: 63.5, result: 'dat' as const },
    { stt: 5, name: 'Hoàng Văn E', team: 'Bình Dương', weightClass: '60-65kg', actualWeight: 62.1, result: 'dat' as const },
]

/* ═══════════════════════════════════════════════════════════════
   PAGE COMPONENT
   ═══════════════════════════════════════════════════════════════ */

type Tab = 'dashboard' | 'medal-table' | 'match-report' | 'certificates' | 'weigh-in'

export function Page_Reports() {
    const [activeTab, setActiveTab] = useState<Tab>('dashboard')
    const [previewTemplate, setPreviewTemplate] = useState<string | null>(null)

    const tabs: { id: Tab; label: string; icon: string }[] = [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'medal-table', label: 'Huy chương', icon: '🏅' },
        { id: 'match-report', label: 'Biên bản', icon: '📄' },
        { id: 'certificates', label: 'Chứng nhận', icon: '🎖️' },
        { id: 'weigh-in', label: 'Cân ký', icon: '⚖️' },
    ]

    return (
        <div className="min-h-screen" style={{ background: 'var(--vct-bg-base)' }}>
            {/* Header */}
            <div className="px-6 py-5" style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)' }}>
                <div className="flex items-center justify-between max-w-7xl mx-auto">
                    <div>
                        <VCT_Text variant="h1" style={{ color: '#fff', margin: 0 }}>📊 Báo cáo & Xuất dữ liệu</VCT_Text>
                        <VCT_Text variant="small" style={{ color: 'rgba(255,255,255,0.6)' }}>
                            Giải Vovinam Toàn Quốc 2026 · Dashboard & Print Templates
                        </VCT_Text>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex gap-1 py-3 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className="px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all"
                            style={{
                                background: activeTab === tab.id ? 'var(--vct-accent-cyan)' : 'transparent',
                                color: activeTab === tab.id ? '#fff' : 'var(--vct-text-secondary)',
                                border: 'none',
                                cursor: 'pointer',
                            }}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 pb-8">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                    >
                        {activeTab === 'dashboard' && <DashboardTab />}
                        {activeTab === 'medal-table' && <MedalTableTab />}
                        {activeTab === 'match-report' && <MatchReportTab />}
                        {activeTab === 'certificates' && <CertificatesTab />}
                        {activeTab === 'weigh-in' && <WeighInTab />}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════
   DASHBOARD TAB
   ═══════════════════════════════════════════════════════════════ */

function DashboardTab() {
    return (
        <div className="grid gap-6">
            {/* KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <VCT_StatCard label="Tổng VĐV" value={STATS_DATA.totalAthletes} icon="🏋️" color="#00bcd4" trend={{ value: 12, label: 'vs 2025' }} />
                <VCT_StatCard label="Đội tham gia" value={STATS_DATA.totalTeams} icon="👥" color="#7c3aed" />
                <VCT_StatCard label="Trận đã đấu" value={`${STATS_DATA.matchesCompleted}/${STATS_DATA.totalMatches}`} icon="⚔️" color="#22c55e" />
                <VCT_StatCard label="Tổng huy chương" value={STATS_DATA.medalGold + STATS_DATA.medalSilver + STATS_DATA.medalBronze} icon="🏅" color="#f59e0b" />
            </div>

            {/* Progress */}
            <VCT_Card>
                <div className="p-4">
                    <VCT_Text variant="h3" style={{ marginBottom: 12 }}>Tiến độ giải đấu</VCT_Text>
                    <div className="grid gap-3">
                        <VCT_ChartProgressBar label="Trận đấu hoàn thành" value={45} max={72} color="#22c55e" />
                        <VCT_ChartProgressBar label="Đăng ký VĐV" value={248} max={300} color="#00bcd4" />
                        <VCT_ChartProgressBar label="Cân ký xong" value={180} max={248} color="#7c3aed" />
                        <VCT_ChartProgressBar label="Phát huy chương" value={72} max={96} color="#f59e0b" />
                    </div>
                </div>
            </VCT_Card>

            {/* Charts Row */}
            <div className="grid md:grid-cols-2 gap-4">
                <VCT_Card>
                    <div className="p-4">
                        <VCT_BarChart data={ATHLETES_BY_CATEGORY} title="VĐV theo nội dung" height={220} />
                    </div>
                </VCT_Card>
                <VCT_Card>
                    <div className="p-4">
                        <VCT_DonutChart data={MATCH_STATUS_DONUT} title="Trạng thái trận đấu" centerLabel={`${STATS_DATA.totalMatches}`} />
                    </div>
                </VCT_Card>
            </div>

            {/* Medal Breakdown */}
            <VCT_Card>
                <div className="p-4">
                    <VCT_HorizontalBarChart data={MEDALS_BY_TEAM} title="Top 6 tổng huy chương theo đoàn" />
                </div>
            </VCT_Card>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════
   MEDAL TABLE TAB
   ═══════════════════════════════════════════════════════════════ */

function MedalTableTab() {
    return (
        <div className="grid gap-4">
            <div className="flex items-center justify-between">
                <VCT_Text variant="h2">Bảng tổng sắp huy chương</VCT_Text>
                <VCT_Button variant="secondary" size="sm" onClick={() => window.print()}>
                    🖨️ In bảng
                </VCT_Button>
            </div>

            {/* On-screen table */}
            <VCT_Card>
                <div className="overflow-x-auto">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                {['Hạng', 'Đoàn', '🥇 Vàng', '🥈 Bạc', '🥉 Đồng', 'Tổng'].map((h) => (
                                    <th key={h} style={{
                                        padding: '10px 14px', textAlign: h === 'Đoàn' ? 'left' : 'center',
                                        borderBottom: '2px solid var(--vct-border-subtle)',
                                        fontSize: 13, fontWeight: 700, color: 'var(--vct-text-secondary)',
                                    }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {MEDAL_TABLE.map((row) => (
                                <motion.tr
                                    key={row.rank}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: row.rank * 0.05 }}
                                    style={{
                                        background: row.rank <= 3 ? 'rgba(250,204,21,0.05)' : undefined,
                                    }}
                                >
                                    <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: row.rank <= 3 ? 800 : 400, fontSize: row.rank <= 3 ? 16 : 14, color: 'var(--vct-text-primary)' }}>
                                        {row.rank <= 3 ? ['🥇', '🥈', '🥉'][row.rank - 1] : row.rank}
                                    </td>
                                    <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--vct-text-primary)' }}>{row.team}</td>
                                    <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#b45309' }}>{row.gold}</td>
                                    <td style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--vct-text-secondary)' }}>{row.silver}</td>
                                    <td style={{ padding: '10px 14px', textAlign: 'center', color: '#92400e' }}>{row.bronze}</td>
                                    <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: 'var(--vct-text-primary)' }}>{row.total}</td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </VCT_Card>

            {/* Hidden print version */}
            <div className="hidden print:block">
                <PrintMedalTable data={MEDAL_TABLE} tournamentName="Giải Vovinam Toàn Quốc 2026" />
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════
   MATCH REPORT TAB
   ═══════════════════════════════════════════════════════════════ */

function MatchReportTab() {
    const [showPreview, setShowPreview] = useState(false)

    return (
        <div className="grid gap-4">
            <div className="flex items-center justify-between">
                <VCT_Text variant="h2">Biên bản trận đấu</VCT_Text>
                <div className="flex gap-2">
                    <VCT_Button variant="secondary" size="sm" onClick={() => setShowPreview(!showPreview)}>
                        {showPreview ? '← Danh sách' : '👁️ Xem mẫu'}
                    </VCT_Button>
                    <VCT_Button variant="primary" size="sm" onClick={() => window.print()}>
                        🖨️ In
                    </VCT_Button>
                </div>
            </div>

            {showPreview ? (
                <div className="overflow-auto rounded-xl" style={{ border: '1px solid var(--vct-border-subtle)', background: '#fff' }}>
                    <PrintMatchReport data={DEMO_MATCH_REPORT} />
                </div>
            ) : (
                <div className="grid gap-3">
                    {[
                        { id: 'DK-M-56-R2-003', red: 'Nguyễn Văn A', blue: 'Lê Văn C', cat: 'ĐK Nam 56-60kg', round: 'Bán kết', status: 'done' },
                        { id: 'DK-M-56-R2-004', red: 'Trần Văn B', blue: 'Phạm Văn D', cat: 'ĐK Nam 56-60kg', round: 'Bán kết', status: 'done' },
                        { id: 'DK-F-52-R1-001', red: 'Lê Thị E', blue: 'Nguyễn Thị F', cat: 'ĐK Nữ 52-56kg', round: 'Tứ kết', status: 'live' },
                        { id: 'DK-M-65-R1-002', red: 'Hoàng Văn G', blue: 'Vũ Văn H', cat: 'ĐK Nam 65-70kg', round: 'Vòng loại', status: 'pending' },
                    ].map((m) => (
                        <VCT_Card key={m.id}>
                            <div className="p-4 flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <VCT_Text variant="body" style={{ fontWeight: 700 }}>{m.id}</VCT_Text>
                                        <VCT_Badge
                                            type={m.status === 'done' ? 'success' : m.status === 'live' ? 'warning' : 'info'}
                                            text={m.status === 'done' ? 'Hoàn tất' : m.status === 'live' ? 'Đang đấu' : 'Chưa đấu'}
                                        />
                                    </div>
                                    <VCT_Text variant="small" style={{ color: 'var(--vct-text-secondary)' }}>
                                        {m.cat} · {m.round}
                                    </VCT_Text>
                                    <VCT_Text variant="small" style={{ color: 'var(--vct-text-tertiary)' }}>
                                        🔴 {m.red} vs 🔵 {m.blue}
                                    </VCT_Text>
                                </div>
                                {m.status === 'done' && (
                                    <VCT_Button variant="ghost" size="sm" onClick={() => setShowPreview(true)}>
                                        📄 Xem biên bản
                                    </VCT_Button>
                                )}
                            </div>
                        </VCT_Card>
                    ))}
                </div>
            )}
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════
   CERTIFICATES TAB
   ═══════════════════════════════════════════════════════════════ */

function CertificatesTab() {
    const [previewMedal, setPreviewMedal] = useState<'gold' | 'silver' | 'bronze' | null>(null)

    const certData = {
        athleteName: 'Nguyễn Văn A',
        teamName: 'Hà Nội',
        category: 'Đối kháng Nam 56-60kg',
        tournamentName: 'Giải Vovinam Toàn Quốc 2026',
        date: '09/03/2026',
        signedBy: 'Ông Trần Đức Minh',
    }

    return (
        <div className="grid gap-4">
            <VCT_Text variant="h2">Giấy chứng nhận & Thẻ VĐV</VCT_Text>

            {/* Medal types */}
            <div className="grid md:grid-cols-3 gap-3">
                {(['gold', 'silver', 'bronze'] as const).map((medal) => (
                    <motion.div key={medal} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <VCT_Card>
                            <button
                                onClick={() => setPreviewMedal(medal)}
                                className="w-full p-6 text-center"
                                style={{ border: 'none', background: 'none', cursor: 'pointer' }}
                            >
                                <div style={{ fontSize: '3rem' }}>
                                    {medal === 'gold' ? '🥇' : medal === 'silver' ? '🥈' : '🥉'}
                                </div>
                                <VCT_Text variant="h3">
                                    {medal === 'gold' ? 'HCV' : medal === 'silver' ? 'HCB' : 'HCĐ'}
                                </VCT_Text>
                                <VCT_Text variant="small" style={{ color: 'var(--vct-text-tertiary)' }}>
                                    Nhấn để xem mẫu
                                </VCT_Text>
                            </button>
                        </VCT_Card>
                    </motion.div>
                ))}
            </div>

            {/* Certificate Preview */}
            {previewMedal && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex items-center justify-between mb-3">
                        <VCT_Text variant="h3">Xem trước giấy chứng nhận</VCT_Text>
                        <div className="flex gap-2">
                            <VCT_Button variant="ghost" size="sm" onClick={() => setPreviewMedal(null)}>
                                ✕ Đóng
                            </VCT_Button>
                            <VCT_Button variant="primary" size="sm" onClick={() => window.print()}>
                                🖨️ In
                            </VCT_Button>
                        </div>
                    </div>
                    <div className="overflow-auto rounded-xl" style={{ border: '1px solid var(--vct-border-subtle)' }}>
                        <PrintCertificate data={{ ...certData, medal: previewMedal }} />
                    </div>
                </motion.div>
            )}

            {/* Athlete Badge Preview */}
            <VCT_Card>
                <div className="p-4">
                    <VCT_Text variant="h3" style={{ marginBottom: 12 }}>Thẻ VĐV mẫu</VCT_Text>
                    <div className="flex flex-wrap gap-4">
                        <PrintAthleteBadge data={{
                            name: 'Nguyễn Văn A', team: 'Hà Nội',
                            category: 'Đối kháng Nam', weightClass: '56-60kg',
                            athleteId: 'VDV-2026-001', tournamentName: 'Giải Vovinam Toàn Quốc 2026',
                        }} />
                        <PrintAthleteBadge data={{
                            name: 'Trần Thị B', team: 'TP.HCM',
                            category: 'Quyền Nữ', weightClass: '',
                            athleteId: 'VDV-2026-045', tournamentName: 'Giải Vovinam Toàn Quốc 2026',
                        }} />
                    </div>
                </div>
            </VCT_Card>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════
   WEIGH-IN TAB
   ═══════════════════════════════════════════════════════════════ */

function WeighInTab() {
    return (
        <div className="grid gap-4">
            <div className="flex items-center justify-between">
                <VCT_Text variant="h2">Biên bản cân ký</VCT_Text>
                <VCT_Button variant="primary" size="sm" onClick={() => window.print()}>
                    🖨️ In biên bản
                </VCT_Button>
            </div>

            <div className="grid md:grid-cols-3 gap-3">
                <VCT_StatCard label="Tổng VĐV cân" value={DEMO_WEIGH_IN.length} icon="⚖️" color="#00bcd4" />
                <VCT_StatCard label="Đạt" value={DEMO_WEIGH_IN.filter((w) => w.result === 'dat').length} icon="✅" color="#22c55e" />
                <VCT_StatCard label="Không đạt" value={DEMO_WEIGH_IN.filter((w) => w.result === 'khong_dat').length} icon="❌" color="#ef4444" />
            </div>

            <VCT_Card>
                <div className="overflow-x-auto">
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr>
                                {['STT', 'Họ tên', 'Đoàn', 'Hạng cân', 'Cân TT', 'Kết quả'].map((h) => (
                                    <th key={h} style={{
                                        padding: '10px 14px', textAlign: h === 'Họ tên' ? 'left' : 'center',
                                        borderBottom: '2px solid var(--vct-border-subtle)',
                                        fontSize: 13, fontWeight: 700, color: 'var(--vct-text-secondary)',
                                    }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {DEMO_WEIGH_IN.map((row) => (
                                <motion.tr
                                    key={row.stt}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: row.stt * 0.08 }}
                                >
                                    <td style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--vct-text-primary)' }}>{row.stt}</td>
                                    <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--vct-text-primary)' }}>{row.name}</td>
                                    <td style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--vct-text-secondary)' }}>{row.team}</td>
                                    <td style={{ padding: '10px 14px', textAlign: 'center', color: 'var(--vct-text-secondary)' }}>{row.weightClass}</td>
                                    <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: 'var(--vct-text-primary)' }}>{row.actualWeight}kg</td>
                                    <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                                        <VCT_Badge
                                            type={row.result === 'dat' ? 'success' : 'danger'}
                                            text={row.result === 'dat' ? '✓ Đạt' : '✗ K.đạt'}
                                        />
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </VCT_Card>

            {/* Hidden print version */}
            <div className="hidden print:block">
                <PrintWeighInReport data={DEMO_WEIGH_IN} date="09/03/2026" tournamentName="Giải Vovinam Toàn Quốc 2026" />
            </div>
        </div>
    )
}
