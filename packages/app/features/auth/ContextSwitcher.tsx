import { useState, useEffect, useCallback } from 'react'

// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — CONTEXT SWITCHER COMPONENT
// Allows users with multiple roles to switch active context
// without logging out. Calls /api/v1/auth/switch-context.
// ═══════════════════════════════════════════════════════════════

interface RoleBinding {
    id: string
    user_id: string
    role: string
    scope_type: string
    scope_id: string
    scope_name: string
    granted_at: string
    expires_at?: string
    is_active: boolean
}

interface ContextSwitcherProps {
    /** Current active role code */
    currentRole: string
    /** API base URL */
    apiBase?: string
    /** Called after successful context switch with new tokens */
    onContextSwitch?: (result: { token: string; activeContext: { role: string; scope_name: string } }) => void
    /** Custom className */
    className?: string
}

const ROLE_DISPLAY_NAMES: Record<string, string> = {
    admin: 'Quản trị hệ thống',
    federation_president: 'Chủ tịch Liên đoàn',
    federation_secretary: 'Tổng thư ký',
    provincial_admin: 'Quản trị địa phương',
    technical_director: 'Giám đốc kỹ thuật',
    btc: 'Ban tổ chức',
    referee_manager: 'Điều phối trọng tài',
    referee: 'Trọng tài',
    coach: 'Huấn luyện viên',
    delegate: 'Cán bộ đoàn',
    athlete: 'Vận động viên',
    medical_staff: 'Nhân viên y tế',
}

const ROLE_ICONS: Record<string, string> = {
    admin: '⚙️',
    federation_president: '🏛️',
    federation_secretary: '📋',
    provincial_admin: '🏢',
    technical_director: '🎯',
    btc: '📊',
    referee_manager: '🧑‍⚖️',
    referee: '⚖️',
    coach: '🥋',
    delegate: '📌',
    athlete: '🏅',
    medical_staff: '🏥',
}

export function ContextSwitcher({
    currentRole,
    apiBase = '/api/v1',
    onContextSwitch,
    className = '',
}: ContextSwitcherProps) {
    const [bindings, setBindings] = useState<RoleBinding[]>([])
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // Fetch user's role bindings
    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const token = localStorage.getItem('access_token') || ''
                const res = await fetch(`${apiBase}/auth/my-roles`, {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (res.ok) {
                    const data = await res.json()
                    setBindings(data.bindings || [])
                }
            } catch {
                // Silently fail — bindings will be empty
            }
        }
        fetchRoles()
    }, [apiBase])

    // Close dropdown on outside click
    useEffect(() => {
        if (!isOpen) return
        const handleClick = () => setIsOpen(false)
        document.addEventListener('click', handleClick)
        return () => document.removeEventListener('click', handleClick)
    }, [isOpen])

    // Switch context
    const handleSwitch = useCallback(
        async (bindingId: string) => {
            setIsLoading(true)
            setError(null)
            try {
                const token = localStorage.getItem('access_token') || ''
                const res = await fetch(`${apiBase}/auth/switch-context`, {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ role_binding_id: bindingId }),
                })

                if (!res.ok) {
                    const errData = await res.json()
                    setError(errData.message || 'Chuyển ngữ cảnh thất bại')
                    return
                }

                const result = await res.json()

                // Update stored tokens
                if (result.accessToken) {
                    localStorage.setItem('access_token', result.accessToken)
                }
                if (result.refreshToken) {
                    localStorage.setItem('refresh_token', result.refreshToken)
                }

                setIsOpen(false)
                onContextSwitch?.(result)
            } catch {
                setError('Lỗi kết nối khi chuyển ngữ cảnh')
            } finally {
                setIsLoading(false)
            }
        },
        [apiBase, onContextSwitch]
    )

    // Don't render if user has only 1 or fewer roles
    if (bindings.length <= 1) {
        return (
            <div className={`inline-flex items-center gap-1.5 rounded-full border border-vct-border bg-vct-input px-3 py-2 text-xs font-bold text-[var(--vct-text-secondary)] ${className}`}>
                <span className="text-sm">{ROLE_ICONS[currentRole] || '👤'}</span>
                <span>{ROLE_DISPLAY_NAMES[currentRole] || currentRole}</span>
            </div>
        )
    }

    return (
        <div className={`relative inline-block ${className}`} onClick={(e) => e.stopPropagation()}>
            {/* Current context button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold transition-all ${isOpen
                        ? 'border-vct-accent bg-vct-accent/10 text-vct-accent'
                        : 'border-vct-border bg-vct-elevated text-vct-text hover:border-vct-accent hover:text-vct-accent'
                    }`}
                title="Chuyển vai trò"
            >
                <span className="text-sm">{ROLE_ICONS[currentRole] || '👤'}</span>
                <span>{ROLE_DISPLAY_NAMES[currentRole] || currentRole}</span>
                <span className="ml-0.5 text-[10px] opacity-50">{isOpen ? '▲' : '▼'}</span>
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute right-0 top-[calc(100%+6px)] z-[100] min-w-[280px] overflow-hidden rounded-xl border border-vct-border bg-vct-card shadow-[var(--vct-shadow-xl)]">
                    <div className="px-4 pb-2 pt-3 text-[11px] font-extrabold uppercase tracking-[0.5px] text-vct-text-muted">
                        Chuyển vai trò
                    </div>
                    {error && (
                        <div className="px-4 py-2 text-xs text-[var(--vct-danger)] bg-[var(--vct-danger-muted)]">
                            {error}
                        </div>
                    )}
                    {bindings.map((b) => (
                        <button
                            key={b.id}
                            onClick={() => handleSwitch(b.id)}
                            disabled={isLoading || b.role === currentRole}
                            className={`flex w-full items-center gap-2.5 border-none px-4 py-2.5 text-left text-sm transition-colors ${b.role === currentRole
                                    ? 'cursor-default bg-vct-accent/10 opacity-70'
                                    : 'cursor-pointer bg-transparent hover:bg-[var(--vct-bg-hover)]'
                                }`}
                        >
                            <span className="shrink-0 text-base">{ROLE_ICONS[b.role] || '👤'}</span>
                            <div className="min-w-0 flex-1">
                                <div className="text-sm font-semibold text-vct-text">
                                    {ROLE_DISPLAY_NAMES[b.role] || b.role}
                                </div>
                                <div className="mt-0.5 text-[11px] text-vct-text-muted">
                                    {b.scope_name}
                                </div>
                            </div>
                            {b.role === currentRole && (
                                <span className="shrink-0 rounded-full bg-vct-accent/15 px-2 py-0.5 text-[10px] font-bold text-vct-accent">
                                    Đang dùng
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

export default ContextSwitcher
