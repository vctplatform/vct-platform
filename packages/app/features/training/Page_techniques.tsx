'use client'

import * as React from 'react'
import { useState, useMemo, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
    VCT_Badge, VCT_Button, VCT_Stack, VCT_Toast,
    VCT_SearchInput, VCT_Modal, VCT_Input, VCT_Field, VCT_Select,
    VCT_ConfirmDialog, VCT_EmptyState, VCT_FilterChips,
    VCT_Tabs
} from '../components/vct-ui'
import { VCT_PageContainer, VCT_PageHero, VCT_StatRow } from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'
import { useTechniques } from '../hooks/useHeritageAPI'

// ════════════════════════════════════════
// TYPES & MOCK DATA
// ════════════════════════════════════════
type TechCategory = 'tan_phap' | 'thu_phap' | 'cuoc_phap' | 'binh_khi' | 'vat' | 'khi_cong'

interface Technique {
    id: string
    name: string
    category: TechCategory
    difficulty: 'co_ban' | 'trung_cap' | 'cao_cap'
    has_video: boolean
    description: string
    tags: string[]
}

const CAT_MAP: Record<TechCategory, string> = {
    tan_phap: 'Tấn pháp (Stances)',
    thu_phap: 'Thủ pháp (Hands)',
    cuoc_phap: 'Cước pháp (Kicks)',
    binh_khi: 'Binh khí (Weapons)',
    vat: 'Vật (Grappling)',
    khi_cong: 'Khí công (Breath/Energy)'
}

const DIFF_MAP: Record<string, { label: string; color: string }> = {
    co_ban: { label: 'Cơ bản', color: '#10b981' },
    trung_cap: { label: 'Trung cấp', color: '#f59e0b' },
    cao_cap: { label: 'Cao cấp', color: '#ef4444' }
}

const BLANK_FORM: Partial<Technique> = {
    name: '', category: 'tan_phap', difficulty: 'co_ban', has_video: false, description: '', tags: []
}

// ════════════════════════════════════════
// VIDEO PLAYER MODAL
// ════════════════════════════════════════
const VideoPlayer = ({ technique, onClose }: { technique: Technique, onClose: () => void }) => {
    return (
        <VCT_Modal isOpen={true} onClose={onClose} title={`Video Hướng Dẫn: ${technique.name}`} width="800px">
            <div className="aspect-video bg-black rounded-lg w-full flex flex-col items-center justify-center relative overflow-hidden group">
                {technique.has_video ? (
                    <>
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-40"></div>
                        <div className="z-10 bg-white/20 backdrop-blur-md rounded-full w-20 h-20 flex items-center justify-center cursor-pointer hover:bg-white/30 transition-colors shadow-2xl">
                            <VCT_Icons.Play size={36} color="#fff" />
                        </div>
                        <div className="absolute bottom-4 left-4 right-4 h-1 bg-white/20 rounded-full overflow-hidden">
                            <div className="w-1/3 h-full bg-(--vct-accent-cyan) shadow-[0_0_10px_var(--vct-accent-cyan)]"></div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-4 opacity-50">
                        <VCT_Icons.VideoOff size={48} color="#fff" />
                        <span className="text-white font-medium">Video chưa được cập nhật cho kỹ thuật này.</span>
                    </div>
                )}
            </div>
            <div className="mt-4 flex gap-4 text-sm text-(--vct-text-secondary)">
                <span className="flex items-center gap-1"><VCT_Icons.Info size={16} /> Nhóm: {CAT_MAP[technique.category]}</span>
                <span className="flex items-center gap-1"><VCT_Icons.Activity size={16} /> Độ khó: {DIFF_MAP[technique.difficulty]?.label ?? 'N/A'}</span>
            </div>
            <div className="mt-3 p-3 bg-(--vct-bg-elevated) rounded-lg text-sm border border-(--vct-border-subtle)">
                <strong className="text-(--vct-text-primary)">Mô tả:</strong> {technique.description || 'Chưa có mô tả.'}
            </div>
        </VCT_Modal>
    )
}

// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_techniques = () => {
    // ── Real API data ──
    const { data: apiTechniques } = useTechniques()
    const [techs, setTechs] = useState<Technique[]>([])
    const [search, setSearch] = useState('')

    useEffect(() => {
        if (apiTechniques && apiTechniques.length > 0) {
            setTechs(apiTechniques.map(t => ({
                id: t.id, name: t.name, category: (t.category || 'tan_phap') as TechCategory,
                difficulty: (t.difficulty || 'co_ban') as Technique['difficulty'],
                has_video: !!t.video_url, description: t.description || '',
                tags: t.variations || [],
            })))
        }
    }, [apiTechniques])
    const [categoryFilter, setCategoryFilter] = useState<string | null>(null)
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' })
    const [showModal, setShowModal] = useState(false)
    const [playingVideo, setPlayingVideo] = useState<Technique | null>(null)
    const [editingTech, setEditingTech] = useState<Technique | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Technique | null>(null)
    const [form, setForm] = useState<any>({ ...BLANK_FORM, tagsInput: '' })

    const showToast = useCallback((msg: string, type = 'success') => {
        setToast({ show: true, msg, type })
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3500)
    }, [])

    // ── Computed ──
    const filtered = useMemo(() => {
        let data = techs
        if (categoryFilter && categoryFilter !== 'all') data = data.filter(t => t.category === categoryFilter)
        if (search) {
            const q = search.toLowerCase()
            data = data.filter(t => t.name.toLowerCase().includes(q) || t.tags.some(tag => tag.toLowerCase().includes(q)))
        }
        return data
    }, [techs, categoryFilter, search])

    const totalVideos = techs.filter(t => t.has_video).length

    // ── Filters ──
    const activeFilters = useMemo(() => {
        const f: Array<{ key: string; label: string; value: string }> = []
        if (categoryFilter && categoryFilter !== 'all') f.push({ key: 'category', label: 'Nhóm', value: CAT_MAP[categoryFilter as TechCategory] || categoryFilter })
        if (search) f.push({ key: 'search', label: 'Tìm kiếm', value: search })
        return f
    }, [categoryFilter, search])

    const removeFilter = (key: string) => {
        if (key === 'category') setCategoryFilter(null)
        if (key === 'search') setSearch('')
    }

    // ── CRUD Operations ──
    const openAddModal = useCallback(() => {
        setEditingTech(null)
        setForm({ ...BLANK_FORM, tagsInput: '' })
        setShowModal(true)
    }, [])

    const openEditModal = useCallback((tech: Technique) => {
        setEditingTech(tech)
        setForm({ ...tech, tagsInput: tech.tags.join(', ') })
        setShowModal(true)
    }, [])

    const handleSave = () => {
        if (!form.name) { showToast('Vui lòng nhập tên kỹ thuật', 'error'); return }

        const formTags = form.tagsInput ? form.tagsInput.split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean) : []
        const dataToSave = { ...form, tags: formTags }
        delete dataToSave.tagsInput

        if (editingTech) {
            setTechs(prev => prev.map(t => t.id === editingTech.id ? { ...t, ...dataToSave } : t))
            showToast(`Đã cập nhật "${form.name}"`)
        } else {
            const newTech: Technique = {
                ...dataToSave, id: `T-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
            }
            setTechs(prev => [newTech, ...prev])
            showToast(`Đã thêm kỹ thuật "${form.name}"`)
        }
        setShowModal(false)
    }

    const handleDelete = () => {
        if (!deleteTarget) return
        setTechs(prev => prev.filter(t => t.id !== deleteTarget.id))
        showToast(`Đã xóa "${deleteTarget.name}"`, 'success')
        setDeleteTarget(null)
    }

    return (
        <VCT_PageContainer size="wide" animated>
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast(prev => ({ ...prev, show: false }))} />

            <VCT_PageHero
                icon={<VCT_Icons.Layers size={24} />}
                title="Kho Kỹ Thuật"
                subtitle="Hệ thống hóa các nhóm kỹ thuật, thế võ, binh khí với video trực quan."
                gradientFrom="rgba(14, 165, 233, 0.08)"
                gradientTo="rgba(139, 92, 246, 0.06)"
            />

            <VCT_StatRow items={[
                { label: 'Tổng kỹ thuật', value: techs.length, icon: <VCT_Icons.Layers size={18} />, color: '#0ea5e9' },
                { label: 'Cơ bản', value: techs.filter(t => t.difficulty === 'co_ban').length, icon: <VCT_Icons.Check size={18} />, color: '#10b981' },
                { label: 'Nâng cao', value: techs.filter(t => t.difficulty !== 'co_ban').length, icon: <VCT_Icons.Activity size={18} />, color: '#ef4444' },
                { label: 'Video', value: totalVideos, sub: `${Math.round((totalVideos / techs.length) * 100 || 0)}% bao phủ`, icon: <VCT_Icons.Video size={18} />, color: '#8b5cf6' },
            ] as StatItem[]} className="mb-6" />

            {/* ── FILTER CHIPS ── */}
            <VCT_FilterChips filters={activeFilters} onRemove={removeFilter} onClearAll={() => { setCategoryFilter(null); setSearch(''); }} />

            {/* ── TABS (Categories) ── */}
            <div className="mb-5 border-b border-(--vct-border-subtle) pb-2 flex items-center justify-between flex-wrap gap-4">
                <VCT_Tabs
                    tabs={[
                        { key: 'all', label: 'Tất cả' },
                        ...Object.entries(CAT_MAP).map(([k, v]) => ({ key: k, label: v.split(' ')[0] + (v.split(' ')[1] ? ' ' + v.split(' ')[1] : '') }))
                    ]}
                    activeTab={categoryFilter || 'all'}
                    onChange={setCategoryFilter}
                />

                <VCT_Stack direction="row" gap={12} align="center">
                    <div className="w-[250px]">
                        <VCT_SearchInput value={search} onChange={setSearch} onClear={() => setSearch('')} placeholder="Tìm kiếm kỹ thuật, tags..." />
                    </div>
                    <VCT_Button icon={<VCT_Icons.Plus size={16} />} onClick={openAddModal}>Thêm mới</VCT_Button>
                </VCT_Stack>
            </div>

            {/* ── GRID OF CARDS ── */}
            {filtered.length === 0 ? (
                <VCT_EmptyState title="Không tìm thấy kỹ thuật" description="Chưa có kỹ thuật nào phù hợp với bộ lọc." actionLabel="Thêm kỹ thuật" onAction={openAddModal} icon="🥋" />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    <AnimatePresence>
                        {filtered.map(tech => (
                            <motion.div
                                key={tech.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                                className="bg-(--vct-bg-elevated) border border-(--vct-border-subtle) rounded-2xl overflow-hidden hover:border-(--vct-accent-cyan) hover:shadow-[0_4px_24px_-8px_var(--vct-accent-cyan)] transition-all flex flex-col group cursor-default"
                            >
                                {/* Thumbnail / Video trigger */}
                                <div
                                    className="aspect-video bg-(--vct-bg-card) relative cursor-pointer overflow-hidden border-b border-(--vct-border-subtle) flex items-center justify-center"
                                    onClick={() => setPlayingVideo(tech)}
                                >
                                    {tech.has_video ? (
                                        <>
                                            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/30 transition-colors z-10 duration-300"></div>
                                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-60 group-hover:scale-110 transition-transform duration-700"></div>
                                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center z-20 group-hover:bg-(--vct-accent-cyan) group-hover:text-white transition-all shadow-lg text-(--vct-accent-cyan)">
                                                <VCT_Icons.Play size={24} className="ml-1" />
                                            </div>
                                            <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-md font-bold z-20 backdrop-blur-md">VIDEO</div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center opacity-40 group-hover:opacity-100 transition-opacity text-(--vct-text-secondary)">
                                            <VCT_Icons.Image size={32} />
                                            <span className="text-[10px] mt-2 font-bold uppercase">No Media</span>
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <div className="p-4 flex-1 flex flex-col">
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <h3 className="font-bold text-[15px] text-(--vct-text-primary) leading-tight">{tech.name}</h3>
                                        <div className="shrink-0 flex gap-1">
                                            <button aria-label={`Sửa ${tech.name}`} onClick={(e) => { e.stopPropagation(); openEditModal(tech) }} className="p-1.5 text-(--vct-text-tertiary) hover:text-(--vct-accent-cyan) hover:bg-(--vct-bg-glass) rounded-md transition-colors"><VCT_Icons.Edit size={14} /></button>
                                            <button aria-label={`Xóa ${tech.name}`} onClick={(e) => { e.stopPropagation(); setDeleteTarget(tech) }} className="p-1.5 text-(--vct-text-tertiary) hover:text-[#ef4444] hover:bg-[#ef444420] rounded-md transition-colors"><VCT_Icons.Trash size={14} /></button>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                        <span {...{style: { color: DIFF_MAP[tech.difficulty]?.color ?? '#94a3b8', background: `${DIFF_MAP[tech.difficulty]?.color ?? '#94a3b8'}15`, padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}}>
                                            {DIFF_MAP[tech.difficulty]?.label ?? tech.difficulty}
                                        </span>
                                        <span className="text-[11px] font-medium text-(--vct-text-secondary) bg-(--vct-bg-base) px-2 py-0.5 rounded border border-(--vct-border-subtle)">
                                            {CAT_MAP[tech.category].split(' ')[0]}
                                        </span>
                                    </div>

                                    <p className="text-[12px] text-(--vct-text-secondary) leading-relaxed line-clamp-2 mt-auto mb-3">
                                        {tech.description}
                                    </p>

                                    {tech.tags.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5 mt-auto pt-3 border-t border-(--vct-border-subtle)">
                                            {tech.tags.map(tag => (
                                                <span key={tag} className="text-[10px] text-(--vct-text-tertiary) font-monospace before:content-['#']">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* ── VIDEO PLAYER MODAL ── */}
            {playingVideo && <VideoPlayer technique={playingVideo} onClose={() => setPlayingVideo(null)} />}

            {/* ── ADD/EDIT MODAL ── */}
            <VCT_Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingTech ? 'Chỉnh sửa thuật' : 'Thêm Kỹ thuật mới'} width="680px" footer={
                <>
                    <VCT_Button variant="secondary" onClick={() => setShowModal(false)}>Hủy</VCT_Button>
                    <VCT_Button onClick={handleSave}>{editingTech ? 'Lưu cập nhật' : 'Thêm'}</VCT_Button>
                </>
            }>
                <VCT_Stack gap={16}>
                    <VCT_Field label="Tên Kỹ thuật *"><VCT_Input value={form.name} onChange={(e: any) => setForm({ ...form, name: e.target.value })} placeholder="VD: Trung bình tấn" /></VCT_Field>
                    <VCT_Stack direction="row" gap={16}>
                        <VCT_Field label="Nhóm kỹ thuật" className="flex-1"><VCT_Select options={Object.entries(CAT_MAP).map(([k, v]) => ({ value: k, label: v }))} value={form.category} onChange={(v: any) => setForm({ ...form, category: v })} /></VCT_Field>
                        <VCT_Field label="Độ khó" className="flex-1"><VCT_Select options={Object.entries(DIFF_MAP).map(([k, v]) => ({ value: k, label: v.label }))} value={form.difficulty} onChange={(v: any) => setForm({ ...form, difficulty: v })} /></VCT_Field>
                    </VCT_Stack>

                    <VCT_Field label="Mô tả">
                        <textarea
                            value={form.description}
                            onChange={(e: any) => setForm({ ...form, description: e.target.value })}
                            placeholder="Mô tả kỹ thuật, cách thực hiện..."
                            className="w-full bg-(--vct-bg-elevated) border border-(--vct-border-subtle) rounded-lg p-3 text-(--vct-text-primary) text-sm outline-none focus:border-(--vct-accent-cyan) transition-colors min-h-[80px] resize-y"
                        />
                    </VCT_Field>

                    <VCT_Stack direction="row" gap={16} align="end">
                        <VCT_Field label="Thẻ đánh dấu (Tags - cách nhau dấu phẩy)" className="flex-1">
                            <VCT_Input value={form.tagsInput} onChange={(e: any) => setForm({ ...form, tagsInput: e.target.value })} placeholder="VD: cơ bản, tấn, móc" />
                        </VCT_Field>
                        <label className="flex items-center gap-3 cursor-pointer pb-2 bg-(--vct-bg-elevated) border border-(--vct-border-subtle) rounded-lg h-10 mb-1 px-3 py-2">
                            <input aria-label="Có video" type="checkbox" checked={form.has_video} onChange={(e) => setForm({ ...form, has_video: e.target.checked })} {...{style: { accentColor: '#22d3ee', width: 16, height: 16 }}} />
                            <span className="text-sm font-semibold text-(--vct-text-primary)">Có Video</span>
                        </label>
                    </VCT_Stack>
                </VCT_Stack>
            </VCT_Modal>

            {/* ── DELETE CONFIRM ── */}
            <VCT_ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
                title="Xác nhận xóa" message={`Bạn có chắc muốn xóa kỹ thuật "${deleteTarget?.name}"?`}
                confirmLabel="Xóa" />
        </VCT_PageContainer>
    )
}
