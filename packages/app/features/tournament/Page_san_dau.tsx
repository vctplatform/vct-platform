'use client';
import * as React from 'react';
import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    VCT_Card, VCT_Badge, VCT_Button, VCT_Text, VCT_Stack,
    VCT_Toast, VCT_Modal, VCT_Divider, VCT_Input, VCT_Field, VCT_Select,
    VCT_ConfirmDialog, VCT_EmptyState, VCT_SearchInput
} from '@vct/ui';
import { VCT_PageContainer, VCT_StatRow } from '@vct/ui';
import type { StatItem } from '@vct/ui';
import { VCT_Icons } from '@vct/ui';

import { genId } from '../hooks/useTournamentAPI';
import type { SanDau, TrangThaiSan, TrangThaiTrangBi } from '../data/types';
import { repositories, useEntityCollection } from '../data/repository';
import { useToast } from '../hooks/use-toast';

const TRANG_THAI_SAN_MAP: Record<TrangThaiSan, { label: string; color: string; type: string; icon: any }> = {
    dong: { label: 'Đóng', color: 'var(--vct-text-tertiary)', type: 'info', icon: VCT_Icons.Moon },
    san_sang: { label: 'Sẵn sàng', color: 'var(--vct-success)', type: 'success', icon: VCT_Icons.Check },
    dang_chuan_bi: { label: 'Đang chuẩn bị', color: 'var(--vct-warning)', type: 'warning', icon: VCT_Icons.Clock },
    dang_thi_dau: { label: 'Đang thi đấu', color: 'var(--vct-danger)', type: 'danger', icon: VCT_Icons.Activity },
    su_co: { label: 'Sự cố', color: 'var(--vct-danger)', type: 'danger', icon: VCT_Icons.Alert },
    bao_tri: { label: 'Bảo trì', color: 'var(--vct-warning)', type: 'warning', icon: VCT_Icons.Wrench },
};

const TRANG_BI_MAP: Record<TrangThaiTrangBi, { label: string; color: string }> = {
    tot: { label: 'Tốt', color: 'var(--vct-success)' },
    thieu: { label: 'Thiếu', color: 'var(--vct-warning)' },
    hong: { label: 'Hỏng', color: 'var(--vct-danger)' },
};

const BLANK_ARENA: Partial<SanDau> = {
    ten: '',
    vi_tri: '',
    loai: 'doi_khang',
    kich_thuoc: '12x12m',
    phu_trach: '',
    phu_trach_sdt: '',
    trang_thai: 'san_sang',
    capacity: 300,
    total_today: 10,
};

// ════════════════════════════════════════
// LIVE SCOREBOARD
// ════════════════════════════════════════
const LiveScoreboard = ({ color, name, score, team, isWinner }: { color: 'red' | 'blue', name: string, score: number | string, team: string, isWinner?: boolean }) => {
    const isRed = color === 'red';
    const themeColor = isRed ? 'var(--vct-danger)' : 'var(--vct-info)';

    return (
        <div {...{ style: {
            flex: 1, padding: '12px', borderRadius: '16px',
            background: 'var(--vct-bg-elevated)', border: `1.5px solid ${isWinner ? themeColor : 'var(--vct-border-subtle)'}`,
            display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', overflow: 'hidden',
            boxShadow: isWinner ? `0 0 20px ${themeColor}20` : 'none',
            transition: 'all 0.3s'
        } }}>
            <div {...{ style: {
                position: 'absolute', top: 0, [isRed ? 'left' : 'right']: 0,
                padding: '2px 8px', background: themeColor, color: 'var(--vct-bg-elevated)',
                fontSize: '9px', fontWeight: 900,
                borderBottomRightRadius: isRed ? 8 : 0, borderBottomLeftRadius: isRed ? 0 : 8,
                letterSpacing: '0.05em'
            } }}>
                {isRed ? 'GIÁP ĐÒ' : 'GIÁP XANH'}
            </div>

            <VCT_Stack align="center" gap={2} {...{ style: { marginTop: '12px', width: '100%', textAlign: 'center' } }}>
                <div {...{ style: { fontSize: '32px', fontWeight: 900, color: themeColor, fontFamily: 'monospace', textShadow: `0 0 10px ${themeColor}30` } }}>
                    {score}
                </div>
                <VCT_Text variant="h3" {...{ style: { fontSize: '14px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' } }}>{name}</VCT_Text>
                <VCT_Text variant="small" {...{ style: { opacity: 0.5, fontSize: '10px' } }}>{team}</VCT_Text>
            </VCT_Stack>
        </div>
    );
};


// ════════════════════════════════════════
// ARENA PAGE
// ════════════════════════════════════════
export const Page_san_dau = () => {
    const {
        items: arenas,
        setItems: setArenasState,
        uiState,
    } = useEntityCollection(repositories.arenas.mock);
    const { toast, showToast, hideToast } = useToast();
    const [expandedArenaId, setExpandedArenaId] = useState<string | null>(null);
    const [showArenaModal, setShowArenaModal] = useState(false);
    const [editingArena, setEditingArena] = useState<SanDau | null>(null);
    const [arenaForm, setArenaForm] = useState<any>({ ...BLANK_ARENA });
    const [deleteTarget, setDeleteTarget] = useState<SanDau | null>(null);

    // Filtering
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterType, setFilterType] = useState('all');

    const filteredArenas = useMemo(() => {
        return arenas.filter(a => {
            const matchesSearch = a.ten.toLowerCase().includes(searchQuery.toLowerCase()) ||
                a.vi_tri.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = filterStatus === 'all' || a.trang_thai === filterStatus;
            const matchesType = filterType === 'all' || a.loai === filterType;
            return matchesSearch && matchesStatus && matchesType;
        });
    }, [arenas, searchQuery, filterStatus, filterType]);

    const setArenas = useCallback((updater: React.SetStateAction<SanDau[]>) => {
        setArenasState(prev => {
            const next = typeof updater === 'function'
                ? (updater as (value: SanDau[]) => SanDau[])(prev)
                : updater;
            void repositories.arenas.mock.replaceAll(next);
            return next;
        });
    }, [setArenasState]);

    // ── Computed ──
    const totalMatches = arenas.reduce((sum, a) => sum + a.total_today, 0);
    const totalDone = arenas.reduce((sum, a) => sum + a.done_today, 0);
    const liveArenas = arenas.filter(a => a.trang_thai === 'dang_thi_dau').length;

    const handleStatusChange = (id: string, newStatus: TrangThaiSan) => {
        setArenas(prev => prev.map(a => {
            if (a.id === id) {
                const updated = { ...a, trang_thai: newStatus };
                updated.history = [{ time: new Date().toLocaleString('vi-VN'), action: `Chuyển → ${TRANG_THAI_SAN_MAP[newStatus].label}`, by: 'Admin' }, ...updated.history];
                return updated;
            }
            return a;
        }));
        showToast(`Đã chuyển trạng thái sàn thành ${TRANG_THAI_SAN_MAP[newStatus].label}`);
    };

    const openCreateArena = () => {
        setEditingArena(null);
        setArenaForm({ ...BLANK_ARENA });
        setShowArenaModal(true);
    };

    const openEditArena = (arena: SanDau) => {
        setEditingArena(arena);
        setArenaForm({ ...arena });
        setShowArenaModal(true);
    };

    const saveArena = () => {
        if (!arenaForm.ten || !arenaForm.vi_tri) {
            showToast('Vui lòng nhập tên và vị trí sàn', 'error');
            return;
        }

        if (editingArena) {
            setArenas(prev => prev.map(item => item.id === editingArena.id
                ? {
                    ...item,
                    ...arenaForm,
                    history: [
                        { time: new Date().toLocaleString('vi-VN'), action: 'Cập nhật thông tin sàn', by: 'Admin' },
                        ...item.history,
                    ],
                }
                : item));
            showToast(`Đã cập nhật ${arenaForm.ten}`);
        } else {
            const created: SanDau = {
                id: genId('S'),
                ten: arenaForm.ten,
                vi_tri: arenaForm.vi_tri,
                loai: arenaForm.loai,
                kich_thuoc: arenaForm.kich_thuoc || '12x12m',
                trang_thai: arenaForm.trang_thai || 'san_sang',
                phu_trach: arenaForm.phu_trach || 'Chưa phân công',
                phu_trach_sdt: arenaForm.phu_trach_sdt || '',
                sub_state: '',
                noi_dung: '',
                match_live: null,
                queue: [],
                done_today: 0,
                total_today: Number(arenaForm.total_today || 10),
                capacity: Number(arenaForm.capacity || 300),
                trong_tai: [],
                trang_bi: [
                    { ten: 'Giáp hộ thân', sl: 4, tt: 'tot' },
                    { ten: 'Găng tay', sl: 8, tt: 'tot' },
                ],
                history: [
                    { time: new Date().toLocaleString('vi-VN'), action: 'Tạo mới sàn đấu', by: 'Admin' },
                ],
                ghi_chu: '',
            };
            setArenas(prev => [created, ...prev]);
            showToast(`Đã thêm ${created.ten}`);
        }

        setShowArenaModal(false);
    };

    const removeArena = () => {
        if (!deleteTarget) return;
        setArenas(prev => prev.filter(item => item.id !== deleteTarget.id));
        showToast(`Đã xóa ${deleteTarget.ten}`, 'success');
        setDeleteTarget(null);
    };

    return (
        <VCT_PageContainer size="wide" animated>
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={hideToast} />

            {/* ── KPI HEADER ── */}
            <VCT_StatRow items={[
                { label: 'Tổng Sàn', value: arenas.length, icon: <VCT_Icons.Columns size={18} />, color: 'var(--vct-accent-cyan)' },
                { label: 'LIVE', value: liveArenas, icon: <VCT_Icons.Activity size={18} />, color: 'var(--vct-danger)' },
                { label: 'Trận hôm nay', value: totalMatches, icon: <VCT_Icons.List size={18} />, color: 'var(--vct-info)', sub: `Xong: ${totalDone}` },
                { label: 'Sẵn sàng', value: arenas.filter(a => a.trang_thai === 'san_sang').length, icon: <VCT_Icons.Check size={18} />, color: 'var(--vct-success)' },
            ] as StatItem[]} className="mb-6" />

            {/* ── HEADER ── */}
            <VCT_Stack direction="row" justify="space-between" align="center" {...{ style: { marginBottom: '24px' } }}>
                <div>
                    <VCT_Text variant="h1">Quản lý Sàn đấu (Arenas)</VCT_Text>
                    <VCT_Text variant="small" {...{ style: { opacity: 0.5 } }}>Giám sát thời gian thực và điều phối trận đấu</VCT_Text>
                </div>
                <VCT_Button icon={<VCT_Icons.Plus size={16} />} onClick={openCreateArena}>Thêm Sàn</VCT_Button>
            </VCT_Stack>

            {/* ── FILTERS ── */}
            <VCT_Card {...{ style: { marginBottom: '24px', padding: '16px' } }}>
                <VCT_Stack direction="row" gap={16} align="center">
                    <div className="flex-1">
                        <VCT_SearchInput
                            placeholder="Tìm kiếm sàn đấu, vị trí..."
                            value={searchQuery}
                            onChange={(v: string) => setSearchQuery(v)}
                            onClear={() => setSearchQuery('')}
                        />
                    </div>
                    <div {...{ style: { width: '200px' } }}>
                        <VCT_Select
                            options={[
                                { value: 'all', label: 'Tất cả trạng thái' },
                                ...Object.entries(TRANG_THAI_SAN_MAP).map(([k, v]) => ({ value: k, label: v.label }))
                            ]}
                            value={filterStatus}
                            onChange={(v: string) => setFilterStatus(v)}
                        />
                    </div>
                    <div {...{ style: { width: '180px' } }}>
                        <VCT_Select
                            options={[
                                { value: 'all', label: 'Tất cả loại sàn' },
                                { value: 'doi_khang', label: 'Đối kháng' },
                                { value: 'quyen', label: 'Quyền' },
                                { value: 'ca_hai', label: 'Cả hai' },
                            ]}
                            value={filterType}
                            onChange={(v: string) => setFilterType(v)}
                        />
                    </div>
                </VCT_Stack>
            </VCT_Card>

            {/* ── ARENA GRID ── */}
            {uiState.error && (
                <div className="mb-4 rounded-xl border border-red-500/25 bg-red-500/8 px-3.5 py-3 text-[13px] font-bold text-red-500">
                    Không thể tải dữ liệu sàn đấu: {uiState.error}
                </div>
            )}

            {uiState.loading && arenas.length === 0 ? (
                <div {...{ style: { padding: 24, borderRadius: 16, border: '1px solid var(--vct-border-subtle)', background: 'var(--vct-bg-glass)', textAlign: 'center', color: 'var(--vct-text-tertiary)', fontWeight: 600 } }}>
                    Đang tải danh sách sàn đấu...
                </div>
            ) : filteredArenas.length === 0 ? (
                <VCT_EmptyState
                    title="Không tìm thấy sàn đấu"
                    description="Thử thay đổi bộ lọc hoặc thêm sàn đấu mới."
                    actionLabel="Thêm sàn đấu"
                    onAction={openCreateArena}
                    icon="🏟️"
                />
            ) : (
                <div {...{ style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '24px' } }}>
                    {filteredArenas.map(arena => {
                        const isLive = arena.trang_thai === 'dang_thi_dau';
                        const stMap = TRANG_THAI_SAN_MAP[arena.trang_thai];
                        const Icon = stMap.icon;
                        const isExpanded = expandedArenaId === arena.id;

                        return (
                            <VCT_Card key={arena.id} className={isLive ? 'vct-border-glow' : ''} {...{ style: {
                                borderColor: isLive ? 'var(--vct-accent-cyan)' : 'var(--vct-border-subtle)',
                                boxShadow: isLive ? '0 10px 40px rgba(34, 211, 238, 0.15)' : 'none',
                                display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden'
                            } }}>
                                {/* OVERVIEW STRIP */}
                                <div {...{ style: { height: 4, background: stMap.color, width: '100%' } }} />

                                <div {...{ style: { padding: '20px' } }}>
                                    <VCT_Stack direction="row" justify="space-between" align="center" {...{ style: { marginBottom: '16px' } }}>
                                        <VCT_Stack direction="row" align="center" gap={12}>
                                            <div {...{ style: { width: 44, height: 44, borderRadius: 12, background: 'var(--vct-bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '18px', color: stMap.color, border: '1px solid var(--vct-border-subtle)' } }}>
                                                {arena.ten.split(' ')[1] || arena.ten[0]}
                                            </div>
                                            <div>
                                                <VCT_Text variant="h2" {...{ style: { fontSize: '16px' } }}>{arena.ten} <span {...{ style: { fontSize: 13, opacity: 0.5, fontWeight: 500 } }}>({arena.kich_thuoc})</span></VCT_Text>
                                                <VCT_Text variant="small" {...{ style: { opacity: 0.5 } }}>{arena.vi_tri} • {arena.loai === 'doi_khang' ? '🥊 Đối kháng' : arena.loai === 'quyen' ? '🥋 Quyền' : '⚔️ Cả hai'}</VCT_Text>
                                            </div>
                                        </VCT_Stack>
                                        <VCT_Badge text={stMap.label} type={stMap.type as 'info' | 'success' | 'warning' | 'danger'} pulse={isLive} />
                                    </VCT_Stack>

                                    {/* PROGRESS HUB */}
                                    <VCT_Stack direction="row" gap={12} {...{ style: { marginBottom: '16px', background: 'var(--vct-bg-elevated)', padding: '12px', borderRadius: '12px', border: '1px solid var(--vct-border-subtle)' } }}>
                                        <div className="flex-1">
                                            <VCT_Text variant="small" {...{ style: { opacity: 0.5, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' } }}>Tiến độ</VCT_Text>
                                            <div {...{ style: { fontSize: '16px', fontWeight: 800 } }}>{arena.done_today}/{arena.total_today} <span {...{ style: { fontSize: '11px', fontWeight: 500, opacity: 0.5 } }}>trận</span></div>
                                            <div {...{ style: { height: 4, background: 'var(--vct-border-subtle)', borderRadius: 2, marginTop: 4, overflow: 'hidden' } }}>
                                                <div {...{ style: { height: '100%', width: `${(arena.done_today / arena.total_today) * 100}%`, background: 'var(--vct-accent-cyan)' } }} />
                                            </div>
                                        </div>
                                        <VCT_Divider vertical />
                                        <div className="flex-1">
                                            <VCT_Text variant="small" {...{ style: { opacity: 0.5, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' } }}>Đợi sân</VCT_Text>
                                            <div {...{ style: { fontSize: '16px', fontWeight: 800 } }}>{arena.queue.length} <span {...{ style: { fontSize: '11px', fontWeight: 500, opacity: 0.5 } }}>trận</span></div>
                                        </div>
                                    </VCT_Stack>

                                    {/* HEARTBEAT ANIMATION & LIVE MATCH */}
                                    <div {...{ style: { minHeight: '180px', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'var(--vct-bg-input)', borderRadius: 16, padding: '16px', position: 'relative', overflow: 'hidden' } }}>
                                        {isLive && (
                                            <motion.div
                                                animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.05, 1] }}
                                                transition={{ repeat: Infinity, duration: 2 }}
                                                {...{ style: { position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, var(--vct-accent-cyan) 0%, transparent 60%)', pointerEvents: 'none' } }}
                                            />
                                        )}

                                        {arena.match_live ? (
                                            <>
                                                <div {...{ style: { textAlign: 'center', marginBottom: '12px', position: 'relative', zIndex: 1 } }}>
                                                    <VCT_Text variant="small" {...{ style: { color: 'var(--vct-accent-cyan)', fontWeight: 800 } }}>{arena.noi_dung}</VCT_Text>
                                                    <div {...{ style: { color: 'var(--vct-warning)', fontSize: 13, fontWeight: 700, marginTop: 4 } }}>Hiệp {arena.match_live.hiep} • {arena.match_live.time}</div>
                                                </div>
                                                <VCT_Stack direction="row" gap={12} {...{ style: { position: 'relative', zIndex: 1, marginBottom: '16px' } }}>
                                                    <LiveScoreboard
                                                        color="red"
                                                        name={arena.match_live.vdv1}
                                                        score={arena.match_live.diem1}
                                                        team="Đỏ"
                                                        isWinner={arena.match_live.diem1 > arena.match_live.diem2}
                                                    />
                                                    <div {...{ style: { display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.4, fontWeight: 900, fontStyle: 'italic', fontSize: 12 } }}>VS</div>
                                                    <LiveScoreboard
                                                        color="blue"
                                                        name={arena.match_live.vdv2}
                                                        score={arena.match_live.diem2}
                                                        team="Xanh"
                                                        isWinner={arena.match_live.diem2 > arena.match_live.diem1}
                                                    />
                                                </VCT_Stack>

                                                {/* QUICK CONTROLS - MOCK */}
                                                <VCT_Stack direction="row" gap={8} {...{ style: { zIndex: 1 } }}>
                                                    <VCT_Button
                                                        size="small"
                                                        variant="secondary"
                                                        {...{ style: { flex: 1, background: 'rgba(239, 68, 68, 0.1)', color: 'var(--vct-danger)', borderColor: 'var(--vct-danger)' } }}
                                                        onClick={() => showToast(`Dừng trận đấu tại ${arena.ten}`, 'info')}
                                                    >Tạm dừng</VCT_Button>
                                                    <VCT_Button
                                                        size="small"
                                                        {...{ style: { flex: 1, background: 'var(--vct-success)', borderColor: 'var(--vct-success)' } }}
                                                        onClick={() => showToast(`Kết thúc trận đấu tại ${arena.ten}`, 'success')}
                                                    >Kết thúc</VCT_Button>
                                                </VCT_Stack>
                                            </>
                                        ) : (
                                            <div {...{ style: { textAlign: 'center', opacity: 0.4 } }}>
                                                <Icon size={40} {...{ style: { marginBottom: 12, opacity: 0.5 } }} />
                                                <VCT_Text {...{ style: { fontWeight: 600 } }}>Sàn đang {stMap.label.toLowerCase()}</VCT_Text>
                                            </div>
                                        )}
                                    </div>

                                    {/* QUEUE STRIP */}
                                    {arena.queue.length > 0 && (
                                        <div {...{ style: { marginTop: 16, display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--vct-bg-elevated)', borderRadius: 12, border: '1px solid var(--vct-border-subtle)' } }}>
                                            <VCT_Text variant="small" {...{ style: { color: 'var(--vct-warning)', flexShrink: 0, fontWeight: 800 } }}>TIẾP THEO</VCT_Text>
                                            <div {...{ style: { flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' } }}>
                                                <span {...{ style: { fontSize: 13, fontWeight: 700 } }}>{arena.queue[0]?.vdv1} vs {arena.queue[0]?.vdv2}</span>
                                                <span {...{ style: { fontSize: 11, opacity: 0.5, marginLeft: 8 } }}>({arena.queue[0]?.noi_dung})</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* ACTION BUTTONS */}
                                    <VCT_Stack direction="row" gap={8} className="mt-4">
                                        <VCT_Button variant="secondary" onClick={() => openEditArena(arena)} {...{ style: { width: 40, padding: 0, flexShrink: 0 } }} title="Sửa thông tin sàn">
                                            <VCT_Icons.Edit size={16} />
                                        </VCT_Button>
                                        <VCT_Button variant="secondary" onClick={() => setDeleteTarget(arena)} {...{ style: { width: 40, padding: 0, color: 'var(--vct-danger)', borderColor: 'rgba(239,68,68,0.35)', flexShrink: 0 } }} title="Xóa sàn">
                                            <VCT_Icons.Trash size={16} />
                                        </VCT_Button>
                                        <VCT_Button variant="secondary" onClick={() => setExpandedArenaId(isExpanded ? null : arena.id)} {...{ style: { padding: '0 16px', flexShrink: 0, whiteSpace: 'nowrap' } }}>
                                            {isExpanded ? 'Thu gọn' : 'Chi tiết Sàn'}
                                        </VCT_Button>
                                        <div {...{ style: { flex: 1, minWidth: 140 } }}>
                                            <VCT_Select
                                                options={Object.keys(TRANG_THAI_SAN_MAP).map(k => ({ value: k, label: TRANG_THAI_SAN_MAP[k as TrangThaiSan].label }))}
                                                value={arena.trang_thai}
                                                onChange={(v: string) => handleStatusChange(arena.id, v as TrangThaiSan)}
                                            />
                                        </div>
                                    </VCT_Stack>
                                </div>

                                {/* EXPANDED DETAILS */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} {...{ style: { overflow: 'hidden' } }}>
                                            <div {...{ style: { padding: '0 20px 20px', borderTop: '1px dashed var(--vct-border-subtle)', background: 'var(--vct-bg-base)' } }}>
                                                <div {...{ style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 16 } }}>
                                                    {/* CÁN BỘ & TIẾN ĐỘ */}
                                                    <div>
                                                        <div {...{ style: { fontSize: 11, opacity: 0.5, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' } }}>Thông tin phụ trách</div>
                                                        <div {...{ style: { fontSize: 13, fontWeight: 700 } }}>{arena.phu_trach} <span {...{ style: { opacity: 0.5 } }}>({arena.phu_trach_sdt})</span></div>
                                                        <div {...{ style: { fontSize: 13, marginTop: 8 } }}>Trọng tài: <span {...{ style: { fontWeight: 600 } }}>{arena.trong_tai.length} người</span></div>
                                                        <div className="mt-4">
                                                            <div {...{ style: { display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4, fontWeight: 600 } }}>
                                                                <span>Tiến độ trận ({arena.done_today}/{arena.total_today})</span>
                                                                <span {...{ style: { color: 'var(--vct-accent-cyan)' } }}>{Math.round((arena.done_today / Math.max(1, arena.total_today)) * 100)}%</span>
                                                            </div>
                                                            <div {...{ style: { width: '100%', height: 6, background: 'var(--vct-bg-input)', borderRadius: 3, overflow: 'hidden' } }}>
                                                                <div {...{ style: { width: `${(arena.done_today / Math.max(1, arena.total_today)) * 100}%`, height: '100%', background: 'var(--vct-accent-cyan)' } }} />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* TRANG BỊ */}
                                                    <div>
                                                        <div {...{ style: { fontSize: 11, opacity: 0.5, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' } }}>Danh sách trang bị</div>
                                                        <VCT_Stack gap={6}>
                                                            {arena.trang_bi.map((tb, i) => (
                                                                <div key={i} {...{ style: { display: 'flex', justifyContent: 'space-between', fontSize: 13, background: 'var(--vct-bg-elevated)', padding: '6px 12px', borderRadius: 6, border: '1px solid var(--vct-border-subtle)' } }}>
                                                                    <span {...{ style: { fontWeight: 500 } }}>{tb.ten} (x{tb.sl})</span>
                                                                    <span {...{ style: { color: TRANG_BI_MAP[tb.tt].color, fontWeight: 700 } }}>{TRANG_BI_MAP[tb.tt].label}</span>
                                                                </div>
                                                            ))}
                                                        </VCT_Stack>
                                                    </div>
                                                </div>

                                                {/* HOẠT ĐỘNG (TIMELINE) */}
                                                <div className="mt-6">
                                                    <div {...{ style: { fontSize: 11, opacity: 0.5, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' } }}>Lịch sử hoạt động</div>
                                                    <VCT_Stack gap={6}>
                                                        {arena.history.length === 0 ? <div {...{ style: { fontSize: 13, opacity: 0.5 } }}>Chưa có hoạt động</div> :
                                                            arena.history.slice(0, 3).map((h, i) => (
                                                                <div key={i} {...{ style: { display: 'flex', fontSize: 12, gap: 12, opacity: i === 0 ? 1 : 0.6 } }}>
                                                                    <span {...{ style: { fontFamily: 'monospace', color: 'var(--vct-accent-cyan)' } }}>{h.time.split(' ')[1]}</span>
                                                                    <span {...{ style: { fontWeight: 600, flex: 1 } }}>{h.action}</span>
                                                                    <span {...{ style: { opacity: 0.5 } }}>{h.by}</span>
                                                                </div>
                                                            ))
                                                        }
                                                    </VCT_Stack>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </VCT_Card>
                        );
                    })}
                </div>
            )}

            <VCT_Modal
                isOpen={showArenaModal}
                onClose={() => setShowArenaModal(false)}
                title={editingArena ? 'Cập nhật sàn đấu' : 'Thêm sàn đấu'}
                width="760px"
                footer={
                    <>
                        <VCT_Button variant="secondary" onClick={() => setShowArenaModal(false)}>Hủy</VCT_Button>
                        <VCT_Button onClick={saveArena}>{editingArena ? 'Lưu thay đổi' : 'Tạo sàn'}</VCT_Button>
                    </>
                }
            >
                <div {...{ style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 } }}>
                    <VCT_Field label="Tên sàn *">
                        <VCT_Input value={arenaForm.ten || ''} onChange={(e: any) => setArenaForm((p: any) => ({ ...p, ten: e.target.value }))} placeholder="VD: Sàn E" />
                    </VCT_Field>
                    <VCT_Field label="Vị trí *">
                        <VCT_Input value={arenaForm.vi_tri || ''} onChange={(e: any) => setArenaForm((p: any) => ({ ...p, vi_tri: e.target.value }))} placeholder="Khu A — Tầng 1" />
                    </VCT_Field>

                    <VCT_Select
                        label="Loại sàn"
                        value={arenaForm.loai || 'doi_khang'}
                        onChange={(value: string) => setArenaForm((p: any) => ({ ...p, loai: value }))}
                        options={[
                            { value: 'doi_khang', label: 'Đối kháng' },
                            { value: 'quyen', label: 'Quyền' },
                            { value: 'ca_hai', label: 'Cả hai' },
                        ]}
                    />
                    <VCT_Select
                        label="Trạng thái"
                        value={arenaForm.trang_thai || 'san_sang'}
                        onChange={(value: string) => setArenaForm((p: any) => ({ ...p, trang_thai: value }))}
                        options={Object.keys(TRANG_THAI_SAN_MAP).map(k => ({ value: k, label: TRANG_THAI_SAN_MAP[k as TrangThaiSan].label }))}
                    />

                    <VCT_Field label="Kích thước">
                        <VCT_Input value={arenaForm.kich_thuoc || ''} onChange={(e: any) => setArenaForm((p: any) => ({ ...p, kich_thuoc: e.target.value }))} placeholder="12x12m" />
                    </VCT_Field>
                    <VCT_Field label="Sức chứa">
                        <VCT_Input type="number" value={arenaForm.capacity ?? ''} onChange={(e: any) => setArenaForm((p: any) => ({ ...p, capacity: Number(e.target.value || 0) }))} placeholder="300" />
                    </VCT_Field>

                    <VCT_Field label="Phụ trách">
                        <VCT_Input value={arenaForm.phu_trach || ''} onChange={(e: any) => setArenaForm((p: any) => ({ ...p, phu_trach: e.target.value }))} placeholder="Họ và tên phụ trách" />
                    </VCT_Field>
                    <VCT_Field label="SĐT phụ trách">
                        <VCT_Input value={arenaForm.phu_trach_sdt || ''} onChange={(e: any) => setArenaForm((p: any) => ({ ...p, phu_trach_sdt: e.target.value }))} placeholder="090..." />
                    </VCT_Field>

                    <VCT_Field label="Tổng trận dự kiến hôm nay" {...{ style: { gridColumn: '1 / -1' } }}>
                        <VCT_Input type="number" value={arenaForm.total_today ?? ''} onChange={(e: any) => setArenaForm((p: any) => ({ ...p, total_today: Number(e.target.value || 0) }))} placeholder="10" />
                    </VCT_Field>
                </div>
            </VCT_Modal>

            <VCT_ConfirmDialog
                isOpen={!!deleteTarget}
                onClose={() => setDeleteTarget(null)}
                onConfirm={removeArena}
                title="Xóa sàn đấu"
                message={`Bạn chắc chắn muốn xóa ${deleteTarget?.ten || 'sàn này'}? Hành động này không thể hoàn tác.`}
                confirmLabel="Xóa"
                confirmVariant="danger"
            />
        </VCT_PageContainer>
    );
};
