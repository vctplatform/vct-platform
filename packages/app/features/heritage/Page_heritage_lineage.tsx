'use client'
// ════════════════════════════════════════════════════════════════
// VCT ECOSYSTEM — Heritage: Lineage Tree (Gia phả Võ thuật)
// Interactive family tree of martial arts schools and masters
// ════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VCT_Text, VCT_Card, VCT_Badge, VCT_Button, VCT_Tabs } from '@vct/ui'
import { VCT_Icons } from '@vct/ui'

interface LineageNode {
    id: string
    name: string
    title: string
    school: string
    generation: number
    beltRank: string
    yearFounded?: number
    avatar?: string
    children: string[]
    parentId: string | null
    bio: string
    achievements: string[]
}

const LINEAGE_DATA: LineageNode[] = [
    { id: 'root', name: 'Lão sư Nguyễn Văn Thiện', title: 'Chưởng môn', school: 'Sơn Long Quyền', generation: 1, beltRank: 'Hồng đai 9 đẳng', yearFounded: 1952, parentId: null, bio: 'Sáng lập phái Sơn Long Quyền tại Bình Định năm 1952. Tổ sư là người kết hợp tinh hoa các dòng võ cổ truyền miền Trung.', achievements: ['Sáng lập Sơn Long Quyền', 'Huy chương vàng Đại hội TDTT 1960', 'Giải thưởng Di sản Văn hóa 1985'], children: ['gen2-1', 'gen2-2', 'gen2-3'] },
    { id: 'gen2-1', name: 'Võ sư Trần Quốc Bình', title: 'Phó Chưởng môn', school: 'Sơn Long Quyền', generation: 2, beltRank: 'Hồng đai 7 đẳng', parentId: 'root', bio: 'Đệ tử đầu tiên, phát triển dòng Đối kháng của phái.', achievements: ['HCV Giải VĐQG 1975', 'Đào tạo 200+ môn sinh'], children: ['gen3-1', 'gen3-2'] },
    { id: 'gen2-2', name: 'Võ sư Lê Thị Hương', title: 'Trưởng tràng', school: 'Sơn Long Quyền - Chi Bắc', generation: 2, beltRank: 'Hồng đai 6 đẳng', parentId: 'root', bio: 'Mở rộng phái ra phía Bắc, thành lập chi nhánh Hà Nội năm 1978.', achievements: ['Mở chi nhánh Hà Nội', 'HCV Nữ đầu tiên'], children: ['gen3-3'] },
    { id: 'gen2-3', name: 'Võ sư Phạm Đức Long', title: 'Huấn luyện viên trưởng', school: 'Sơn Long Quyền', generation: 2, beltRank: 'Hồng đai 5 đẳng', parentId: 'root', bio: 'Chuyên về Quyền thuật, biên soạn giáo trình 12 bài quyền.', achievements: ['Biên soạn giáo trình chuẩn', 'Giải A Nghiên cứu KHKT'], children: [] },
    { id: 'gen3-1', name: 'Võ sư Trần Minh Tuấn', title: 'HLV Quốc gia', school: 'Sơn Long Quyền', generation: 3, beltRank: 'Đai đen 4 đẳng', parentId: 'gen2-1', bio: 'HLV đội tuyển quốc gia 2010-2020.', achievements: ['HLV xuất sắc 2015', '12 HCV SEA Games qua các đội viên'], children: [] },
    { id: 'gen3-2', name: 'Võ sư Nguyễn Hoàng Nam', title: 'Trưởng CLB TP.HCM', school: 'Sơn Long Quyền - Chi Nam', generation: 3, beltRank: 'Đai đen 3 đẳng', parentId: 'gen2-1', bio: 'Mở rộng phái tại khu vực phía Nam.', achievements: ['Mở 5 CLB tại TP.HCM', 'Đào tạo 500+ võ sinh'], children: [] },
    { id: 'gen3-3', name: 'Võ sư Lê Quang Vinh', title: 'Trưởng CLB Hà Nội', school: 'Sơn Long Quyền - Chi Bắc', generation: 3, beltRank: 'Đai đen 3 đẳng', parentId: 'gen2-2', bio: 'Kế thừa chi Bắc, phát triển tại Hà Nội.', achievements: ['BXH #1 Miền Bắc 2020', '3 HCV Giải VĐQG'], children: [] },
]

const GENERATION_COLORS: Record<number, string> = {
    1: 'var(--vct-info)',
    2: 'var(--vct-info)',
    3: 'var(--vct-success)',
    4: 'var(--vct-warning)',
}

export function Page_heritage_lineage() {
    const [selectedNode, setSelectedNode] = useState<LineageNode | null>(null)
    const [expandedGen, setExpandedGen] = useState<Set<number>>(new Set([1, 2, 3]))
    const [searchQuery, setSearchQuery] = useState('')
    const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree')

    const generations = useMemo(() => {
        const map = new Map<number, LineageNode[]>()
        LINEAGE_DATA.forEach(n => {
            const list = map.get(n.generation) || []
            list.push(n)
            map.set(n.generation, list)
        })
        return Array.from(map.entries()).sort((a, b) => a[0] - b[0])
    }, [])

    const filtered = useMemo(() => {
        if (!searchQuery) return LINEAGE_DATA
        const q = searchQuery.toLowerCase()
        return LINEAGE_DATA.filter(n => n.name.toLowerCase().includes(q) || n.school.toLowerCase().includes(q))
    }, [searchQuery])

    return (
        <div className="grid gap-6">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <VCT_Text as="h1" weight={900} className="text-2xl">Gia Phả Võ Thuật</VCT_Text>
                    <VCT_Text color="muted" className="text-sm mt-1">Dòng phái, sư đồ truyền thừa qua các thế hệ</VCT_Text>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <VCT_Icons.Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-vct-text-muted" />
                        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Tìm võ sư, dòng phái..." className="rounded-lg border border-vct-border bg-vct-elevated py-2 pl-9 pr-3 text-sm outline-none focus:border-vct-accent w-64" />
                    </div>
                    <div className="flex rounded-lg border border-vct-border">
                        <button onClick={() => setViewMode('tree')} className={`px-3 py-2 text-xs font-bold rounded-l-lg transition ${viewMode === 'tree' ? 'bg-vct-accent text-white' : 'bg-vct-elevated text-vct-text-muted'}`}>🌳 Cây</button>
                        <button onClick={() => setViewMode('list')} className={`px-3 py-2 text-xs font-bold rounded-r-lg transition ${viewMode === 'list' ? 'bg-vct-accent text-white' : 'bg-vct-elevated text-vct-text-muted'}`}>📋 Danh sách</button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 tablet:grid-cols-4 gap-3">
                {[
                    { label: 'Thế hệ', value: generations.length, icon: '🏛️', color: 'var(--vct-info)' },
                    { label: 'Võ sư / Bậc thầy', value: LINEAGE_DATA.length, icon: '🥋', color: 'var(--vct-info)' },
                    { label: 'Chi phái', value: 3, icon: '🌿', color: 'var(--vct-success)' },
                    { label: 'Năm lập phái', value: '1952', icon: '📜', color: 'var(--vct-warning)' },
                ].map(s => (
                    <div key={s.label} className="rounded-xl border border-vct-border bg-vct-elevated p-4">
                        <div className="text-2xl mb-1">{s.icon}</div>
                        <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
                        <div className="text-xs text-vct-text-muted font-bold">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Tree View */}
            {viewMode === 'tree' && (
                <div className="grid gap-4">
                    {generations.map(([gen, nodes]) => (
                        <div key={gen}>
                            <button onClick={() => setExpandedGen(prev => { const s = new Set(prev); s.has(gen) ? s.delete(gen) : s.add(gen); return s })}
                                className="flex items-center gap-2 mb-3 text-sm font-bold text-vct-text-muted hover:text-vct-text transition">
                                <span className="h-6 w-6 rounded-full text-white text-xs flex items-center justify-center font-bold" style={{ background: GENERATION_COLORS[gen] || 'var(--vct-text-tertiary)' }}>{gen}</span>
                                Thế hệ {gen} ({nodes.length} người)
                                <VCT_Icons.ExpandMore size={16} className={`transition-transform ${expandedGen.has(gen) ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {expandedGen.has(gen) && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                                        className="grid tablet:grid-cols-2 desktop:grid-cols-3 gap-3 ml-8 relative">
                                        {/* Connecting line */}
                                        <div className="absolute -left-4 top-0 bottom-0 w-px bg-vct-border" />

                                        {nodes.filter(n => !searchQuery || filtered.includes(n)).map(node => (
                                            <motion.div key={node.id} layoutId={node.id} onClick={() => setSelectedNode(node)}
                                                className="cursor-pointer rounded-xl border border-vct-border bg-vct-elevated p-4 transition hover:border-vct-accent hover:shadow-lg relative">
                                                <div className="absolute -left-[calc(1rem+4px)] top-6 w-4 h-px bg-vct-border" />
                                                <div className="flex items-start gap-3">
                                                    <div className="h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0"
                                                        style={{ background: `linear-gradient(135deg, ${GENERATION_COLORS[gen]}, ${GENERATION_COLORS[gen]}99)` }}>
                                                        {node.name.split(' ').slice(-1)[0]?.[0]}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-bold text-sm truncate">{node.name}</div>
                                                        <div className="text-xs text-vct-text-muted">{node.title}</div>
                                                        <div className="flex gap-2 mt-2">
                                                            <VCT_Badge variant="info" size="sm">{node.beltRank}</VCT_Badge>
                                                            {node.children.length > 0 && <VCT_Badge variant="success" size="sm">{node.children.length} đệ tử</VCT_Badge>}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ))}
                </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
                <div className="rounded-xl border border-vct-border overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-vct-elevated">
                            <tr>
                                <th className="text-left px-4 py-3 font-bold text-vct-text-muted">Họ tên</th>
                                <th className="text-left px-4 py-3 font-bold text-vct-text-muted">Chức vị</th>
                                <th className="text-left px-4 py-3 font-bold text-vct-text-muted">Dòng phái</th>
                                <th className="text-center px-4 py-3 font-bold text-vct-text-muted">Thế hệ</th>
                                <th className="text-left px-4 py-3 font-bold text-vct-text-muted">Cấp bậc</th>
                                <th className="text-center px-4 py-3 font-bold text-vct-text-muted">Đệ tử</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(n => (
                                <tr key={n.id} onClick={() => setSelectedNode(n)} className="border-t border-vct-border cursor-pointer hover:bg-vct-elevated/50 transition">
                                    <td className="px-4 py-3 font-bold">{n.name}</td>
                                    <td className="px-4 py-3 text-vct-text-muted">{n.title}</td>
                                    <td className="px-4 py-3 text-vct-text-muted">{n.school}</td>
                                    <td className="px-4 py-3 text-center"><span className="inline-flex h-6 w-6 items-center justify-center rounded-full text-white text-xs font-bold" style={{ background: GENERATION_COLORS[n.generation] }}>{n.generation}</span></td>
                                    <td className="px-4 py-3"><VCT_Badge variant="info" size="sm">{n.beltRank}</VCT_Badge></td>
                                    <td className="px-4 py-3 text-center font-bold">{n.children.length}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Detail Sidebar */}
            <AnimatePresence>
                {selectedNode && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z- flex justify-end" onClick={() => setSelectedNode(null)}>
                        <div className="absolute inset-0 bg-black/40" />
                        <motion.div initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }} transition={{ type: 'spring', damping: 25 }}
                            onClick={e => e.stopPropagation()} className="relative w-full max-w-md bg-vct-bg border-l border-vct-border p-6 overflow-y-auto">
                            <button onClick={() => setSelectedNode(null)} className="absolute top-4 right-4 text-vct-text-muted hover:text-vct-text"><VCT_Icons.Close size={20} /></button>
                            <div className="h-20 w-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mb-4"
                                style={{ background: `linear-gradient(135deg, ${GENERATION_COLORS[selectedNode.generation]}, ${GENERATION_COLORS[selectedNode.generation]}99)` }}>
                                {selectedNode.name.split(' ').slice(-1)[0]?.[0]}
                            </div>
                            <h2 className="text-xl font-black m-0">{selectedNode.name}</h2>
                            <p className="text-sm text-vct-text-muted mt-1">{selectedNode.title} — {selectedNode.school}</p>
                            <div className="flex gap-2 mt-3">
                                <VCT_Badge variant="info">{selectedNode.beltRank}</VCT_Badge>
                                <VCT_Badge variant="warning">Thế hệ {selectedNode.generation}</VCT_Badge>
                            </div>
                            <div className="mt-6">
                                <h3 className="text-sm font-bold mb-2">Tiểu sử</h3>
                                <p className="text-sm text-vct-text-muted leading-6">{selectedNode.bio}</p>
                            </div>
                            <div className="mt-6">
                                <h3 className="text-sm font-bold mb-2">Thành tựu</h3>
                                <div className="grid gap-2">
                                    {selectedNode.achievements.map((a, i) => (
                                        <div key={i} className="flex items-start gap-2 text-sm">
                                            <span className="text-amber-500 mt-0.5">🏅</span>
                                            <span>{a}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {selectedNode.children.length > 0 && (
                                <div className="mt-6">
                                    <h3 className="text-sm font-bold mb-2">Đệ tử trực tiếp</h3>
                                    <div className="grid gap-2">
                                        {selectedNode.children.map(cid => {
                                            const child = LINEAGE_DATA.find(n => n.id === cid)
                                            return child ? (
                                                <button key={cid} onClick={() => setSelectedNode(child)}
                                                    className="flex items-center gap-2 rounded-lg border border-vct-border p-2 text-left hover:bg-vct-elevated transition">
                                                    <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                                        style={{ background: GENERATION_COLORS[child.generation] }}>
                                                        {child.name.split(' ').slice(-1)[0]?.[0]}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-bold">{child.name}</div>
                                                        <div className="text-xs text-vct-text-muted">{child.title}</div>
                                                    </div>
                                                </button>
                                            ) : null
                                        })}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
