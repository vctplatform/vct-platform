'use client'
import React, { useState } from 'react'
import { VCT_Icons } from '@vct/ui'
import { VCT_PageContainer, VCT_EmptyState, VCT_Badge } from '@vct/ui'
import { useApiQuery } from '../hooks/useApiQuery'
import { AthleteProfile, ClubMembership } from '@vct/shared-types'
import { useRouter } from 'next/navigation'

export function Page_athlete_clubs() {
    const router = useRouter()
    const [showJoinModal, setShowJoinModal] = useState(false)
    const [showLeaveConfirm, setShowLeaveConfirm] = useState<string | null>(null)

    // Fetch profile to get ID
    const { data: profile } = useApiQuery<AthleteProfile>(
        '/api/v1/athlete-profiles/me'
    )

    // Fetch clubs
    const { data: clubs, isLoading } = useApiQuery<ClubMembership[]>(
        profile ? `/api/v1/club-memberships?athleteId=${profile.id}` : ''
    )

    if (isLoading) {
        return (
            <VCT_PageContainer size="wide" animated>
                <div className="mb-6 flex justify-between animate-pulse">
                    <div className="h-10 w-48 bg-vct-border rounded-xl"></div>
                    <div className="h-10 w-32 bg-vct-border rounded-xl"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                    <div className="h-48 bg-vct-elevated rounded-3xl border border-vct-border"></div>
                    <div className="h-48 bg-vct-elevated rounded-3xl border border-vct-border"></div>
                </div>
            </VCT_PageContainer>
        )
    }

    return (
        <VCT_PageContainer size="wide" animated>
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.back()} title="Quay lại" className="rounded-xl border border-vct-border p-2.5 text-vct-text-muted hover:bg-vct-input hover:text-vct-text transition-colors bg-vct-bg">
                        <VCT_Icons.ChevronLeft size={18} />
                    </button>
                    <div>
                        <h1 className="m-0 text-3xl font-black text-vct-text">Câu lạc bộ</h1>
                        <p className="text-sm text-vct-text-muted mt-1">Các đơn vị/CLB bạn đang tham gia sinh hoạt</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowJoinModal(true)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-vct-accent px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-vct-accent-hover shadow-md hover:shadow-lg hover:-translate-y-0.5"
                >
                    <VCT_Icons.Plus size={18} /> Xin gia nhập CLB
                </button>
            </div>

            {!clubs || clubs.length === 0 ? (
                <div className="py-12">
                    <VCT_EmptyState
                        icon={<VCT_Icons.Building size={64} className="text-(--vct-info)/50" />}
                        title="Chưa tham gia CLB nào"
                        description="Bạn hiện chưa là thành viên của bất kỳ Câu lạc bộ hay Võ đường nào. Gia nhập CLB để được đăng ký tham gia các giải đấu."
                        actionLabel="Tìm kiếm CLB"
                        onAction={() => setShowJoinModal(true)}
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {clubs.map(c => (
                        <div key={c.id} className="relative rounded-3xl border border-vct-border bg-vct-elevated overflow-hidden group hover:border-(--vct-info)/50 hover:shadow-lg transition-all duration-300 flex flex-col">
                            {/* Card Header Background */}
                            <div className="h-24 bg-linear-to-br from-(--vct-info)/20 via-[#a855f7]/10 to-transparent relative">
                                <div className="absolute -bottom-8 left-6 w-16 h-16 rounded-2xl bg-vct-bg border-4 border-vct-elevated shadow-sm flex items-center justify-center text-(--vct-info)">
                                    <VCT_Icons.Building size={28} />
                                </div>
                                <div className="absolute top-4 right-4">
                                    <VCT_Badge variant={c.status === 'active' ? 'success' : c.status === 'pending' ? 'warning' : 'neutral'}>
                                        {c.status === 'active' ? 'Đang sinh hoạt' : c.status === 'pending' ? 'Chờ duyệt' : 'Đã rời'}
                                    </VCT_Badge>
                                </div>
                            </div>

                            {/* Card Content */}
                            <div className="pt-10 px-6 pb-6 flex-1 flex flex-col">
                                <h3 className="text-xl font-black text-vct-text mb-1 group-hover:text-(--vct-info) transition-colors line-clamp-2">{c.club_name}</h3>
                                <div className="text-sm font-bold text-vct-text-muted mb-6">Trực thuộc: <span className="text-vct-text font-medium">{c.coach_name || 'Liên đoàn'}</span></div>

                                <div className="space-y-3 mt-auto">
                                    <div className="flex justify-between items-center text-sm p-3 rounded-xl bg-vct-bg border border-vct-border">
                                        <span className="text-vct-text-muted flex items-center gap-2"><VCT_Icons.User size={16} />Vai trò</span>
                                        <span className={`font-black ${c.role === 'captain' ? 'text-amber-500' : 'text-vct-text'}`}>{c.role === 'captain' ? 'Đội trưởng' : 'Thành viên'}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm p-3 rounded-xl bg-vct-bg border border-vct-border">
                                        <span className="text-vct-text-muted flex items-center gap-2"><VCT_Icons.Calendar size={16} />Gia nhập</span>
                                        <span className="font-mono text-vct-text font-medium bg-vct-input px-2 py-0.5 rounded">{c.join_date || 'Chưa cập nhật'}</span>
                                    </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-vct-border/50">
                                    <button
                                        onClick={() => setShowLeaveConfirm(c.id)}
                                        className="w-full flex justify-center items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-2 text-sm font-bold text-red-500 transition-colors hover:bg-red-500 hover:text-white"
                                    >
                                        <VCT_Icons.LogOut size={16} /> Xin rời CLB
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* JOIN MODAL OVERLAY */}
            {showJoinModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-vct-elevated rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-vct-border">
                        <div className="p-6 border-b border-vct-border flex justify-between items-center bg-vct-bg/50">
                            <h2 className="text-xl font-black text-vct-text">Xin gia nhập CLB mới</h2>
                            <button onClick={() => setShowJoinModal(false)} title="Đóng" className="text-vct-text-muted hover:text-vct-text p-1 bg-vct-input rounded-lg"><VCT_Icons.X size={20} /></button>
                        </div>
                        <div className="p-6">
                            <label className="block text-sm font-bold text-vct-text-muted mb-2">Tìm kiếm Câu lạc bộ</label>
                            <div className="relative mb-6">
                                <VCT_Icons.Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-vct-text-muted" />
                                <input type="text" placeholder="Nhập tên CLB..." className="w-full pl-10 pr-4 py-3 rounded-xl bg-vct-input border border-vct-border focus:border-(--vct-info) focus:ring-1 focus:ring-(--vct-info) outline-none text-vct-text transition-all" />
                            </div>
                            <div className="text-center text-sm text-vct-text-muted border border-dashed border-vct-border rounded-xl p-8 bg-vct-bg">
                                <VCT_Icons.Search size={32} className="mx-auto mb-2 opacity-50" />
                                Gõ để tìm kiếm CLB trong hệ thống
                            </div>
                        </div>
                        <div className="p-4 border-t border-vct-border bg-vct-bg flex gap-3">
                            <button onClick={() => setShowJoinModal(false)} className="flex-1 py-2.5 rounded-xl font-bold text-vct-text hover:bg-vct-input transition-colors">Hủy</button>
                            <button disabled className="flex-1 py-2.5 rounded-xl font-bold bg-(--vct-info) text-white opacity-50 cursor-not-allowed">Gửi Yêu Cầu</button>
                        </div>
                    </div>
                </div>
            )}

            {/* LEAVE CONFIRM MODAL */}
            {showLeaveConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-vct-elevated rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl border border-vct-border text-center">
                        <div className="pt-8 pb-4">
                            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-red-500/20">
                                <VCT_Icons.Alert size={32} />
                            </div>
                            <h2 className="text-xl font-black text-vct-text px-6">Xác nhận rời CLB?</h2>
                            <p className="text-sm text-vct-text-muted mt-2 px-6">Sau khi được duyệt rời CLB, bạn sẽ không thể tham gia các giải đấu dưới danh nghĩa CLB này nữa. Kể cả các giải đấu đang đăng ký.</p>
                        </div>
                        <div className="p-4 flex gap-3 bg-vct-bg border-t border-vct-border">
                            <button onClick={() => setShowLeaveConfirm(null)} className="flex-1 py-2.5 rounded-xl font-bold text-vct-text border border-vct-border hover:bg-vct-input transition-colors">Hủy bỏ</button>
                            <button onClick={() => setShowLeaveConfirm(null)} className="flex-1 py-2.5 rounded-xl font-bold border border-red-500 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.4)] text-white hover:bg-red-600 transition-all">Đồng ý Rời</button>
                        </div>
                    </div>
                </div>
            )}
        </VCT_PageContainer>
    )
}
