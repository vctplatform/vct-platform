'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { VCT_Icons } from '../components/vct-icons'
import type { WorkspaceType } from './workspace-types'
import { WORKSPACE_META } from './workspace-types'
import type { WorkspaceAccess } from '../auth/types'
import { useI18n } from '../i18n'

interface WorkspaceSwitcherProps {
    workspaces: WorkspaceAccess[]
    currentType: WorkspaceType
    onSwitch: (ws: WorkspaceAccess) => void
    isCollapsed?: boolean
}

export const WorkspaceSwitcher = ({
    workspaces,
    currentType,
    onSwitch,
    isCollapsed = false,
}: WorkspaceSwitcherProps) => {
    const { t } = useI18n()
    const [isOpen, setIsOpen] = React.useState(false)
    const ref = React.useRef<HTMLDivElement>(null)

    const currentMeta = WORKSPACE_META[currentType]
    const iconMap = VCT_Icons as Record<string, React.ComponentType<any>>
    const CurrentIcon = iconMap[currentMeta.icon] ?? VCT_Icons.Activity

    // Close dropdown on outside click
    React.useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false)
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    if (workspaces.length <= 1) {
        // Only one workspace — show static label
        return (
            <div className="border-b border-vct-border px-4 py-3">
                <div className="flex items-center gap-2.5 rounded-xl border border-vct-border bg-vct-input px-3 py-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${currentMeta.color}25` }}>
                        <CurrentIcon size={14} color={currentMeta.color} />
                    </div>
                    {!isCollapsed && (
                        <div className="min-w-0 flex-1">
                            <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-vct-text-muted">Workspace</div>
                            <div className="mt-0.5 truncate text-xs font-bold text-vct-text">{t(currentMeta.label)}</div>
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <div ref={ref} className="relative border-b border-vct-border px-4 py-3">
            <button
                type="button"
                onClick={() => setIsOpen(p => !p)}
                className="flex w-full items-center gap-2.5 rounded-xl border border-vct-border bg-vct-input px-3 py-2 transition-colors hover:bg-[var(--vct-bg-elevated)]"
            >
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${currentMeta.color}25` }}>
                    <CurrentIcon size={14} color={currentMeta.color} />
                </div>
                {!isCollapsed && (
                    <>
                        <div className="min-w-0 flex-1 text-left">
                            <div className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-vct-text-muted">Workspace</div>
                            <div className="mt-0.5 truncate text-xs font-bold text-vct-text">{t(currentMeta.label)}</div>
                        </div>
                        <motion.span animate={{ rotate: isOpen ? 180 : 0 }} className="shrink-0 text-vct-text-muted">
                            <VCT_Icons.ChevronDown size={14} />
                        </motion.span>
                    </>
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-4 right-4 z-[100] mt-2 rounded-xl border border-vct-border bg-[var(--vct-bg-card)] p-2 shadow-2xl"
                    >
                        <div className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-vct-text-muted px-2 pt-1 pb-2">
                            Chọn Workspace
                        </div>
                        {workspaces.map(ws => {
                            const meta = WORKSPACE_META[ws.type]
                            if (!meta) return null
                            const WsIcon = iconMap[meta.icon] ?? VCT_Icons.Activity
                            const isCurrent = ws.type === currentType

                            return (
                                <button
                                    key={`${ws.type}-${ws.scopeId}`}
                                    type="button"
                                    onClick={() => {
                                        onSwitch(ws)
                                        setIsOpen(false)
                                    }}
                                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                                        isCurrent
                                            ? 'bg-vct-accent/10 text-vct-accent'
                                            : 'text-[var(--vct-text-secondary)] hover:bg-[var(--vct-bg-elevated)]'
                                    }`}
                                >
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${meta.color}20` }}>
                                        <WsIcon size={16} color={isCurrent ? 'var(--vct-accent)' : meta.color} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <div className="truncate text-sm font-semibold">{t(meta.label)}</div>
                                        <div className="truncate text-[11px] text-vct-text-muted">
                                            {ws.scopeName ? t(ws.scopeName) : ws.scopeId}
                                        </div>
                                    </div>
                                    {isCurrent && (
                                        <VCT_Icons.CheckCircle size={16} className="shrink-0 text-vct-accent" />
                                    )}
                                </button>
                            )
                        })}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
