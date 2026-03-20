'use client'

import * as React from 'react'
import { useState, useMemo, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { VCT_Icons } from '../../components/vct-icons'
import { useAdminShortcuts } from '../hooks/useAdminShortcuts'

interface PaletteItem {
    id: string
    label: string
    icon: React.ReactNode
    path: string
    keywords?: string[]
}

const ADMIN_PAGES: PaletteItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <VCT_Icons.Dashboard size={16} />, path: '/admin', keywords: ['tổng quan', 'home'] },
    { id: 'users', label: 'Quản lý Users', icon: <VCT_Icons.Users size={16} />, path: '/admin/users', keywords: ['người dùng', 'tài khoản'] },
    { id: 'clubs', label: 'Quản lý CLB', icon: <VCT_Icons.Building size={16} />, path: '/admin/clubs', keywords: ['câu lạc bộ'] },
    { id: 'people', label: 'VĐV / HLV / Trọng tài', icon: <VCT_Icons.Award size={16} />, path: '/admin/people', keywords: ['athlete', 'coach', 'referee'] },
    { id: 'tournaments', label: 'Giải đấu', icon: <VCT_Icons.Trophy size={16} />, path: '/admin/tournaments', keywords: ['tournament', 'competition'] },
    { id: 'federation', label: 'Liên đoàn', icon: <VCT_Icons.Building size={16} />, path: '/admin/federation', keywords: ['organization'] },
    { id: 'tenants', label: 'Tenants', icon: <VCT_Icons.Globe size={16} />, path: '/admin/tenants', keywords: ['multi-tenant'] },
    { id: 'roles', label: 'Phân quyền', icon: <VCT_Icons.Shield size={16} />, path: '/admin/roles', keywords: ['RBAC', 'permission'] },
    { id: 'rankings', label: 'Bảng xếp hạng', icon: <VCT_Icons.BarChart size={16} />, path: '/admin/rankings', keywords: ['ELO', 'rating'] },
    { id: 'scoring', label: 'Chấm điểm', icon: <VCT_Icons.Activity size={16} />, path: '/admin/scoring', keywords: ['live', 'match'] },
    { id: 'finance', label: 'Tài chính', icon: <VCT_Icons.DollarSign size={16} />, path: '/admin/finance', keywords: ['money', 'billing'] },
    { id: 'support', label: 'Hỗ trợ', icon: <VCT_Icons.Mail size={16} />, path: '/admin/support', keywords: ['ticket', 'help'] },
    { id: 'feature-flags', label: 'Feature Flags', icon: <VCT_Icons.Layers size={16} />, path: '/admin/feature-flags', keywords: ['toggle', 'rollout'] },
    { id: 'system', label: 'Hệ thống', icon: <VCT_Icons.Settings size={16} />, path: '/admin/system', keywords: ['config', 'cấu hình'] },
    { id: 'reference-data', label: 'Dữ liệu tham chiếu', icon: <VCT_Icons.Database size={16} />, path: '/admin/reference-data', keywords: ['đai', 'hạng cân'] },
    { id: 'subscriptions', label: 'Gói dịch vụ', icon: <VCT_Icons.CreditCard size={16} />, path: '/admin/subscriptions', keywords: ['plan', 'subscription'] },
]

interface AdminCommandPaletteProps {
    open: boolean
    onClose: () => void
}

export function AdminCommandPalette({ open, onClose }: AdminCommandPaletteProps) {
    const router = useRouter()
    const [query, setQuery] = useState('')
    const inputRef = useRef<HTMLInputElement>(null)

    const filtered = useMemo(() => {
        if (!query) return ADMIN_PAGES
        const q = query.toLowerCase()
        return ADMIN_PAGES.filter(p =>
            p.label.toLowerCase().includes(q)
            || p.id.includes(q)
            || p.keywords?.some(k => k.includes(q))
        )
    }, [query])

    const [activeIndex, setActiveIndex] = useState(0)

    useEffect(() => { setActiveIndex(0) }, [query])
    useEffect(() => {
        if (open) {
            setQuery('')
            setTimeout(() => inputRef.current?.focus(), 50)
        }
    }, [open])

    useAdminShortcuts({
        onEscape: open ? onClose : undefined,
    })

    const navigate = (item: PaletteItem) => {
        onClose()
        router.push(item.path)
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActiveIndex(i => Math.min(i + 1, filtered.length - 1))
        } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActiveIndex(i => Math.max(i - 1, 0))
        } else if (e.key === 'Enter' && filtered[activeIndex]) {
            navigate(filtered[activeIndex]!)
        }
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z- flex items-start justify-center pt-[15vh]" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div
                className="relative w-full max-w-[560px] rounded-2xl border border-white/10 bg-[#0f172a]/95 shadow-2xl overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Search input */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
                    <VCT_Icons.Search size={18} className="text-white/40 shrink-0" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Tìm trang admin..."
                        className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-white/30"
                        autoComplete="off"
                    />
                    <kbd className="text-[10px] font-mono text-white/30 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">ESC</kbd>
                </div>

                {/* Results */}
                <div className="max-h-[50vh] overflow-y-auto py-2">
                    {filtered.length === 0 && (
                        <div className="px-4 py-6 text-center text-sm text-white/40">Không tìm thấy trang</div>
                    )}
                    {filtered.map((item, i) => (
                        <button
                            key={item.id}
                            onClick={() => navigate(item)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors cursor-pointer ${i === activeIndex
                                    ? 'bg-cyan-500/15 text-cyan-300'
                                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                                }`}
                        >
                            <span className="shrink-0 opacity-60">{item.icon}</span>
                            <span className="flex-1">{item.label}</span>
                            <span className="text-[10px] text-white/20 font-mono">{item.path}</span>
                        </button>
                    ))}
                </div>

                {/* Footer */}
                <div className="flex items-center gap-4 px-4 py-2 border-t border-white/10 text-[10px] text-white/30">
                    <span><kbd className="bg-white/5 border border-white/10 px-1 rounded">↑↓</kbd> điều hướng</span>
                    <span><kbd className="bg-white/5 border border-white/10 px-1 rounded">Enter</kbd> mở trang</span>
                    <span><kbd className="bg-white/5 border border-white/10 px-1 rounded">Esc</kbd> đóng</span>
                </div>
            </div>
        </div>
    )
}
