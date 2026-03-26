// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — FEDERATION MASTER DATA PAGE (FULL CRUD)
// Manage belt ranks, weight classes, and age groups.
// API-driven with VCT design system + create/edit/delete.
// ═══════════════════════════════════════════════════════════════
'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

// ── Types ────────────────────────────────────────────────────

interface MasterBelt {
    level: number; name: string; color_hex: string;
    required_time_min: number; is_dan_level: boolean;
    description?: string; scope?: string;
}

interface MasterWeight {
    id: string; gender: string; category: string;
    max_weight: number; is_heavy: boolean; scope?: string;
}

interface MasterAge {
    id: string; name: string; min_age: number; max_age: number; scope?: string;
}

type TabKey = 'belt' | 'weight' | 'age';
type ModalMode = 'create' | 'edit' | null;

const BASE = '/api/v1/federation/master';

// ── Reusable modal overlay ──────────────────────────────────

function Modal({ open, onClose, title, children }: {
    open: boolean; onClose: () => void; title: string;
    children: React.ReactNode;
}) {
    if (!open) return null;
    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                style={{
                    position: 'fixed', inset: 0, zIndex: 9999,
                    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '1rem',
                }}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={e => e.stopPropagation()}
                    style={{
                        background: 'var(--vct-card-bg, #fff)',
                        borderRadius: 16, width: '100%', maxWidth: 500,
                        border: '1px solid var(--vct-border, #e2e8f0)',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                    }}
                >
                    <div style={{
                        padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--vct-border, #e2e8f0)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--vct-text, #1e293b)' }}>{title}</h3>
                        <button onClick={onClose} style={{
                            background: 'none', border: 'none', cursor: 'pointer', padding: 4,
                            color: 'var(--vct-text-secondary, #94a3b8)', fontSize: '1.2rem',
                        }}>✕</button>
                    </div>
                    <div style={{ padding: '1.25rem 1.5rem' }}>
                        {children}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}

// ── Reusable form field ─────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div style={{ marginBottom: '1rem' }}>
            <label style={{
                display: 'block', fontSize: '0.82rem', fontWeight: 600, marginBottom: 4,
                color: 'var(--vct-text-secondary, #64748b)',
            }}>{label}</label>
            {children}
        </div>
    );
}

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.6rem 0.75rem', borderRadius: 8,
    border: '1px solid var(--vct-border, #e2e8f0)',
    background: 'var(--vct-bg, #f8fafc)',
    color: 'var(--vct-text, #1e293b)', fontSize: '0.9rem',
    outline: 'none',
};

const btnPrimary: React.CSSProperties = {
    padding: '0.6rem 1.25rem', borderRadius: 10, border: 'none',
    background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: 'var(--vct-bg-elevated)',
    fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
};

const btnDanger: React.CSSProperties = {
    ...btnPrimary,
    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
};

const btnOutline: React.CSSProperties = {
    padding: '0.6rem 1.25rem', borderRadius: 10,
    border: '1px solid var(--vct-border, #e2e8f0)',
    background: 'transparent', color: 'var(--vct-text, #1e293b)',
    fontWeight: 500, fontSize: '0.85rem', cursor: 'pointer',
};

// ── Toast ───────────────────────────────────────────────────

function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
    useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t) }, [onClose]);
    return (
        <motion.div
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 40 }}
            style={{
                position: 'fixed', bottom: 24, right: 24, zIndex: 10000,
                padding: '0.8rem 1.25rem', borderRadius: 12,
                background: type === 'success' ? 'var(--vct-success)' : 'var(--vct-danger)',
                color: 'var(--vct-bg-elevated)', fontWeight: 600, fontSize: '0.85rem',
                boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            }}
        >
            {type === 'success' ? '✓' : '✕'} {message}
        </motion.div>
    );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export function Page_federation_master_data() {
    const searchParams = useSearchParams();
    const initialTab = (searchParams?.get('tab') as TabKey) || 'belt';

    const [tab, setTab] = useState<TabKey>(initialTab);
    const [belts, setBelts] = useState<MasterBelt[]>([]);
    const [weights, setWeights] = useState<MasterWeight[]>([]);
    const [ages, setAges] = useState<MasterAge[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Belt modal
    const [beltModal, setBeltModal] = useState<ModalMode>(null);
    const [editBelt, setEditBelt] = useState<MasterBelt | null>(null);
    const [beltForm, setBeltForm] = useState({ name: '', color_hex: 'var(--vct-bg-elevated)', required_time_min: 3, is_dan_level: false, description: '' });

    // Weight modal
    const [weightModal, setWeightModal] = useState<ModalMode>(null);
    const [editWeight, setEditWeight] = useState<MasterWeight | null>(null);
    const [weightForm, setWeightForm] = useState({ gender: 'MALE', category: 'Kyorugi', max_weight: 50, is_heavy: false });

    // Age modal
    const [ageModal, setAgeModal] = useState<ModalMode>(null);
    const [editAge, setEditAge] = useState<MasterAge | null>(null);
    const [ageForm, setAgeForm] = useState({ name: '', min_age: 6, max_age: 18 });

    // Delete confirmation
    const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'belt' | 'weight' | 'age'; id: string } | null>(null);

    // ── Data Fetching ──────────────────────────────────────────

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const [bRes, wRes, aRes] = await Promise.all([
                fetch(`${BASE}/belts`).then(r => r.json()).catch(() => ({ belts: [] })),
                fetch(`${BASE}/weights`).then(r => r.json()).catch(() => ({ weight_classes: [] })),
                fetch(`${BASE}/ages`).then(r => r.json()).catch(() => ({ age_groups: [] })),
            ]);
            setBelts(bRes.belts || []);
            setWeights(wRes.weight_classes || []);
            setAges(aRes.age_groups || []);
        } catch { /* fallback empty */ }
        setLoading(false);
    }, []);

    useEffect(() => { fetchAll() }, [fetchAll]);

    const showToast = (message: string, type: 'success' | 'error') => setToast({ message, type });

    // ── Belt CRUD ──────────────────────────────────────────────

    const openCreateBelt = () => {
        setBeltForm({ name: '', color_hex: 'var(--vct-warning)', required_time_min: 3, is_dan_level: false, description: '' });
        setEditBelt(null);
        setBeltModal('create');
    };
    const openEditBelt = (b: MasterBelt) => {
        setBeltForm({ name: b.name, color_hex: b.color_hex, required_time_min: b.required_time_min, is_dan_level: b.is_dan_level, description: b.description || '' });
        setEditBelt(b);
        setBeltModal('edit');
    };
    const saveBelt = async () => {
        try {
            if (beltModal === 'create') {
                const newLevel = belts.length > 0 ? Math.max(...belts.map(b => b.level)) + 1 : 1;
                await fetch(`${BASE}/belts`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...beltForm, level: newLevel }),
                });
                showToast('Đã tạo đai mới', 'success');
            } else if (editBelt) {
                await fetch(`${BASE}/belts/${editBelt.level}`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...beltForm, level: editBelt.level }),
                });
                showToast('Đã cập nhật đai', 'success');
            }
            setBeltModal(null);
            fetchAll();
        } catch { showToast('Lỗi khi lưu đai', 'error'); }
    };
    const deleteBelt = async (level: number) => {
        try {
            await fetch(`${BASE}/belts/${level}`, { method: 'DELETE' });
            showToast('Đã xóa đai', 'success');
            setDeleteConfirm(null);
            fetchAll();
        } catch { showToast('Lỗi khi xóa đai', 'error'); }
    };

    // ── Weight CRUD ────────────────────────────────────────────

    const openCreateWeight = () => {
        setWeightForm({ gender: 'MALE', category: 'Kyorugi', max_weight: 50, is_heavy: false });
        setEditWeight(null);
        setWeightModal('create');
    };
    const openEditWeight = (w: MasterWeight) => {
        setWeightForm({ gender: w.gender, category: w.category, max_weight: w.max_weight, is_heavy: w.is_heavy });
        setEditWeight(w);
        setWeightModal('edit');
    };
    const saveWeight = async () => {
        try {
            if (weightModal === 'create') {
                const id = `${weightForm.gender === 'MALE' ? 'm' : 'f'}-u${weightForm.max_weight}`;
                await fetch(`${BASE}/weights`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...weightForm, id }),
                });
                showToast('Đã tạo hạng cân', 'success');
            } else if (editWeight) {
                await fetch(`${BASE}/weights/${editWeight.id}`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...weightForm, id: editWeight.id }),
                });
                showToast('Đã cập nhật hạng cân', 'success');
            }
            setWeightModal(null);
            fetchAll();
        } catch { showToast('Lỗi khi lưu hạng cân', 'error'); }
    };
    const deleteWeight = async (id: string) => {
        try {
            await fetch(`${BASE}/weights/${id}`, { method: 'DELETE' });
            showToast('Đã xóa hạng cân', 'success');
            setDeleteConfirm(null);
            fetchAll();
        } catch { showToast('Lỗi khi xóa', 'error'); }
    };

    // ── Age CRUD ───────────────────────────────────────────────

    const openCreateAge = () => {
        setAgeForm({ name: '', min_age: 6, max_age: 18 });
        setEditAge(null);
        setAgeModal('create');
    };
    const openEditAge = (a: MasterAge) => {
        setAgeForm({ name: a.name, min_age: a.min_age, max_age: a.max_age });
        setEditAge(a);
        setAgeModal('edit');
    };
    const saveAge = async () => {
        try {
            if (ageModal === 'create') {
                const id = `custom-${Date.now()}`;
                await fetch(`${BASE}/ages`, {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...ageForm, id }),
                });
                showToast('Đã tạo nhóm tuổi', 'success');
            } else if (editAge) {
                await fetch(`${BASE}/ages/${editAge.id}`, {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...ageForm, id: editAge.id }),
                });
                showToast('Đã cập nhật nhóm tuổi', 'success');
            }
            setAgeModal(null);
            fetchAll();
        } catch { showToast('Lỗi khi lưu nhóm tuổi', 'error'); }
    };
    const deleteAge = async (id: string) => {
        try {
            await fetch(`${BASE}/ages/${id}`, { method: 'DELETE' });
            showToast('Đã xóa nhóm tuổi', 'success');
            setDeleteConfirm(null);
            fetchAll();
        } catch { showToast('Lỗi khi xóa', 'error'); }
    };

    // ── Tabs ───────────────────────────────────────────────────

    const tabs: { key: TabKey; label: string; icon: string; count: number }[] = [
        { key: 'belt', label: 'Hệ thống Đai', icon: '🥋', count: belts.length },
        { key: 'weight', label: 'Hạng Cân', icon: '⚖️', count: weights.length },
        { key: 'age', label: 'Nhóm Tuổi', icon: '📅', count: ages.length },
    ];

    // ═════════════════════════════════════════════════════════════
    // RENDER
    // ═════════════════════════════════════════════════════════════

    return (
        <div style={{ padding: '2rem', maxWidth: 1200, margin: '0 auto' }}>
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                style={{ marginBottom: '1.5rem' }}
            >
                <h1 style={{ fontSize: '1.75rem', fontWeight: 700, margin: 0, color: 'var(--vct-text, #1e293b)' }}>
                    📋 Danh mục Chuẩn — Master Data
                </h1>
                <p style={{ fontSize: '0.9rem', margin: '0.25rem 0 0', color: 'var(--vct-text-secondary, #64748b)' }}>
                    Cấu hình hệ thống đai, hạng cân và nhóm tuổi — Chuẩn quốc gia
                </p>
            </motion.div>

            {/* Tab bar + action button */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: '1.5rem', flexWrap: 'wrap', gap: '0.75rem',
            }}>
                <div style={{
                    display: 'flex', gap: 4, padding: 4, borderRadius: 14,
                    background: 'var(--vct-elevated, #f1f5f9)',
                    border: '1px solid var(--vct-border, #e2e8f0)',
                }}>
                    {tabs.map(t => (
                        <button key={t.key} onClick={() => setTab(t.key)}
                            style={{
                                padding: '0.5rem 1rem', borderRadius: 10, border: 'none',
                                fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                                transition: 'all 0.2s',
                                background: tab === t.key ? 'rgba(124,58,237,0.12)' : 'transparent',
                                color: tab === t.key ? '#7c3aed' : 'var(--vct-text-secondary, #64748b)',
                            }}>
                            {t.icon} {t.label} ({loading ? '–' : t.count})
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => tab === 'belt' ? openCreateBelt() : tab === 'weight' ? openCreateWeight() : openCreateAge()}
                    style={{
                        ...btnPrimary,
                        display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                    ✚ Thêm mới
                </button>
            </div>

            {/* Loading skeleton */}
            {loading && (
                <div style={{ padding: '3rem 0', textAlign: 'center', color: 'var(--vct-text-secondary, #94a3b8)' }}>
                    Đang tải dữ liệu...
                </div>
            )}

            {/* ── Belts Tab ──────────────────────────────────── */}
            {!loading && tab === 'belt' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {belts.length === 0 && <EmptyState label="Chưa có đai nào" />}
                    {belts.sort((a, b) => a.level - b.level).map(b => {
                        const isLight = b.color_hex === 'var(--vct-bg-elevated)' || b.color_hex === 'var(--vct-warning)';
                        return (
                            <motion.div key={b.level}
                                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 16,
                                    padding: '1rem 1.25rem', borderRadius: 14,
                                    background: 'var(--vct-card-bg, #fff)',
                                    border: '1px solid var(--vct-border, #e2e8f0)',
                                    transition: 'border-color 0.2s',
                                }}
                            >
                                <div style={{
                                    width: 44, height: 44, borderRadius: 10, display: 'flex',
                                    alignItems: 'center', justifyContent: 'center', fontWeight: 800,
                                    fontSize: '0.9rem', flexShrink: 0,
                                    background: b.color_hex === 'var(--vct-bg-elevated)' ? 'rgba(255,255,255,0.9)' : b.color_hex,
                                    border: b.color_hex === 'var(--vct-bg-elevated)' ? '2px solid var(--vct-border, #ddd)' : 'none',
                                    color: isLight ? 'var(--vct-bg-input)' : '#fff',
                                }}>{b.level}</div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--vct-text, #1e293b)' }}>{b.name}</div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--vct-text-secondary, #94a3b8)', marginTop: 2 }}>
                                        Tối thiểu {b.required_time_min} tháng {b.description ? `• ${b.description}` : ''}
                                    </div>
                                </div>
                                {b.is_dan_level && (
                                    <span style={{
                                        padding: '0.2rem 0.6rem', borderRadius: 6,
                                        background: 'rgba(245,158,11,0.12)', color: 'var(--vct-warning)',
                                        fontSize: '0.7rem', fontWeight: 700, whiteSpace: 'nowrap',
                                    }}>ĐẲNG CẤP</span>
                                )}
                                <div style={{ display: 'flex', gap: 4 }}>
                                    <ActionBtn icon="✏️" onClick={() => openEditBelt(b)} />
                                    <ActionBtn icon="🗑️" onClick={() => setDeleteConfirm({ type: 'belt', id: String(b.level) })} />
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}

            {/* ── Weights Tab ────────────────────────────────── */}
            {!loading && tab === 'weight' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                    {weights.length === 0 && <EmptyState label="Chưa có hạng cân nào" />}
                    {weights.map(w => (
                        <motion.div key={w.id}
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            style={{
                                padding: '1.25rem', borderRadius: 14, textAlign: 'center',
                                background: 'var(--vct-card-bg, #fff)',
                                border: '1px solid var(--vct-border, #e2e8f0)',
                                position: 'relative',
                            }}
                        >
                            <div style={{
                                fontSize: '1.75rem', fontWeight: 800,
                                color: w.gender === 'MALE' ? 'var(--vct-info)' : 'var(--vct-accent-pink)',
                            }}>
                                {w.is_heavy ? '80+' : `U${w.max_weight}`}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--vct-text-secondary, #64748b)', marginTop: 4 }}>
                                {w.gender === 'MALE' ? '♂ Nam' : '♀ Nữ'} • {w.category}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--vct-text-secondary, #94a3b8)', marginTop: 2 }}>
                                {w.is_heavy ? 'Trên 80 kg' : `Dưới ${w.max_weight} kg`}
                            </div>
                            <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 10 }}>
                                <ActionBtn icon="✏️" onClick={() => openEditWeight(w)} />
                                <ActionBtn icon="🗑️" onClick={() => setDeleteConfirm({ type: 'weight', id: w.id })} />
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* ── Ages Tab ───────────────────────────────────── */}
            {!loading && tab === 'age' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {ages.length === 0 && <EmptyState label="Chưa có nhóm tuổi nào" />}
                    {ages.map(a => (
                        <motion.div key={a.id}
                            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 16,
                                padding: '1rem 1.25rem', borderRadius: 14,
                                background: 'var(--vct-card-bg, #fff)',
                                border: '1px solid var(--vct-border, #e2e8f0)',
                            }}
                        >
                            <div style={{
                                width: 48, height: 48, borderRadius: 10,
                                background: 'rgba(16,185,129,0.08)', color: 'var(--vct-success)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: 700, fontSize: '0.8rem', flexShrink: 0,
                            }}>{a.id.toUpperCase()}</div>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--vct-text, #1e293b)' }}>{a.name}</div>
                                <div style={{ fontSize: '0.78rem', color: 'var(--vct-text-secondary, #94a3b8)', marginTop: 2 }}>
                                    Từ {a.min_age} đến {a.max_age} tuổi
                                </div>
                            </div>
                            {/* Age range bar */}
                            <div style={{ width: 120 }}>
                                <div style={{
                                    height: 6, borderRadius: 3,
                                    background: 'var(--vct-elevated, #f1f5f9)',
                                    overflow: 'hidden',
                                }}>
                                    <div style={{
                                        height: '100%', borderRadius: 3,
                                        background: 'rgba(16,185,129,0.5)',
                                        marginLeft: `${(a.min_age / 50) * 100}%`,
                                        width: `${((a.max_age - a.min_age) / 50) * 100}%`,
                                    }} />
                                </div>
                                <div style={{
                                    display: 'flex', justifyContent: 'space-between',
                                    fontSize: '0.65rem', color: 'var(--vct-text-secondary, #94a3b8)', marginTop: 2,
                                }}>
                                    <span>{a.min_age}</span><span>{a.max_age}</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 4 }}>
                                <ActionBtn icon="✏️" onClick={() => openEditAge(a)} />
                                <ActionBtn icon="🗑️" onClick={() => setDeleteConfirm({ type: 'age', id: a.id })} />
                            </div>
                        </motion.div>
                    ))}
                </motion.div>
            )}

            {/* ═══════════════════════════════════ MODALS ════════════════════ */}

            {/* Belt Modal */}
            <Modal open={beltModal !== null} onClose={() => setBeltModal(null)}
                title={beltModal === 'create' ? 'Thêm đai mới' : 'Sửa thông tin đai'}>
                <Field label="Tên đai">
                    <input style={inputStyle} value={beltForm.name}
                        onChange={e => setBeltForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Ví dụ: Đai Trắng (Cấp 8)" />
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Field label="Màu đai">
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <input type="color" value={beltForm.color_hex}
                                onChange={e => setBeltForm(f => ({ ...f, color_hex: e.target.value }))}
                                style={{ width: 40, height: 36, border: 'none', cursor: 'pointer', borderRadius: 6 }} />
                            <input style={{ ...inputStyle, flex: 1 }} value={beltForm.color_hex}
                                onChange={e => setBeltForm(f => ({ ...f, color_hex: e.target.value }))} />
                        </div>
                    </Field>
                    <Field label="Thời gian tối thiểu (tháng)">
                        <input type="number" style={inputStyle} value={beltForm.required_time_min}
                            onChange={e => setBeltForm(f => ({ ...f, required_time_min: parseInt(e.target.value) || 0 }))} />
                    </Field>
                </div>
                <Field label="Mô tả">
                    <input style={inputStyle} value={beltForm.description}
                        onChange={e => setBeltForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="Ghi chú về quy chế đai này" />
                </Field>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: '1.25rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={beltForm.is_dan_level}
                        onChange={e => setBeltForm(f => ({ ...f, is_dan_level: e.target.checked }))} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--vct-text, #1e293b)' }}>Đây là đẳng cấp (Đai Đen)</span>
                </label>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button style={btnOutline} onClick={() => setBeltModal(null)}>Hủy</button>
                    <button style={btnPrimary} onClick={saveBelt}>
                        {beltModal === 'create' ? 'Tạo đai' : 'Cập nhật'}
                    </button>
                </div>
            </Modal>

            {/* Weight Modal */}
            <Modal open={weightModal !== null} onClose={() => setWeightModal(null)}
                title={weightModal === 'create' ? 'Thêm hạng cân' : 'Sửa hạng cân'}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Field label="Giới tính">
                        <select style={inputStyle} value={weightForm.gender}
                            onChange={e => setWeightForm(f => ({ ...f, gender: e.target.value }))}>
                            <option value="MALE">Nam</option>
                            <option value="FEMALE">Nữ</option>
                        </select>
                    </Field>
                    <Field label="Thể loại">
                        <input style={inputStyle} value={weightForm.category}
                            onChange={e => setWeightForm(f => ({ ...f, category: e.target.value }))} />
                    </Field>
                </div>
                <Field label="Cân nặng tối đa (kg)">
                    <input type="number" style={inputStyle} value={weightForm.max_weight}
                        onChange={e => setWeightForm(f => ({ ...f, max_weight: parseFloat(e.target.value) || 0 }))} />
                </Field>
                <label style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: '1.25rem', cursor: 'pointer' }}>
                    <input type="checkbox" checked={weightForm.is_heavy}
                        onChange={e => setWeightForm(f => ({ ...f, is_heavy: e.target.checked }))} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--vct-text, #1e293b)' }}>Hạng nặng (80+ kg)</span>
                </label>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button style={btnOutline} onClick={() => setWeightModal(null)}>Hủy</button>
                    <button style={btnPrimary} onClick={saveWeight}>
                        {weightModal === 'create' ? 'Tạo hạng cân' : 'Cập nhật'}
                    </button>
                </div>
            </Modal>

            {/* Age Modal */}
            <Modal open={ageModal !== null} onClose={() => setAgeModal(null)}
                title={ageModal === 'create' ? 'Thêm nhóm tuổi' : 'Sửa nhóm tuổi'}>
                <Field label="Tên nhóm tuổi">
                    <input style={inputStyle} value={ageForm.name}
                        onChange={e => setAgeForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Ví dụ: Thiếu niên (U15)" />
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Field label="Tuổi tối thiểu">
                        <input type="number" style={inputStyle} value={ageForm.min_age}
                            onChange={e => setAgeForm(f => ({ ...f, min_age: parseInt(e.target.value) || 0 }))} />
                    </Field>
                    <Field label="Tuổi tối đa">
                        <input type="number" style={inputStyle} value={ageForm.max_age}
                            onChange={e => setAgeForm(f => ({ ...f, max_age: parseInt(e.target.value) || 0 }))} />
                    </Field>
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button style={btnOutline} onClick={() => setAgeModal(null)}>Hủy</button>
                    <button style={btnPrimary} onClick={saveAge}>
                        {ageModal === 'create' ? 'Tạo nhóm tuổi' : 'Cập nhật'}
                    </button>
                </div>
            </Modal>

            {/* Delete Confirmation */}
            <Modal open={deleteConfirm !== null} onClose={() => setDeleteConfirm(null)} title="Xác nhận xóa">
                <p style={{ fontSize: '0.9rem', color: 'var(--vct-text, #1e293b)', margin: '0 0 1.25rem' }}>
                    Bạn có chắc muốn xóa mục này? Hành động này không thể hoàn tác.
                </p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button style={btnOutline} onClick={() => setDeleteConfirm(null)}>Hủy</button>
                    <button style={btnDanger} onClick={() => {
                        if (!deleteConfirm) return;
                        if (deleteConfirm.type === 'belt') deleteBelt(parseInt(deleteConfirm.id));
                        else if (deleteConfirm.type === 'weight') deleteWeight(deleteConfirm.id);
                        else deleteAge(deleteConfirm.id);
                    }}>
                        Xóa
                    </button>
                </div>
            </Modal>

            {/* Toast */}
            <AnimatePresence>
                {toast && <Toast {...toast} onClose={() => setToast(null)} />}
            </AnimatePresence>
        </div>
    );
}

// ── Small helpers ─────────────────────────────────────────────

function ActionBtn({ icon, onClick }: { icon: string; onClick: () => void }) {
    return (
        <button onClick={onClick} style={{
            width: 32, height: 32, borderRadius: 8, border: '1px solid var(--vct-border, #e2e8f0)',
            background: 'transparent', cursor: 'pointer', fontSize: '0.8rem',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.15s',
        }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--vct-elevated, #f1f5f9)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >{icon}</button>
    );
}

function EmptyState({ label }: { label: string }) {
    return (
        <div style={{
            padding: '3rem', textAlign: 'center', borderRadius: 14,
            background: 'var(--vct-card-bg, #fff)', border: '1px dashed var(--vct-border, #e2e8f0)',
            color: 'var(--vct-text-secondary, #94a3b8)', fontSize: '0.9rem',
            gridColumn: '1 / -1',
        }}>
            {label}
        </div>
    );
}

export default Page_federation_master_data;
