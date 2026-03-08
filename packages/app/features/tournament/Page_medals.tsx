'use client';
import * as React from 'react';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
    VCT_Badge, VCT_KpiCard, VCT_Stack, VCT_Toast, VCT_AvatarLetter,
    VCT_SegmentedControl, VCT_ProgressBar
} from '../components/vct-ui';
import { VCT_Icons } from '../components/vct-icons';
import { DON_VIS, LUOT_THI_QUYENS, TRAN_DAUS } from '../data/mock-data';
import { VCT_Button, VCT_EmptyState, VCT_Modal } from '../components/vct-ui';

// Aggregate medal data from mock results
interface MedalRow { id: string; ten: string; tat: string; hcv: number; hcb: number; hcd: number; tong: number }

const MEDAL_COLORS: Record<string, { label: string; color: string; icon: string }> = {
    vang: { label: 'Huy chương Vàng', color: '#fbbf24', icon: '🥇' },
    bac: { label: 'Huy chương Bạc', color: '#94a3b8', icon: '🥈' },
    dong: { label: 'Huy chương Đồng', color: '#d97706', icon: '🥉' },
};

const buildMedalTable = (): MedalRow[] => {
    const map: Record<string, MedalRow> = {};
    DON_VIS.forEach(d => { map[d.id] = { id: d.id, ten: d.ten, tat: d.tat, hcv: 0, hcb: 0, hcd: 0, tong: 0 }; });

    // From Quyền results
    const quyenByND = new Map<string, typeof LUOT_THI_QUYENS>();
    LUOT_THI_QUYENS.filter(l => l.trang_thai === 'da_cham').forEach(l => {
        const k = l.noi_dung;
        if (!quyenByND.has(k)) quyenByND.set(k, []);
        quyenByND.get(k)!.push(l);
    });
    quyenByND.forEach((entries) => {
        const sorted = [...entries].sort((a, b) => b.diem_tb - a.diem_tb);
        sorted.forEach((e, i) => {
            const doan = DON_VIS.find(d => d.tat === e.doan_ten || d.ten.includes(e.doan_ten));
            const md = doan ? map[doan.id] : undefined;
            if (!md) return;
            if (i === 0) { md.hcv++; md.tong++; }
            else if (i === 1) { md.hcb++; md.tong++; }
            else if (i === 2) { md.hcd++; md.tong++; }
        });
    });

    // From ĐK results
    TRAN_DAUS.filter(t => t.trang_thai === 'ket_thuc').forEach(t => {
        const winnerDoan = t.diem_do > t.diem_xanh ? t.vdv_do.doan : t.vdv_xanh.doan;
        const doan = DON_VIS.find(d => d.tat === winnerDoan || d.ten.includes(winnerDoan));
        const md = doan ? map[doan.id] : undefined;
        if (md) { md.hcv++; md.tong++; }
    });

    return Object.values(map).filter(m => m.tong > 0).sort((a, b) => b.hcv - a.hcv || b.hcb - a.hcb || b.hcd - a.hcd);
};

export const Page_medals = () => {
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });
    const [filterMedal, setFilterMedal] = useState('all');
    const [certModal, setCertModal] = useState<any>(null);

    const medalTable = useMemo(buildMedalTable, []);
    const totalHCV = medalTable.reduce((s, m) => s + m.hcv, 0);
    const totalHCB = medalTable.reduce((s, m) => s + m.hcb, 0);
    const totalHCD = medalTable.reduce((s, m) => s + m.hcd, 0);

    // Mock derived data for individual medalists based on medalTable
    const filtered = useMemo(() => {
        // Simplified mock generation for demonstration
        interface MedalAthlete { id: string; vdv_ten: string; doan_ten: string; nd_ten: string; diem_so: string; loai_hc: string }
        const athletes: MedalAthlete[] = [];
        let count = 0;
        for (const m of medalTable) {
            if (m.hcv > 0 && (filterMedal === 'all' || filterMedal === 'vang')) athletes.push({ id: `v${count++}`, vdv_ten: `Nguyễn Văn ${count}`, doan_ten: m.ten, nd_ten: 'Quyền Nam', diem_so: '9.50', loai_hc: 'vang' });
            if (m.hcb > 0 && (filterMedal === 'all' || filterMedal === 'bac')) athletes.push({ id: `v${count++}`, vdv_ten: `Trần Thị ${count}`, doan_ten: m.ten, nd_ten: 'Đối Kháng Nữ 50kg', diem_so: 'W', loai_hc: 'bac' });
            if (m.hcd > 0 && (filterMedal === 'all' || filterMedal === 'dong')) athletes.push({ id: `v${count++}`, vdv_ten: `Lê Bá ${count}`, doan_ten: m.ten, nd_ten: 'Đối Kháng Nam 60kg', diem_so: 'L', loai_hc: 'dong' });
        }
        return athletes;
    }, [medalTable, filterMedal]);

    return (
        <div style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 100 }}>
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast(p => ({ ...p, show: false }))} />

            <VCT_Stack direction="row" justify="space-between" align="center" style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 18, fontWeight: 900, textTransform: 'uppercase' }}>Bảng Tổng Sắp Huy Chương</div>
                <VCT_Button variant="secondary" icon={<VCT_Icons.Download size={16} />} onClick={() => { window.print(); setToast({ show: true, msg: 'Đang xuất bảng huy chương...', type: 'info' }); }}>Xuất PDF / In</VCT_Button>
            </VCT_Stack>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                <VCT_KpiCard label="🥇 Vàng" value={totalHCV} icon={<VCT_Icons.Award size={24} />} color="#fbbf24" />
                <VCT_KpiCard label="🥈 Bạc" value={totalHCB} icon={<VCT_Icons.Award size={24} />} color="#94a3b8" />
                <VCT_KpiCard label="🥉 Đồng" value={totalHCD} icon={<VCT_Icons.Award size={24} />} color="#d97706" />
                <VCT_KpiCard label="Tổng HC" value={totalHCV + totalHCB + totalHCD} icon={<VCT_Icons.Star size={24} />} color="#22d3ee" sub={`${medalTable.length} đoàn có huy chương`} />
            </div>

            {/* Stacked Bar Chart */}
            {medalTable.length > 0 && (
                <div style={{ padding: 24, borderRadius: 16, background: 'var(--vct-bg-glass)', border: '1px solid var(--vct-border-subtle)', marginBottom: 32 }}>
                    <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 20 }}>📊 Tỷ trọng Huy chương theo Đoàn</div>
                    <div style={{ display: 'grid', gap: 12 }}>
                        {medalTable.slice(0, 10).map(m => {
                            const maxTong = Math.max(...medalTable.map(x => x.tong));
                            return (
                                <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                    <span style={{ fontWeight: 700, fontSize: 12, minWidth: 100, textAlign: 'right' }}>{m.ten}</span>
                                    <div style={{ flex: 1, height: 20, display: 'flex', borderRadius: 4, overflow: 'hidden', background: 'rgba(255,255,255,0.05)' }}>
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${(m.hcv / maxTong) * 100}%` }} transition={{ delay: 0.1 }}
                                            style={{ height: '100%', background: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {m.hcv > 0 && <span style={{ fontSize: 10, fontWeight: 900, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{m.hcv}</span>}
                                        </motion.div>
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${(m.hcb / maxTong) * 100}%` }} transition={{ delay: 0.2 }}
                                            style={{ height: '100%', background: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {m.hcb > 0 && <span style={{ fontSize: 10, fontWeight: 900, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{m.hcb}</span>}
                                        </motion.div>
                                        <motion.div initial={{ width: 0 }} animate={{ width: `${(m.hcd / maxTong) * 100}%` }} transition={{ delay: 0.3 }}
                                            style={{ height: '100%', background: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {m.hcd > 0 && <span style={{ fontSize: 10, fontWeight: 900, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{m.hcd}</span>}
                                        </motion.div>
                                    </div>
                                    <span style={{ fontWeight: 900, fontSize: 14, fontFamily: 'monospace', minWidth: 30, color: 'var(--vct-accent-cyan)' }}>{m.tong}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Podium Top 3 */}
            {medalTable.length >= 3 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 40, alignItems: 'flex-end' }}>
                    {[medalTable[1], medalTable[0], medalTable[2]].map((m, i) => {
                        if (!m) return null;
                        const podH = [100, 140, 80][i];
                        const medal = ['🥈', '🥇', '🥉'][i];
                        const border = ['#94a3b8', '#fbbf24', '#d97706'][i];
                        return (
                            <motion.div key={m.id} initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.2 }}
                                style={{ textAlign: 'center', width: 160 }}>
                                <div style={{ fontSize: 36, marginBottom: 8 }}>{medal}</div>
                                <VCT_AvatarLetter name={m.ten} size={i === 1 ? 56 : 44} style={{ margin: '0 auto 8px', border: `3px solid ${border}` }} />
                                <div style={{ fontWeight: 900, fontSize: i === 1 ? 16 : 14 }}>{m.ten}</div>
                                <div style={{ fontSize: 12, opacity: 0.5, marginBottom: 8 }}>{m.hcv}V {m.hcb}B {m.hcd}Đ = {m.tong}</div>
                                <div style={{ height: podH, background: `linear-gradient(180deg, ${border}40, ${border}10)`, borderRadius: '12px 12px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ fontSize: 32, fontWeight: 900, opacity: 0.2 }}>{[2, 1, 3][i]}</span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}

            <VCT_Stack direction="row" justify="space-between" align="center" style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 18, fontWeight: 900, textTransform: 'uppercase' }}>Vận Động Viên Đạt Huy Chương</div>
                <VCT_SegmentedControl
                    options={[
                        { label: 'Tất cả', value: 'all' },
                        { label: 'Vàng', value: 'vang' },
                        { label: 'Bạc', value: 'bac' },
                        { label: 'Đồng', value: 'dong' },
                    ]}
                    value={filterMedal}
                    onChange={setFilterMedal}
                />
            </VCT_Stack>

            {filtered.length === 0 ? (
                <VCT_EmptyState title="Không tìm thấy VĐV đạt huy chương" description="Thay đổi bộ lọc hoặc kiểm tra lại." icon="🏅" />
            ) : (
                <div style={{ borderRadius: 16, border: '1px solid var(--vct-border-subtle)', overflow: 'hidden', background: 'var(--vct-bg-glass)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--vct-border-strong)', background: 'var(--vct-bg-card)' }}>
                                {['Huy chương', 'Họ & Tên', 'Đoàn', 'Nội dung', 'Điểm / Thành tích', 'In Giấy Khen'].map((h, i) => (
                                    <th key={i} style={{ padding: '16px', textAlign: 'left', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', opacity: 0.5 }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((r) => {
                                const hc = r.loai_hc as keyof typeof MEDAL_COLORS;
                                const m = MEDAL_COLORS[hc];
                                if (!m) return null;
                                return (
                                    <tr key={r.id} style={{ borderBottom: '1px solid var(--vct-border-subtle)', transition: 'all 0.2s', background: 'transparent' }}>
                                        <td style={{ padding: '16px' }}>
                                            <VCT_Stack direction="row" gap={10} align="center">
                                                <div style={{ width: 32, height: 32, borderRadius: 8, background: m.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, boxShadow: `0 4px 10px ${m.color}60`, textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                                                    {m.icon}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 800, fontSize: 14 }}>{m.label}</div>
                                                </div>
                                            </VCT_Stack>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ fontWeight: 800, fontSize: 15 }}>{r.vdv_ten}</div>
                                        </td>
                                        <td style={{ padding: '16px', fontSize: 14, fontWeight: 600, color: 'var(--vct-text-secondary)' }}>{r.doan_ten}</td>
                                        <td style={{ padding: '16px' }}>
                                            <div style={{ display: 'inline-flex', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: 800, color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)' }}>
                                                {r.nd_ten}
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px', fontSize: 16, fontWeight: 900, fontFamily: 'monospace' }}>{r.diem_so || '—'}</td>
                                        <td style={{ padding: '16px' }}>
                                            <VCT_Button variant="secondary" icon={<VCT_Icons.Printer size={14} />} onClick={() => setCertModal(r)} style={{ padding: '4px 12px', fontSize: 12 }}>In Khen THưởng</VCT_Button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Print Certificate Modal */}
            <VCT_Modal isOpen={!!certModal} onClose={() => setCertModal(null)} title="In Giấy Chứng Nhận Thành Tích" width="900px" footer={
                <><VCT_Button variant="secondary" onClick={() => setCertModal(null)}>Đóng</VCT_Button><VCT_Button icon={<VCT_Icons.Printer size={16} />} onClick={() => window.print()}>In Giấy Khen</VCT_Button></>
            }>
                {certModal && (
                    <div className="print-cert-container" style={{ padding: 20 }}>
                        <div style={{ border: '15px solid transparent', borderImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0h100v100H0z\' fill=\'none\' stroke=\'%23d4af37\' stroke-width=\'4\'/%3E%3Cpath d=\'M10 10h80v80H10z\' fill=\'none\' stroke=\'%23d4af37\' stroke-width=\'1\'/%3E%3C/svg%3E") 15 stretch', padding: '40px', textAlign: 'center', background: '#fff', color: '#000', position: 'relative', minHeight: 600, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ fontSize: 14, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 30, letterSpacing: 2 }}>
                                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM<br />Độc lập - Tự do - Hạnh phúc
                            </div>

                            <h1 style={{ color: '#b91c1c', fontSize: 36, fontWeight: 900, textTransform: 'uppercase', margin: '0 0 10px 0', letterSpacing: 3 }}>GIẤY CHỨNG NHẬN</h1>
                            <div style={{ fontSize: 20, color: '#d4af37', fontWeight: 800, textTransform: 'uppercase', marginBottom: 40, letterSpacing: 2 }}>THÀNH TÍCH THI ĐẤU</div>

                            <div style={{ fontSize: 18, marginBottom: 15 }}>Chứng nhận Vận động viên:</div>
                            <div style={{ fontSize: 40, fontWeight: 900, color: '#1e3a8a', textTransform: 'uppercase', marginBottom: 15, fontFamily: 'serif' }}>{(certModal as any).vdv_ten}</div>

                            <div style={{ fontSize: 20, marginBottom: 30, fontWeight: 'bold' }}>Đơn vị: {(certModal as any).doan_ten}</div>

                            <div style={{ fontSize: 18, marginBottom: 15 }}>Đã đạt thành tích:</div>
                            <div style={{ fontSize: 32, fontWeight: 900, color: '#d4af37', textTransform: 'uppercase', marginBottom: 15 }}>
                                {(certModal as any).loai_hc === 'vang' ? 'HUY CHƯƠNG VÀNG' : (certModal as any).loai_hc === 'bac' ? 'HUY CHƯƠNG BẠC' : 'HUY CHƯƠNG ĐỒNG'}
                            </div>

                            <div style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 50 }}>Nội dung: {(certModal as any).nd_ten}</div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 80px', marginTop: 'auto' }}>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ fontStyle: 'italic', marginBottom: 10 }}>............, ngày ..... tháng ..... năm 20...</p>
                                    <p style={{ fontWeight: 'bold', fontSize: 18 }}>TRƯỞNG BAN TỔ CHỨC</p>
                                </div>
                                <div style={{ textAlign: 'center' }}>
                                    <p style={{ visibility: 'hidden', marginBottom: 10 }}>............, ngày ..... tháng ..... năm 20...</p>
                                    <p style={{ fontWeight: 'bold', fontSize: 18 }}>LIÊN ĐOÀN VÕ THUẬT</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <style>{`
                    @media print {
                        body * { visibility: hidden; }
                        .print-cert-container, .print-cert-container * { visibility: visible; }
                        .print-cert-container { position: absolute; left: 0; top: 0; width: 100%; height: 100%; display: block !important; }
                        main, nav, header { display: none !important; }
                        @page { size: landscape; margin: 0; }
                    }
                `}</style>
            </VCT_Modal>

            {/* Medal Table */}
            <div style={{ borderRadius: 16, border: '1px solid var(--vct-border-subtle)', overflow: 'hidden', background: 'var(--vct-bg-glass)', marginTop: 40 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid var(--vct-border-strong)', background: 'var(--vct-bg-card)' }}>
                            {['Hạng', 'Đơn vị', '🥇 Vàng', '🥈 Bạc', '🥉 Đồng', 'Tổng'].map((h, i) => (
                                <th key={i} style={{ padding: '14px 16px', textAlign: i >= 2 ? 'center' : 'left', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', opacity: 0.6 }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {medalTable.map((m, idx) => (
                            <tr key={m.id} style={{ borderBottom: '1px solid var(--vct-border-subtle)', background: idx < 3 ? `${['#fbbf24', '#94a3b8', '#d97706'][idx]}08` : idx % 2 === 0 ? 'transparent' : 'rgba(128,128,128,0.02)' }}>
                                <td style={{ padding: '14px 16px', fontWeight: 900, fontSize: 16, color: idx < 3 ? ['#fbbf24', '#94a3b8', '#d97706'][idx] : 'var(--vct-text-tertiary)' }}>{idx + 1}</td>
                                <td style={{ padding: '14px 16px' }}>
                                    <VCT_Stack direction="row" gap={10} align="center">
                                        <VCT_AvatarLetter name={m.ten} size={32} />
                                        <div><div style={{ fontWeight: 700, fontSize: 14 }}>{m.ten}</div><div style={{ fontSize: 11, opacity: 0.4 }}>{m.tat}</div></div>
                                    </VCT_Stack>
                                </td>
                                <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 900, fontSize: 18, color: '#fbbf24' }}>{m.hcv || '—'}</td>
                                <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 900, fontSize: 18, color: '#94a3b8' }}>{m.hcb || '—'}</td>
                                <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 900, fontSize: 18, color: '#d97706' }}>{m.hcd || '—'}</td>
                                <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 900, fontSize: 18, color: 'var(--vct-accent-cyan)' }}>{m.tong}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
