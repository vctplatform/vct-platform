'use client'

import type { ReactNode, CSSProperties } from 'react'

/* ────────────────────────────────────────────
 *  VCT_Timeline
 *  Vertical event timeline for activity feeds,
 *  match event logs, and audit trails.
 * ──────────────────────────────────────────── */

export interface TimelineEvent {
    /** Timestamp or label (e.g. "14:30", "2 phút trước") */
    time: string
    /** Event title */
    title: string
    /** Optional detail text */
    description?: string
    /** Optional icon node */
    icon?: ReactNode
    /** Dot/line color override (CSS value) */
    color?: string
}

export interface VCT_TimelineProps {
    events: TimelineEvent[]
    /** Max height before scroll */
    maxHeight?: number | string
    className?: string
    style?: CSSProperties
}

export function VCT_Timeline({ events, maxHeight, className, style }: VCT_TimelineProps) {
    if (events.length === 0) return null

    return (
        <div
            className={`vct-hide-scrollbar ${className ?? ''}`}
            style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 0,
                maxHeight,
                overflowY: maxHeight ? 'auto' : undefined,
                ...style,
            }}
        >
            {events.map((evt, i) => (
                <div
                    key={`${evt.time}-${i}`}
                    style={{
                        display: 'flex',
                        gap: 12,
                        position: 'relative',
                        paddingBottom: i < events.length - 1 ? 20 : 0,
                    }}
                >
                    {/* Dot + line column */}
                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            flexShrink: 0,
                            width: 28,
                        }}
                    >
                        {/* Dot or custom icon */}
                        <span
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: evt.icon ? 28 : 10,
                                height: evt.icon ? 28 : 10,
                                borderRadius: '50%',
                                background: evt.icon
                                    ? (evt.color ?? 'var(--vct-accent-cyan)')
                                    : (evt.color ?? 'var(--vct-accent-cyan)'),
                                color: '#fff',
                                fontSize: 14,
                                flexShrink: 0,
                                marginTop: evt.icon ? 0 : 5,
                            }}
                        >
                            {evt.icon ?? null}
                        </span>
                        {/* Connecting line */}
                        {i < events.length - 1 && (
                            <span
                                style={{
                                    flex: 1,
                                    width: 2,
                                    minHeight: 12,
                                    background: 'var(--vct-border-subtle)',
                                    borderRadius: 1,
                                }}
                            />
                        )}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0, paddingTop: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                            <span
                                style={{
                                    fontSize: 'var(--vct-font-sm)',
                                    fontWeight: 600,
                                    color: 'var(--vct-text-primary)',
                                }}
                            >
                                {evt.title}
                            </span>
                            <span
                                style={{
                                    fontSize: 'var(--vct-font-xs)',
                                    color: 'var(--vct-text-tertiary)',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {evt.time}
                            </span>
                        </div>
                        {evt.description && (
                            <p
                                style={{
                                    margin: '2px 0 0',
                                    fontSize: 'var(--vct-font-xs)',
                                    lineHeight: 1.5,
                                    color: 'var(--vct-text-secondary)',
                                }}
                            >
                                {evt.description}
                            </p>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
