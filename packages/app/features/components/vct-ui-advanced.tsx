'use client';
import * as React from 'react';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VCT_Icons } from './vct-icons';
import { VCT_Button } from './vct-ui.legacy';

// ════════════════════════════════════════
// 🔧 HOOKS
// ════════════════════════════════════════

/** Hook to detect prefers-reduced-motion */
export function usePrefersReducedMotion(): boolean {
    const [prefersReduced, setPrefersReduced] = useState(false);
    useEffect(() => {
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        setPrefersReduced(mq.matches);
        const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
        mq.addEventListener('change', handler);
        return () => mq.removeEventListener('change', handler);
    }, []);
    return prefersReduced;
}

/** Hook for click outside detection */
function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
    useEffect(() => {
        const listener = (e: MouseEvent | TouchEvent) => {
            if (!ref.current || ref.current.contains(e.target as Node)) return;
            handler();
        };
        document.addEventListener('mousedown', listener);
        document.addEventListener('touchstart', listener);
        return () => {
            document.removeEventListener('mousedown', listener);
            document.removeEventListener('touchstart', listener);
        };
    }, [ref, handler]);
}

// ════════════════════════════════════════
// 1. TOOLTIP
// ════════════════════════════════════════

export interface VCTTooltipProps {
    content: React.ReactNode;
    children: React.ReactElement;
    position?: 'top' | 'bottom' | 'left' | 'right';
    delay?: number;
}

export const VCT_Tooltip = ({ content, children, position = 'top', delay = 300 }: VCTTooltipProps) => {
    const [visible, setVisible] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const triggerRef = useRef<HTMLDivElement>(null);

    const show = () => {
        timerRef.current = setTimeout(() => setVisible(true), delay);
    };
    const hide = () => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setVisible(false);
    };

    const positionStyles: Record<string, React.CSSProperties> = {
        top: { bottom: '100%', left: '50%', transform: 'translateX(-50%)', marginBottom: '8px' },
        bottom: { top: '100%', left: '50%', transform: 'translateX(-50%)', marginTop: '8px' },
        left: { right: '100%', top: '50%', transform: 'translateY(-50%)', marginRight: '8px' },
        right: { left: '100%', top: '50%', transform: 'translateY(-50%)', marginLeft: '8px' },
    };

    return (
        <div
            ref={triggerRef}
            onMouseEnter={show}
            onMouseLeave={hide}
            onFocus={show}
            onBlur={hide}
            style={{ position: 'relative', display: 'inline-flex' }}
        >
            {children}
            <AnimatePresence>
                {visible && (
                    <motion.div
                        role="tooltip"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        style={{
                            position: 'absolute',
                            ...positionStyles[position],
                            padding: '8px 14px',
                            borderRadius: '10px',
                            background: 'var(--vct-bg-elevated)',
                            border: '1px solid var(--vct-border-strong)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                            fontSize: '12px',
                            fontWeight: 600,
                            color: 'var(--vct-text-primary)',
                            whiteSpace: 'nowrap',
                            zIndex: 9999,
                            pointerEvents: 'none',
                        }}
                    >
                        {content}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ════════════════════════════════════════
// 2. DRAWER
// ════════════════════════════════════════

export interface VCTDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    children?: React.ReactNode;
    footer?: React.ReactNode;
    position?: 'left' | 'right';
    width?: string | number;
}

export const VCT_Drawer = ({ isOpen, onClose, title, children, footer, position = 'right', width = '420px' }: VCTDrawerProps) => {
    const drawerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', handleKey);
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', handleKey);
            document.body.style.overflow = prev;
        };
    }, [isOpen, onClose]);

    const slideFrom = position === 'right' ? { x: '100%' } : { x: '-100%' };

    return (
        <AnimatePresence>
            {isOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex' }}>
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        onClick={onClose}
                        aria-hidden="true"
                        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
                    />
                    <motion.aside
                        ref={drawerRef}
                        role="dialog"
                        aria-modal="true"
                        aria-label={typeof title === 'string' ? title : 'Panel'}
                        initial={slideFrom}
                        animate={{ x: 0 }}
                        exit={slideFrom}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        style={{
                            position: 'absolute',
                            top: 0,
                            bottom: 0,
                            [position]: 0,
                            width,
                            maxWidth: '90vw',
                            background: 'var(--vct-bg-elevated)',
                            borderLeft: position === 'right' ? '1px solid var(--vct-border-strong)' : 'none',
                            borderRight: position === 'left' ? '1px solid var(--vct-border-strong)' : 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            boxShadow: '0 0 40px rgba(0,0,0,0.3)',
                            zIndex: 1001,
                        }}
                    >
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderBottom: '1px solid var(--vct-border-subtle)', flexShrink: 0 }}>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 900, textTransform: 'uppercase' }}>{title}</h2>
                            <button type="button" aria-label="Đóng panel" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--vct-text-tertiary)', padding: '4px' }}>
                                <VCT_Icons.x size={22} />
                            </button>
                        </div>
                        {/* Body */}
                        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>{children}</div>
                        {/* Footer */}
                        {footer && (
                            <div style={{ padding: '20px 24px', borderTop: '1px solid var(--vct-border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '12px', flexShrink: 0 }}>
                                {footer}
                            </div>
                        )}
                    </motion.aside>
                </div>
            )}
        </AnimatePresence>
    );
};

// ════════════════════════════════════════
// 3. PAGINATION
// ════════════════════════════════════════

export interface VCTPaginationProps {
    current: number;
    total: number;
    pageSize: number;
    onChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    pageSizeOptions?: number[];
    showSizeChanger?: boolean;
    showTotal?: boolean;
}

export const VCT_Pagination = ({
    current,
    total,
    pageSize,
    onChange,
    onPageSizeChange,
    pageSizeOptions = [10, 20, 50, 100],
    showSizeChanger = true,
    showTotal = true,
}: VCTPaginationProps) => {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safeCurrentPage = Math.min(Math.max(1, current), totalPages);

    const getVisiblePages = (): (number | 'ellipsis')[] => {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
        const pages: (number | 'ellipsis')[] = [1];
        if (safeCurrentPage > 3) pages.push('ellipsis');
        const start = Math.max(2, safeCurrentPage - 1);
        const end = Math.min(totalPages - 1, safeCurrentPage + 1);
        for (let i = start; i <= end; i++) pages.push(i);
        if (safeCurrentPage < totalPages - 2) pages.push('ellipsis');
        if (totalPages > 1) pages.push(totalPages);
        return pages;
    };

    const btnStyle = (active: boolean): React.CSSProperties => ({
        minWidth: '36px',
        height: '36px',
        borderRadius: '10px',
        border: active ? '1.5px solid var(--vct-accent-cyan)' : '1px solid var(--vct-border-subtle)',
        background: active ? 'rgba(34, 211, 238, 0.1)' : 'var(--vct-bg-elevated)',
        color: active ? 'var(--vct-accent-cyan)' : 'var(--vct-text-primary)',
        fontWeight: active ? 800 : 600,
        fontSize: '13px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'inherit',
        transition: 'all 0.15s',
    });

    const from = (safeCurrentPage - 1) * pageSize + 1;
    const to = Math.min(safeCurrentPage * pageSize, total);

    return (
        <nav role="navigation" aria-label="Phân trang" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginTop: '20px' }}>
            {/* Left: total info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {showTotal && (
                    <span style={{ fontSize: '12px', color: 'var(--vct-text-tertiary)', fontWeight: 600 }}>
                        {from}–{to} / {total} mục
                    </span>
                )}
                {showSizeChanger && onPageSizeChange && (
                    <select
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(Number(e.target.value))}
                        aria-label="Số mục mỗi trang"
                        style={{
                            padding: '6px 10px', borderRadius: '8px', border: '1px solid var(--vct-border-subtle)',
                            background: 'var(--vct-bg-input)', color: 'var(--vct-text-primary)', fontSize: '12px',
                            cursor: 'pointer', fontFamily: 'inherit',
                        }}
                    >
                        {pageSizeOptions.map((s) => (
                            <option key={s} value={s}>{s} / trang</option>
                        ))}
                    </select>
                )}
            </div>

            {/* Right: page buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                    onClick={() => onChange(safeCurrentPage - 1)}
                    disabled={safeCurrentPage <= 1}
                    aria-label="Trang trước"
                    style={{ ...btnStyle(false), opacity: safeCurrentPage <= 1 ? 0.4 : 1, cursor: safeCurrentPage <= 1 ? 'not-allowed' : 'pointer' }}
                >
                    <VCT_Icons.ChevronLeft size={16} />
                </button>

                {getVisiblePages().map((page, i) =>
                    page === 'ellipsis' ? (
                        <span key={`e-${i}`} style={{ padding: '0 6px', color: 'var(--vct-text-tertiary)', fontSize: '14px' }}>…</span>
                    ) : (
                        <button
                            key={page}
                            onClick={() => onChange(page)}
                            aria-current={page === safeCurrentPage ? 'page' : undefined}
                            aria-label={`Trang ${page}`}
                            style={btnStyle(page === safeCurrentPage)}
                        >
                            {page}
                        </button>
                    )
                )}

                <button
                    onClick={() => onChange(safeCurrentPage + 1)}
                    disabled={safeCurrentPage >= totalPages}
                    aria-label="Trang sau"
                    style={{ ...btnStyle(false), opacity: safeCurrentPage >= totalPages ? 0.4 : 1, cursor: safeCurrentPage >= totalPages ? 'not-allowed' : 'pointer' }}
                >
                    <VCT_Icons.ChevronRight size={16} />
                </button>
            </div>
        </nav>
    );
};

// ════════════════════════════════════════
// 4. COMBOBOX (Searchable Select)
// ════════════════════════════════════════

export interface ComboboxOption {
    value: string;
    label: string;
    description?: string;
    disabled?: boolean;
}

export interface VCTComboboxProps {
    options: ComboboxOption[];
    value?: string | null;
    onChange: (value: string | null) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyMessage?: string;
    disabled?: boolean;
    clearable?: boolean;
    label?: React.ReactNode;
}

export const VCT_Combobox = ({
    options,
    value,
    onChange,
    placeholder = 'Chọn...',
    searchPlaceholder = 'Tìm kiếm...',
    emptyMessage = 'Không tìm thấy kết quả',
    disabled = false,
    clearable = true,
    label,
}: VCTComboboxProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [highlightIndex, setHighlightIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    useClickOutside(containerRef, () => setIsOpen(false));

    const filtered = useMemo(() => {
        const q = search.toLowerCase().trim();
        if (!q) return options;
        return options.filter(
            (o) => o.label.toLowerCase().includes(q) || (o.description?.toLowerCase().includes(q))
        );
    }, [options, search]);

    const selectedOption = options.find((o) => o.value === value);

    const handleSelect = (opt: ComboboxOption) => {
        if (opt.disabled) return;
        onChange(opt.value);
        setIsOpen(false);
        setSearch('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsOpen(true);
            }
            return;
        }
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightIndex((i) => Math.min(i + 1, filtered.length - 1));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightIndex((i) => Math.max(i - 1, 0));
                break;
            case 'Enter':
                e.preventDefault();
                if (filtered[highlightIndex]) handleSelect(filtered[highlightIndex]);
                break;
            case 'Escape':
                setIsOpen(false);
                setSearch('');
                break;
        }
    };

    useEffect(() => {
        if (isOpen && inputRef.current) inputRef.current.focus();
    }, [isOpen]);

    useEffect(() => {
        setHighlightIndex(0);
    }, [search]);

    // Scroll highlighted item into view
    useEffect(() => {
        if (!isOpen || !listRef.current) return;
        const item = listRef.current.children[highlightIndex] as HTMLElement;
        item?.scrollIntoView({ block: 'nearest' });
    }, [highlightIndex, isOpen]);

    const wrapper = (content: React.ReactNode) => label
        ? <div style={{ marginBottom: '16px' }}><label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--vct-text-secondary)', marginBottom: '6px' }}>{label}</label>{content}</div>
        : <>{content}</>;

    return wrapper(
        <div ref={containerRef} style={{ position: 'relative' }} onKeyDown={handleKeyDown}>
            {/* Trigger */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                style={{
                    width: '100%', padding: '12px 16px', borderRadius: '12px',
                    background: 'var(--vct-bg-input)', border: '1.5px solid var(--vct-border-subtle)',
                    color: selectedOption ? 'var(--vct-text-primary)' : 'var(--vct-text-tertiary)',
                    fontSize: '13px', fontWeight: 600, fontFamily: 'inherit',
                    cursor: disabled ? 'not-allowed' : 'pointer', textAlign: 'left',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    opacity: disabled ? 0.6 : 1, transition: 'all 0.15s',
                }}
            >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selectedOption?.label || placeholder}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                    {clearable && selectedOption && (
                        <span
                            onClick={(e) => { e.stopPropagation(); onChange(null); }}
                            style={{ cursor: 'pointer', opacity: 0.5, display: 'flex' }}
                            aria-label="Xóa lựa chọn"
                        >
                            <VCT_Icons.x size={14} />
                        </span>
                    )}
                    <VCT_Icons.Chevron size={16} style={{ opacity: 0.5, transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }} />
                </div>
            </button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.15 }}
                        style={{
                            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '6px',
                            background: 'var(--vct-bg-elevated)', border: '1px solid var(--vct-border-strong)',
                            borderRadius: '14px', boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
                            zIndex: 50, overflow: 'hidden',
                        }}
                    >
                        {/* Search input */}
                        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--vct-border-subtle)' }}>
                            <div style={{ position: 'relative' }}>
                                <VCT_Icons.Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                <input
                                    ref={inputRef}
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={searchPlaceholder}
                                    aria-label="Tìm kiếm lựa chọn"
                                    style={{
                                        width: '100%', padding: '8px 12px 8px 32px', borderRadius: '8px',
                                        background: 'var(--vct-bg-input)', border: '1px solid var(--vct-border-subtle)',
                                        color: 'var(--vct-text-primary)', fontSize: '12px', outline: 'none',
                                    }}
                                />
                            </div>
                        </div>

                        {/* Options list */}
                        <div ref={listRef} role="listbox" style={{ maxHeight: '240px', overflowY: 'auto', padding: '4px' }}>
                            {filtered.length === 0 ? (
                                <div style={{ padding: '16px', textAlign: 'center', fontSize: '12px', color: 'var(--vct-text-tertiary)' }}>
                                    {emptyMessage}
                                </div>
                            ) : (
                                filtered.map((opt, i) => (
                                    <div
                                        key={opt.value}
                                        role="option"
                                        aria-selected={opt.value === value}
                                        onClick={() => handleSelect(opt)}
                                        onMouseEnter={() => setHighlightIndex(i)}
                                        style={{
                                            padding: '10px 14px', borderRadius: '8px', cursor: opt.disabled ? 'not-allowed' : 'pointer',
                                            background: i === highlightIndex ? 'var(--vct-bg-input)' : 'transparent',
                                            opacity: opt.disabled ? 0.5 : 1, transition: 'background 0.1s',
                                            display: 'flex', alignItems: 'center', gap: '10px',
                                        }}
                                    >
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '13px', fontWeight: opt.value === value ? 700 : 500, color: opt.value === value ? 'var(--vct-accent-cyan)' : 'var(--vct-text-primary)' }}>
                                                {opt.label}
                                            </div>
                                            {opt.description && (
                                                <div style={{ fontSize: '11px', color: 'var(--vct-text-tertiary)', marginTop: '2px' }}>{opt.description}</div>
                                            )}
                                        </div>
                                        {opt.value === value && <VCT_Icons.Check size={16} color="var(--vct-accent-cyan)" />}
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ════════════════════════════════════════
// 5. DATEPICKER
// ════════════════════════════════════════

export interface VCTDatePickerProps {
    value?: string; // YYYY-MM-DD
    onChange: (date: string) => void;
    placeholder?: string;
    min?: string;
    max?: string;
    disabled?: boolean;
    label?: React.ReactNode;
}

export const VCT_DatePicker = ({ value, onChange, placeholder = 'Chọn ngày...', min, max, disabled, label }: VCTDatePickerProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(() => {
        if (value) return new Date(value + 'T00:00:00');
        return new Date();
    });
    const containerRef = useRef<HTMLDivElement>(null);

    useClickOutside(containerRef, () => setIsOpen(false));

    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0=Sun
    const weekDays = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const monthNames = ['Th.01', 'Th.02', 'Th.03', 'Th.04', 'Th.05', 'Th.06', 'Th.07', 'Th.08', 'Th.09', 'Th.10', 'Th.11', 'Th.12'];

    const isDisabled = (day: number) => {
        const d = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (min && d < min) return true;
        if (max && d > max) return true;
        return false;
    };

    const isSelected = (day: number) => {
        const d = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        return d === value;
    };

    const isToday = (day: number) => {
        const today = new Date();
        return year === today.getFullYear() && month === today.getMonth() && day === today.getDate();
    };

    const selectDay = (day: number) => {
        if (isDisabled(day)) return;
        const d = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        onChange(d);
        setIsOpen(false);
    };

    const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
    const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

    const displayValue = value
        ? (() => {
            const d = new Date(value + 'T00:00:00');
            return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
        })()
        : '';

    const content = (
        <div ref={containerRef} style={{ position: 'relative' }}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                style={{
                    width: '100%', padding: '12px 16px', borderRadius: '12px',
                    background: 'var(--vct-bg-input)', border: '1.5px solid var(--vct-border-subtle)',
                    color: displayValue ? 'var(--vct-text-primary)' : 'var(--vct-text-tertiary)',
                    fontSize: '13px', fontWeight: 600, fontFamily: 'inherit',
                    cursor: disabled ? 'not-allowed' : 'pointer', textAlign: 'left',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    opacity: disabled ? 0.6 : 1,
                }}
            >
                <span>{displayValue || placeholder}</span>
                <VCT_Icons.Calendar size={16} style={{ opacity: 0.5 }} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                        style={{
                            position: 'absolute', top: '100%', left: 0, marginTop: '6px',
                            background: 'var(--vct-bg-elevated)', border: '1px solid var(--vct-border-strong)',
                            borderRadius: '16px', boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
                            zIndex: 50, padding: '16px', width: '300px',
                        }}
                    >
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <button type="button" onClick={prevMonth} aria-label="Tháng trước" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--vct-text-primary)', padding: '4px' }}>
                                <VCT_Icons.ChevronLeft size={18} />
                            </button>
                            <span style={{ fontSize: '14px', fontWeight: 800 }}>{monthNames[month]} {year}</span>
                            <button type="button" onClick={nextMonth} aria-label="Tháng sau" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--vct-text-primary)', padding: '4px' }}>
                                <VCT_Icons.ChevronRight size={18} />
                            </button>
                        </div>

                        {/* Weekday headers */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '4px' }}>
                            {weekDays.map((d) => (
                                <div key={d} style={{ textAlign: 'center', fontSize: '10px', fontWeight: 700, color: 'var(--vct-text-tertiary)', padding: '6px 0', textTransform: 'uppercase' }}>{d}</div>
                            ))}
                        </div>

                        {/* Days grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                            {Array.from({ length: firstDayOfWeek }, (_, i) => (
                                <div key={`blank-${i}`} />
                            ))}
                            {Array.from({ length: daysInMonth }, (_, i) => {
                                const day = i + 1;
                                const sel = isSelected(day);
                                const dis = isDisabled(day);
                                const tod = isToday(day);
                                return (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => selectDay(day)}
                                        disabled={dis}
                                        style={{
                                            width: '36px', height: '36px', borderRadius: '10px',
                                            border: tod && !sel ? '1.5px solid var(--vct-accent-cyan)' : 'none',
                                            background: sel ? 'var(--vct-accent-cyan)' : 'transparent',
                                            color: sel ? '#000' : dis ? 'var(--vct-text-tertiary)' : 'var(--vct-text-primary)',
                                            fontWeight: sel || tod ? 800 : 500, fontSize: '13px',
                                            cursor: dis ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                                            opacity: dis ? 0.4 : 1, transition: 'all 0.1s',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}
                                    >
                                        {day}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    if (label) {
        return (
            <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--vct-text-secondary)', marginBottom: '6px' }}>{label}</label>
                {content}
            </div>
        );
    }
    return content;
};

// ════════════════════════════════════════
// 6. TIMEPICKER
// ════════════════════════════════════════

export interface VCTTimePickerProps {
    value?: string; // HH:mm
    onChange: (time: string) => void;
    placeholder?: string;
    min?: string;
    max?: string;
    step?: number; // minutes
    disabled?: boolean;
    label?: React.ReactNode;
}

export const VCT_TimePicker = ({
    value,
    onChange,
    placeholder = 'Chọn giờ...',
    min = '00:00',
    max = '23:59',
    step = 15,
    disabled,
    label,
}: VCTTimePickerProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const selectedRef = useRef<HTMLDivElement>(null);

    useClickOutside(containerRef, () => setIsOpen(false));

    const timeSlots = useMemo(() => {
        const slots: string[] = [];
        for (let h = 0; h < 24; h++) {
            for (let m = 0; m < 60; m += step) {
                const t = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                if (t >= min && t <= max) slots.push(t);
            }
        }
        return slots;
    }, [min, max, step]);

    useEffect(() => {
        if (isOpen && selectedRef.current) {
            selectedRef.current.scrollIntoView({ block: 'center' });
        }
    }, [isOpen]);

    const content = (
        <div ref={containerRef} style={{ position: 'relative' }}>
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                style={{
                    width: '100%', padding: '12px 16px', borderRadius: '12px',
                    background: 'var(--vct-bg-input)', border: '1.5px solid var(--vct-border-subtle)',
                    color: value ? 'var(--vct-text-primary)' : 'var(--vct-text-tertiary)',
                    fontSize: '13px', fontWeight: 600, fontFamily: 'inherit',
                    cursor: disabled ? 'not-allowed' : 'pointer', textAlign: 'left',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    opacity: disabled ? 0.6 : 1,
                }}
            >
                <span>{value || placeholder}</span>
                <VCT_Icons.Clock size={16} style={{ opacity: 0.5 }} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                        style={{
                            position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '6px',
                            background: 'var(--vct-bg-elevated)', border: '1px solid var(--vct-border-strong)',
                            borderRadius: '14px', boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
                            zIndex: 50, maxHeight: '240px', overflowY: 'auto', padding: '4px',
                        }}
                    >
                        {timeSlots.map((t) => {
                            const isSel = t === value;
                            return (
                                <div
                                    key={t}
                                    ref={isSel ? selectedRef : undefined}
                                    onClick={() => { onChange(t); setIsOpen(false); }}
                                    style={{
                                        padding: '10px 16px', borderRadius: '8px', cursor: 'pointer',
                                        background: isSel ? 'rgba(34, 211, 238, 0.1)' : 'transparent',
                                        color: isSel ? 'var(--vct-accent-cyan)' : 'var(--vct-text-primary)',
                                        fontWeight: isSel ? 700 : 500, fontSize: '13px',
                                        fontFamily: 'ui-monospace, monospace', transition: 'background 0.1s',
                                    }}
                                >
                                    {t}
                                </div>
                            );
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );

    if (label) {
        return (
            <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--vct-text-secondary)', marginBottom: '6px' }}>{label}</label>
                {content}
            </div>
        );
    }
    return content;
};

// ════════════════════════════════════════
// 7. CHECKBOX
// ════════════════════════════════════════

export interface VCTCheckboxProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label?: React.ReactNode;
    description?: React.ReactNode;
    disabled?: boolean;
    indeterminate?: boolean;
}

export const VCT_Checkbox = ({ checked, onChange, label, description, disabled = false, indeterminate = false }: VCTCheckboxProps) => {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.indeterminate = indeterminate;
        }
    }, [indeterminate]);

    return (
        <label style={{
            display: 'flex', alignItems: 'flex-start', gap: '12px',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            padding: '4px 0',
        }}>
            <div style={{ position: 'relative', flexShrink: 0, marginTop: '2px' }}>
                <input
                    ref={inputRef}
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => !disabled && onChange(e.target.checked)}
                    disabled={disabled}
                    style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                    aria-label={typeof label === 'string' ? label : undefined}
                />
                <motion.div
                    animate={{
                        background: checked || indeterminate ? 'var(--vct-accent-cyan)' : 'var(--vct-bg-input)',
                        borderColor: checked || indeterminate ? 'var(--vct-accent-cyan)' : 'var(--vct-border-strong)',
                    }}
                    transition={{ duration: 0.15 }}
                    style={{
                        width: '20px', height: '20px', borderRadius: '6px',
                        border: '2px solid var(--vct-border-strong)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                >
                    <AnimatePresence>
                        {(checked || indeterminate) && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                transition={{ duration: 0.15 }}
                            >
                                {indeterminate ? (
                                    <div style={{ width: '10px', height: '2px', background: '#000', borderRadius: '1px' }} />
                                ) : (
                                    <VCT_Icons.Check size={14} color="#000" strokeWidth={3} />
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
            {(label || description) && (
                <div>
                    {label && <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--vct-text-primary)' }}>{label}</div>}
                    {description && <div style={{ fontSize: '11px', color: 'var(--vct-text-tertiary)', marginTop: '2px' }}>{description}</div>}
                </div>
            )}
        </label>
    );
};

// ════════════════════════════════════════
// 8. RADIO GROUP
// ════════════════════════════════════════

export interface RadioOption {
    value: string;
    label: React.ReactNode;
    description?: React.ReactNode;
    disabled?: boolean;
}

export interface VCTRadioGroupProps {
    options: RadioOption[];
    value?: string;
    onChange: (value: string) => void;
    name?: string;
    direction?: 'horizontal' | 'vertical';
    disabled?: boolean;
    label?: React.ReactNode;
}

export const VCT_RadioGroup = ({
    options,
    value,
    onChange,
    name = 'vct-radio',
    direction = 'vertical',
    disabled = false,
    label,
}: VCTRadioGroupProps) => {
    return (
        <fieldset style={{ border: 'none', margin: 0, padding: 0, marginBottom: '16px' }}>
            {label && (
                <legend style={{ fontSize: '12px', fontWeight: 700, color: 'var(--vct-text-secondary)', marginBottom: '10px', padding: 0 }}>{label}</legend>
            )}
            <div style={{ display: 'flex', flexDirection: direction === 'horizontal' ? 'row' : 'column', gap: direction === 'horizontal' ? '20px' : '8px' }}>
                {options.map((opt) => {
                    const isSelected = opt.value === value;
                    const isDisabled = disabled || opt.disabled;
                    return (
                        <label
                            key={opt.value}
                            style={{
                                display: 'flex', alignItems: 'flex-start', gap: '12px',
                                cursor: isDisabled ? 'not-allowed' : 'pointer',
                                opacity: isDisabled ? 0.5 : 1, padding: '4px 0',
                            }}
                        >
                            <div style={{ position: 'relative', flexShrink: 0, marginTop: '2px' }}>
                                <input
                                    type="radio"
                                    name={name}
                                    value={opt.value}
                                    checked={isSelected}
                                    onChange={() => !isDisabled && onChange(opt.value)}
                                    disabled={isDisabled}
                                    style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                                />
                                <div style={{
                                    width: '20px', height: '20px', borderRadius: '50%',
                                    border: `2px solid ${isSelected ? 'var(--vct-accent-cyan)' : 'var(--vct-border-strong)'}`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'border-color 0.15s',
                                }}>
                                    <motion.div
                                        animate={{ scale: isSelected ? 1 : 0 }}
                                        transition={{ duration: 0.15 }}
                                        style={{
                                            width: '10px', height: '10px', borderRadius: '50%',
                                            background: 'var(--vct-accent-cyan)',
                                        }}
                                    />
                                </div>
                            </div>
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--vct-text-primary)' }}>{opt.label}</div>
                                {opt.description && <div style={{ fontSize: '11px', color: 'var(--vct-text-tertiary)', marginTop: '2px' }}>{opt.description}</div>}
                            </div>
                        </label>
                    );
                })}
            </div>
        </fieldset>
    );
};

// ════════════════════════════════════════
// 9. FILE UPLOAD
// ════════════════════════════════════════

export interface VCTFileUploadProps {
    onFiles: (files: File[]) => void;
    accept?: string;
    multiple?: boolean;
    maxSizeMB?: number;
    label?: React.ReactNode;
    description?: React.ReactNode;
    disabled?: boolean;
    children?: React.ReactNode;
}

export const VCT_FileUpload = ({
    onFiles,
    accept,
    multiple = false,
    maxSizeMB = 10,
    label,
    description,
    disabled = false,
}: VCTFileUploadProps) => {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    const validateAndSet = (files: FileList | File[]) => {
        setError(null);
        const arr = Array.from(files);
        const maxBytes = maxSizeMB * 1024 * 1024;
        const oversized = arr.find((f) => f.size > maxBytes);
        if (oversized) {
            setError(`File "${oversized.name}" vượt quá ${maxSizeMB}MB`);
            return;
        }
        setSelectedFiles(arr);
        onFiles(arr);
    };

    const handleDrag = (e: React.DragEvent, entering: boolean) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) setIsDragging(entering);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (disabled) return;
        if (e.dataTransfer.files.length) validateAndSet(e.dataTransfer.files);
    };

    const removeFile = (index: number) => {
        const updated = selectedFiles.filter((_, i) => i !== index);
        setSelectedFiles(updated);
        onFiles(updated);
    };

    const content = (
        <div>
            <div
                onDragEnter={(e) => handleDrag(e, true)}
                onDragOver={(e) => handleDrag(e, true)}
                onDragLeave={(e) => handleDrag(e, false)}
                onDrop={handleDrop}
                onClick={() => !disabled && inputRef.current?.click()}
                role="button"
                tabIndex={0}
                aria-label="Kéo thả hoặc nhấn để chọn file"
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.click(); } }}
                style={{
                    padding: '32px 24px', borderRadius: '16px',
                    border: `2px dashed ${isDragging ? 'var(--vct-accent-cyan)' : 'var(--vct-border-subtle)'}`,
                    background: isDragging ? 'rgba(34, 211, 238, 0.05)' : 'var(--vct-bg-input)',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    textAlign: 'center', transition: 'all 0.2s',
                    opacity: disabled ? 0.5 : 1,
                }}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    multiple={multiple}
                    onChange={(e) => e.target.files && validateAndSet(e.target.files)}
                    style={{ display: 'none' }}
                />
                <VCT_Icons.Upload size={28} style={{ marginBottom: '12px', opacity: 0.4, color: isDragging ? 'var(--vct-accent-cyan)' : 'var(--vct-text-tertiary)' }} />
                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--vct-text-primary)', marginBottom: '4px' }}>
                    Kéo thả file hoặc <span style={{ color: 'var(--vct-accent-cyan)', textDecoration: 'underline' }}>nhấn để chọn</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--vct-text-tertiary)' }}>
                    {description || `Tối đa ${maxSizeMB}MB${accept ? ` · ${accept}` : ''}`}
                </div>
            </div>

            {error && (
                <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '8px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <VCT_Icons.AlertCircle size={12} /> {error}
                </div>
            )}

            {/* Selected files list */}
            {selectedFiles.length > 0 && (
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {selectedFiles.map((file, i) => (
                        <div key={`${file.name}-${i}`} style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '8px 12px', borderRadius: '10px',
                            background: 'var(--vct-bg-input)', border: '1px solid var(--vct-border-subtle)',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                                <VCT_Icons.File size={14} style={{ opacity: 0.5, flexShrink: 0 }} />
                                <span style={{ fontSize: '12px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                                <span style={{ fontSize: '10px', color: 'var(--vct-text-tertiary)', flexShrink: 0 }}>
                                    {(file.size / 1024).toFixed(0)} KB
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                                aria-label={`Xóa file ${file.name}`}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--vct-text-tertiary)', padding: '2px' }}
                            >
                                <VCT_Icons.x size={14} />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    if (label) {
        return (
            <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--vct-text-secondary)', marginBottom: '6px' }}>{label}</label>
                {content}
            </div>
        );
    }
    return content;
};

// ════════════════════════════════════════
// 10. ALERT / BANNER
// ════════════════════════════════════════

export interface VCTAlertProps {
    type?: 'info' | 'success' | 'warning' | 'danger';
    title?: React.ReactNode;
    children?: React.ReactNode;
    closeable?: boolean;
    onClose?: () => void;
    icon?: React.ReactNode;
}

export const VCT_Alert = ({ type = 'info', title, children, closeable = false, onClose, icon }: VCTAlertProps) => {
    const configs = {
        info: { bg: 'rgba(34, 211, 238, 0.08)', border: 'rgba(34, 211, 238, 0.25)', color: '#22d3ee', defaultIcon: <VCT_Icons.Info size={18} /> },
        success: { bg: 'rgba(34, 197, 94, 0.08)', border: 'rgba(34, 197, 94, 0.25)', color: '#22c55e', defaultIcon: <VCT_Icons.CheckCircle size={18} /> },
        warning: { bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.25)', color: '#f59e0b', defaultIcon: <VCT_Icons.AlertTriangle size={18} /> },
        danger: { bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.25)', color: '#ef4444', defaultIcon: <VCT_Icons.AlertCircle size={18} /> },
    };
    const c = configs[type];

    return (
        <div
            role="alert"
            style={{
                padding: '14px 18px', borderRadius: '14px',
                background: c.bg, border: `1px solid ${c.border}`,
                display: 'flex', alignItems: 'flex-start', gap: '12px',
                marginBottom: '16px',
            }}
        >
            <div style={{ color: c.color, flexShrink: 0, marginTop: '1px' }}>{icon || c.defaultIcon}</div>
            <div style={{ flex: 1 }}>
                {title && <div style={{ fontSize: '13px', fontWeight: 700, color: c.color, marginBottom: children ? '4px' : 0 }}>{title}</div>}
                {children && <div style={{ fontSize: '12px', color: 'var(--vct-text-secondary)', lineHeight: 1.5 }}>{children}</div>}
            </div>
            {closeable && onClose && (
                <button type="button" onClick={onClose} aria-label="Đóng thông báo" style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.color, opacity: 0.6, padding: '2px' }}>
                    <VCT_Icons.x size={16} />
                </button>
            )}
        </div>
    );
};
