'use client'

import * as React from 'react'
import { useState } from 'react'
import {
    VCT_Button, VCT_Stack, VCT_SearchInput,
    VCT_KpiCard
} from '../components/vct-ui'
import { VCT_Icons } from '../components/vct-icons'

// ════════════════════════════════════════
// MOCK DATA
// ════════════════════════════════════════
const TREE_DATA = {
    id: 'T1',
    name: 'Tổ Sư Sáng Lập',
    title: 'Đại Lão Võ Sư',
    era: '1930',
    description: 'Người khai sáng môn phái',
    children: [
        {
            id: 'T2',
            name: 'Trưởng Môn Đời 2',
            title: 'Hồng Đai Đệ Nhất Cấp',
            era: '1960',
            children: [
                {
                    id: 'T4',
                    name: 'Võ Sư Chuẩn Hồng Đai',
                    title: 'Quản đốc khu vực Miền Bắc',
                    era: '1985',
                },
                {
                    id: 'T5',
                    name: 'Võ Sư Chuẩn Hồng Đai',
                    title: 'Quản đốc khu vực Miền Nam',
                    era: '1987',
                    children: [
                        { id: 'T8', name: 'Hoàng Văn A', title: 'Hoàng Đai Đệ Tam', era: '2005' },
                        { id: 'T9', name: 'Lê Thị B', title: 'Hoàng Đai Đệ Nhị', era: '2010' },
                    ]
                }
            ]
        },
        {
            id: 'T3',
            name: 'Võ Sư Sáng Lập Hệ Phái',
            title: 'Hồng Đai Đệ Nhất Cấp',
            era: '1965',
            children: [
                {
                    id: 'T6',
                    name: 'Chưởng Môn Hệ Phái',
                    title: 'Hồng Đai Đệ Nhị Cấp',
                    era: '1990',
                },
                {
                    id: 'T7',
                    name: 'Cố Vấn Kỹ Thuật',
                    title: 'Hồng Đai Đệ Nhị Cấp',
                    era: '1992',
                }
            ]
        }
    ]
}

// Simple recursive tree component
const TreeNode = ({ node }: { node: any }) => {
    const hasChildren = node.children && node.children.length > 0;

    return (
        <div className="flex flex-col items-center">
            {/* Node Card */}
            <div className="bg-[var(--vct-bg-elevated)] border border-[var(--vct-border-subtle)] hover:border-[var(--vct-accent-cyan)] transition-colors rounded-xl p-4 w-[280px] shadow-sm relative group cursor-pointer z-10">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-[var(--vct-border-strong)] flex items-center justify-center shrink-0 border-2 border-[var(--vct-bg-card)] shadow-inner">
                        <VCT_Icons.User className="text-[var(--vct-text-secondary)]" size={20} />
                    </div>
                    <div>
                        <div className="font-bold text-[var(--vct-text-primary)] text-sm">{node.name}</div>
                        <div className="text-[11px] font-semibold text-[var(--vct-accent-cyan)] mt-0.5">{node.title}</div>
                        <div className="text-[10px] text-[var(--vct-text-tertiary)] mt-1 flex items-center gap-1">
                            <VCT_Icons.Clock size={10} /> Thời kỳ: {node.era}
                        </div>
                    </div>
                </div>
            </div>

            {/* Children logic */}
            {hasChildren && (
                <div className="relative flex flex-col items-center mt-4">
                    {/* Vertical line down from parent */}
                    <div className="w-px h-6 bg-[var(--vct-border-strong)] absolute -top-4"></div>

                    {/* Horizontal connecting line */}
                    {node.children.length > 1 && (
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[calc(100%-280px)] h-px bg-[var(--vct-border-strong)]"></div>
                    )}

                    <div className="flex flex-row gap-8 pt-2">
                        {node.children.map((child: any) => (
                            <div key={child.id} className="relative flex flex-col items-center">
                                {/* Vertical line down to child */}
                                <div className="w-px h-6 bg-[var(--vct-border-strong)] absolute -top-8"></div>
                                <TreeNode node={child} />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}


// ════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════
export const Page_heritage = () => {
    const [search, setSearch] = useState('')

    return (
        <div className="mx-auto max-w-[1400px] p-4 pb-24">
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[var(--vct-text-primary)]">Di Sản & Gia Phả</h1>
                    <p className="text-sm text-[var(--vct-text-secondary)] mt-1">Lưu trữ truyền thống, hệ phái và tôn vinh các bậc tiền nhân.</p>
                </div>
                <VCT_Stack direction="row" gap={12}>
                    <VCT_Button icon={<VCT_Icons.Download size={16} />} variant="secondary">Xuất Gia Phả</VCT_Button>
                    <VCT_Button icon={<VCT_Icons.Plus size={16} />}>Thêm Cây Gia Phả</VCT_Button>
                </VCT_Stack>
            </div>

            {/* ── KPI ── */}
            <div className="vct-stagger mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <VCT_KpiCard label="Hệ Phái Đăng Ký" value={15} icon={<VCT_Icons.Network size={24} />} color="#0ea5e9" />
                <VCT_KpiCard label="Đại Võ Sư" value={45} icon={<VCT_Icons.Star size={24} />} color="#f59e0b" />
                <VCT_KpiCard label="Hồng Đai / Chuẩn Hồng Đai" value={320} icon={<VCT_Icons.Award size={24} />} color="#ef4444" />
                <VCT_KpiCard label="Di Sản Lưu Trữ" value="2.5k" icon={<VCT_Icons.Library size={24} />} color="#8b5cf6" />
            </div>

            {/* ── TOOLBAR ── */}
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4 bg-[var(--vct-bg-elevated)] p-4 rounded-xl border border-[var(--vct-border-subtle)]">
                <div className="flex gap-4 items-center">
                    <h2 className="font-bold text-lg text-[var(--vct-text-primary)]">Cây Phả Hệ Môn Phái</h2>
                    <div className="h-6 w-px bg-[var(--vct-border-strong)]"></div>
                    <VCT_Button variant="outline" size="sm" icon={<VCT_Icons.ZoomIn size={14} />}>Phóng to</VCT_Button>
                    <VCT_Button variant="outline" size="sm" icon={<VCT_Icons.ZoomOut size={14} />}>Thu nhỏ</VCT_Button>
                </div>
                <div className="w-full md:w-[300px]">
                    <VCT_SearchInput placeholder="Tìm kiếm võ sư, hệ phái..." value={search} onChange={setSearch} onClear={() => setSearch('')} />
                </div>
            </div>

            {/* ── TREE VIEWER ── */}
            <div className="bg-[var(--vct-bg-card)] border border-[var(--vct-border-strong)] rounded-2xl overflow-hidden p-8 min-h-[600px] flex items-start justify-center overflow-x-auto relative">
                {/* Background Grid Pattern */}
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(var(--vct-border-strong) 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.3 }}></div>

                <div className="pt-8">
                    <TreeNode node={TREE_DATA} />
                </div>
            </div>

        </div>
    )
}
