'use client';
import * as React from 'react';
import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    VCT_Badge, VCT_Button, VCT_KpiCard, VCT_Stack, VCT_Toast,
    VCT_Modal, VCT_Select, VCT_Field, VCT_EmptyState, VCT_AvatarLetter,
    VCT_ConfirmDialog, VCT_Card, VCT_ProgressBar, VCT_Text
} from '../components/vct-ui';
import { VCT_Icons } from '../components/vct-icons';
import { TRONG_TAIS, SAN_DAUS, genId } from '../data/mock-data';
import { CAP_BAC_TT_MAP, type TrongTai } from '../data/types';

interface Assignment { id: string; tt_id: string; san_id: string; vai_tro: string; ngay: string; phien: string }

const VAI_TRO_OPTIONS = [
    { value: 'chinh', label: 'Trọng tài chính' },
    { value: 'phu', label: 'Trọng tài phụ' },
    { value: 'giam_dinh', label: 'Giám định viên' },
    { value: 'thong_ke', label: 'Thống kê viên' },
];

const PHIENS = ['sang', 'chieu', 'toi'] as const;
const PHIEN_LABELS: Record<string, string> = { sang: '🌅 Sáng', chieu: '☀️ Chiều', toi: '🌙 Tối' };

const INIT_ASSIGNMENTS: Assignment[] = [
    { id: 'PA01', tt_id: 'TT01', san_id: 'S01', vai_tro: 'chinh', ngay: '2026-08-15', phien: 'sang' },
    { id: 'PA02', tt_id: 'TT03', san_id: 'S01', vai_tro: 'phu', ngay: '2026-08-15', phien: 'sang' },
    { id: 'PA03', tt_id: 'TT02', san_id: 'S02', vai_tro: 'chinh', ngay: '2026-08-15', phien: 'sang' },
    { id: 'PA04', tt_id: 'TT05', san_id: 'S02', vai_tro: 'giam_dinh', ngay: '2026-08-15', phien: 'sang' },
    { id: 'PA05', tt_id: 'TT04', san_id: 'S03', vai_tro: 'chinh', ngay: '2026-08-15', phien: 'chieu' },
    { id: 'PA06', tt_id: 'TT01', san_id: 'S01', vai_tro: 'chinh', ngay: '2026-08-15', phien: 'chieu' },
];

// ════════════════════════════════════════
// AUTO-ASSIGN ALGORITHM (Round-robin)
// ════════════════════════════════════════
function autoAssign(
    ttList: TrongTai[],
    sans: typeof SAN_DAUS,
    ngay: string
): Assignment[] {
    const result: Assignment[] = [];
    const activeSans = sans.filter(s => s.trang_thai !== 'bao_tri');
    // Roles to fill per sàn per phien: 1 chính + 1 phụ
    const roles = ['chinh', 'phu'];

    let ttIdx = 0;
    for (const phien of PHIENS) {
        for (const san of activeSans) {
            for (const role of roles) {
                if (ttIdx >= ttList.length) ttIdx = 0; // Round-robin wrap
                const tt = ttList[ttIdx]!;
                // Check no conflict: TT not already assigned to another sàn in same phien
                const conflict = result.find(r => r.tt_id === tt.id && r.phien === phien);
                if (!conflict) {
                    result.push({
                        id: genId('PA'),
                        tt_id: tt.id,
                        san_id: san.id,
                        vai_tro: role,
                        ngay,
                        phien,
                    });
                }
                ttIdx++;
            }
        }
    }
    return result;
}

// ════════════════════════════════════════
// PAGE COMPONENT
// ════════════════════════════════════════
export const Page_referee_assignments = () => {
    const [assignments, setAssignments] = useState<Assignment[]>(INIT_ASSIGNMENTS);
    const [showModal, setShowModal] = useState(false);
    const [showAutoModal, setShowAutoModal] = useState(false);
    const [form, setForm] = useState({ tt_id: '', san_id: '', vai_tro: 'chinh', ngay: '2026-08-15', phien: 'sang' });
    const [deleteTarget, setDeleteTarget] = useState<Assignment | null>(null);
    const [viewMode, setViewMode] = useState<'san' | 'matrix'>('san');
    const [isAutoAssigning, setIsAutoAssigning] = useState(false);
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });

    const showToast = useCallback((msg: string, type = 'success') => { setToast({ show: true, msg, type }); setTimeout(() => setToast(p => ({ ...p, show: false })), 3500); }, []);

    const ttsActive = TRONG_TAIS.filter(t => t.trang_thai === 'xac_nhan');
    const sanActive = SAN_DAUS;

    const getTT = (id: string) => TRONG_TAIS.find(t => t.id === id);
    const getSan = (id: string) => SAN_DAUS.find(s => s.id === id);

    // Group by sàn
    const bySan = useMemo(() => {
        const m = new Map<string, Assignment[]>();
        assignments.forEach(a => {
            if (!m.has(a.san_id)) m.set(a.san_id, []);
            m.get(a.san_id)!.push(a);
        });
        return m;
    }, [assignments]);

    // TT workload stats
    const ttWorkload = useMemo(() => {
        const wl: Record<string, number> = {};
        assignments.forEach(a => { wl[a.tt_id] = (wl[a.tt_id] || 0) + 1; });
        return wl;
    }, [assignments]);

    const handleAdd = () => {
        if (!form.tt_id || !form.san_id) { showToast('Chọn TT và sàn!', 'error'); return; }
        const conflict = assignments.find(a => a.tt_id === form.tt_id && a.ngay === form.ngay && a.phien === form.phien && a.san_id !== form.san_id);
        if (conflict) { showToast(`TT đã được phân công sàn khác trong phiên này!`, 'error'); return; }
        setAssignments(p => [...p, { ...form, id: genId('PA') }]);
        const tt = getTT(form.tt_id);
        showToast(`Phân công ${tt?.ho_ten || ''} → ${getSan(form.san_id)?.ten || ''}`);
        setShowModal(false);
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        setAssignments(p => p.filter(a => a.id !== deleteTarget.id));
        showToast('Đã hủy phân công');
        setDeleteTarget(null);
    };

    // ── AUTO-ASSIGN ──
    const handleAutoAssign = useCallback(() => {
        setIsAutoAssigning(true);
        setTimeout(() => {
            const newAssignments = autoAssign(ttsActive, SAN_DAUS, '2026-08-15');
            setAssignments(newAssignments);
            setShowAutoModal(false);
            setIsAutoAssigning(false);
            showToast(`Phân công tự động ${newAssignments.length} lượt trọng tài cho ${SAN_DAUS.filter(s => s.trang_thai !== 'bao_tri').length} sàn`);
        }, 1200);
    }, [ttsActive, showToast]);

    // ── Matrix View: TT (rows) x Phiên (cols) ──
    const renderMatrixView = () => (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px', fontSize: 13 }}>
                <thead>
                    <tr>
                        <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--vct-text-tertiary)' }}>Trọng tài</th>
                        <th style={{ textAlign: 'center', padding: '8px 12px', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', color: 'var(--vct-text-tertiary)' }}>Tổng</th>
                        {PHIENS.map(p => (
                            <th key={p} style={{ textAlign: 'center', padding: '8px 12px', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', color: 'var(--vct-text-tertiary)' }}>
                                {PHIEN_LABELS[p]}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {ttsActive.map(tt => {
                        const count = ttWorkload[tt.id] || 0;
                        const maxCount = Math.max(1, ...Object.values(ttWorkload));
                        return (
                            <motion.tr key={tt.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ background: 'var(--vct-bg-elevated)' }}>
                                <td style={{ padding: '10px 12px', borderRadius: '8px 0 0 8px' }}>
                                    <VCT_Stack direction="row" gap={8} align="center">
                                        <VCT_AvatarLetter name={tt.ho_ten} size={26} />
                                        <div>
                                            <div style={{ fontWeight: 700, fontSize: 13 }}>{tt.ho_ten}</div>
                                            <div style={{ fontSize: 10, opacity: 0.5 }}>{CAP_BAC_TT_MAP[tt.cap_bac].label} • {tt.chuyen_mon}</div>
                                        </div>
                                    </VCT_Stack>
                                </td>
                                <td style={{ textAlign: 'center', padding: '10px' }}>
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 8, background: count > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', fontWeight: 800, fontSize: 13, color: count > 0 ? '#10b981' : '#f59e0b' }}>
                                        {count}
                                    </div>
                                    <div style={{ width: '60%', margin: '4px auto 0', height: 3, borderRadius: 2, background: '#e2e8f0' }}>
                                        <div style={{ width: `${(count / maxCount) * 100}%`, height: '100%', borderRadius: 2, background: count > 0 ? '#10b981' : '#e2e8f0', transition: 'width 0.3s' }} />
                                    </div>
                                </td>
                                {PHIENS.map(phien => {
                                    const phienAssigns = assignments.filter(a => a.tt_id === tt.id && a.phien === phien);
                                    return (
                                        <td key={phien} style={{ textAlign: 'center', padding: '6px', borderRadius: phien === 'toi' ? '0 8px 8px 0' : 0 }}>
                                            {phienAssigns.length === 0 ? (
                                                <span style={{ color: '#cbd5e1', fontSize: 16 }}>○</span>
                                            ) : phienAssigns.map(a => {
                                                const san = getSan(a.san_id);
                                                const vtr = VAI_TRO_OPTIONS.find(v => v.value === a.vai_tro);
                                                return (
                                                    <div key={a.id} style={{
                                                        padding: '4px 8px', borderRadius: 8, marginBottom: 2,
                                                        background: a.vai_tro === 'chinh' ? 'rgba(59,130,246,0.1)' : 'rgba(148,163,184,0.1)',
                                                        fontSize: 11, fontWeight: 600,
                                                    }}>
                                                        <div style={{ color: a.vai_tro === 'chinh' ? '#3b82f6' : '#64748b' }}>{san?.ten}</div>
                                                        <div style={{ fontSize: 9, opacity: 0.5 }}>{vtr?.label}</div>
                                                    </div>
                                                );
                                            })}
                                        </td>
                                    );
                                })}
                            </motion.tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );

    return (
        <div style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 100 }}>
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast(p => ({ ...p, show: false }))} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                <VCT_KpiCard label="Tổng phân công" value={assignments.length} icon={<VCT_Icons.Users size={24} />} color="#0ea5e9" />
                <VCT_KpiCard label="TT tham gia" value={new Set(assignments.map(a => a.tt_id)).size} icon={<VCT_Icons.Shield size={24} />} color="#10b981" sub={`/${ttsActive.length} TT sẵn sàng`} />
                <VCT_KpiCard label="Sàn có TT" value={bySan.size} icon={<VCT_Icons.Layout size={24} />} color="#22d3ee" sub={`/${sanActive.length} sàn`} />
                <VCT_KpiCard label="TT chưa phân" value={ttsActive.length - new Set(assignments.map(a => a.tt_id)).size} icon={<VCT_Icons.Clock size={24} />} color="#f59e0b" />
            </div>

            {/* Toolbar */}
            <VCT_Stack direction="row" justify="space-between" align="center" style={{ marginBottom: 24 }}>
                <VCT_Stack direction="row" gap={8}>
                    <VCT_Button
                        variant={viewMode === 'san' ? 'primary' : 'secondary'}
                        icon={<VCT_Icons.Layout size={16} />}
                        onClick={() => setViewMode('san')}
                    >
                        Theo Sàn
                    </VCT_Button>
                    <VCT_Button
                        variant={viewMode === 'matrix' ? 'primary' : 'secondary'}
                        icon={<VCT_Icons.LayoutGrid size={16} />}
                        onClick={() => setViewMode('matrix')}
                    >
                        Ma trận TT
                    </VCT_Button>
                </VCT_Stack>
                <VCT_Stack direction="row" gap={8}>
                    <VCT_Button variant="secondary" icon={<VCT_Icons.Shuffle size={16} />} onClick={() => setShowAutoModal(true)}>
                        ⚡ Phân công tự động
                    </VCT_Button>
                    <VCT_Button icon={<VCT_Icons.Plus size={16} />} onClick={() => setShowModal(true)}>Phân công TT</VCT_Button>
                </VCT_Stack>
            </VCT_Stack>

            {/* Content */}
            {viewMode === 'matrix' ? (
                <VCT_Card title="Ma trận Phân công Trọng tài">
                    {renderMatrixView()}
                </VCT_Card>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
                    {sanActive.map(san => {
                        const sanAssigns = bySan.get(san.id) || [];
                        return (
                            <VCT_Card key={san.id}>
                                <VCT_Stack direction="row" gap={12} align="center" style={{ marginBottom: 16 }}>
                                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: san.trang_thai === 'dang_thi_dau' ? '#ef4444' : san.trang_thai === 'san_sang' ? '#10b981' : '#f59e0b' }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontWeight: 800, fontSize: 15 }}>{san.ten}</div>
                                        <div style={{ fontSize: 11, opacity: 0.5 }}>{san.vi_tri} • {san.loai}</div>
                                    </div>
                                    <VCT_Badge text={`${sanAssigns.length} TT`} type={sanAssigns.length > 0 ? 'success' : 'warning'} />
                                </VCT_Stack>

                                {sanAssigns.length === 0 ? (
                                    <div style={{ padding: 20, textAlign: 'center', opacity: 0.3, fontSize: 13 }}>Chưa phân công trọng tài</div>
                                ) : (
                                    <VCT_Stack gap={8}>
                                        {sanAssigns.map(a => {
                                            const tt = getTT(a.tt_id);
                                            const vtr = VAI_TRO_OPTIONS.find(v => v.value === a.vai_tro);
                                            return (
                                                <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: 'var(--vct-bg-elevated)', border: '1px solid var(--vct-border-subtle)' }}>
                                                    <VCT_AvatarLetter name={tt?.ho_ten || '?'} size={28} />
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: 700, fontSize: 13 }}>{tt?.ho_ten || '—'}</div>
                                                        <div style={{ fontSize: 11, opacity: 0.5 }}>{vtr?.label} • {tt ? CAP_BAC_TT_MAP[tt.cap_bac].label : ''}</div>
                                                    </div>
                                                    <VCT_Badge text={PHIEN_LABELS[a.phien] || a.phien} type="info" />
                                                    <button onClick={() => setDeleteTarget(a)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}><VCT_Icons.x size={14} /></button>
                                                </div>
                                            );
                                        })}
                                    </VCT_Stack>
                                )}
                            </VCT_Card>
                        );
                    })}
                </div>
            )}

            {/* Add Modal */}
            <VCT_Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Phân công Trọng tài" width="500px" footer={
                <><VCT_Button variant="secondary" onClick={() => setShowModal(false)}>Hủy</VCT_Button><VCT_Button onClick={handleAdd}>Phân công</VCT_Button></>
            }>
                <VCT_Stack gap={16}>
                    <VCT_Field label="Trọng tài *"><VCT_Select options={ttsActive.map(t => ({ value: t.id, label: `${t.ho_ten} — ${CAP_BAC_TT_MAP[t.cap_bac].label}` }))} value={form.tt_id} onChange={(v: any) => setForm({ ...form, tt_id: v })} /></VCT_Field>
                    <VCT_Field label="Sàn đấu *"><VCT_Select options={sanActive.map(s => ({ value: s.id, label: `${s.ten} — ${s.vi_tri}` }))} value={form.san_id} onChange={(v: any) => setForm({ ...form, san_id: v })} /></VCT_Field>
                    <VCT_Field label="Vai trò"><VCT_Select options={VAI_TRO_OPTIONS} value={form.vai_tro} onChange={(v: any) => setForm({ ...form, vai_tro: v })} /></VCT_Field>
                    <VCT_Stack direction="row" gap={16}>
                        <VCT_Field label="Phiên" style={{ flex: 1 }}><VCT_Select options={[{ value: 'sang', label: 'Sáng' }, { value: 'chieu', label: 'Chiều' }, { value: 'toi', label: 'Tối' }]} value={form.phien} onChange={(v: any) => setForm({ ...form, phien: v })} /></VCT_Field>
                    </VCT_Stack>
                </VCT_Stack>
            </VCT_Modal>

            {/* Auto-Assign Modal */}
            <VCT_Modal isOpen={showAutoModal} onClose={() => setShowAutoModal(false)} title="⚡ Phân công Trọng tài Tự động">
                <VCT_Text variant="body" style={{ marginBottom: 16, color: 'var(--vct-text-secondary)' }}>
                    Thuật toán Round-Robin sẽ phân công đều trọng tài cho tất cả các sàn đấu,
                    mỗi sàn có 1 TT chính + 1 TT phụ, đảm bảo không có xung đột (cùng TT ở 2 sàn 1 phiên).
                </VCT_Text>

                <div style={{ padding: 16, borderRadius: 12, background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)', marginBottom: 16 }}>
                    <VCT_Text variant="small" style={{ fontWeight: 700, color: '#10b981' }}>📊 Tổng quan dự kiến</VCT_Text>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 8 }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 20, fontWeight: 900 }}>{ttsActive.length}</div>
                            <div style={{ fontSize: 11, color: 'var(--vct-text-tertiary)' }}>TT sẵn sàng</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 20, fontWeight: 900 }}>{SAN_DAUS.filter(s => s.trang_thai !== 'bao_tri').length}</div>
                            <div style={{ fontSize: 11, color: 'var(--vct-text-tertiary)' }}>Sàn khả dụng</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 20, fontWeight: 900 }}>{SAN_DAUS.filter(s => s.trang_thai !== 'bao_tri').length * 3 * 2}</div>
                            <div style={{ fontSize: 11, color: 'var(--vct-text-tertiary)' }}>Slot dự kiến</div>
                        </div>
                    </div>
                </div>

                <VCT_Stack direction="row" gap={12} justify="flex-end">
                    <VCT_Button variant="secondary" onClick={() => setShowAutoModal(false)}>Hủy</VCT_Button>
                    <VCT_Button variant="primary" loading={isAutoAssigning} icon={<VCT_Icons.Shuffle size={16} />} onClick={handleAutoAssign}>
                        ⚡ Phân công ngay
                    </VCT_Button>
                </VCT_Stack>
            </VCT_Modal>

            <VCT_ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
                title="Hủy phân công" message="Bạn có chắc muốn hủy phân công trọng tài này?" confirmLabel="Hủy phân công" />
        </div>
    );
};
