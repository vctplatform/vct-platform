'use client';
import * as React from 'react';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { VCT_Icons } from './vct-icons';

export interface CommandItem {
    id: string;
    label: string;
    icon?: React.ReactNode;
    shortcut?: string;
    section?: string;
    action?: () => void;
    href?: string;
}

const DEFAULT_COMMANDS: CommandItem[] = [
    // Navigation
    { id: 'nav-dashboard', label: 'Dashboard — Tổng quan', icon: <VCT_Icons.Dashboard size={18} />, section: 'Điều hướng', href: '/' },
    { id: 'nav-teams', label: 'Quản lý Đoàn / Đơn vị', icon: <VCT_Icons.Building2 size={18} />, section: 'Điều hướng', href: '/teams' },
    { id: 'nav-athletes', label: 'Quản lý Vận động viên', icon: <VCT_Icons.Users size={18} />, section: 'Điều hướng', href: '/athletes' },
    { id: 'nav-combat', label: 'Thi đấu Đối kháng', icon: <VCT_Icons.Swords size={18} />, section: 'Điều hướng', href: '/combat' },
    { id: 'nav-forms', label: 'Thi đấu Quyền / Biểu diễn', icon: <VCT_Icons.Star size={18} />, section: 'Điều hướng', href: '/forms' },
    { id: 'nav-draw', label: 'Bốc thăm đấu loại', icon: <VCT_Icons.Shuffle size={18} />, section: 'Điều hướng', href: '/boc-tham' },
    { id: 'nav-weigh', label: 'Cân ký — Weigh In', icon: <VCT_Icons.Scale size={18} />, section: 'Điều hướng', href: '/weigh-in' },
    { id: 'nav-medals', label: 'Bảng tổng sắp huy chương', icon: <VCT_Icons.Medal size={18} />, section: 'Điều hướng', href: '/medals' },
    { id: 'nav-referees', label: 'Quản lý Trọng tài', icon: <VCT_Icons.UserCheck size={18} />, section: 'Điều hướng', href: '/referees' },
    { id: 'nav-appeals', label: 'Khiếu nại — Appeals', icon: <VCT_Icons.AlertCircle size={18} />, section: 'Điều hướng', href: '/appeals' },
    { id: 'nav-arenas', label: 'Quản lý Sàn đấu', icon: <VCT_Icons.LayoutGrid size={18} />, section: 'Điều hướng', href: '/arenas' },
    { id: 'nav-config', label: 'Cấu hình giải đấu', icon: <VCT_Icons.Settings size={18} />, section: 'Điều hướng', href: '/giai-dau' },
    { id: 'nav-reports', label: 'Báo cáo — Reports', icon: <VCT_Icons.File size={18} />, section: 'Điều hướng', href: '/reports' },
    // Quick actions
    { id: 'act-schedule', label: 'Xem Lịch thi đấu', icon: <VCT_Icons.Calendar size={18} />, section: 'Thao tác nhanh', href: '/schedule' },
    { id: 'act-tv', label: 'Chế độ TV Dashboard', icon: <VCT_Icons.TV size={18} />, section: 'Thao tác nhanh', href: '/tv' },
];

export const VCT_CommandPalette = ({ extraCommands = [] }: { extraCommands?: CommandItem[] }) => {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [activeIdx, setActiveIdx] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const allCommands = useMemo(() => [...DEFAULT_COMMANDS, ...extraCommands], [extraCommands]);

    const filtered = useMemo(() => {
        if (!query.trim()) return allCommands;
        const q = query.toLowerCase();
        return allCommands.filter(c => c.label.toLowerCase().includes(q) || c.section?.toLowerCase().includes(q));
    }, [allCommands, query]);

    // Group by section
    const grouped = useMemo(() => {
        const map = new Map<string, CommandItem[]>();
        for (const item of filtered) {
            const section = item.section || 'Khác';
            if (!map.has(section)) map.set(section, []);
            map.get(section)!.push(item);
        }
        return map;
    }, [filtered]);

    // Hotkey: Ctrl+K or Cmd+K
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setOpen(prev => !prev);
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, []);

    // Focus input on open
    useEffect(() => {
        if (open) {
            setQuery('');
            setActiveIdx(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [open]);

    // Scroll active item into view
    useEffect(() => {
        const el = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`);
        el?.scrollIntoView({ block: 'nearest' });
    }, [activeIdx]);

    const executeItem = useCallback((item: CommandItem) => {
        setOpen(false);
        if (item.action) item.action();
        else if (item.href) router.push(item.href);
    }, [router]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(prev => Math.min(prev + 1, filtered.length - 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(prev => Math.max(prev - 1, 0)); }
        else if (e.key === 'Enter' && filtered[activeIdx]) { e.preventDefault(); executeItem(filtered[activeIdx]); }
        else if (e.key === 'Escape') { setOpen(false); }
    };

    let flatIdx = -1;

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z- bg-black/60 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    />
                    {/* Palette */}
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="fixed left-1/2 top-[15%] z- w-full max-w-[560px] -translate-x-1/2 overflow-hidden rounded-2xl border border-(--vct-border-strong) bg-(--vct-bg-card) shadow-2xl"
                    >
                        {/* Search bar */}
                        <div className="flex items-center gap-3 border-b border-(--vct-border-subtle) px-4 py-3">
                            <VCT_Icons.Search size={18} className="shrink-0 opacity-50" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={e => { setQuery(e.target.value); setActiveIdx(0); }}
                                onKeyDown={handleKeyDown}
                                placeholder="Tìm lệnh, trang, tính năng..."
                                className="w-full bg-transparent text-sm font-medium text-(--vct-text-primary) outline-none placeholder:text-(--vct-text-muted)"
                            />
                            <kbd className="shrink-0 rounded-md border border-(--vct-border-subtle) bg-(--vct-bg-elevated) px-2 py-0.5 text-[10px] font-bold text-(--vct-text-tertiary)">
                                ESC
                            </kbd>
                        </div>

                        {/* Results */}
                        <div ref={listRef} className="vct-hide-scrollbar max-h-[400px] overflow-y-auto py-2">
                            {filtered.length === 0 ? (
                                <div className="px-4 py-8 text-center text-sm font-semibold opacity-40">
                                    Không tìm thấy lệnh phù hợp
                                </div>
                            ) : (
                                Array.from(grouped.entries()).map(([section, items]) => (
                                    <div key={section}>
                                        <div className="px-4 pb-1 pt-3 text-[10px] font-bold uppercase tracking-wider opacity-40">
                                            {section}
                                        </div>
                                        {items.map(item => {
                                            flatIdx++;
                                            const idx = flatIdx;
                                            const isActive = idx === activeIdx;
                                            return (
                                                <button
                                                    key={item.id}
                                                    data-idx={idx}
                                                    onClick={() => executeItem(item)}
                                                    onMouseEnter={() => setActiveIdx(idx)}
                                                    className={`flex w-full items-center gap-3 border-none px-4 py-2.5 text-left font-inherit text-sm font-semibold transition-colors ${isActive ? 'bg-(--vct-accent-cyan)/10 text-(--vct-accent-cyan)' : 'bg-transparent text-(--vct-text-primary) hover:bg-(--vct-bg-elevated)'}`}
                                                >
                                                    <span className={`shrink-0 ${isActive ? 'opacity-100' : 'opacity-50'}`}>
                                                        {item.icon}
                                                    </span>
                                                    <span className="flex-1 truncate">{item.label}</span>
                                                    {item.shortcut && (
                                                        <kbd className="rounded border border-(--vct-border-subtle) bg-(--vct-bg-elevated) px-1.5 py-0.5 text-[10px] font-bold opacity-50">
                                                            {item.shortcut}
                                                        </kbd>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer hint */}
                        <div className="flex items-center gap-4 border-t border-(--vct-border-subtle) px-4 py-2 text-[10px] font-bold opacity-40">
                            <span>↑↓ Di chuyển</span>
                            <span>⏎ Chọn</span>
                            <span>ESC Đóng</span>
                            <span className="ml-auto">Ctrl+K mở nhanh</span>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
