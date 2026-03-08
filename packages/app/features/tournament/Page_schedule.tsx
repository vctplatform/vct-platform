'use client';
import * as React from 'react';
import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    VCT_Badge, VCT_Button, VCT_KpiCard, VCT_Stack, VCT_Toast, VCT_Card,
    VCT_StatusPipeline, VCT_EmptyState, VCT_Tabs, VCT_Modal, VCT_Select, VCT_Text
} from '../components/vct-ui';
import { VCT_Icons } from '../components/vct-icons';
import { SAN_DAUS, HANG_CANS, NOI_DUNG_QUYENS, genId } from '../data/mock-data';
import type { LichThiDau, TrangThaiLich, PhienThi, SanDau } from '../data/types';
import { repositories, useEntityCollection } from '../data/repository';

// ════════════════════════════════════════
// CONSTANTS & MAPS
// ════════════════════════════════════════
const ST_MAP: Record<TrangThaiLich, { label: string; color: string; type: string }> = {
    du_kien: { label: 'Dự kiến', color: '#94a3b8', type: 'info' },
    xac_nhan: { label: 'Xác nhận', color: '#22d3ee', type: 'info' },
    dang_dien_ra: { label: '🔴 Đang diễn ra', color: '#ef4444', type: 'warning' },
    hoan_thanh: { label: '✓ Hoàn thành', color: '#10b981', type: 'success' },
};
const PHIEN_MAP: Record<PhienThi, { label: string; icon: string; time: string }> = {
    sang: { label: 'Sáng', icon: '🌅', time: '08:00 — 11:30' },
    chieu: { label: 'Chiều', icon: '☀️', time: '13:30 — 17:00' },
    toi: { label: 'Tối', icon: '🌙', time: '19:00 — 21:30' },
};
const DAYS = ['2026-08-15', '2026-08-16', '2026-08-17', '2026-08-18', '2026-08-19'];
const DAY_LABELS: Record<string, string> = {
    '2026-08-15': 'Ngày 1 — 15/08', '2026-08-16': 'Ngày 2 — 16/08',
    '2026-08-17': 'Ngày 3 — 17/08', '2026-08-18': 'Ngày 4 — 18/08',
    '2026-08-19': 'Ngày 5 — 19/08',
};
const PHIENS: PhienThi[] = ['sang', 'chieu', 'toi'];

// ════════════════════════════════════════
// AUTO-SCHEDULE ALGORITHM (Greedy)
// ════════════════════════════════════════
interface ContentItem { id: string; ten: string; loai: 'doi_khang' | 'quyen'; so_tran: number; }

function getAllContents(): ContentItem[] {
    const items: ContentItem[] = [];
    HANG_CANS.filter(h => h.trang_thai === 'active').forEach(h => {
        items.push({
            id: h.id,
            ten: `ĐK ${h.gioi === 'nam' ? 'Nam' : 'Nữ'} ${h.can_tu}-${h.can_den}kg ${h.lua_tuoi}`,
            loai: 'doi_khang',
            so_tran: Math.floor(Math.random() * 4) + 2, // Simulate 2-5 matches per content
        });
    });
    NOI_DUNG_QUYENS.filter(q => q.trang_thai === 'active').forEach(q => {
        items.push({
            id: q.id,
            ten: `Quyền: ${q.ten}`,
            loai: 'quyen',
            so_tran: Math.floor(Math.random() * 3) + 1, // 1-3 rounds
        });
    });
    return items;
}

function autoSchedule(
    days: string[],
    phiens: PhienThi[],
    sans: SanDau[],
    contents: ContentItem[]
): LichThiDau[] {
    const result: LichThiDau[] = [];
    const activeSans = sans.filter(s => s.trang_thai !== 'bao_tri');
    let contentIdx = 0;
    const startTimes: Record<PhienThi, string> = { sang: '08:00', chieu: '13:30', toi: '19:00' };
    const endTimes: Record<PhienThi, string> = { sang: '11:30', chieu: '17:00', toi: '21:30' };

    for (const day of days) {
        for (const phien of phiens) {
            for (const san of activeSans) {
                if (contentIdx >= contents.length) break;
                const content = contents[contentIdx]!;
                result.push({
                    id: genId('L'),
                    ngay: day,
                    phien,
                    san_id: san.id,
                    noi_dung: content.ten,
                    so_tran: content.so_tran,
                    gio_bat_dau: startTimes[phien],
                    gio_ket_thuc: endTimes[phien],
                    trang_thai: 'du_kien' as TrangThaiLich,
                });
                contentIdx++;
            }
        }
    }
    return result;
}

// ════════════════════════════════════════
// PAGE COMPONENT
// ════════════════════════════════════════
export const Page_schedule = () => {
    const [dayFilter, setDayFilter] = useState('2026-08-15');
    const { items: schedule, setItems: setScheduleState } = useEntityCollection(repositories.schedule.mock);
    const [viewMode, setViewMode] = useState<'timeline' | 'grid'>('timeline');
    const [showAutoModal, setShowAutoModal] = useState(false);
    const [autoConfig, setAutoConfig] = useState({ days: 3, distribute: 'balanced' });
    const [isGenerating, setIsGenerating] = useState(false);
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' as string });

    const showToast = useCallback((msg: string, type = 'success') => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast(p => ({ ...p, show: false })), 3000);
    }, []);

    const setSchedule = useCallback((updater: React.SetStateAction<LichThiDau[]>) => {
        setScheduleState(prev => {
            const next = typeof updater === 'function'
                ? (updater as (value: LichThiDau[]) => LichThiDau[])(prev)
                : updater;
            void repositories.schedule.mock.replaceAll(next);
            return next;
        });
    }, [setScheduleState]);

    const filtered = useMemo(() => schedule.filter(l => l.ngay === dayFilter), [dayFilter, schedule]);
    const grouped = useMemo(() => {
        const g: Record<string, LichThiDau[]> = { sang: [], chieu: [], toi: [] };
        filtered.forEach(l => { if (g[l.phien]) g[l.phien]!.push(l); });
        return g;
    }, [filtered]);

    // KPIs
    const totalMatches = useMemo(() => schedule.reduce((s, l) => s + l.so_tran, 0), [schedule]);
    const totalSessions = schedule.length;
    const liveCount = schedule.filter(l => l.trang_thai === 'dang_dien_ra').length;
    const activeSans = SAN_DAUS.filter(s => s.trang_thai === 'dang_thi_dau' || s.trang_thai === 'san_sang').length;

    const pStages = useMemo(() => [
        { key: 'dang_dien_ra', label: '🔴 LIVE', color: '#ef4444', count: schedule.filter(l => l.trang_thai === 'dang_dien_ra').length },
        { key: 'xac_nhan', label: 'Xác nhận', color: '#22d3ee', count: schedule.filter(l => l.trang_thai === 'xac_nhan').length },
        { key: 'du_kien', label: 'Dự kiến', color: '#94a3b8', count: schedule.filter(l => l.trang_thai === 'du_kien').length },
        { key: 'hoan_thanh', label: 'Xong', color: '#10b981', count: schedule.filter(l => l.trang_thai === 'hoan_thanh').length },
    ], [schedule]);

    // ── AUTO-SCHEDULE ──
    const handleAutoSchedule = useCallback(() => {
        setIsGenerating(true);
        setTimeout(() => {
            const contents = getAllContents();
            const selectedDays = DAYS.slice(0, autoConfig.days);
            const newSchedule = autoSchedule(selectedDays, PHIENS, SAN_DAUS, contents);
            setSchedule(newSchedule);
            setShowAutoModal(false);
            setIsGenerating(false);
            showToast(`Đã tạo tự động ${newSchedule.length} phiên, ${newSchedule.reduce((s, l) => s + l.so_tran, 0)} trận trên ${SAN_DAUS.filter(s => s.trang_thai !== 'bao_tri').length} sàn`);
        }, 1500);
    }, [autoConfig, setSchedule, showToast]);

    // ── DELETE ITEM ──
    const handleDelete = useCallback((id: string) => {
        setSchedule(prev => prev.filter(l => l.id !== id));
        showToast('Đã xóa phiên thi đấu', 'info');
    }, [setSchedule, showToast]);

    // ── Grid View: San x Phien matrix ──
    const renderGridView = () => {
        const activeSansList = SAN_DAUS.filter(s => s.trang_thai !== 'bao_tri');
        return (
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px', fontSize: 13 }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--vct-text-tertiary)' }}>Sàn</th>
                            {PHIENS.map(p => (
                                <th key={p} style={{ textAlign: 'center', padding: '8px 12px', fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--vct-text-tertiary)' }}>
                                    {PHIEN_MAP[p].icon} {PHIEN_MAP[p].label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {activeSansList.map(san => (
                            <tr key={san.id}>
                                <td style={{ padding: '10px 12px', fontWeight: 700, borderRadius: '8px 0 0 8px', background: 'var(--vct-bg-elevated)' }}>
                                    {san.ten}
                                </td>
                                {PHIENS.map(phien => {
                                    const items = filtered.filter(l => l.san_id === san.id && l.phien === phien);
                                    return (
                                        <td key={phien} style={{ padding: '6px', textAlign: 'center', background: 'var(--vct-bg-elevated)' }}>
                                            {items.length === 0 ? (
                                                <span style={{ color: '#cbd5e1', fontSize: 12 }}>—</span>
                                            ) : items.map(item => {
                                                const st = ST_MAP[item.trang_thai];
                                                return (
                                                    <motion.div key={item.id} initial={{ scale: 0.9 }} animate={{ scale: 1 }}
                                                        style={{
                                                            padding: '8px 10px', borderRadius: 10, marginBottom: 4,
                                                            background: `${st.color}10`, borderLeft: `3px solid ${st.color}`,
                                                            textAlign: 'left',
                                                        }}
                                                    >
                                                        <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.3 }}>{item.noi_dung}</div>
                                                        <div style={{ fontSize: 10, color: 'var(--vct-text-tertiary)', marginTop: 2 }}>
                                                            {item.so_tran} trận • {item.gio_bat_dau}—{item.gio_ket_thuc}
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <div style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 100 }}>
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast(p => ({ ...p, show: false }))} />

            {/* KPIs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                <VCT_KpiCard label="Tổng phiên" value={totalSessions} icon={<VCT_Icons.Calendar size={24} />} color="#0ea5e9" />
                <VCT_KpiCard label="Tổng trận" value={totalMatches} icon={<VCT_Icons.Swords size={24} />} color="#f59e0b" />
                <VCT_KpiCard label="Đang diễn ra" value={liveCount} icon={<VCT_Icons.Play size={24} />} color="#ef4444" sub="🔴 LIVE" />
                <VCT_KpiCard label="Sàn hoạt động" value={activeSans} icon={<VCT_Icons.Layout size={24} />} color="#22d3ee" />
            </div>

            <VCT_StatusPipeline stages={pStages} activeStage={null} onStageClick={() => { }} />

            {/* Toolbar */}
            <VCT_Stack direction="row" justify="space-between" align="center" style={{ marginBottom: 16, marginTop: 16 }}>
                <VCT_Stack direction="row" gap={8}>
                    <VCT_Button
                        variant={viewMode === 'timeline' ? 'primary' : 'secondary'}
                        icon={<VCT_Icons.List size={16} />}
                        onClick={() => setViewMode('timeline')}
                    >
                        Timeline
                    </VCT_Button>
                    <VCT_Button
                        variant={viewMode === 'grid' ? 'primary' : 'secondary'}
                        icon={<VCT_Icons.LayoutGrid size={16} />}
                        onClick={() => setViewMode('grid')}
                    >
                        Ma trận Sàn
                    </VCT_Button>
                </VCT_Stack>
                <VCT_Button
                    variant="primary"
                    icon={<VCT_Icons.Shuffle size={16} />}
                    onClick={() => setShowAutoModal(true)}
                >
                    ⚡ Tạo lịch tự động
                </VCT_Button>
            </VCT_Stack>

            {/* Day Tabs */}
            <VCT_Tabs tabs={DAYS.map(d => ({ key: d, label: DAY_LABELS[d] || d }))} activeTab={dayFilter} onChange={setDayFilter} />

            {/* Content */}
            {viewMode === 'grid' ? (
                <VCT_Card title={`Ma trận Lịch — ${DAY_LABELS[dayFilter] || dayFilter}`}>
                    {renderGridView()}
                </VCT_Card>
            ) : (
                /* Timeline View */
                PHIENS.map(phien => {
                    const items = grouped[phien] || [];
                    if (items.length === 0) return null;
                    const p = PHIEN_MAP[phien];
                    return (
                        <div key={phien} style={{ marginBottom: 24 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                                <span style={{ fontSize: 20 }}>{p.icon}</span>
                                <span style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{p.label}</span>
                                <span style={{ fontSize: 11, color: 'var(--vct-text-tertiary)' }}>{p.time}</span>
                            </div>
                            <div style={{ display: 'grid', gap: 10 }}>
                                {items.map((l, i) => {
                                    const st = ST_MAP[l.trang_thai];
                                    const san = SAN_DAUS.find(s => s.id === l.san_id);
                                    return (
                                        <motion.div key={l.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
                                                borderRadius: 14, border: '1px solid var(--vct-border-subtle)',
                                                background: 'var(--vct-bg-glass)', borderLeft: `4px solid ${st.color}`,
                                                transition: 'box-shadow 0.2s ease',
                                            }}
                                                onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.06)')}
                                                onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                                            >
                                                <div style={{ minWidth: 100, textAlign: 'center' }}>
                                                    <div style={{ fontSize: 15, fontWeight: 900, fontFamily: 'monospace' }}>{l.gio_bat_dau}</div>
                                                    <div style={{ fontSize: 11, opacity: 0.4 }}>{l.gio_ket_thuc}</div>
                                                </div>
                                                <div style={{ width: 1, height: 40, background: 'var(--vct-border-subtle)' }} />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 700, fontSize: 14 }}>{l.noi_dung}</div>
                                                    <div style={{ fontSize: 12, opacity: 0.5, marginTop: 2 }}>
                                                        📍 {san?.ten || l.san_id} • {l.so_tran} trận
                                                    </div>
                                                </div>
                                                <VCT_Badge text={st.label} type={st.type} pulse={l.trang_thai === 'dang_dien_ra'} />
                                                <VCT_Button variant="ghost" icon={<VCT_Icons.Trash size={14} />} onClick={() => handleDelete(l.id)} />
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })
            )}

            {filtered.length === 0 && <VCT_EmptyState title="Không có lịch" description={`Ngày ${DAY_LABELS[dayFilter] || dayFilter} chưa có lịch thi đấu. Hãy nhấn "Tạo lịch tự động" để bắt đầu.`} icon="📅" />}

            {/* Auto-Schedule Modal */}
            <VCT_Modal isOpen={showAutoModal} onClose={() => setShowAutoModal(false)} title="⚡ Tạo Lịch Tự Động">
                <VCT_Text variant="body" style={{ marginBottom: 16, color: 'var(--vct-text-secondary)' }}>
                    Hệ thống sẽ tự động phân bổ các nội dung thi đấu vào các phiên (Sáng/Chiều/Tối) và các sàn đấu,
                    đảm bảo cân bằng tải và tối ưu thời gian thi đấu.
                </VCT_Text>

                <VCT_Select
                    label="Số ngày thi đấu"
                    options={[
                        { value: '2', label: '2 ngày' },
                        { value: '3', label: '3 ngày' },
                        { value: '4', label: '4 ngày' },
                        { value: '5', label: '5 ngày' },
                    ]}
                    value={String(autoConfig.days)}
                    onChange={(v: string) => setAutoConfig(prev => ({ ...prev, days: parseInt(v) }))}
                />

                <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.1)' }}>
                    <VCT_Text variant="small" style={{ fontWeight: 700, color: '#3b82f6' }}>📊 Tổng quan dự kiến</VCT_Text>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 8 }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--vct-text-primary)' }}>{getAllContents().length}</div>
                            <div style={{ fontSize: 11, color: 'var(--vct-text-tertiary)' }}>Nội dung</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--vct-text-primary)' }}>{SAN_DAUS.filter(s => s.trang_thai !== 'bao_tri').length}</div>
                            <div style={{ fontSize: 11, color: 'var(--vct-text-tertiary)' }}>Sàn khả dụng</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--vct-text-primary)' }}>{autoConfig.days * 3}</div>
                            <div style={{ fontSize: 11, color: 'var(--vct-text-tertiary)' }}>Phiên tổng</div>
                        </div>
                    </div>
                </div>

                <VCT_Stack direction="row" gap={12} justify="flex-end" style={{ marginTop: 24 }}>
                    <VCT_Button variant="secondary" onClick={() => setShowAutoModal(false)}>Hủy</VCT_Button>
                    <VCT_Button variant="primary" loading={isGenerating} icon={<VCT_Icons.Shuffle size={16} />} onClick={handleAutoSchedule}>
                        ⚡ Tạo lịch ngay
                    </VCT_Button>
                </VCT_Stack>
            </VCT_Modal>
        </div>
    );
};
