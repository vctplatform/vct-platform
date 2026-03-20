'use client'

import * as React from 'react'
import { useState, useMemo, useEffect } from 'react'
import { useApiFetch } from './useApiFetch'
import { VCT_Badge, VCT_Button, VCT_Stack, VCT_SearchInput, VCT_EmptyState } from '../components/vct-ui'
import { VCT_PageContainer, VCT_StatRow } from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'

// ════════════════════════════════════════
// FEDERATION — CERTIFICATIONS
// ════════════════════════════════════════

type CertType = 'coach_license' | 'referee_license' | 'club_registration' | 'belt_certificate' | 'instructor'
type CertStatus = 'active' | 'expired' | 'suspended' | 'revoked'

interface Certificate {
    id: string; cert_number: string; type: CertType
    holder_name: string; holder_type: string
    status: CertStatus; issued_at: string; valid_until: string
    verify_code: string
}

const CERT_TYPE_MAP: Record<CertType, { label: string; color: string; icon: string }> = {
    coach_license: { label: 'Giấy phép HLV', color: '#0ea5e9', icon: '🥋' },
    referee_license: { label: 'Giấy phép Trọng tài', color: '#8b5cf6', icon: '⚖️' },
    club_registration: { label: 'Đăng ký CLB', color: '#10b981', icon: '🏢' },
    belt_certificate: { label: 'Chứng nhận Đai', color: '#f59e0b', icon: '🥇' },
    instructor: { label: 'Chứng chỉ Giảng viên', color: '#ec4899', icon: '📜' },
}

const STATUS_MAP: Record<CertStatus, { label: string; type: any }> = {
    active: { label: 'Hiệu lực', type: 'success' },
    expired: { label: 'Hết hạn', type: 'warning' },
    suspended: { label: 'Tạm đình chỉ', type: 'error' },
    revoked: { label: 'Thu hồi', type: 'error' },
}

const FALLBACK_CERTS: Certificate[] = [
    { id: 'CERT-001', cert_number: 'HLV-2026/0012', type: 'coach_license', holder_name: 'Nguyễn Văn A', holder_type: 'coach', status: 'active', issued_at: '2026-01-15', valid_until: '2028-01-15', verify_code: 'VCT-HLV-A1B2C3' },
    { id: 'CERT-002', cert_number: 'TT-2026/0045', type: 'referee_license', holder_name: 'Trần Thị B', holder_type: 'referee', status: 'active', issued_at: '2026-02-01', valid_until: '2027-02-01', verify_code: 'VCT-TT-D4E5F6' },
    { id: 'CERT-003', cert_number: 'CLB-2025/0120', type: 'club_registration', holder_name: 'CLB Tần Long', holder_type: 'club', status: 'expired', issued_at: '2024-03-01', valid_until: '2025-03-01', verify_code: 'VCT-CLB-G7H8I9' },
    { id: 'CERT-004', cert_number: 'DAI-2026/0300', type: 'belt_certificate', holder_name: 'Lê Minh C', holder_type: 'athlete', status: 'active', issued_at: '2026-03-01', valid_until: '2099-12-31', verify_code: 'VCT-DAI-J0K1L2' },
    { id: 'CERT-005', cert_number: 'GV-2025/0008', type: 'instructor', holder_name: 'Phạm Văn D', holder_type: 'coach', status: 'suspended', issued_at: '2025-06-15', valid_until: '2027-06-15', verify_code: 'VCT-GV-M3N4O5' },
]

export const Page_federation_certifications = () => {
    const [search, setSearch] = useState('')
    const [typeFilter, setTypeFilter] = useState('')

    // ── API Fetch ────────────────────────────────────────
    const certsApi = useApiFetch<Certificate[]>()

    useEffect(() => {
        certsApi.execute('/certifications')
    }, [])  

    const certs = certsApi.data?.length ? certsApi.data : FALLBACK_CERTS

    const filtered = useMemo(() => {
        let data = certs
        if (typeFilter) data = data.filter(c => c.type === typeFilter)
        if (search) {
            const q = search.toLowerCase()
            data = data.filter(c => c.holder_name.toLowerCase().includes(q) || c.cert_number.toLowerCase().includes(q) || c.verify_code.toLowerCase().includes(q))
        }
        return data
    }, [search, typeFilter, certs])

    return (
        <VCT_PageContainer size="wide" animated>
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-(--vct-text-primary)">Chứng chỉ & Giấy phép</h1>
                <p className="text-sm text-(--vct-text-secondary) mt-1">Cấp phát, quản lý và xác minh chứng chỉ HLV, trọng tài, đăng ký CLB và chứng nhận đai.</p>
            </div>

            <VCT_StatRow items={[
                { label: 'Tổng chứng chỉ', value: certs.length, icon: <VCT_Icons.Award size={18} />, color: '#8b5cf6' },
                { label: 'Hiệu lực', value: certs.filter(c => c.status === 'active').length, icon: <VCT_Icons.Check size={18} />, color: '#10b981' },
                { label: 'Hết hạn', value: certs.filter(c => c.status === 'expired').length, icon: <VCT_Icons.Clock size={18} />, color: '#f59e0b' },
                { label: 'Bị thu hồi/đình chỉ', value: certs.filter(c => ['suspended', 'revoked'].includes(c.status)).length, icon: <VCT_Icons.AlertCircle size={18} />, color: '#ef4444' },
            ] as StatItem[]} className="mb-6" />

            <VCT_Stack direction="row" gap={16} align="center" justify="space-between" className="mb-5 flex-wrap">
                <VCT_Stack direction="row" gap={12} align="center" className="flex-1 min-w-[300px]">
                    <div className="w-full max-w-[300px]">
                        <VCT_SearchInput value={search} onChange={setSearch} onClear={() => setSearch('')} placeholder="Tìm người, số chứng chỉ, mã xác minh..." />
                    </div>
                    <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="bg-(--vct-bg-elevated) border border-(--vct-border-subtle) text-(--vct-text-primary) text-sm rounded-lg px-3 py-2 outline-none">
                        <option value="">Tất cả loại</option>
                        {Object.entries(CERT_TYPE_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                    </select>
                </VCT_Stack>
                <VCT_Button icon={<VCT_Icons.Plus size={16} />} onClick={() => { }}>Cấp chứng chỉ</VCT_Button>
            </VCT_Stack>

            {filtered.length === 0 ? (
                <VCT_EmptyState title="Không có chứng chỉ nào" description="Thử thay đổi bộ lọc." icon="📜" />
            ) : (
                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
                    {filtered.map(cert => {
                        const ct = CERT_TYPE_MAP[cert.type]
                        const st = STATUS_MAP[cert.status]
                        return (
                            <div key={cert.id} className="rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-glass) p-5 hover:border-(--vct-accent-cyan) transition-colors cursor-pointer" style={{ borderTop: `3px solid ${ct.color}` }}>
                                <VCT_Stack direction="row" justify="space-between" align="center" className="mb-3">
                                    <span className="text-2xl">{ct.icon}</span>
                                    <VCT_Badge text={st.label} type={st.type} />
                                </VCT_Stack>
                                <div className="font-bold text-sm text-(--vct-text-primary)">{ct.label}</div>
                                <div className="text-xs opacity-60 font-mono mt-1">{cert.cert_number}</div>
                                <div className="mt-3 pt-3 border-t border-(--vct-border-subtle)">
                                    <div className="text-sm"><strong>{cert.holder_name}</strong></div>
                                    <div className="text-xs opacity-50 mt-1">Cấp: {cert.issued_at} • Hạn: {cert.valid_until}</div>
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className="text-[10px] font-mono px-2 py-1 rounded bg-(--vct-bg-elevated) opacity-60">{cert.verify_code}</span>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </VCT_PageContainer>
    )
}
