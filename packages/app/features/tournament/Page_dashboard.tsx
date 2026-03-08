'use client';

import * as React from 'react';
import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
    VCT_Card, VCT_Badge, VCT_KpiCard, VCT_Text, VCT_Stack, VCT_Button, VCT_AvatarLetter
} from '../components/vct-ui';
import { VCT_Icons } from '../components/vct-icons';
import { TOURNAMENT_CONFIG } from '../data/tournament-config';
import { DON_VIS, VAN_DONG_VIENS, TRAN_DAUS, LUOT_THI_QUYENS, TRONG_TAIS, CAN_KYS, KHIEU_NAIS, SAN_DAUS } from '../data/mock-data';

export const Page_dashboard = () => {
    const router = useRouter();

    // Data Aggregation
    const kpis = useMemo(() => {
        const totalMatches = TRAN_DAUS.length;
        const finishedMatches = TRAN_DAUS.filter(t => t.trang_thai === 'ket_thuc').length;
        const liveMatches = TRAN_DAUS.filter(t => t.trang_thai === 'dang_dau').length;

        const medalsByDoan = DON_VIS.map(d => {
            let hcv = 0, hcb = 0, hcd = 0;
            // Count from combat
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
    }, []);

    // Live Blinker
    const [tick, setTick] = useState(false);
    useEffect(() => { const int = setInterval(() => setTick(t => !t), 1000); return () => clearInterval(int); }, []);

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', paddingBottom: '80px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* 1. HERO BANNER */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                style={{ padding: '32px', borderRadius: '24px', position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, rgba(34, 211, 238, 0.1), rgba(139, 92, 246, 0.05))', border: '1px solid rgba(34, 211, 238, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}
            >
                <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: '50%', opacity: 0.03, backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, currentColor 20px, currentColor 21px)' }} />
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <VCT_Stack direction="row" gap={12} align="center" style={{ marginBottom: '16px' }}>
                        <span style={{ fontSize: '32px' }}>🏆</span>
                        <VCT_Badge text="🔴 LIVE TOURNAMENT" type="warning" pulse />
                        <VCT_Badge text={`Tiến độ Đối kháng: ${Math.round((kpis.tran_dau.da_xong / kpis.tran_dau.tong) * 100) || 0}%`} type="success" />
                    </VCT_Stack>
                    <VCT_Text variant="h1" style={{ marginBottom: '8px', fontSize: '36px', letterSpacing: '-0.02em', background: 'var(--vct-accent-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        {TOURNAMENT_CONFIG.ten_giai}
                    </VCT_Text>
                    <VCT_Stack direction="row" gap={24} style={{ opacity: 0.7 }}>
                        <VCT_Stack direction="row" gap={8} align="center"><VCT_Icons.MapPin size={16} /> <VCT_Text>{TOURNAMENT_CONFIG.dia_diem}</VCT_Text></VCT_Stack>
                        <VCT_Stack direction="row" gap={8} align="center"><VCT_Icons.Clock size={16} /> <VCT_Text>{TOURNAMENT_CONFIG.ngay_bat_dau} → {TOURNAMENT_CONFIG.ngay_ket_thuc}</VCT_Text></VCT_Stack>
                    </VCT_Stack>
                </div>
                <div style={{ position: 'relative', zIndex: 1, display: 'flex', gap: '16px' }}>
                    <VCT_Button icon={<VCT_Icons.Settings size={18} />} onClick={() => router.push('/giai-dau')} variant="secondary">Cấu hình giải</VCT_Button>
                    <VCT_Button icon={<VCT_Icons.Download size={18} />} onClick={() => router.push('/reports')}>Báo cáo tổng hợp</VCT_Button>
                </div>
            </motion.div>

            {/* 2. KPI ROW */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                <VCT_KpiCard label="Đoàn tham gia" value={kpis.doan} icon={<VCT_Icons.Building2 size={28} />} color="#0ea5e9" />
                <VCT_KpiCard label="Tổng VĐV" value={kpis.vdv.tong} icon={<VCT_Icons.Users size={28} />} color="#f59e0b" sub={`♂ ${kpis.vdv.nam} — ♀ ${kpis.vdv.nu}`} />
                <VCT_KpiCard label="Trọng Tài" value={kpis.trong_tai} icon={<VCT_Icons.UserCheck size={28} />} color="#10b981" />

                <div style={{ background: 'var(--vct-bg-card)', borderRadius: '20px', padding: '24px', border: '1px solid var(--vct-border-subtle)', position: 'relative', overflow: 'hidden', cursor: 'pointer' }} onClick={() => router.push('/combat')}>
                    <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.05 }}><VCT_Icons.Swords size={120} /></div>
                    <VCT_Text variant="small" style={{ textTransform: 'uppercase', opacity: 0.5, fontWeight: 700, marginBottom: 8 }}>Trận Đối Kháng</VCT_Text>
                    <div style={{ fontSize: '32px', fontWeight: 900, color: '#a78bfa', lineHeight: 1, marginBottom: 12 }}>{kpis.tran_dau.tong}</div>
                    <VCT_Stack direction="row" justify="space-between" style={{ fontSize: 12, fontWeight: 600 }}>
                        <span style={{ color: '#10b981' }}>{kpis.tran_dau.da_xong} Xong</span>
                        <span style={{ color: '#ef4444' }}>{kpis.tran_dau.dang_dien} Đang đấu {tick ? '🔴' : '⚪'}</span>
                        <span style={{ opacity: 0.5 }}>{kpis.tran_dau.sap_dien} Chờ</span>
                    </VCT_Stack>
                    <div style={{ height: 6, background: 'var(--vct-border-strong)', borderRadius: 3, marginTop: 8, overflow: 'hidden', display: 'flex' }}>
                        <div style={{ width: `${(kpis.tran_dau.da_xong / kpis.tran_dau.tong) * 100}%`, background: '#10b981' }} />
                        <div style={{ width: `${(kpis.tran_dau.dang_dien / kpis.tran_dau.tong) * 100}%`, background: '#ef4444' }} />
                    </div>
                </div>
            </div>

            {/* 3. MIDDLE SECTION */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px', alignItems: 'stretch' }}>
                <VCT_Card title="🔴 Sàn đấu trực tiếp (LIVE)" headerAction={<VCT_Button variant="secondary" onClick={() => router.push('/combat')}>Quản lý thi đấu</VCT_Button>} style={{ height: '100%' }}>
                    <VCT_Stack gap={16}>
                        {kpis.san_live.map(san => (
                            <div key={san.id} style={{ padding: '16px', borderRadius: '16px', background: 'var(--vct-bg-elevated)', border: `1px solid ${san.match ? 'rgba(239, 68, 68, 0.3)' : 'var(--vct-border-subtle)'}`, position: 'relative', overflow: 'hidden' }}>
                                {san.match && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: '#ef4444' }} />}
                                <VCT_Stack direction="row" justify="space-between" align="center" style={{ marginBottom: san.match ? 16 : 0 }}>
                                    <VCT_Stack direction="row" gap={12} align="center">
                                        <VCT_Text style={{ fontWeight: 900, fontSize: 18 }}>{san.ten}</VCT_Text>
                                        <VCT_Badge text={san.match ? san.match.hang_can : 'Trống'} type="info" />
                                    </VCT_Stack>
                                    <VCT_Badge text={san.match ? 'Đang đấu' : 'Đang nghỉ'} type={san.match ? 'warning' : 'info'} pulse={!!san.match} />
                                </VCT_Stack>
                                {san.match && (
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', background: 'var(--vct-bg-glass)', padding: '16px', borderRadius: '12px' }}>
                                        <div style={{ flex: 1, textAlign: 'center' }}>
                                            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#3b82f6', margin: '0 auto 8px', boxShadow: '0 0 8px rgba(59,130,246,0.5)' }} />
                                            <div style={{ fontWeight: 800, fontSize: 14 }}>{san.match.vdv_xanh.ten}</div>
                                            <div style={{ fontSize: 11, opacity: 0.5 }}>{san.match.vdv_xanh.doan}</div>
                                        </div>
                                        <div style={{ fontSize: 32, fontWeight: 900, fontFamily: 'monospace', color: '#10b981', display: 'flex', gap: 12, alignItems: 'center' }}>
                                            <span style={{ color: '#3b82f6' }}>{san.match.diem_xanh}</span>
                                            <span style={{ opacity: 0.2 }}>:</span>
                                            <span style={{ color: '#ef4444' }}>{san.match.diem_do}</span>
                                        </div>
                                        <div style={{ flex: 1, textAlign: 'center' }}>
                                            <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ef4444', margin: '0 auto 8px', boxShadow: '0 0 8px rgba(239,68,68,0.5)' }} />
                                            <div style={{ fontWeight: 800, fontSize: 14 }}>{san.match.vdv_do.ten}</div>
                                            <div style={{ fontSize: 11, opacity: 0.5 }}>{san.match.vdv_do.doan}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </VCT_Stack>
                </VCT_Card>

                <VCT_Stack gap={24}>
                    {/* Cân ký overview */}
                    <VCT_Card title="⚖️ Tiến trình Cân ký" style={{ flex: 1, cursor: 'pointer' }} onClick={() => router.push('/weigh-in')}>
                        <VCT_Stack justify="center" style={{ height: '100%', padding: '12px 0' }}>
                            <VCT_Stack direction="row" justify="space-between" align="center" style={{ marginBottom: 8 }}>
                                <VCT_Text>Đã cân / Tổng số</VCT_Text>
                                <VCT_Text style={{ fontWeight: 900 }}>{kpis.can_ky.hoan_thanh} / {kpis.can_ky.tong}</VCT_Text>
                            </VCT_Stack>
                            <div style={{ height: 12, background: 'var(--vct-border-strong)', borderRadius: 6, overflow: 'hidden', display: 'flex', marginBottom: 16 }}>
                                <div style={{ width: `${(kpis.can_ky.hoan_thanh / kpis.can_ky.tong) * 100}%`, background: '#22d3ee' }} />
                            </div>
                            <VCT_Stack direction="row" gap={12}>
                                <div style={{ flex: 1, padding: 12, borderRadius: 12, background: 'rgba(239, 68, 68, 0.05)', border: `1px solid ${kpis.can_ky.vuot > 0 ? '#ef4444' : 'rgba(239, 68, 68, 0.2)'}`, textAlign: 'center' }}>
                                    <div style={{ fontSize: 20, fontWeight: 900, color: kpis.can_ky.vuot > 0 ? '#ef4444' : 'var(--vct-text-tertiary)' }}>{kpis.can_ky.vuot}</div>
                                    <VCT_Text variant="small">Lố cân</VCT_Text>
                                </div>
                                <div style={{ flex: 1, padding: 12, borderRadius: 12, background: 'rgba(245, 158, 11, 0.05)', border: `1px solid ${kpis.can_ky.cho > 0 ? '#f59e0b' : 'rgba(245, 158, 11, 0.2)'}`, textAlign: 'center' }}>
                                    <div style={{ fontSize: 20, fontWeight: 900, color: kpis.can_ky.cho > 0 ? '#f59e0b' : 'var(--vct-text-tertiary)' }}>{kpis.can_ky.cho}</div>
                                    <VCT_Text variant="small">Chờ cân</VCT_Text>
                                </div>
                            </VCT_Stack>
                        </VCT_Stack>
                    </VCT_Card>

                    {/* Khiếu nại */}
                    <VCT_Card title="⚠️ Cảnh báo Khiếu nại" style={{ flex: 1, border: kpis.khieu_nai.cho > 0 ? '1px solid rgba(239, 68, 68, 0.5)' : undefined, cursor: 'pointer' }} onClick={() => router.push('/appeals')}>
                        <VCT_Stack justify="center" align="center" style={{ height: '100%', textAlign: 'center', padding: '16px' }}>
                            {kpis.khieu_nai.cho > 0 ? (
                                <>
                                    <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 1.5 }} style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                                        <VCT_Icons.AlertCircle size={32} />
                                    </motion.div>
                                    <VCT_Text variant="h2" style={{ color: '#ef4444', marginBottom: 4 }}>{kpis.khieu_nai.cho} Khiếu nại mới</VCT_Text>
                                    <VCT_Text variant="small" style={{ opacity: 0.7 }}>Cần Tổng trọng tài xử lý</VCT_Text>
                                </>
                            ) : (
                                <>
                                    <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                                        <VCT_Icons.Check size={32} />
                                    </div>
                                    <VCT_Text style={{ fontWeight: 700, color: '#10b981' }}>Không có khiếu nại kịch trần</VCT_Text>
                                </>
                            )}
                        </VCT_Stack>
                    </VCT_Card>
                </VCT_Stack>
            </div>

            {/* 4. LEADERBOARD (Top 3 Medals) */}
            <VCT_Card title="🏆 Top 3 Đoàn Xuất Sắc" headerAction={<VCT_Button variant="secondary" onClick={() => router.push('/medals')}>Theo dõi bảng tổng sắp</VCT_Button>}>
                {kpis.top_huy_chuong.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                        {kpis.top_huy_chuong.map((m, i) => (
                            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 16, borderRadius: 12, background: 'var(--vct-bg-elevated)', border: `1px solid ${i === 0 ? '#eab30850' : i === 1 ? '#94a3b850' : '#b4530950'}` }}>
                                <div style={{ fontSize: 32, fontWeight: 900, color: i === 0 ? '#eab308' : i === 1 ? '#94a3b8' : '#b45309' }}>{i + 1}</div>
                                <VCT_AvatarLetter name={m.ten} size={48} />
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 800, fontSize: 14 }}>{m.ten}</div>
                                    <div style={{ fontSize: 12, display: 'flex', gap: 12, marginTop: 4 }}>
                                        <span style={{ color: '#eab308', fontWeight: 700 }}>🥇 {m.hcv}</span>
                                        <span style={{ color: '#94a3b8', fontWeight: 700 }}>🥈 {m.hcb}</span>
                                        <span style={{ color: '#b45309', fontWeight: 700 }}>🥉 {m.hcd}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ padding: 40, textAlign: 'center', opacity: 0.5, fontWeight: 700 }}>Chưa có huy chương nào được trao.</div>
                )}
            </VCT_Card>
        </div>
    );
};
