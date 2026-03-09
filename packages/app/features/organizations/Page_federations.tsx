'use client'

import React, { useState, useMemo } from 'react'
import { Search, Plus, Building2, ChevronRight, Users, Trophy, MapPin, Phone, Mail, Globe, Edit, MoreHorizontal, Filter, ChevronDown, Eye } from 'lucide-react'

// ── Types ────────────────────────────────────────────────────

interface Federation {
    id: string
    name: string
    code: string
    level: 'quoc_gia' | 'tinh' | 'khu_vuc'
    parent_id?: string
    address?: string
    phone?: string
    email?: string
    website?: string
    logo_url?: string
    president?: string
    established_year?: number
    is_active: boolean
    club_count?: number
    member_count?: number
}

interface Club {
    id: string
    federation_id: string
    name: string
    code: string
    city?: string
    province?: string
    head_coach?: string
    member_count: number
    is_active: boolean
}

// ── Mock Data ────────────────────────────────────────────────

const MOCK_FEDERATIONS: Federation[] = [
    { id: 'fed-1', name: 'Liên đoàn Võ thuật Cổ truyền Việt Nam', code: 'VCTF', level: 'quoc_gia', president: 'Nguyễn Văn A', established_year: 1990, is_active: true, club_count: 63, member_count: 15000, address: 'Hà Nội', phone: '024-1234-5678', email: 'lienhe@vctf.vn', website: 'https://vctf.vn' },
    { id: 'fed-2', name: 'Liên đoàn Võ Cổ Truyền Bình Định', code: 'VCT-BD', level: 'tinh', parent_id: 'fed-1', president: 'Trần Văn B', established_year: 1995, is_active: true, club_count: 12, member_count: 3200, address: 'Quy Nhơn, Bình Định', phone: '0256-123-456' },
    { id: 'fed-3', name: 'Liên đoàn Võ Cổ Truyền TP.HCM', code: 'VCT-HCM', level: 'tinh', parent_id: 'fed-1', president: 'Lê Văn C', established_year: 1998, is_active: true, club_count: 25, member_count: 5400, address: 'TP. Hồ Chí Minh' },
    { id: 'fed-4', name: 'Liên đoàn Võ Cổ Truyền Hà Nội', code: 'VCT-HN', level: 'tinh', parent_id: 'fed-1', president: 'Phạm Thị D', established_year: 2001, is_active: true, club_count: 18, member_count: 4100, address: 'Hà Nội' },
    { id: 'fed-5', name: 'Liên đoàn Võ Cổ Truyền miền Trung', code: 'VCT-MT', level: 'khu_vuc', parent_id: 'fed-1', president: 'Hoàng Văn E', established_year: 2005, is_active: true, club_count: 8, member_count: 1800 },
]

const MOCK_CLUBS: Club[] = [
    { id: 'club-1', federation_id: 'fed-2', name: 'CLB Bình Định Gia', code: 'BDG-01', city: 'Quy Nhơn', province: 'Bình Định', head_coach: 'Võ sư Trần Minh', member_count: 85, is_active: true },
    { id: 'club-2', federation_id: 'fed-2', name: 'CLB An Thái', code: 'AT-01', city: 'An Nhơn', province: 'Bình Định', head_coach: 'Võ sư Nguyễn Hải', member_count: 120, is_active: true },
    { id: 'club-3', federation_id: 'fed-3', name: 'CLB Tân Khánh Bà Trà', code: 'TKBT-01', city: 'Quận 1', province: 'TP.HCM', head_coach: 'Võ sư Lê Thanh', member_count: 200, is_active: true },
    { id: 'club-4', federation_id: 'fed-4', name: 'CLB Thăng Long Võ Đạo', code: 'TLVD-01', city: 'Ba Đình', province: 'Hà Nội', head_coach: 'Võ sư Phạm Hùng', member_count: 150, is_active: true },
]

// ── Level Badge ──────────────────────────────────────────────

const LEVEL_LABELS: Record<string, { label: string; color: string }> = {
    quoc_gia: { label: 'Quốc gia', color: '#dc2626' },
    tinh: { label: 'Tỉnh/Thành', color: '#2563eb' },
    khu_vuc: { label: 'Khu vực', color: '#16a34a' },
}

function LevelBadge({ level }: { level: string }) {
    const config = LEVEL_LABELS[level] || { label: level, color: '#6b7280' }
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: `${config.color}18`, color: config.color, border: `1px solid ${config.color}30` }}>
            {config.label}
        </span>
    )
}

// ── Stat Card ────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number | string; color: string }) {
    return (
        <div style={{ background: '#fff', borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16, border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}14`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={24} style={{ color }} />
            </div>
            <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#111827', lineHeight: 1 }}>{value}</div>
                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{label}</div>
            </div>
        </div>
    )
}

// ── Main Component ───────────────────────────────────────────

export default function Page_federations() {
    const [search, setSearch] = useState('')
    const [selectedFed, setSelectedFed] = useState<Federation | null>(null)
    const [levelFilter, setLevelFilter] = useState<string>('')
    const [showCreate, setShowCreate] = useState(false)

    const filteredFederations = useMemo(() => {
        return MOCK_FEDERATIONS.filter(f => {
            const matchSearch = search === '' || f.name.toLowerCase().includes(search.toLowerCase()) || f.code.toLowerCase().includes(search.toLowerCase())
            const matchLevel = levelFilter === '' || f.level === levelFilter
            return matchSearch && matchLevel
        })
    }, [search, levelFilter])

    const selectedClubs = useMemo(() => {
        if (!selectedFed) return []
        return MOCK_CLUBS.filter(c => c.federation_id === selectedFed.id)
    }, [selectedFed])

    const totals = useMemo(() => ({
        federations: MOCK_FEDERATIONS.length,
        clubs: MOCK_FEDERATIONS.reduce((s, f) => s + (f.club_count || 0), 0),
        members: MOCK_FEDERATIONS.reduce((s, f) => s + (f.member_count || 0), 0),
    }), [])

    return (
        <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 700, color: '#111827', margin: 0 }}>Tổ chức & Liên đoàn</h1>
                    <p style={{ fontSize: 14, color: '#6b7280', margin: '4px 0 0' }}>Quản lý cấu trúc Liên đoàn → Câu lạc bộ</p>
                </div>
                <button onClick={() => setShowCreate(true)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 8, background: '#dc2626', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                    <Plus size={18} /> Thêm Liên đoàn
                </button>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                <StatCard icon={Building2} label="Liên đoàn" value={totals.federations} color="#dc2626" />
                <StatCard icon={Users} label="Câu lạc bộ" value={totals.clubs} color="#2563eb" />
                <StatCard icon={Trophy} label="Thành viên" value={totals.members.toLocaleString('vi-VN')} color="#16a34a" />
            </div>

            {/* Search & Filter */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                <div style={{ flex: 1, position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm liên đoàn..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ width: '100%', padding: '10px 14px 10px 42px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                    />
                </div>
                <select
                    value={levelFilter}
                    onChange={e => setLevelFilter(e.target.value)}
                    style={{ padding: '10px 14px', borderRadius: 8, border: '1px solid #d1d5db', fontSize: 14, outline: 'none', cursor: 'pointer', minWidth: 160 }}
                >
                    <option value="">Tất cả cấp</option>
                    <option value="quoc_gia">Quốc gia</option>
                    <option value="tinh">Tỉnh/Thành</option>
                    <option value="khu_vuc">Khu vực</option>
                </select>
            </div>

            {/* Content: Federation List + Detail */}
            <div style={{ display: 'grid', gridTemplateColumns: selectedFed ? '1fr 1fr' : '1fr', gap: 20 }}>
                {/* Federation List */}
                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                    <div style={{ padding: '16px 20px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 15, fontWeight: 600, color: '#374151' }}>Danh sách Liên đoàn ({filteredFederations.length})</span>
                    </div>
                    <div style={{ maxHeight: 600, overflowY: 'auto' }}>
                        {filteredFederations.map(fed => (
                            <div
                                key={fed.id}
                                onClick={() => setSelectedFed(selectedFed?.id === fed.id ? null : fed)}
                                style={{
                                    padding: '16px 20px',
                                    borderBottom: '1px solid #f3f4f6',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 16,
                                    background: selectedFed?.id === fed.id ? '#fef2f2' : 'transparent',
                                    transition: 'background 0.15s',
                                }}
                            >
                                <div style={{ width: 44, height: 44, borderRadius: 10, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Building2 size={22} style={{ color: '#dc2626' }} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fed.name}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                                        <LevelBadge level={fed.level} />
                                        <span style={{ fontSize: 12, color: '#9ca3af' }}>{fed.code}</span>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                    <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{fed.club_count || 0}</div>
                                    <div style={{ fontSize: 11, color: '#9ca3af' }}>CLB</div>
                                </div>
                                <ChevronRight size={16} style={{ color: '#d1d5db', flexShrink: 0 }} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Detail Panel */}
                {selectedFed && (
                    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>{selectedFed.name}</h2>
                                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                                    <LevelBadge level={selectedFed.level} />
                                    <span style={{ fontSize: 13, color: '#6b7280' }}>Mã: {selectedFed.code}</span>
                                </div>
                            </div>
                            <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                                <Edit size={14} /> Sửa
                            </button>
                        </div>
                        <div style={{ padding: '20px 24px' }}>
                            {/* Info Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                                {selectedFed.president && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <Users size={16} style={{ color: '#6b7280' }} />
                                        <div><div style={{ fontSize: 11, color: '#9ca3af' }}>Chủ tịch</div><div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{selectedFed.president}</div></div>
                                    </div>
                                )}
                                {selectedFed.established_year && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <Trophy size={16} style={{ color: '#6b7280' }} />
                                        <div><div style={{ fontSize: 11, color: '#9ca3af' }}>Thành lập</div><div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{selectedFed.established_year}</div></div>
                                    </div>
                                )}
                                {selectedFed.address && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <MapPin size={16} style={{ color: '#6b7280' }} />
                                        <div><div style={{ fontSize: 11, color: '#9ca3af' }}>Địa chỉ</div><div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{selectedFed.address}</div></div>
                                    </div>
                                )}
                                {selectedFed.phone && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <Phone size={16} style={{ color: '#6b7280' }} />
                                        <div><div style={{ fontSize: 11, color: '#9ca3af' }}>Điện thoại</div><div style={{ fontSize: 14, fontWeight: 500, color: '#111827' }}>{selectedFed.phone}</div></div>
                                    </div>
                                )}
                            </div>

                            {/* Clubs List */}
                            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#374151', margin: '0 0 12px', borderTop: '1px solid #f3f4f6', paddingTop: 20 }}>
                                Câu lạc bộ trực thuộc ({selectedClubs.length})
                            </h3>
                            {selectedClubs.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '32px 0', color: '#9ca3af', fontSize: 14 }}>
                                    Chưa có CLB nào
                                </div>
                            ) : (
                                selectedClubs.map(club => (
                                    <div key={club.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 8, border: '1px solid #f3f4f6', marginBottom: 8, background: '#fafafa' }}>
                                        <div style={{ width: 36, height: 36, borderRadius: 8, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <Building2 size={18} style={{ color: '#2563eb' }} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{club.name}</div>
                                            <div style={{ fontSize: 12, color: '#6b7280' }}>{club.city}, {club.province} • HLV: {club.head_coach}</div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: 14, fontWeight: 600, color: '#2563eb' }}>{club.member_count}</div>
                                            <div style={{ fontSize: 11, color: '#9ca3af' }}>thành viên</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
