'use client'
import React, { useState, useCallback } from 'react'
import { VCT_Icons } from '@vct/ui'
import { VCT_Image } from '@vct/ui'
import { VCT_PageContainer, VCT_SectionCard, VCT_EmptyState, VCT_StatRow, VCT_Badge } from '@vct/ui'
import { useApiQuery } from '../hooks/useApiQuery'
import { AthleteProfile } from '@vct/shared-types'
import { useRouter } from 'next/navigation'

interface EditForm {
    phone: string; email: string; address: string; province: string;
    id_number: string; weight: string; height: string;
}

export function Page_athlete_profile() {
    const router = useRouter()
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [saveMsg, setSaveMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
    const [editForm, setEditForm] = useState<EditForm>({ phone: '', email: '', address: '', province: '', id_number: '', weight: '', height: '' })

    // Fetch profile
    const { data: profile, isLoading } = useApiQuery<AthleteProfile>(
        '/api/v1/athlete-profiles/me'
    )

    if (isLoading) {
        return (
            <VCT_PageContainer size="wide" animated>
                <div className="mb-6 flex justify-between animate-pulse">
                    <div className="h-8 w-48 bg-vct-border rounded-lg"></div>
                    <div className="h-10 w-32 bg-vct-border rounded-xl"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
                    <div className="col-span-1 h-[400px] bg-vct-elevated rounded-3xl"></div>
                    <div className="md:col-span-2 space-y-6">
                        <div className="h-32 bg-vct-elevated rounded-3xl"></div>
                        <div className="h-[300px] bg-vct-elevated rounded-3xl"></div>
                    </div>
                </div>
            </VCT_PageContainer>
        )
    }

    if (!profile) {
        return (
            <VCT_PageContainer>
                <VCT_EmptyState
                    icon={<VCT_Icons.User size={48} />}
                    title="Chưa có hồ sơ Vận động viên"
                    description="Bạn cần có hồ sơ VĐV để xem trang này."
                />
            </VCT_PageContainer>
        )
    }

    return (
        <VCT_PageContainer size="wide" animated>
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="rounded-xl border border-vct-border p-2 text-vct-text-muted hover:bg-vct-input hover:text-vct-text transition">
                        <VCT_Icons.ChevronLeft size={18} />
                    </button>
                    <div>
                        <h1 className="m-0 text-2xl font-black text-vct-text">Hồ sơ chi tiết</h1>
                        <p className="text-sm text-vct-text-muted">Quản lý lý lịch, đẳng cấp và thành tích</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {isEditing && (
                        <button
                            onClick={() => { setIsEditing(false); setSaveMsg(null) }}
                            className="flex items-center gap-2 rounded-xl border border-vct-border px-4 py-2 text-sm font-bold text-vct-text-muted hover:text-vct-text hover:bg-vct-bg transition-all"
                        >
                            <VCT_Icons.MinusCircle size={16} /> Hủy
                        </button>
                    )}
                    <button
                        onClick={() => {
                            if (isEditing && profile) {
                                // Save
                                setIsSaving(true)
                                const patch: Record<string, unknown> = {}
                                if (editForm.phone !== (profile.phone || '')) patch.phone = editForm.phone
                                if (editForm.email !== (profile.email || '')) patch.email = editForm.email
                                if (editForm.address !== (profile.address || '')) patch.address = editForm.address
                                if (editForm.province !== (profile.province || '')) patch.province = editForm.province
                                if (editForm.id_number !== (profile.id_number || '')) patch.id_number = editForm.id_number
                                const w = parseFloat(editForm.weight)
                                if (!isNaN(w) && w !== profile.weight) patch.weight = w
                                const h = parseFloat(editForm.height)
                                if (!isNaN(h) && h !== profile.height) patch.height = h

                                if (Object.keys(patch).length === 0) {
                                    setSaveMsg({ type: 'success', text: 'Không có thay đổi' })
                                    setIsSaving(false)
                                    setIsEditing(false)
                                    return
                                }

                                fetch(`/api/v1/athlete-profiles/${profile.id}`, {
                                    method: 'PATCH', headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(patch),
                                }).then(res => {
                                    if (res.ok) {
                                        setSaveMsg({ type: 'success', text: 'Đã lưu thành công!' })
                                        setIsEditing(false)
                                    } else {
                                        setSaveMsg({ type: 'error', text: 'Lỗi khi lưu. Vui lòng thử lại.' })
                                    }
                                }).catch(() => {
                                    setSaveMsg({ type: 'error', text: 'Lỗi kết nối.' })
                                }).finally(() => setIsSaving(false))
                            } else if (profile) {
                                // Enter edit mode
                                setEditForm({
                                    phone: profile.phone || '', email: profile.email || '',
                                    address: profile.address || '', province: profile.province || '',
                                    id_number: profile.id_number || '',
                                    weight: String(profile.weight || ''), height: String(profile.height || ''),
                                })
                                setSaveMsg(null)
                                setIsEditing(true)
                            }
                        }}
                        disabled={isSaving}
                        className={`flex justify-center items-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition-all ${isEditing
                            ? 'bg-emerald-500 border-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-60'
                            : 'bg-vct-bg border-vct-border text-vct-text hover:bg-vct-input hover:border-vct-border-strong'
                            }`}
                    >
                        {isSaving ? '...' : isEditing ? <><VCT_Icons.Check size={16} /> Lưu thay đổi</> : <><VCT_Icons.Edit size={16} /> Cập nhật hồ sơ</>}
                    </button>
                </div>
                {saveMsg && (
                    <div className={`text-xs font-bold mt-2 px-3 py-1.5 rounded-lg ${saveMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                        {saveMsg.text}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT COL: INFO */}
                <div className="space-y-6">
                    <div className="relative p-6 rounded-3xl border border-vct-border bg-vct-elevated text-center overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-(--vct-info)/20 to-(--vct-info)/20"></div>
                        <div className="relative w-32 h-32 mx-auto mt-4 mb-4 rounded-full border-4 border-vct-bg shadow-lg bg-vct-border overflow-hidden">
                            {profile.photo_url ? <VCT_Image src={profile.photo_url} className="w-full h-full" fill objectFit="cover" alt="avatar" sizes="128px" /> : <div className="w-full h-full flex items-center justify-center text-4xl">🥋</div>}
                            {isEditing && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center cursor-pointer hover:bg-black/60 transition">
                                    <VCT_Icons.Camera size={24} className="text-white" />
                                </div>
                            )}
                        </div>
                        <h2 className="text-xl font-bold text-vct-text">{profile?.full_name}</h2>
                        <div className="text-sm text-(--vct-info) font-bold mt-1">ID: {profile.id}</div>
                        <VCT_Badge variant={profile.status === 'active' ? 'success' : 'neutral'} className="mt-3">
                            {profile.status === 'active' ? 'Đang hoạt động' : 'Tạm ngưng'}
                        </VCT_Badge>

                        <div className="mt-6 border-t border-vct-border/50 pt-4 text-left space-y-4">
                            {[
                                { i: <VCT_Icons.Calendar size={16} />, l: 'Ngày sinh', v: profile.date_of_birth },
                                { i: <VCT_Icons.User size={16} />, l: 'Giới tính', v: profile.gender === 'nam' ? 'Nam' : 'Nữ' },
                                { i: <VCT_Icons.Phone size={16} />, l: 'Điện thoại', v: profile.phone || 'Chưa cập nhật', f: 'phone' },
                                { i: <VCT_Icons.Mail size={16} />, l: 'Email', v: profile.email || 'Chưa cập nhật', f: 'email' },
                                { i: <VCT_Icons.MapPin size={16} />, l: 'Tỉnh/TP', v: profile.province || 'Chưa cập nhật', f: 'province' },
                                { i: <VCT_Icons.Home size={16} />, l: 'Địa chỉ', v: profile.address || 'Chưa cập nhật', f: 'address' },
                                { i: <VCT_Icons.FileText size={16} />, l: 'CMND/CCCD', v: profile.id_number || 'Chưa cập nhật', f: 'id_number' },
                            ].map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between text-sm group">
                                    <div className="flex items-center gap-2 text-vct-text-muted">
                                        {item.i} <span>{item.l}</span>
                                    </div>
                                    {isEditing && item.f ? (
                                        <input type="text" value={editForm[item.f as keyof EditForm] || ''}
                                            onChange={e => setEditForm(prev => ({ ...prev, [item.f!]: e.target.value }))}
                                            className="bg-vct-input border border-vct-border-strong rounded px-2 py-1 text-right w-36 text-vct-text text-xs focus:outline-none focus:border-vct-accent" />
                                    ) : (
                                        <span className="font-semibold text-vct-text font-mono tracking-tight group-hover:text-vct-accent transition">{item.v}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <VCT_SectionCard title="Thể chất" icon={<VCT_Icons.Activity size={18} />} accentColor="var(--vct-success)">
                        <div className="flex gap-4">
                            <div className="flex-1 p-4 rounded-2xl bg-(--vct-success)/10 border border-(--vct-success)/20 text-center">
                                <div className="text-3xl font-black text-(--vct-success) mb-1">
                                    {isEditing ? <input type="number" defaultValue={profile.weight} className="bg-transparent w-full text-center outline-none border-b border-(--vct-success)/50 focus:border-(--vct-success)" /> : profile.weight || '--'}
                                </div>
                                <div className="text-xs font-bold text-(--vct-success)/70 uppercase">Cân nặng (kg)</div>
                            </div>
                            <div className="flex-1 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center">
                                <div className="text-3xl font-black text-amber-500 mb-1">
                                    {isEditing ? <input type="number" defaultValue={profile.height} className="bg-transparent w-full text-center outline-none border-b border-amber-500/50 focus:border-amber-500" /> : profile.height || '--'}
                                </div>
                                <div className="text-xs font-bold text-amber-500/70 uppercase">Chiều cao (cm)</div>
                            </div>
                        </div>
                    </VCT_SectionCard>
                </div>

                {/* RIGHT COL: STATS & PROGRESS */}
                <div className="lg:col-span-2 space-y-6">
                    <VCT_StatRow
                        items={[
                            { label: 'Elo Rating', value: profile.elo_rating, color: 'var(--vct-info)' },
                            { label: 'Giải thi đấu', value: profile.total_tournaments, color: 'var(--vct-info)' },
                            { label: 'Huy chương', value: profile.total_medals, color: 'var(--vct-gold)' }
                        ]}
                        cols={3}
                    />

                    <VCT_SectionCard title="Đẳng cấp & Thăng đai" icon={<VCT_Icons.Award size={18} />} accentColor="var(--vct-gold)">
                        <div className="flex items-center gap-6 mb-8 p-4 bg-vct-bg rounded-2xl border border-vct-border">
                            <div className="w-16 h-16 rounded-full border-4 border-(--vct-gold)/30 flex items-center justify-center bg-(--vct-gold)/10 text-2xl shadow-inner">🥋</div>
                            <div>
                                <div className="text-sm font-bold text-vct-text-muted tracking-wide uppercase mb-1">Đẳng cấp hiện tại</div>
                                <div className="text-2xl font-black text-amber-500">{profile.belt_label}</div>
                            </div>
                        </div>

                        {/* Timeline — from API belt_history */}
                        <div className="relative pl-6 space-y-6 before:absolute before:inset-y-0 before:left-[11px] before:w-0.5 before:bg-vct-border">
                            {(profile.belt_history && profile.belt_history.length > 0
                                ? profile.belt_history.map((b, idx) => ({ belt: b.belt, date: b.date, current: idx === profile.belt_history!.length - 1 }))
                                : [
                                    { belt: profile.belt_label, date: '—', current: true },
                                ]
                            ).reverse().map((item, idx) => (
                                <div key={idx} className="relative">
                                    <div className={`absolute -left-[31px] w-5 h-5 rounded-full border-4 border-vct-elevated ${item.current ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-vct-border-strong'}`}></div>
                                    <div className="p-4 rounded-xl bg-vct-bg border border-vct-border hover:border-vct-border-strong transition-colors group">
                                        <div className="flex justify-between items-center">
                                            <span className={`font-bold ${item.current ? 'text-amber-500' : 'text-vct-text'}`}>{item.belt}</span>
                                            <span className="text-xs font-mono text-vct-text-muted bg-vct-elevated px-2 py-0.5 rounded-lg border border-vct-border">{item.date}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </VCT_SectionCard>

                    <VCT_SectionCard title="Chỉ số Kỹ năng" icon={<VCT_Icons.TrendingUp size={18} />} accentColor="var(--vct-info)">
                        {profile.skill_stats && profile.skill_stats.length > 0 ? (
                            <div className="space-y-3">
                                {profile.skill_stats.map(s => (
                                    <div key={s.label} className="flex items-center gap-3">
                                        <span className="text-xs font-semibold text-vct-text-muted w-20 text-right">{s.label}</span>
                                        <div className="flex-1 h-2.5 bg-vct-bg rounded-full border border-vct-border overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${s.value}%`, background: s.color }}></div>
                                        </div>
                                        <span className="text-xs font-bold w-8" style={{ color: s.color }}>{s.value}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-10 border border-dashed border-vct-border rounded-2xl flex flex-col items-center justify-center text-center opacity-60 bg-vct-bg">
                                <VCT_Icons.Activity size={48} className="text-vct-border-strong mb-4" />
                                <p className="text-vct-text-muted font-bold">Chưa có dữ liệu kỹ năng</p>
                                <p className="text-xs text-vct-text-muted mt-2">(Dữ liệu sẽ được cập nhật sau kỳ thi đấu)</p>
                            </div>
                        )}
                    </VCT_SectionCard>
                </div>
            </div>
        </VCT_PageContainer>
    )
}
