'use client';

import * as React from 'react';
import { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    VCT_Badge, VCT_Text, VCT_Stack, VCT_Button, VCT_AvatarLetter
} from '../components/vct-ui';
import { VCT_PageContainer, VCT_PageHero, VCT_SectionCard, VCT_StatRow } from '../components/vct-ui';
import { VCT_Timeline, type TimelineEvent } from '../components/VCT_Timeline';
import { VCT_Icons } from '../components/vct-icons';
import { TournamentWorkflowStepper } from './TournamentWorkflowStepper';
import { TOURNAMENT_CONFIG } from '../data/tournament-config';
import { repositories, useEntityCollection } from '../data/repository';
import type { StatItem } from '../components/VCT_StatRow';

const ACTIVITY_FEED: TimelineEvent[] = [
    { time: '2 phút trước', title: 'Trận #12 kết thúc', description: 'Nguyễn Văn A thắng điểm 7-5', color: 'var(--vct-success)' },
    { time: '8 phút trước', title: 'Cân ký hoàn tất', description: '42/45 VĐV đạt cân nặng', color: 'var(--vct-info)' },
    { time: '15 phút trước', title: 'Đoàn Bình Định gửi hồ sơ', description: '15 VĐV, 8 nội dung', color: 'var(--vct-warning)' },
    { time: '30 phút trước', title: 'Trận #11 bắt đầu', description: 'Sàn 2 — Đối kháng Nữ 52kg', color: 'var(--vct-danger)' },
    { time: '45 phút trước', title: 'Lịch thi đấu cập nhật', description: 'Buổi chiều: 12 trận ĐK, 6 lượt Quyền', color: 'var(--vct-accent-cyan)' },
];

export const Page_dashboard = () => {
    const router = useRouter();
    const teamsStore = useEntityCollection(repositories.teams.mock);
    const athletesStore = useEntityCollection(repositories.athletes.mock);
    const refereesStore = useEntityCollection(repositories.referees.mock);
    const combatStore = useEntityCollection(repositories.combatMatches.mock);
    const formsStore = useEntityCollection(repositories.formPerformances.mock);
    const weighStore = useEntityCollection(repositories.weighIns.mock);
    const appealsStore = useEntityCollection(repositories.appeals.mock);
    const arenasStore = useEntityCollection(repositories.arenas.mock);

    const DON_VIS = teamsStore.items;
    const VAN_DONG_VIENS = athletesStore.items;
    const TRONG_TAIS = refereesStore.items;
    const TRAN_DAUS = combatStore.items;
    const CAN_KYS = weighStore.items;
    const KHIEU_NAIS = appealsStore.items;
    const SAN_DAUS = arenasStore.items;

    const kpis = useMemo(() => {
        const totalMatches = TRAN_DAUS.length;
        const finishedMatches = TRAN_DAUS.filter(t => t.trang_thai === 'ket_thuc').length;
        const liveMatches = TRAN_DAUS.filter(t => t.trang_thai === 'dang_dau').length;

        const medalsByDoan = DON_VIS.map(d => {
            let hcv = 0, hcb = 0, hcd = 0;
            TRAN_DAUS.filter(t => t.trang_thai === 'ket_thuc' && (t.vdv_do.doan === d.tat || t.vdv_xanh.doan === d.tat)).forEach(t => {
                if (t.diem_do > t.diem_xanh && t.vdv_do.doan === d.tat) hcv++;
                if (t.diem_xanh > t.diem_do && t.vdv_xanh.doan === d.tat) hcv++;
            });
            return { id: d.id, ten: d.ten, tat: d.tat, hcv, hcb, hcd, tong: hcv + hcb + hcd };
        }).sort((a, b) => b.hcv - a.hcv || b.tong - a.tong).filter(m => m.tong > 0).slice(0, 3);

        return {
            doan: DON_VIS.length,
            vdv: { tong: VAN_DONG_VIENS.length, nam: VAN_DONG_VIENS.filter(v => v.gioi === 'nam').length, nu: VAN_DONG_VIENS.filter(v => v.gioi === 'nu').length },
            trong_tai: TRONG_TAIS.length,
            tran_dau: { tong: totalMatches, da_xong: finishedMatches, dang_dien: liveMatches, sap_dien: totalMatches - finishedMatches - liveMatches },
            can_ky: {
                tong: CAN_KYS.length, hoan_thanh: CAN_KYS.filter(c => c.ket_qua !== 'cho_can').length,
                vuot: CAN_KYS.filter(c => c.ket_qua === 'khong_dat').length, cho: CAN_KYS.filter(c => c.ket_qua === 'cho_can').length
            },
            khieu_nai: { cho: KHIEU_NAIS.filter(k => k.trang_thai === 'moi').length },
            san_live: SAN_DAUS.map(s => {
                const liveMatch = TRAN_DAUS.find(t => t.san_id === s.id && t.trang_thai === 'dang_dau');
                return { id: s.id, ten: s.ten, match: liveMatch };
            }),
            top_huy_chuong: medalsByDoan
        };
    }, [CAN_KYS, DON_VIS, KHIEU_NAIS, SAN_DAUS, TRAN_DAUS, TRONG_TAIS, VAN_DONG_VIENS]);

    const [tick, setTick] = useState(false);
    useEffect(() => { const int = setInterval(() => setTick(t => !t), 1000); return () => clearInterval(int); }, []);

    const hasError = teamsStore.uiState.error || athletesStore.uiState.error || refereesStore.uiState.error ||
        combatStore.uiState.error || formsStore.uiState.error || weighStore.uiState.error ||
        appealsStore.uiState.error || arenasStore.uiState.error;

    const progressPct = kpis.tran_dau.tong > 0 ? Math.round((kpis.tran_dau.da_xong / kpis.tran_dau.tong) * 100) : 0;

    const topStats: StatItem[] = [
        { label: 'Đoàn tham gia', value: kpis.doan, icon: <VCT_Icons.Building2 size={18} />, color: '#0ea5e9' },
        { label: 'Tổng VĐV', value: kpis.vdv.tong, icon: <VCT_Icons.Users size={18} />, color: '#f59e0b', sub: `♂ ${kpis.vdv.nam} — ♀ ${kpis.vdv.nu}` },
        { label: 'Trọng Tài', value: kpis.trong_tai, icon: <VCT_Icons.UserCheck size={18} />, color: '#10b981' },
        { label: 'Trận đấu', value: kpis.tran_dau.tong, icon: <VCT_Icons.Swords size={18} />, color: '#a78bfa', sub: `${kpis.tran_dau.da_xong} xong · ${kpis.tran_dau.dang_dien} đang đấu` },
    ];

    return (
        <VCT_PageContainer size="wide" animated>
            {hasError && (
                <div className="mb-4 rounded-xl border border-red-500/25 bg-red-500/[0.08] px-4 py-3 text-[13px] font-bold text-red-500">
                    Một số nguồn dữ liệu dashboard chưa tải được. Số liệu có thể chưa đầy đủ.
                </div>
            )}

            {/* 1. HERO BANNER */}
            <VCT_PageHero
                icon={<span className="text-2xl">🏆</span>}
                title={TOURNAMENT_CONFIG.ten_giai}
                subtitle={`${TOURNAMENT_CONFIG.dia_diem} · ${TOURNAMENT_CONFIG.ngay_bat_dau} → ${TOURNAMENT_CONFIG.ngay_ket_thuc}`}
                badge="🔴 LIVE"
                badgeType="warning"
                gradientFrom="rgba(34, 211, 238, 0.08)"
                gradientTo="rgba(139, 92, 246, 0.05)"
                actions={
                    <>
                        <VCT_Button icon={<VCT_Icons.Settings size={18} />} onClick={() => router.push('/giai-dau')} variant="secondary">Cấu hình giải</VCT_Button>
                        <VCT_Button icon={<VCT_Icons.Download size={18} />} onClick={() => router.push('/reports')}>Báo cáo</VCT_Button>
                    </>
                }
            />

            {/* ── Progress bar ── */}
            <div className="mb-6 flex items-center gap-4 rounded-xl border border-vct-border bg-vct-elevated px-5 py-3.5">
                <span className="text-sm font-bold text-vct-text-muted">Tiến độ Đối kháng</span>
                <div className="flex-1 overflow-hidden rounded-full bg-vct-input" style={{ height: 8 }}>
                    <div className="flex h-full transition-all duration-500">
                        <div className="bg-emerald-500 transition-all" style={{ width: `${progressPct}%` }} />
                        <div className="bg-red-500 transition-all" style={{ width: `${kpis.tran_dau.tong > 0 ? (kpis.tran_dau.dang_dien / kpis.tran_dau.tong) * 100 : 0}%` }} />
                    </div>
                </div>
                <span className="text-sm font-black vct-gradient-text">{progressPct}%</span>
            </div>

            {/* 2. KPI ROW */}
            <VCT_StatRow items={topStats} className="mb-6" />

            {/* 2.5 WORKFLOW STEPPER */}
            <div className="mb-6">
                <TournamentWorkflowStepper compact />
            </div>

            {/* 3. MIDDLE SECTION */}
            <div className="mb-6 grid grid-cols-1 items-stretch gap-6 desktop:grid-cols-[1fr_350px]">
                {/* Live Arenas */}
                <VCT_SectionCard
                    title="🔴 Sàn đấu trực tiếp"
                    accentColor="#ef4444"
                    headerAction={<VCT_Button variant="secondary" onClick={() => router.push('/combat')}>Quản lý</VCT_Button>}
                >
                    <div className="space-y-4">
                        {kpis.san_live.map(san => (
                            <div key={san.id} className={`relative overflow-hidden rounded-2xl border p-4 transition-all ${san.match ? 'border-red-500/30 bg-red-500/[0.02]' : 'border-vct-border bg-vct-bg'}`}>
                                {san.match && <div className="absolute bottom-0 left-0 top-0 w-1 bg-red-500" />}
                                <div className="flex items-center justify-between" style={{ marginBottom: san.match ? 16 : 0 }}>
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg font-black">{san.ten}</span>
                                        <VCT_Badge text={san.match ? san.match.hang_can : 'Trống'} type="info" />
                                    </div>
                                    <VCT_Badge text={san.match ? 'Đang đấu' : 'Đang nghỉ'} type={san.match ? 'warning' : 'info'} pulse={!!san.match} />
                                </div>
                                {san.match && (
                                    <div className="flex items-center justify-center gap-6 rounded-xl bg-vct-glass p-4">
                                        <div className="flex-1 text-center">
                                            <div className="mx-auto mb-2 h-3 w-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                                            <div className="text-sm font-extrabold">{san.match.vdv_xanh.ten}</div>
                                            <div className="text-[11px] text-vct-text-muted">{san.match.vdv_xanh.doan}</div>
                                        </div>
                                        <div className="flex items-center gap-3 font-mono text-3xl font-black">
                                            <span className="text-blue-500">{san.match.diem_xanh}</span>
                                            <span className="text-vct-text-muted/20">:</span>
                                            <span className="text-red-500">{san.match.diem_do}</span>
                                        </div>
                                        <div className="flex-1 text-center">
                                            <div className="mx-auto mb-2 h-3 w-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                                            <div className="text-sm font-extrabold">{san.match.vdv_do.ten}</div>
                                            <div className="text-[11px] text-vct-text-muted">{san.match.vdv_do.doan}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </VCT_SectionCard>

                <div className="flex flex-col gap-6">
                    {/* Weigh-in progress */}
                    <VCT_SectionCard title="⚖️ Tiến trình Cân ký" accentColor="#22d3ee" hover onClick={() => router.push('/weigh-in')}>
                        <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-vct-text-muted">Đã cân / Tổng số</span>
                            <span className="font-black">{kpis.can_ky.hoan_thanh} / {kpis.can_ky.tong}</span>
                        </div>
                        <div className="mb-4 h-3 overflow-hidden rounded-full bg-vct-input">
                            <div className="h-full bg-cyan-400 transition-all" style={{ width: `${kpis.can_ky.tong > 0 ? (kpis.can_ky.hoan_thanh / kpis.can_ky.tong) * 100 : 0}%` }} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className={`rounded-xl border p-3 text-center ${kpis.can_ky.vuot > 0 ? 'border-red-500/30 bg-red-500/5' : 'border-vct-border bg-vct-bg'}`}>
                                <div className={`text-xl font-black ${kpis.can_ky.vuot > 0 ? 'text-red-500' : 'text-vct-text-muted'}`}>{kpis.can_ky.vuot}</div>
                                <div className="text-[11px] font-bold text-vct-text-muted">Lố cân</div>
                            </div>
                            <div className={`rounded-xl border p-3 text-center ${kpis.can_ky.cho > 0 ? 'border-amber-500/30 bg-amber-500/5' : 'border-vct-border bg-vct-bg'}`}>
                                <div className={`text-xl font-black ${kpis.can_ky.cho > 0 ? 'text-amber-500' : 'text-vct-text-muted'}`}>{kpis.can_ky.cho}</div>
                                <div className="text-[11px] font-bold text-vct-text-muted">Chờ cân</div>
                            </div>
                        </div>
                    </VCT_SectionCard>

                    {/* Complaints */}
                    <VCT_SectionCard
                        title="⚠️ Khiếu nại"
                        accentColor={kpis.khieu_nai.cho > 0 ? '#ef4444' : '#10b981'}
                        hover
                        onClick={() => router.push('/appeals')}
                    >
                        <div className="flex flex-col items-center py-4 text-center">
                            {kpis.khieu_nai.cho > 0 ? (
                                <>
                                    <motion.div
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ repeat: Infinity, duration: 1.5 }}
                                        className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-500"
                                    >
                                        <VCT_Icons.AlertCircle size={28} />
                                    </motion.div>
                                    <div className="text-2xl font-black text-red-500">{kpis.khieu_nai.cho}</div>
                                    <div className="mt-1 text-xs font-bold text-vct-text-muted">Khiếu nại mới — Cần xử lý</div>
                                </>
                            ) : (
                                <>
                                    <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                                        <VCT_Icons.Check size={28} />
                                    </div>
                                    <div className="text-sm font-bold text-emerald-500">Không có khiếu nại</div>
                                </>
                            )}
                        </div>
                    </VCT_SectionCard>
                </div>

                {/* Activity Feed */}
                <VCT_SectionCard title="📋 Hoạt động gần đây" accentColor="#0ea5e9">
                    <VCT_Timeline events={ACTIVITY_FEED} maxHeight={280} />
                </VCT_SectionCard>
            </div>

            {/* 4. LEADERBOARD */}
            <VCT_SectionCard
                title="🏆 Top 3 Đoàn Xuất Sắc"
                accentColor="#eab308"
                headerAction={<VCT_Button variant="secondary" onClick={() => router.push('/medals')}>Bảng tổng sắp</VCT_Button>}
            >
                {kpis.top_huy_chuong.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                        {kpis.top_huy_chuong.map((m, i) => {
                            const colors = ['#eab308', '#94a3b8', '#b45309'];
                            return (
                                <div key={m.id} className="vct-card-hover flex items-center gap-4 rounded-xl border border-vct-border bg-vct-bg p-4"
                                    style={{ borderColor: `${colors[i]}30` }}
                                >
                                    <div className="text-[32px] font-black" style={{ color: colors[i] }}>{i + 1}</div>
                                    <VCT_AvatarLetter name={m.ten} size={48} />
                                    <div className="flex-1 min-w-0">
                                        <div className="truncate text-sm font-extrabold">{m.ten}</div>
                                        <div className="mt-1 flex gap-3 text-xs">
                                            <span className="font-bold text-amber-500">🥇 {m.hcv}</span>
                                            <span className="font-bold text-slate-400">🥈 {m.hcb}</span>
                                            <span className="font-bold text-orange-700">🥉 {m.hcd}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-10 text-center text-sm font-bold text-vct-text-muted">Chưa có huy chương nào được trao.</div>
                )}
            </VCT_SectionCard>
        </VCT_PageContainer>
    );
};
