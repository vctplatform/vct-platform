'use client';
import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { VCT_Icons } from './vct-icons';

// ════════════════════════════════════════
// 🛠️ UTILITIES
// ════════════════════════════════════════
export const cn = (...classes: any[]) => classes.filter(Boolean).join(' ');

// ════════════════════════════════════════
// 1. PROVIDER & LAYOUT
// ════════════════════════════════════════

export const VCT_Provider = ({ children }: { children: React.ReactNode }) => (
    <div className="vct-app-root" style={{ background: 'var(--vct-bg-base)', minHeight: '100vh', color: 'var(--vct-text-primary)' }}>
        {children}
    </div>
);

export const VCT_Stack = ({ children, direction = 'column', gap = 16, align = 'stretch', justify = 'flex-start', style = {}, className = "" }: any) => (
    <div className={className} style={{ display: 'flex', flexDirection: direction, gap: `${gap}px`, alignItems: align, justifyContent: justify, ...style }}>
        {children}
    </div>
);

export const VCT_Divider = ({ label, vertical }: { label?: string; vertical?: boolean }) => {
    if (vertical) {
        return <div style={{ width: '1px', alignSelf: 'stretch', background: 'var(--vct-border-subtle)', opacity: 0.3 }} />;
    }
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '24px 0', opacity: 0.3 }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--vct-border-subtle)' }} />
            {label && <VCT_Text variant="small" style={{ whiteSpace: 'nowrap' }}>{label}</VCT_Text>}
            {label && <div style={{ flex: 1, height: '1px', background: 'var(--vct-border-subtle)' }} />}
        </div>
    );
};

// ════════════════════════════════════════
// 2. TYPOGRAPHY
// ════════════════════════════════════════

export const VCT_Text = ({ children, variant = 'body', className = "", style = {} }: any) => {
    const variants: any = {
        h1: { fontSize: '26px', fontWeight: 900, letterSpacing: '-0.02em' },
        h2: { fontSize: '18px', fontWeight: 700 },
        h3: { fontSize: '15px', fontWeight: 700 },
        body: { fontSize: '14px', opacity: 0.8, lineHeight: 1.5 },
        small: { fontSize: '12px', opacity: 0.6, fontWeight: 600, textTransform: 'uppercase' },
        mono: { fontFamily: 'ui-monospace, monospace', fontSize: '13px', letterSpacing: '-0.02em' }
    };
    return <div style={{ ...variants[variant], ...style }} className={className}>{children}</div>;
};

// ════════════════════════════════════════
// 3. CORE UI COMPONENTS
// ════════════════════════════════════════

export const VCT_Badge = ({ text, type = 'success', pulse = true, style = {} }: any) => {
    const configs: any = {
        success: { bg: 'rgba(34, 197, 94, 0.1)', border: 'rgba(34, 197, 94, 0.25)', color: '#22c55e' },
        warning: { bg: 'rgba(234, 179, 8, 0.1)', border: 'rgba(234, 179, 8, 0.25)', color: '#f59e0b' },
        danger: { bg: 'rgba(239, 68, 68, 0.1)', border: 'rgba(239, 68, 68, 0.25)', color: '#ef4444' },
        info: { bg: 'rgba(6, 182, 212, 0.1)', border: 'rgba(6, 182, 212, 0.25)', color: '#22d3ee' },
    };
    const c = configs[type] || configs.success;

    return (
        <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '6px 16px', borderRadius: '99px', background: c.bg,
            border: `1.5px solid ${c.border}`, boxShadow: `0 4px 12px ${c.bg}`,
            ...style
        }}>
            {pulse && (
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: c.color, boxShadow: `0 0 8px ${c.color}`, animation: 'vct-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }} />
            )}
            <span style={{ fontSize: '11px', fontWeight: 800, color: c.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{text}</span>
        </div>
    );
};

export const VCT_Button = ({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    icon,
    style = {},
    type = 'button',
    ...props
}: any) => {
    const isDisabled = loading || disabled;
    const sizeStyle = size === 'small'
        ? { padding: '6px 14px', fontSize: '12px', borderRadius: '10px' }
        : { padding: '10px 24px', fontSize: '14px', borderRadius: '14px' };
    const background =
        variant === 'primary'
            ? 'var(--vct-accent-gradient)'
            : variant === 'danger'
                ? '#ef4444'
                : variant === 'ghost'
                    ? 'transparent'
                    : 'var(--vct-bg-elevated)';
    const color = (variant === 'primary' || variant === 'danger')
        ? '#fff'
        : variant === 'ghost'
            ? 'var(--vct-text-secondary)'
            : 'var(--vct-text-primary)';
    const border = variant === 'secondary'
        ? '1px solid var(--vct-border-strong)'
        : variant === 'ghost'
            ? '1px solid transparent'
            : 'none';

    return (
        <motion.button
            type={type}
            disabled={isDisabled}
            aria-busy={loading || undefined}
            whileHover={isDisabled ? undefined : { scale: 1.02, y: -1 }}
            whileTap={isDisabled ? undefined : { scale: 0.98, y: 0 }}
            className={cn('vct-btn', `vct-btn-${variant}`, isDisabled && 'vct-disabled')}
            style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                fontWeight: 700,
                cursor: isDisabled ? 'not-allowed' : 'pointer',
                position: 'relative',
                overflow: 'hidden',
                opacity: isDisabled ? 0.6 : 1,
                background,
                color,
                border,
                boxShadow: variant === 'primary' ? '0 8px 20px -4px rgba(14, 165, 233, 0.4)' : '0 2px 4px rgba(0,0,0,0.05)',
                fontFamily: 'inherit',
                transition: 'all 0.2s ease',
                ...sizeStyle,
                ...style
            }}
            {...props}
        >
            {!isDisabled && (
                <motion.div
                    initial={{ x: '-100%', opacity: 0 }}
                    whileHover={{ x: '100%', opacity: 0.3 }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    style={{
                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                        pointerEvents: 'none'
                    }}
                />
            )}
            {loading ? <div className="vct-spinner" style={{ width: 16, height: 16 }} /> : <>{icon && <span style={{ opacity: 0.9 }}>{icon}</span>}{children}</>}
        </motion.button>
    );
};

export const VCT_Card = ({ children, title, headerAction, footer, className = "" }: any) => {
    const cardRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!cardRef.current) return;
        const rect = cardRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        cardRef.current.style.setProperty('--vct-mouse-x', `${x}%`);
        cardRef.current.style.setProperty('--vct-mouse-y', `${y}%`);
    };

    return (
        <div
            ref={cardRef} onMouseMove={handleMouseMove}
            className={cn('vct-card vct-glass', className)}
            style={{
                borderRadius: '20px', padding: '24px', border: '1px solid var(--vct-border-subtle)',
                background: 'var(--vct-bg-glass)', position: 'relative', overflow: 'hidden'
            }}
        >
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, background: `radial-gradient(600px circle at var(--vct-mouse-x, -20%) var(--vct-mouse-y, -20%), rgba(34, 211, 238, 0.06), transparent 40%)` }} />
            {(title || headerAction) && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', position: 'relative', zIndex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.03em', opacity: 0.9 }}>{title}</h3>
                    {headerAction}
                </div>
            )}
            <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
            {footer && <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--vct-border-subtle)', position: 'relative', zIndex: 1 }}>{footer}</div>}
        </div>
    );
};

// ════════════════════════════════════════
// 4. FORMS & INPUTS
// ════════════════════════════════════════

export const VCT_Field = ({ label, error, children, tip, style = {} }: any) => (
    <div style={{ marginBottom: '16px', ...style }}>
        {label && (
            <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700, color: 'var(--vct-text-secondary)', marginBottom: '6px' }}>
                {label} {tip && <span title={tip} style={{ cursor: 'help', opacity: 0.4 }}>ⓘ</span>}
            </label>
        )}
        {children}
        {error && <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px', fontWeight: 600 }}>{error}</div>}
    </div>
);

export const VCT_Input = ({ style = {}, className = "", ...props }: any) => (
    <input
        {...props}
        className={cn('vct-input', className)}
        style={{
            width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'var(--vct-bg-input)',
            border: `1.5px solid var(--vct-border-subtle)`, color: 'var(--vct-text-primary)', outline: 'none', transition: 'all 0.2s', fontSize: '13px',
            ...style
        }}
    />
);

export const VCT_SearchInput = ({ value, onChange, onClear, placeholder, loading }: any) => (
    <div style={{ position: 'relative', width: '100%' }}>
        <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }}>
            <VCT_Icons.Search size={18} />
        </div>
        <input
            value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
            style={{ width: '100%', padding: '12px 44px', borderRadius: '14px', background: 'var(--vct-bg-input)', border: '1.5px solid var(--vct-border-subtle)', color: 'var(--vct-text-primary)', outline: 'none', fontSize: '13px' }}
        />
        <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '8px' }}>
            {loading && <div className="vct-spinner" style={{ width: 14, height: 14 }} />}
            {value && !loading && (
                <button type="button" aria-label="Xóa từ khóa tìm kiếm" onClick={onClear} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, color: 'inherit' }}>
                    <VCT_Icons.x size={16} />
                </button>
            )}
        </div>
    </div>
);

export const VCT_Select = ({ options, value, onChange, label, disabled, style = {} }: any) => {
    const SelectContent = (
        <div style={{ position: 'relative', width: '100%', ...style }}>
            <select
                disabled={disabled}
                value={value} onChange={(e) => onChange(e.target.value)}
                style={{
                    width: '100%', padding: '12px 16px', borderRadius: '12px', background: 'var(--vct-bg-input)',
                    border: '1.5px solid var(--vct-border-subtle)', color: 'var(--vct-text-primary)',
                    appearance: 'none', cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '13px',
                    opacity: disabled ? 0.6 : 1
                }}
            >
                {options.map((opt: any) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
            <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', opacity: 0.5 }}>
                <VCT_Icons.Chevron size={16} />
            </div>
        </div>
    );

    if (label) {
        return <VCT_Field label={label} style={style}>{SelectContent}</VCT_Field>;
    }
    return SelectContent;
};

export const VCT_Switch = ({ isOn, onToggle, label }: any) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
            type="button"
            aria-pressed={isOn}
            aria-label={label || 'Chuyển trạng thái'}
            onClick={() => onToggle(!isOn)}
            style={{ width: '44px', height: '24px', borderRadius: '12px', background: isOn ? 'var(--vct-accent-cyan)' : 'var(--vct-bg-input)', padding: '2px', cursor: 'pointer', transition: '0.3s ease', border: '1px solid var(--vct-border-subtle)', position: 'relative' }}
        >
            <motion.div animate={{ x: isOn ? 20 : 0 }} style={{ width: '18px', height: '18px', borderRadius: '50%', background: isOn ? '#000' : 'var(--vct-text-tertiary)', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
        </button>
        {label && <VCT_Text variant="body" style={{ fontWeight: 600 }}>{label}</VCT_Text>}
    </div>
);

// ════════════════════════════════════════
// 5. INTERACTIVE CONTROLS
// ════════════════════════════════════════

export const VCT_SegmentedControl = ({ options, value, onChange }: any) => (
    <div style={{ display: 'flex', background: 'var(--vct-bg-input)', padding: '4px', borderRadius: '14px', border: '1px solid var(--vct-border-subtle)' }}>
        {options.map((opt: any) => {
            const isActive = value === opt.value;
            return (
                <button key={opt.value} onClick={() => onChange(opt.value)} style={{ flex: 1, padding: '8px 16px', border: 'none', borderRadius: '10px', background: isActive ? 'var(--vct-bg-card)' : 'transparent', color: isActive ? 'var(--vct-accent-cyan)' : 'var(--vct-text-tertiary)', fontWeight: 700, fontSize: '13px', cursor: 'pointer', transition: '0.2s', boxShadow: isActive ? '0 2px 8px rgba(0,0,0,0.1)' : 'none' }}>
                    {opt.label}
                </button>
            );
        })}
    </div>
);

export const VCT_Stepper = ({ steps, currentStep }: any) => (
    <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: '12px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
        {steps.map((step: any, i: number) => {
            const isCompleted = i < currentStep;
            const isActive = i === currentStep;
            return (
                <React.Fragment key={i}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                        <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: isActive ? 'var(--vct-accent-cyan)' : isCompleted ? 'rgba(34, 197, 94, 0.2)' : 'var(--vct-bg-input)', color: isActive ? '#000' : isCompleted ? '#22c55e' : 'var(--vct-text-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800 }}>
                            {isCompleted ? '✓' : i + 1}
                        </div>
                        <VCT_Text variant="small" style={{ color: isActive ? 'var(--vct-text-primary)' : 'var(--vct-text-tertiary)' }}>{step}</VCT_Text>
                    </div>
                    {i < steps.length - 1 && <div style={{ flex: 1, minWidth: '20px', height: '1px', background: 'var(--vct-border-subtle)' }} />}
                </React.Fragment>
            );
        })}
    </div>
);

export const VCT_ScorePad = ({ onAdd, onSub, label, color = 'var(--vct-accent-cyan)' }: any) => (
    <div style={{ background: 'var(--vct-bg-glass-heavy)', padding: '16px', borderRadius: '20px', border: `1px solid ${color}33`, width: '140px', flexShrink: 0 }}>
        <VCT_Text variant="small" style={{ textAlign: 'center', marginBottom: '12px', color }}>{label}</VCT_Text>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <motion.button whileTap={{ scale: 0.9 }} onClick={onAdd} style={{ height: '60px', borderRadius: '12px', border: 'none', background: color, color: '#000', fontSize: '24px', fontWeight: 900, cursor: 'pointer' }}>+</motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={onSub} style={{ height: '44px', borderRadius: '12px', border: `1px solid ${color}44`, background: 'transparent', color: color, fontSize: '18px', fontWeight: 700, cursor: 'pointer' }}>-</motion.button>
        </div>
    </div>
);

// ════════════════════════════════════════
// 6. DATA DISPLAY
// ════════════════════════════════════════

export const VCT_KpiCard = ({ label, value, sub, color = '#22d3ee', icon, style = {} }: any) => (
    <motion.div
        whileHover={{ y: -4, boxShadow: `0 12px 24px -10px ${color}66`, borderColor: `${color}55` }}
        transition={{ duration: 0.2 }}
        className="vct-glass"
        style={{
            ...style, minWidth: '180px', padding: '24px', borderRadius: '24px',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
            border: '1px solid var(--vct-border-subtle)', position: 'relative', overflow: 'hidden'
        }}
    >
        <div style={{ position: 'absolute', top: 0, right: 0, width: '100px', height: '100px', background: `radial-gradient(circle, ${color}15 0%, transparent 70%)`, transform: 'translate(30%, -30%)' }} />
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px', position: 'relative', zIndex: 1 }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: `${color}15`, border: `1px solid ${color}33`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color, boxShadow: `inset 0 2px 10px ${color}11` }}>
                {icon}
            </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--vct-text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                <div style={{ fontSize: '32px', fontWeight: 900, lineHeight: 1, color: 'var(--vct-text-primary)' }}>{value}</div>
                {sub && <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--vct-text-tertiary)' }}>{sub}</div>}
            </div>
        </div>
    </motion.div>
);

export const VCT_Table = ({ columns, data, onRowClick }: any) => (
    <div style={{ width: '100%', overflowX: 'auto', borderRadius: '16px', border: '1px solid var(--vct-border-subtle)', background: 'var(--vct-bg-glass)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
                <tr style={{ borderBottom: '1px solid var(--vct-border-strong)', background: 'var(--vct-bg-card)' }}>
                    {columns.map((col: any, i: number) => (
                        <th key={col.key || i} style={{ padding: '14px 16px', textAlign: col.align || 'left', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', opacity: 0.5 }}>{col.label}</th>
                    ))}
                </tr>
            </thead>
            <tbody>
                {data.length === 0 ? (
                    <tr><td colSpan={columns.length} style={{ padding: '32px', textAlign: 'center', opacity: 0.5 }}>Không có dữ liệu</td></tr>
                ) : (
                    data.map((row: any, idx: number) => (
                        <tr key={row.id || idx} onClick={() => onRowClick?.(row)} style={{ borderBottom: '1px solid var(--vct-border-subtle)', cursor: onRowClick ? 'pointer' : 'default', background: idx % 2 === 0 ? 'transparent' : 'rgba(128,128,128,0.02)' }}>
                            {columns.map((col: any, i: number) => (
                                <td key={col.key || i} style={{ padding: '14px 16px', fontSize: '13px', textAlign: col.align || 'left' }}>
                                    {col.render ? col.render(row, idx) : row[col.key]}
                                </td>
                            ))}
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    </div>
);

export const VCT_AvatarGroup = ({ users, size = 32 }: any) => (
    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
        {users.slice(0, 4).map((user: any, i: number) => (
            <div key={i} style={{ marginLeft: i === 0 ? 0 : -12, border: '2px solid var(--vct-bg-base)', borderRadius: '50%', overflow: 'hidden' }}>
                <div style={{ width: size, height: size, background: 'var(--vct-accent-cyan)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.4, fontWeight: 800 }}>
                    {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                </div>
            </div>
        ))}
        {users.length > 4 && (
            <div style={{ marginLeft: -12, width: size, height: size, borderRadius: '50%', background: 'var(--vct-bg-glass-heavy)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', border: '1px solid var(--vct-border-subtle)' }}>
                +{users.length - 4}
            </div>
        )}
    </div>
);

// ════════════════════════════════════════
// 7. FEEDBACK & OVERLAYS
// ════════════════════════════════════════

export const VCT_LoadingOverlay = ({ open, title, desc }: any) => (
    <AnimatePresence>
        {open && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)' }}>
                <motion.div initial={{ scale: 0.9, y: 10 }} animate={{ scale: 1, y: 0 }} style={{ background: 'var(--vct-bg-elevated)', padding: '24px 32px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px solid var(--vct-border-strong)' }}>
                    <div className="vct-spinner" style={{ width: 24, height: 24 }} />
                    <div>
                        <div style={{ fontWeight: 800, fontSize: '15px' }}>{title || "Đang xử lý..."}</div>
                        <div style={{ fontSize: '12px', opacity: 0.5, marginTop: '4px' }}>{desc || "Vui lòng chờ trong giây lát"}</div>
                    </div>
                </motion.div>
            </motion.div>
        )}
    </AnimatePresence>
);

export const VCT_Modal = ({ isOpen, onClose, title, children, footer, width = '600px' }: any) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!isOpen) return;

        // Save currently focused element to restore later
        previousActiveElement.current = document.activeElement as HTMLElement;

        // Focus the modal container
        const timer = setTimeout(() => {
            if (modalRef.current) {
                const firstFocusable = modalRef.current.querySelector<HTMLElement>(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                firstFocusable?.focus();
            }
        }, 50);

        // Escape key handler
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                onClose();
                return;
            }

            // Focus trap: Tab key cycles within modal
            if (e.key === 'Tab' && modalRef.current) {
                const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
                    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
                );
                if (focusableElements.length === 0) return;

                const first = focusableElements[0];
                const last = focusableElements[focusableElements.length - 1];

                if (e.shiftKey) {
                    if (document.activeElement === first) {
                        e.preventDefault();
                        last.focus();
                    }
                } else {
                    if (document.activeElement === last) {
                        e.preventDefault();
                        first.focus();
                    }
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        // Prevent body scroll
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            clearTimeout(timer);
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = originalOverflow;
            // Restore focus to the previously focused element
            previousActiveElement.current?.focus();
        };
    }, [isOpen, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} aria-hidden="true" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
                    <motion.div
                        ref={modalRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby={typeof title === 'string' ? 'vct-modal-title' : undefined}
                        aria-label={typeof title !== 'string' ? 'Modal' : undefined}
                        initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
                        style={{ width, maxWidth: '90vw', maxHeight: '85vh', display: 'flex', flexDirection: 'column', background: 'var(--vct-bg-elevated)', borderRadius: '24px', border: '1px solid var(--vct-border-strong)', padding: '32px', position: 'relative', zIndex: 1001, boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexShrink: 0 }}>
                            <h2 id="vct-modal-title" style={{ margin: 0, fontSize: '20px', fontWeight: 900, textTransform: 'uppercase' }}>{title}</h2>
                            <button type="button" aria-label="Đóng hộp thoại" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--vct-text-tertiary)' }}><VCT_Icons.x size={24} /></button>
                        </div>
                        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '4px' }}>{children}</div>
                        {footer && <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--vct-border-subtle)', display: 'flex', justifyContent: 'flex-end', gap: '12px', flexShrink: 0 }}>{footer}</div>}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export const VCT_Toast = ({ message, type = 'success', isVisible, onClose }: any) => (
    <AnimatePresence>
        {isVisible && (
            <motion.div role="status" aria-live="polite" initial={{ opacity: 0, y: 50, x: '-50%' }} animate={{ opacity: 1, y: 0, x: '-50%' }} exit={{ opacity: 0, scale: 0.9, x: '-50%' }} style={{ position: 'fixed', bottom: '32px', left: '50%', zIndex: 2000, padding: '12px 24px', borderRadius: '16px', background: 'var(--vct-bg-glass-heavy)', border: '1px solid var(--vct-border-strong)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)', color: 'var(--vct-text-primary)' }}>
                <VCT_Icons.Check color={type === 'success' ? '#22c55e' : '#ef4444'} size={20} />
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{message}</span>
            </motion.div>
        )}
    </AnimatePresence>
);

export const VCT_Skeleton = ({ width = '100%', height = '20px', borderRadius = '8px' }: any) => (
    <div style={{ width, height, borderRadius, background: 'linear-gradient(90deg, var(--vct-border-subtle) 25%, var(--vct-bg-input) 50%, var(--vct-border-subtle) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite linear' }} />
);

export const VCT_EmptyState = ({ title, description, actionLabel, onAction, icon }: any) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 24px', textAlign: 'center', background: 'var(--vct-bg-card)', borderRadius: '16px', border: '1px dashed var(--vct-border-subtle)' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.3 }}>{icon || '🥋'}</div>
        <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>{title}</div>
        <div style={{ fontSize: '13px', opacity: 0.5, maxWidth: '300px', marginBottom: '24px' }}>{description}</div>
        {onAction && <VCT_Button onClick={onAction} variant="primary" icon={<VCT_Icons.Plus size={16} />}>{actionLabel}</VCT_Button>}
    </div>
);

// ════════════════════════════════════════
// 8. ADVANCED CRUD COMPONENTS
// ════════════════════════════════════════

// --- Confirm Dialog ---
export const VCT_ConfirmDialog = ({ isOpen, onClose, onConfirm, title = 'Xác nhận', message, confirmLabel = 'Xác nhận', confirmVariant = 'danger', loading = false, preview }: any) => (
    <VCT_Modal isOpen={isOpen} onClose={onClose} title={title} width="480px" footer={
        <>
            <VCT_Button variant="secondary" onClick={onClose}>Hủy</VCT_Button>
            <VCT_Button variant={confirmVariant} onClick={onConfirm} loading={loading}>{confirmLabel}</VCT_Button>
        </>
    }>
        {preview && <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'var(--vct-bg-input)', marginBottom: '16px', fontSize: '13px', fontWeight: 600 }}>{preview}</div>}
        <div style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--vct-text-secondary)' }}>{message}</div>
    </VCT_Modal>
);

// --- Filter Chips ---
export const VCT_FilterChips = ({ filters, onRemove, onClearAll }: { filters: Array<{ key: string; label: string; value: string }>; onRemove: (key: string) => void; onClearAll: () => void }) => {
    if (!filters || filters.length === 0) return null;
    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginBottom: '16px' }}>
            {filters.map(f => (
                <motion.div key={f.key} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 12px', borderRadius: '99px', background: 'rgba(34, 211, 238, 0.1)', border: '1px solid rgba(34, 211, 238, 0.2)', fontSize: '12px', fontWeight: 600, color: 'var(--vct-accent-cyan)' }}>
                    <span style={{ opacity: 0.6 }}>{f.label}:</span> <span>{f.value}</span>
                    <button onClick={() => onRemove(f.key)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, display: 'flex' }}><VCT_Icons.x size={12} /></button>
                </motion.div>
            ))}
            <button onClick={onClearAll} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 700, color: 'var(--vct-text-tertiary)', textDecoration: 'underline' }}>Xóa tất cả</button>
        </div>
    );
};

// --- Status Pipeline ---
export const VCT_StatusPipeline = ({ stages, activeStage, onStageClick }: { stages: Array<{ key: string; label: string; count: number; color: string }>; activeStage: string | null; onStageClick: (key: string | null) => void }) => (
    <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
        <button onClick={() => onStageClick(null)} style={{
            padding: '8px 16px', borderRadius: '10px', border: activeStage === null ? '2px solid var(--vct-accent-cyan)' : '1px solid var(--vct-border-subtle)',
            background: activeStage === null ? 'rgba(34, 211, 238, 0.08)' : 'var(--vct-bg-elevated)', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: 'var(--vct-text-primary)', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', transition: 'all 0.2s',
        }}>
            Tất cả <span style={{ padding: '2px 8px', borderRadius: '99px', background: 'var(--vct-bg-input)', fontSize: '11px', fontWeight: 800 }}>{stages.reduce((s, st) => s + st.count, 0)}</span>
        </button>
        {stages.map(s => (
            <button key={s.key} onClick={() => onStageClick(s.key === activeStage ? null : s.key)} style={{
                padding: '8px 16px', borderRadius: '10px', border: activeStage === s.key ? `2px solid ${s.color}` : '1px solid var(--vct-border-subtle)',
                background: activeStage === s.key ? `${s.color}15` : 'var(--vct-bg-elevated)', cursor: 'pointer', fontSize: '12px', fontWeight: 700, color: 'var(--vct-text-primary)', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap', transition: 'all 0.2s',
            }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                {s.label} <span style={{ padding: '2px 8px', borderRadius: '99px', background: `${s.color}20`, fontSize: '11px', fontWeight: 800, color: s.color }}>{s.count}</span>
            </button>
        ))}
    </div>
);

// --- Bulk Actions Bar ---
export const VCT_BulkActionsBar = ({ count, actions, onClearSelection }: { count: number; actions: Array<{ label: string; icon?: React.ReactNode; onClick: () => void; variant?: string }>; onClearSelection: () => void }) => {
    if (count === 0) return null;
    return (
        <motion.div initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 900, display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 24px', borderRadius: '16px', background: 'var(--vct-bg-elevated)', border: '1px solid var(--vct-border-strong)', boxShadow: '0 12px 40px rgba(0,0,0,0.3)', backdropFilter: 'blur(20px)' }}>
            <span style={{ fontSize: '13px', fontWeight: 700 }}>Đã chọn <span style={{ color: 'var(--vct-accent-cyan)', fontWeight: 900 }}>{count}</span></span>
            <div style={{ width: 1, height: 20, background: 'var(--vct-border-subtle)' }} />
            {actions.map((a, i) => <VCT_Button key={i} variant={a.variant || 'secondary'} icon={a.icon} onClick={a.onClick} style={{ padding: '6px 14px', fontSize: '12px' }}>{a.label}</VCT_Button>)}
            <button onClick={onClearSelection} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--vct-text-tertiary)', fontSize: '12px', fontWeight: 600 }}>Bỏ chọn</button>
        </motion.div>
    );
};

// --- Progress Bar ---
export const VCT_ProgressBar = ({ value, max, color = 'var(--vct-accent-cyan)', height = 5, showLabel = false }: any) => {
    const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
    return (
        <div style={{ width: '100%' }}>
            <div style={{ width: '100%', height, borderRadius: height, background: 'var(--vct-bg-input)', overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.5, ease: 'easeOut' }}
                    style={{ height: '100%', borderRadius: height, background: pct >= 100 ? '#10b981' : pct >= 70 ? color : pct >= 30 ? '#f59e0b' : '#ef4444' }} />
            </div>
            {showLabel && <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '11px', fontWeight: 600, opacity: 0.6 }}><span>{value}/{max}</span><span>{Math.round(pct)}%</span></div>}
        </div>
    );
};

// --- Tabs ---
export const VCT_Tabs = ({ tabs, activeTab, onChange }: { tabs: Array<{ key: string; label: string; icon?: React.ReactNode; count?: number }>; activeTab: string; onChange: (key: string) => void }) => (
    <div style={{ display: 'flex', gap: '4px', borderBottom: '2px solid var(--vct-border-subtle)', marginBottom: '24px' }}>
        {tabs.map(t => (
            <button key={t.key} onClick={() => onChange(t.key)} style={{
                padding: '12px 20px', border: 'none', borderBottom: activeTab === t.key ? '2px solid var(--vct-accent-cyan)' : '2px solid transparent',
                background: 'transparent', cursor: 'pointer', fontSize: '13px', fontWeight: activeTab === t.key ? 800 : 600,
                color: activeTab === t.key ? 'var(--vct-accent-cyan)' : 'var(--vct-text-tertiary)', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', marginBottom: '-2px',
            }}>
                {t.icon}{t.label}
                {t.count !== undefined && <span style={{ padding: '1px 7px', borderRadius: '99px', background: activeTab === t.key ? 'rgba(34, 211, 238, 0.15)' : 'var(--vct-bg-input)', fontSize: '11px', fontWeight: 800 }}>{t.count}</span>}
            </button>
        ))}
    </div>
);

// --- Avatar Letter ---
export const VCT_AvatarLetter = ({ name, size = 36, color, style: extraStyle = {} }: any) => {
    const initials = (name || '??').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
    const hue = name ? name.split('').reduce((a: number, c: string) => a + c.charCodeAt(0), 0) % 360 : 0;
    const background = color || `hsl(${hue}, 60%, 55%)`;
    return (
        <div style={{ width: size, height: size, borderRadius: '10px', background, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: size * 0.38, flexShrink: 0, ...extraStyle }}>
            {initials}
        </div>
    );
};
