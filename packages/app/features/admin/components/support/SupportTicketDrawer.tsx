import * as React from 'react'
import { VCT_Badge, VCT_Button, VCT_Stack, VCT_AvatarLetter } from '../../../components/vct-ui'
import { VCT_Textarea } from '../../../components/VCT_Textarea'
import { VCT_Icons } from '../../../components/vct-icons'
import { VCT_Drawer } from '../../../components/VCT_Drawer'
import { useShellToast } from '../AdminPageShell'
import type { SupportTicket, TicketReply } from './support.data'
import { STATUS_BADGE, PRIORITY_BADGE, TYPE_BADGE, CANNED_RESPONSES } from './support.data'
import { useState, useMemo } from 'react'

interface TicketNote {
    id: string; ticketId: string; author: string; content: string; createdAt: string
}
interface TicketActivity {
    id: string; ticketId: string; actor: string; action: string; detail?: string; createdAt: string
}

interface SupportTicketDrawerProps {
    selected: SupportTicket | null
    onClose: () => void
    replies: TicketReply[]
    notes: TicketNote[]
    activities: TicketActivity[]
    onAssign: (id: string) => void
    onResolve: (id: string) => void
    onCloseTicket: (id: string) => void
    onReopen: (id: string) => void
    onAddReply: (reply: TicketReply) => void
    onAddNote: (note: TicketNote) => void
}

export function SupportTicketDrawer({
    selected, onClose, replies, notes, activities,
    onAssign, onResolve, onCloseTicket, onReopen, onAddReply, onAddNote,
}: SupportTicketDrawerProps) {
    const [replyText, setReplyText] = useState('')
    const [showCanned, setShowCanned] = useState(false)
    const [noteText, setNoteText] = useState('')
    const [drawerTab, setDrawerTab] = useState<'conversation' | 'notes' | 'timeline'>('conversation')
    const { showToast } = useShellToast()

    const ticketReplies = useMemo(() => {
        if (!selected) return []
        return replies.filter(r => r.ticketId === selected.id)
    }, [selected, replies])

    const ticketNotes = useMemo(() => {
        if (!selected) return []
        return notes.filter(n => n.ticketId === selected.id)
    }, [selected, notes])

    const ticketActivities = useMemo(() => {
        if (!selected) return []
        return activities.filter(a => a.ticketId === selected.id)
    }, [selected, activities])

    return (
        <VCT_Drawer isOpen={!!selected} onClose={() => { onClose(); setReplyText(''); setShowCanned(false) }} title={selected?.tieuDe ?? ''} width={620}>
            {selected && (
                <VCT_Stack gap={16}>
                    {/* Header */}
                    <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono text-sm font-bold text-(--vct-accent-cyan)">{selected.maTicket}</span>
                        <VCT_Badge type={STATUS_BADGE[selected.trangThai]?.type ?? 'neutral'} text={STATUS_BADGE[selected.trangThai]?.label} />
                        <VCT_Badge type={PRIORITY_BADGE[selected.mucUuTien]?.type ?? 'neutral'} text={PRIORITY_BADGE[selected.mucUuTien]?.label} />
                        <VCT_Badge type={TYPE_BADGE[selected.loai]?.type ?? 'neutral'} text={TYPE_BADGE[selected.loai]?.label} />
                    </div>

                    {/* Info compact */}
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { label: 'Người tạo', value: selected.nguoiTaoTen },
                            { label: 'Người xử lý', value: selected.nguoiXuLyTen ?? '—' },
                            { label: 'Ngày tạo', value: selected.createdAt },
                        ].map(item => (
                            <div key={item.label} className="p-2 bg-(--vct-bg-base) rounded-lg border border-(--vct-border-subtle)">
                                <div className="text-[9px] uppercase tracking-wider text-(--vct-text-tertiary) font-bold">{item.label}</div>
                                <div className="font-bold text-xs text-(--vct-text-primary) mt-0.5">{item.value}</div>
                            </div>
                        ))}
                    </div>

                    {/* Drawer Tabs */}
                    <div className="flex items-center gap-1 border-b border-(--vct-border-subtle) pb-1">
                        {([
                            { key: 'conversation', label: `💬 Hội thoại (${ticketReplies.length})` },
                            { key: 'notes', label: `📝 Ghi chú (${ticketNotes.length})` },
                            { key: 'timeline', label: `📋 Timeline (${ticketActivities.length})` },
                        ] as const).map(t => (
                            <button key={t.key} type="button" className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${drawerTab === t.key ? 'bg-(--vct-accent-cyan) text-white' : 'text-(--vct-text-tertiary) hover:text-(--vct-text-primary) hover:bg-white/5'}`} onClick={() => setDrawerTab(t.key)}>{t.label}</button>
                        ))}
                    </div>

                    {/* Tab: Conversation */}
                    {drawerTab === 'conversation' && (
                    <div className="border-t border-(--vct-border-subtle) pt-3">
                        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                            {ticketReplies.length === 0 ? (
                                <div className="text-center py-6 text-sm text-(--vct-text-tertiary)">Chưa có phản hồi nào</div>
                            ) : ticketReplies.map(r => (
                                <div key={r.id} className={`flex ${r.senderRole === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] rounded-2xl p-3 ${
                                        r.senderRole === 'admin'
                                            ? 'bg-(--vct-accent-cyan)/10 border border-(--vct-accent-cyan)/20 rounded-br-md'
                                            : 'bg-(--vct-bg-base) border border-(--vct-border-subtle) rounded-bl-md'
                                    }`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <VCT_AvatarLetter name={r.sender} size={20} />
                                            <span className="text-[11px] font-bold text-(--vct-text-primary)">{r.sender}</span>
                                            <span className="text-[10px] text-(--vct-text-tertiary) ml-auto">{r.createdAt.split(' ')[1] ?? r.createdAt}</span>
                                        </div>
                                        <div className="text-sm text-(--vct-text-secondary) leading-relaxed">{r.content}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    )}

                    {/* Tab: Internal Notes */}
                    {drawerTab === 'notes' && (
                    <div className="space-y-3">
                        {ticketNotes.length === 0 ? (
                            <div className="text-center py-6 text-sm text-(--vct-text-tertiary)">Chưa có ghi chú nội bộ</div>
                        ) : ticketNotes.map(n => (
                            <div key={n.id} className="bg-[#f59e0b10] border border-[#f59e0b25] rounded-xl p-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <VCT_AvatarLetter name={n.author} size={18} />
                                    <span className="text-[11px] font-bold text-(--vct-text-primary)">{n.author}</span>
                                    <VCT_Badge type="warning" text="Nội bộ" />
                                    <span className="text-[10px] text-(--vct-text-tertiary) ml-auto">{n.createdAt}</span>
                                </div>
                                <div className="text-sm text-(--vct-text-secondary) leading-relaxed">{n.content}</div>
                            </div>
                        ))}
                        <div className="border-t border-(--vct-border-subtle) pt-3">
                            <VCT_Textarea value={noteText} onChange={setNoteText} placeholder="Thêm ghi chú nội bộ..." rows={2} />
                            <div className="flex justify-end mt-2">
                                <VCT_Button size="sm" variant="primary" onClick={() => {
                                    if (!noteText.trim() || !selected) return
                                    onAddNote({ id: `N-${Date.now()}`, ticketId: selected.id, author: 'Admin VCT', content: noteText.trim(), createdAt: new Date().toLocaleString('vi-VN') })
                                    setNoteText('')
                                    showToast('Đã thêm ghi chú')
                                }} icon={<VCT_Icons.Plus size={14} />}>Thêm ghi chú</VCT_Button>
                            </div>
                        </div>
                    </div>
                    )}

                    {/* Tab: Activity Timeline */}
                    {drawerTab === 'timeline' && (
                    <div className="relative pl-6">
                        <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-(--vct-border-subtle)" />
                        {ticketActivities.length === 0 ? (
                            <div className="text-center py-6 text-sm text-(--vct-text-tertiary)">Chưa có hoạt động</div>
                        ) : ticketActivities.map(a => {
                            const icons: Record<string, string> = { created: '🆕', assigned: '👤', replied: '💬', note: '📝', resolved: '✅', escalated: '🔺', closed: '🔒' }
                            return (
                                <div key={a.id} className="relative pb-4 last:pb-0">
                                    <div className="absolute -left-4 top-1 w-4 h-4 rounded-full bg-(--vct-bg-elevated) border-2 border-(--vct-border-strong) flex items-center justify-center text-[8px]">{icons[a.action] ?? '•'}</div>
                                    <div className="ml-2">
                                        <div className="text-xs font-bold text-(--vct-text-primary)">{a.actor} <span className="font-normal text-(--vct-text-tertiary)">· {a.action}</span></div>
                                        {a.detail && <div className="text-[11px] text-(--vct-text-secondary) mt-0.5">{a.detail}</div>}
                                        <div className="text-[10px] text-(--vct-text-tertiary) mt-0.5">{a.createdAt}</div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                    )}

                    {/* Reply Form */}
                    {selected.trangThai !== 'closed' && (
                        <div className="border-t border-(--vct-border-subtle) pt-3">
                            {showCanned && (
                                <div className="mb-3 bg-(--vct-bg-base) border border-(--vct-border-subtle) rounded-xl p-3 space-y-2">
                                    <div className="text-[10px] font-bold text-(--vct-text-tertiary) uppercase tracking-wider mb-1">Mẫu phản hồi nhanh</div>
                                    {CANNED_RESPONSES.map(cr => (
                                        <button key={cr.id} type="button" className="w-full text-left p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer" onClick={() => { setReplyText(cr.content); setShowCanned(false) }}>
                                            <div className="text-xs font-bold text-(--vct-text-primary)">{cr.label}</div>
                                            <div className="text-[11px] text-(--vct-text-tertiary) line-clamp-1 mt-0.5">{cr.content}</div>
                                        </button>
                                    ))}
                                </div>
                            )}
                            <VCT_Textarea value={replyText} onChange={setReplyText} placeholder="Nhập phản hồi..." rows={3} />
                            <VCT_Stack direction="row" gap={8} className="mt-2" justify="between">
                                <VCT_Button size="sm" variant="ghost" onClick={() => setShowCanned(!showCanned)} icon={<VCT_Icons.Layers size={14} />}>Mẫu</VCT_Button>
                                <VCT_Button size="sm" variant="primary" onClick={() => {
                                    if (!replyText.trim()) return
                                    const newReply: TicketReply = { id: `R-${Date.now()}`, ticketId: selected.id, sender: 'Admin VCT', senderRole: 'admin', content: replyText.trim(), createdAt: new Date().toLocaleString('vi-VN') }
                                    onAddReply(newReply)
                                    setReplyText('')
                                    showToast('Đã gửi phản hồi')
                                }} icon={<VCT_Icons.ArrowRight size={14} />}>Gửi</VCT_Button>
                            </VCT_Stack>
                        </div>
                    )}

                    {/* CSAT */}
                    {(selected.trangThai === 'resolved' || selected.trangThai === 'closed') && (
                        <div className="bg-[#10b98115] border border-[#10b98130] rounded-xl p-4">
                            <div className="text-xs font-bold text-(--vct-text-tertiary) uppercase tracking-wider mb-2">Đánh giá dịch vụ</div>
                            <div className="flex items-center gap-3">
                                <div className="text-2xl">{'⭐'.repeat(selected.satisfactionRating ?? 4)}{'☆'.repeat(5 - (selected.satisfactionRating ?? 4))}</div>
                                <span className="text-sm font-bold text-(--vct-text-primary)">{selected.satisfactionRating ?? 4}/5</span>
                            </div>
                            {selected.satisfactionNote && <div className="text-xs text-(--vct-text-secondary) mt-1 italic">"{selected.satisfactionNote}"</div>}
                        </div>
                    )}

                    {/* Actions */}
                    <VCT_Stack direction="row" gap={8} className="pt-2 border-t border-(--vct-border-subtle)">
                        {selected.trangThai === 'open' && <VCT_Button variant="primary" onClick={() => { onAssign(selected.id); onClose() }} icon={<VCT_Icons.User size={14} />}>Nhận xử lý</VCT_Button>}
                        {selected.trangThai === 'in_progress' && <VCT_Button variant="primary" onClick={() => { onResolve(selected.id); onClose() }} icon={<VCT_Icons.CheckCircle size={14} />}>Giải quyết</VCT_Button>}
                        {selected.trangThai === 'resolved' && <VCT_Button variant="primary" onClick={() => { onCloseTicket(selected.id); onClose() }} icon={<VCT_Icons.Close size={14} />}>Đóng</VCT_Button>}
                        {(selected.trangThai === 'closed' || selected.trangThai === 'resolved') && <VCT_Button variant="ghost" onClick={() => { onReopen(selected.id); onClose() }} icon={<VCT_Icons.Refresh size={14} />}>Mở lại</VCT_Button>}
                    </VCT_Stack>
                </VCT_Stack>
            ) || null}
        </VCT_Drawer>
    )
}
