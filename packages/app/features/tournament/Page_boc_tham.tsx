'use client';
'use client';
import * as React from 'react';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    VCT_Card, VCT_Badge, VCT_Button, VCT_Text, VCT_Stack, VCT_Toast,
    VCT_EmptyState, VCT_Select
} from '../components/vct-ui';
import { VCT_PageContainer, VCT_StatRow } from '../components/vct-ui';
import type { StatItem } from '../components/VCT_StatRow';
import { VCT_Icons } from '../components/vct-icons';
import { useHangCans, genId } from '../hooks/useTournamentAPI';
import type { VanDongVien } from '../data/types';
import { repositories, useEntityCollection } from '../data/repository';
import { useToast } from '../hooks/use-toast';

// ════════════════════════════════════════
// TYPES
// ════════════════════════════════════════
interface DrawSlot {
    seed: number;
    vdv: VanDongVien | null;
    bye: boolean;
}

interface DrawResult {
    id: string;
    nd_id: string;
    nd_ten: string;
    slots: DrawSlot[];
    schema: number;
    timestamp: string;
    status: 'draft' | 'confirmed';
}

// ════════════════════════════════════════
// DRAW ALGORITHM — Fisher-Yates + Constraint
// ════════════════════════════════════════
function fisherYatesShuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = a[i]!;
        a[i] = a[j]!;
        a[j] = tmp;
    }
    return a;
}

function nextPowerOf2(n: number): number {
    let p = 2;
    while (p < n) p *= 2;
    return p;
}

function drawWithConstraint(vdvs: VanDongVien[]): DrawSlot[] {
    const schema = nextPowerOf2(vdvs.length);
    // Group by team
    const byTeam: Record<string, VanDongVien[]> = {};
    vdvs.forEach(v => {
        if (!byTeam[v.doan_id]) byTeam[v.doan_id] = [];
        byTeam[v.doan_id]!.push(v);
    });

    // Spread same-team athletes apart — simple greedy approach:
    // Alternate picking from different teams, then shuffle within halves
    const teams = Object.keys(byTeam);
    const sorted: VanDongVien[] = [];
    let maxLen = Math.max(...teams.map(t => (byTeam[t] || []).length));
    for (let i = 0; i < maxLen; i++) {
        const shuffledTeams = fisherYatesShuffle(teams);
        for (const t of shuffledTeams) {
            const teamArr = byTeam[t] || [];
            if (teamArr[i]) sorted.push(teamArr[i]!);
        }
    }

    // Final shuffle with constraint check (same team not adjacent)
    let shuffled = fisherYatesShuffle(sorted);
    // Simple swap pass to avoid same-team adjacency
    for (let i = 0; i < shuffled.length - 1; i++) {
        if (shuffled[i]!.doan_id === shuffled[i + 1]?.doan_id) {
            // Find a swap candidate
            for (let j = i + 2; j < shuffled.length; j++) {
                if (shuffled[j]!.doan_id !== shuffled[i]!.doan_id) {
                    const tmp = shuffled[i + 1]!;
                    shuffled[i + 1] = shuffled[j]!;
                    shuffled[j] = tmp;
                    break;
                }
            }
        }
    }

    // Build slots with BYE padding
    const slots: DrawSlot[] = [];
    for (let i = 0; i < schema; i++) {
        if (i < shuffled.length) {
            slots.push({ seed: i + 1, vdv: shuffled[i] ?? null, bye: false });
        } else {
            slots.push({ seed: i + 1, vdv: null, bye: true });
        }
    }
    return slots;
}



// ════════════════════════════════════════
// COLOR HELPERS
// ════════════════════════════════════════
const TEAM_COLORS: Record<string, string> = {};
const PALETTE = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
let colorIdx = 0;
function getTeamColor(doanId: string): string {
    if (!TEAM_COLORS[doanId]) {
        TEAM_COLORS[doanId] = PALETTE[colorIdx % PALETTE.length] || '#64748b';
        colorIdx++;
    }
    return TEAM_COLORS[doanId] || '#64748b';
}

// ════════════════════════════════════════
// PAGE COMPONENT
// ════════════════════════════════════════
export const Page_boc_tham = () => {
    const { data: hangCans } = useHangCans();
    const contentOptions = useMemo(() => {
        const hc = hangCans || [];
        return hc.filter(h => h.trang_thai === 'active').map(h => ({
            value: h.id,
            label: `ĐK ${h.gioi === 'nam' ? 'Nam' : 'Nữ'} ${h.can_tu}-${h.can_den}kg ${h.lua_tuoi}`,
            type: 'doi_khang' as const,
        }));
    }, [hangCans]);

    const registrationStore = useEntityCollection(repositories.registration.mock);
    const athleteStore = useEntityCollection(repositories.athletes.mock);
    const registrations = registrationStore.items;
    const athletes = athleteStore.items;
    const [selectedContent, setSelectedContent] = useState('');

    useEffect(() => {
        if (!selectedContent && contentOptions.length > 0) {
            setSelectedContent(contentOptions[0]?.value || '');
        }
    }, [contentOptions, selectedContent]);

    const [drawResults, setDrawResults] = useState<DrawResult[]>([]);
    const [isDrawing, setIsDrawing] = useState(false);
    const [animPhase, setAnimPhase] = useState<'idle' | 'shuffle' | 'reveal'>('idle');
    const [tempSlots, setTempSlots] = useState<DrawSlot[]>([]);
    const { toast, showToast, hideToast } = useToast(3000);

    // Get eligible VDVs for selected content
    const eligibleVDVs = useMemo(() => {
        const content = contentOptions.find(c => c.value === selectedContent);
        if (!content) return [];
        // Find registrations for this content
        const regIds = registrations
            .filter(d => d.nd_id === selectedContent && d.trang_thai === 'da_duyet')
            .map(d => d.vdv_id);
        return athletes.filter(v => regIds.includes(v.id) && v.trang_thai === 'du_dieu_kien');
    }, [selectedContent, athletes, registrations, contentOptions]);

    // Check if already drawn
    const existingDraw = useMemo(() => drawResults.find(d => d.nd_id === selectedContent), [drawResults, selectedContent]);

    // Stats
    const totalDrawn = drawResults.length;
    const totalConfirmed = drawResults.filter(d => d.status === 'confirmed').length;
    const totalDraft = totalDrawn - totalConfirmed;

    // ── DRAW ACTION ──
    const handleDraw = useCallback(async () => {
        if (eligibleVDVs.length < 2) {
            showToast('Cần ít nhất 2 VĐV đủ điều kiện để bốc thăm', 'warning');
            return;
        }
        setIsDrawing(true);
        setAnimPhase('shuffle');

        // Shuffle animation: show random arrangements quickly
        const content = contentOptions.find(c => c.value === selectedContent);
        let animCount = 0;
        const animInterval = setInterval(() => {
            const shuffled = drawWithConstraint(eligibleVDVs);
            setTempSlots(shuffled);
            animCount++;
            if (animCount >= 8) {
                clearInterval(animInterval);
                // Final draw
                const finalSlots = drawWithConstraint(eligibleVDVs);
                setTempSlots(finalSlots);
                setAnimPhase('reveal');

                setTimeout(() => {
                    const result: DrawResult = {
                        id: genId('BT'),
                        nd_id: selectedContent,
                        nd_ten: content?.label || '',
                        slots: finalSlots,
                        schema: nextPowerOf2(eligibleVDVs.length),
                        timestamp: new Date().toLocaleString('vi-VN'),
                        status: 'draft',
                    };
                    setDrawResults(prev => [...prev.filter(d => d.nd_id !== selectedContent), result]);
                    setIsDrawing(false);
                    setAnimPhase('idle');
                    showToast(`Bốc thăm thành công ${finalSlots.filter(s => !s.bye).length} VĐV (Schema ${result.schema})`);
                }, 1500);
            }
        }, 200);
    }, [eligibleVDVs, selectedContent, showToast, contentOptions]);

    const handleConfirm = useCallback(() => {
        setDrawResults(prev => prev.map(d =>
            d.nd_id === selectedContent ? { ...d, status: 'confirmed' as const } : d
        ));
        showToast('Đã xác nhận kết quả bốc thăm!');
    }, [selectedContent, showToast]);

    const handleReset = useCallback(() => {
        setDrawResults(prev => prev.filter(d => d.nd_id !== selectedContent));
        setTempSlots([]);
        showToast('Đã hủy kết quả bốc thăm', 'info');
    }, [selectedContent, showToast]);

    const displaySlots = existingDraw?.slots || (animPhase !== 'idle' ? tempSlots : []);

    return (
        <VCT_PageContainer size="wide" animated>
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={hideToast} />

            {(registrationStore.uiState.error || athleteStore.uiState.error) && (
                <div className="mb-4 rounded-xl border border-red-500/25 bg-red-500/8 px-3.5 py-3 text-[13px] font-bold text-red-500">
                    Không thể tải đủ dữ liệu để bốc thăm.
                </div>
            )}

            {/* ── HERO HEADER ── */}
            <motion.div
                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
                style={{
                    padding: '32px 40px', borderRadius: '28px', marginBottom: '28px',
                    background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 50%, #bfdbfe 100%)',
                    border: '1px solid rgba(59, 130, 246, 0.1)',
                    boxShadow: '0 10px 30px rgba(59, 130, 246, 0.08)',
                }}
            >
                <VCT_Stack direction="row" justify="space-between" align="center">
                    <div>
                        <VCT_Stack direction="row" align="center" gap={12}>
                            <span style={{ fontSize: 36 }}>🎲</span>
                            <VCT_Text variant="h2" style={{ fontWeight: 900, color: '#1e40af', margin: 0 }}>BỐC THĂM XẾP CẶP</VCT_Text>
                        </VCT_Stack>
                        <VCT_Text variant="body" style={{ color: '#3b82f6', marginTop: 4, fontSize: 14 }}>
                            Fisher-Yates Shuffle — Ràng buộc cùng đoàn không gặp nhau vòng 1
                        </VCT_Text>
                    </div>
                    <VCT_StatRow items={[
                        { label: 'Đã bốc', value: totalDrawn, icon: <VCT_Icons.Shuffle size={18} />, color: '#3b82f6' },
                        { label: 'Xác nhận', value: totalConfirmed, icon: <VCT_Icons.CheckCircle size={18} />, color: '#10b981' },
                        { label: 'Nháp', value: totalDraft, icon: <VCT_Icons.Edit size={18} />, color: '#f59e0b' },
                    ] as StatItem[]} />
                </VCT_Stack>
            </motion.div>

            {/* ── CONTENT SELECTOR ── */}
            <VCT_Card title="Chọn Nội dung Bốc thăm">
                <VCT_Stack direction="row" gap={16} align="flex-end">
                    <div className="flex-1">
                        <VCT_Select
                            label="Hạng cân / Nội dung"
                            options={contentOptions.map((c: any) => ({ value: c.value, label: c.label }))}
                            value={selectedContent}
                            onChange={setSelectedContent}
                        />
                    </div>
                    <VCT_Stack direction="row" gap={8}>
                        <VCT_Badge text={`${eligibleVDVs.length} VĐV đủ điều kiện`} type={eligibleVDVs.length >= 2 ? 'success' : 'danger'} />
                        {existingDraw && <VCT_Badge text={existingDraw.status === 'confirmed' ? '✓ Đã xác nhận' : '📝 Bản nháp'} type={existingDraw.status === 'confirmed' ? 'success' : 'info'} />}
                    </VCT_Stack>
                </VCT_Stack>

                {/* VDV List */}
                <div style={{ marginTop: 20 }}>
                    <VCT_Text variant="small" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, color: 'var(--vct-text-tertiary)' }}>
                        Danh sách VĐV đủ điều kiện ({eligibleVDVs.length})
                    </VCT_Text>
                    {eligibleVDVs.length === 0 ? (
                        <VCT_EmptyState title="Chưa có VĐV" description="Chưa có VĐV đăng ký nội dung này hoặc chưa được duyệt." icon="👤" />
                    ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {eligibleVDVs.map((v, i) => (
                                <motion.div
                                    key={v.id}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 8,
                                        padding: '8px 14px', borderRadius: 12,
                                        background: 'var(--vct-bg-elevated)',
                                        border: `2px solid ${getTeamColor(v.doan_id)}20`,
                                        borderLeft: `4px solid ${getTeamColor(v.doan_id)}`,
                                    }}
                                >
                                    <span style={{ fontSize: 12, fontWeight: 800, color: getTeamColor(v.doan_id) }}>{v.doan_ten.replace('Đoàn ', '').replace('CLB ', '')}</span>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--vct-text-primary)' }}>{v.ho_ten}</span>
                                    <span style={{ fontSize: 11, color: 'var(--vct-text-tertiary)' }}>{v.can_nang}kg</span>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <VCT_Stack direction="row" gap={12} className="mt-6" justify="flex-end">
                    {existingDraw && existingDraw.status === 'draft' && (
                        <>
                            <VCT_Button variant="danger" icon={<VCT_Icons.Trash size={16} />} onClick={handleReset}>
                                Hủy bốc thăm
                            </VCT_Button>
                            <VCT_Button variant="primary" icon={<VCT_Icons.CheckCircle size={16} />} onClick={handleConfirm}>
                                Xác nhận kết quả
                            </VCT_Button>
                        </>
                    )}
                    {!existingDraw && (
                        <VCT_Button
                            variant="primary"
                            loading={isDrawing}
                            icon={<VCT_Icons.Shuffle size={16} />}
                            onClick={handleDraw}
                        >
                            🎲 Bốc thăm tự động
                        </VCT_Button>
                    )}
                    {existingDraw && existingDraw.status === 'confirmed' && (
                        <VCT_Button variant="secondary" icon={<VCT_Icons.RotateCcw size={16} />} onClick={handleReset}>
                            Bốc thăm lại
                        </VCT_Button>
                    )}
                </VCT_Stack>
            </VCT_Card>

            {/* ── DRAW RESULT BRACKET ── */}
            {displaySlots.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mt-6">
                    <VCT_Card title={`Kết quả Bốc thăm — ${contentOptions.find((c: any) => c.value === selectedContent)?.label || ''}`}
                        headerAction={existingDraw && <VCT_Badge text={`Schema ${existingDraw.schema} • ${existingDraw.timestamp}`} type="info" />}
                    >
                        {/* Bracket Table */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                            {Array.from({ length: Math.ceil(displaySlots.length / 2) }).map((_, pairIdx) => {
                                const s1 = displaySlots[pairIdx * 2];
                                const s2 = displaySlots[pairIdx * 2 + 1];
                                return (
                                    <motion.div
                                        key={pairIdx}
                                        initial={{ opacity: 0, x: animPhase === 'shuffle' ? (Math.random() > 0.5 ? 30 : -30) : 0 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: animPhase === 'reveal' ? pairIdx * 0.1 : 0, duration: animPhase === 'shuffle' ? 0.15 : 0.4 }}
                                        style={{
                                            padding: '16px', borderRadius: 16,
                                            background: 'var(--vct-bg-glass-heavy)',
                                            border: '1px solid var(--vct-border-subtle)',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                                        }}
                                    >
                                        <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--vct-text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                            Trận {pairIdx + 1}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                            {/* RED corner */}
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: 10,
                                                padding: '10px 14px', borderRadius: 10,
                                                background: s1?.vdv ? 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.03))' : 'transparent',
                                                borderLeft: '4px solid #ef4444',
                                            }}>
                                                <span style={{ fontSize: 11, fontWeight: 900, color: '#ef4444', fontFamily: 'monospace', minWidth: 24 }}>#{s1?.seed}</span>
                                                {s1?.vdv ? (
                                                    <>
                                                        <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--vct-text-primary)', textTransform: 'uppercase' }}>{s1.vdv.ho_ten}</span>
                                                        <span style={{ fontSize: 11, color: getTeamColor(s1.vdv.doan_id), fontWeight: 700 }}>{s1.vdv.doan_ten}</span>
                                                    </>
                                                ) : (
                                                    <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>BYE</span>
                                                )}
                                            </div>
                                            <div style={{ textAlign: 'center', fontSize: 12, fontWeight: 900, color: '#94a3b8' }}>VS</div>
                                            {/* BLUE corner */}
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: 10,
                                                padding: '10px 14px', borderRadius: 10,
                                                background: s2?.vdv ? 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(59,130,246,0.03))' : 'transparent',
                                                borderLeft: '4px solid #3b82f6',
                                            }}>
                                                <span style={{ fontSize: 11, fontWeight: 900, color: '#3b82f6', fontFamily: 'monospace', minWidth: 24 }}>#{s2?.seed}</span>
                                                {s2?.vdv ? (
                                                    <>
                                                        <span style={{ fontWeight: 800, fontSize: 13, color: 'var(--vct-text-primary)', textTransform: 'uppercase' }}>{s2.vdv.ho_ten}</span>
                                                        <span style={{ fontSize: 11, color: getTeamColor(s2.vdv.doan_id), fontWeight: 700 }}>{s2.vdv.doan_ten}</span>
                                                    </>
                                                ) : (
                                                    <span style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>BYE</span>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {/* Draw History for all contents */}
                        {drawResults.length > 1 && (
                            <div className="mt-6">
                                <VCT_Text variant="small" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, color: 'var(--vct-text-tertiary)' }}>
                                    Tổng hợp bốc thăm ({drawResults.length} nội dung)
                                </VCT_Text>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    {drawResults.map(d => (
                                        <div key={d.id} style={{
                                            padding: '8px 14px', borderRadius: 10,
                                            background: d.status === 'confirmed' ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
                                            border: `1px solid ${d.status === 'confirmed' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`,
                                            cursor: 'pointer',
                                        }}
                                            onClick={() => setSelectedContent(d.nd_id)}
                                        >
                                            <span style={{ fontSize: 12, fontWeight: 700, color: d.status === 'confirmed' ? '#10b981' : '#f59e0b' }}>
                                                {d.status === 'confirmed' ? '✓' : '📝'} {d.nd_ten}
                                            </span>
                                            <span style={{ fontSize: 11, color: 'var(--vct-text-tertiary)', marginLeft: 6 }}>
                                                {d.slots.filter(s => !s.bye).length} VĐV
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </VCT_Card>
                </motion.div>
            )}
        </VCT_PageContainer>
    );
};
