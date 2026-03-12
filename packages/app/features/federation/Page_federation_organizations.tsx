// ═══════════════════════════════════════════════════════════════
// VCT PLATFORM — FEDERATION ORGANIZATIONS PAGE
// View and manage national member organizations (provinces/units)
// with live API integration and VCT design system.
// ═══════════════════════════════════════════════════════════════
'use client';
import React, { useState, useMemo } from 'react';
import { useApiQuery } from '../hooks/useApiQuery';
import { VCT_PageContainer, VCT_PageHero } from '../components/VCT_PageContainer';
import { VCT_Icons } from '../components/vct-icons';
import { VCT_EmptyState, VCT_Button } from '../components/vct-ui';
import { exportToExcel } from '../../utils/exportUtils';

// ── Types ────────────────────────────────────────────────────

interface Organization {
    id: string;
    name: string;
    abbreviation: string;
    region: string;
    type: string;
    status: string;
    club_count: number;
    member_count: number;
    leader_name: string;
}

// ── Fallback ─────────────────────────────────────────────────

const SEED: Organization[] = [
    { id: 'hcm', name: 'Liên đoàn Võ thuật TP.Hồ Chí Minh', abbreviation: 'VCT-HCM', region: 'Miền Nam', type: 'province', status: 'active', club_count: 128, member_count: 4520, leader_name: 'Nguyễn Văn A' },
    { id: 'hn', name: 'Hội Võ thuật cổ truyền Hà Nội', abbreviation: 'VCT-HN', region: 'Miền Bắc', type: 'province', status: 'active', club_count: 96, member_count: 3200, leader_name: 'Trần Thị B' },
    { id: 'dn', name: 'Liên đoàn Võ cổ truyền Đà Nẵng', abbreviation: 'VCT-DN', region: 'Miền Trung', type: 'province', status: 'active', club_count: 42, member_count: 1580, leader_name: 'Lê Văn C' },
    { id: 'bd', name: 'Hội Võ thuật Bình Dương', abbreviation: 'VCT-BD', region: 'Miền Nam', type: 'province', status: 'active', club_count: 35, member_count: 1120, leader_name: 'Phạm Văn D' },
    { id: 'hp', name: 'Hội Võ thuật Hải Phòng', abbreviation: 'VCT-HP', region: 'Miền Bắc', type: 'province', status: 'suspended', club_count: 18, member_count: 620, leader_name: 'Võ Văn E' },
    { id: 'qn', name: 'Hội Võ cổ truyền Quảng Nam', abbreviation: 'VCT-QN', region: 'Miền Trung', type: 'province', status: 'active', club_count: 28, member_count: 950, leader_name: 'Đỗ Thị F' },
    { id: 'ct', name: 'Liên đoàn Võ thuật Cần Thơ', abbreviation: 'VCT-CT', region: 'Miền Nam', type: 'province', status: 'active', club_count: 22, member_count: 780, leader_name: 'Huỳnh Văn G' },
    { id: 'tth', name: 'Hội Võ thuật Thừa Thiên Huế', abbreviation: 'VCT-TTH', region: 'Miền Trung', type: 'province', status: 'inactive', club_count: 12, member_count: 340, leader_name: 'Phan Văn H' },
];

// ── Status helpers ───────────────────────────────────────────

const STATUS_META: Record<string, { color: string; label: string }> = {
    active: { color: '#10b981', label: 'Hoạt động' },
    suspended: { color: '#f59e0b', label: 'Tạm dừng' },
    inactive: { color: '#ef4444', label: 'Ngưng' },
};

const REGION_COLORS: Record<string, string> = {
    'Miền Bắc': '#3b82f6', 'Miền Trung': '#f59e0b', 'Miền Nam': '#10b981',
};

const ALL_REGIONS = ['all', 'Miền Bắc', 'Miền Trung', 'Miền Nam'] as const;

// ── Component ────────────────────────────────────────────────

export function Page_federation_organizations() {
    const { data: apiData, isLoading } = useApiQuery<Organization[]>('/api/v1/federation/units');
    const orgs = apiData || SEED;

    const [regionFilter, setRegionFilter] = useState('all');
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        let list = orgs;
        if (regionFilter !== 'all') list = list.filter(o => o.region === regionFilter);
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(o => o.name.toLowerCase().includes(q) || o.abbreviation.toLowerCase().includes(q) || o.leader_name.toLowerCase().includes(q));
        }
        return list;
    }, [orgs, regionFilter, search]);

    const totalClubs = orgs.reduce((s, o) => s + o.club_count, 0);
    const totalMembers = orgs.reduce((s, o) => s + o.member_count, 0);

    const handleExportExcel = () => {
        const exportData = filtered.map((o, idx) => ({
            'STT': idx + 1,
            'Tên Đơn Vị': o.name,
            'Viết Tắt': o.abbreviation,
            'Vùng Miền': o.region,
            'Số CLB': o.club_count,
            'Số Thành Viên': o.member_count,
            'Trạng Thái': o.status === 'active' ? 'Hoạt động' : o.status === 'suspended' ? 'Tạm dừng' : 'Ngưng',
            'Người Đại Diện': o.leader_name
        }));
        exportToExcel(exportData, 'danh_sach_to_chuc_hiep_hoi');
    };

    const kpis = [
        { label: 'Tổng đơn vị', value: orgs.length, icon: <VCT_Icons.Building size={16} />, color: '#3b82f6' },
        { label: 'Hoạt động', value: orgs.filter(o => o.status === 'active').length, icon: <VCT_Icons.CheckCircle size={16} />, color: '#10b981' },
        { label: 'Tổng CLB', value: totalClubs, icon: <VCT_Icons.Home size={16} />, color: '#f59e0b' },
        { label: 'Tổng thành viên', value: totalMembers.toLocaleString(), icon: <VCT_Icons.Users size={16} />, color: '#8b5cf6' },
    ];

    return (
        <VCT_PageContainer size="default">
            <VCT_PageHero
                title="Tổ chức thành viên Liên đoàn"
                subtitle={`${orgs.length} đơn vị • ${totalClubs} CLB • ${totalMembers.toLocaleString()} thành viên`}
                icon={<VCT_Icons.Building size={24} />}
                gradientFrom="rgba(59, 130, 246, 0.1)"
                gradientTo="rgba(139, 92, 246, 0.06)"
            />

            {/* KPI Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                {kpis.map(kpi => (
                    <div key={kpi.label} className="rounded-2xl border border-vct-border bg-vct-elevated px-4 py-4">
                        <div className="flex items-center gap-2 text-xs text-vct-text-muted mb-1">
                            <span style={{ color: kpi.color }}>{kpi.icon}</span> {kpi.label}
                        </div>
                        <div className="text-2xl font-extrabold" style={{ color: kpi.color }}>{kpi.value}</div>
                    </div>
                ))}
            </div>

            {/* Toolbar */}
            <div className="flex flex-wrap gap-3 mb-6 items-center">
                {/* Region filter */}
                <div className="flex gap-1 bg-vct-elevated p-1 rounded-2xl border border-vct-border">
                    {ALL_REGIONS.map(r => (
                        <button key={r} onClick={() => setRegionFilter(r)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${regionFilter === r ? 'bg-blue-500/15 text-blue-400 shadow-sm' : 'text-vct-text-muted hover:text-vct-text'}`}>
                            {r === 'all' ? `Tất cả (${orgs.length})` : `${r} (${orgs.filter(o => o.region === r).length})`}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                    <VCT_Icons.Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-vct-text-muted" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Tìm đơn vị..."
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-vct-elevated border border-vct-border text-vct-text text-sm focus:outline-none focus:border-vct-accent/50"
                    />
                </div>
                
                <div className="ml-auto flex gap-2">
                    <VCT_Button variant="secondary" onClick={handleExportExcel}>
                        <VCT_Icons.Download size={16} className="mr-2" />
                        Xuất Excel
                    </VCT_Button>
                </div>
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-16 rounded-2xl bg-vct-elevated border border-vct-border animate-pulse" />)}
                </div>
            ) : filtered.length === 0 ? (
                <VCT_EmptyState
                    icon={<VCT_Icons.Building size={48} />}
                    title="Không tìm thấy đơn vị"
                    description="Thay đổi bộ lọc hoặc từ khóa tìm kiếm."
                />
            ) : (
                <div className="rounded-2xl border border-vct-border bg-vct-elevated overflow-hidden">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="border-b border-vct-border">
                                {['Tổ chức', 'Vùng', 'CLB', 'Thành viên', 'Trạng thái', 'Đại diện'].map(h => (
                                    <th key={h} className="px-4 py-3 text-xs font-semibold text-vct-text-muted text-left">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(org => {
                                const st = STATUS_META[org.status] ?? { color: '#64748b', label: org.status };
                                const rc = REGION_COLORS[org.region] ?? '#64748b';
                                return (
                                    <tr key={org.id} className="border-b border-vct-border/50 hover:bg-vct-bg/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="text-sm font-semibold text-vct-text">{org.name}</div>
                                            <div className="text-[11px] text-vct-text-muted mt-0.5">{org.abbreviation}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 rounded-lg text-[11px] font-semibold" style={{ background: `${rc}15`, color: rc }}>
                                                {org.region}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-bold text-vct-text">{org.club_count}</td>
                                        <td className="px-4 py-3 text-sm text-vct-text">{org.member_count.toLocaleString()}</td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 rounded-lg text-[11px] font-bold" style={{ background: `${st.color}15`, color: st.color }}>
                                                {st.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-vct-text-muted">{org.leader_name}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </VCT_PageContainer>
    );
}

export default Page_federation_organizations;
