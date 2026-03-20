'use client'

import * as React from 'react'
import { VCT_Stack } from '../components/vct-ui'
import { VCT_PageContainer, VCT_StatRow } from '../components/vct-ui'
import type { StatItem } from '../components/VCT_StatRow'
import { VCT_Icons } from '../components/vct-icons'

// ════════════════════════════════════════
// FEDERATION — ORG CHART (Tree View)
// ════════════════════════════════════════

interface OrgNode {
    id: string; name: string; type: string; head?: string; level: number
    children: OrgNode[]
}

const ORG_TREE: OrgNode = {
    id: 'root', name: 'Liên đoàn Võ cổ truyền Việt Nam', type: 'central', head: 'Chủ tịch: Nguyễn Văn A', level: 0,
    children: [
        {
            id: 'bch', name: 'Ban Chấp hành', type: 'committee', head: 'Tổng thư ký: Trần Thị B', level: 1,
            children: [
                { id: 'kt', name: 'Ban Kỹ thuật', type: 'department', head: 'Trưởng ban: Lê Văn C', level: 2, children: [] },
                { id: 'tt', name: 'Ban Trọng tài', type: 'department', head: 'Trưởng ban: Phạm Văn D', level: 2, children: [] },
                { id: 'tc', name: 'Ban Tổ chức-Thi đấu', type: 'department', head: 'Trưởng ban: Hoàng Thị E', level: 2, children: [] },
                { id: 'kl', name: 'Hội đồng Kỷ luật', type: 'department', head: 'Chủ tịch HĐ: Ngô Văn F', level: 2, children: [] },
                { id: 'tt2', name: 'Ban Truyền thông', type: 'department', head: 'Trưởng ban: Vũ Thị G', level: 2, children: [] },
            ]
        },
        {
            id: 'bkt', name: 'Ban Kiểm tra', type: 'oversight', head: 'Trưởng BKT: Đinh Văn H', level: 1,
            children: []
        },
        {
            id: 'regions', name: 'Liên đoàn cấp Tỉnh/TP', type: 'federation_branch', level: 1,
            children: [
                { id: 'hcm', name: 'LĐ Võ cổ truyền TP.HCM', type: 'provincial', head: 'Chủ tịch: ...', level: 2, children: [] },
                { id: 'hn', name: 'LĐ Võ cổ truyền Hà Nội', type: 'provincial', head: 'Chủ tịch: ...', level: 2, children: [] },
                { id: 'bdi', name: 'LĐ Võ cổ truyền Bình Định', type: 'provincial', head: 'Chủ tịch: ...', level: 2, children: [] },
            ]
        },
    ]
}

const TYPE_COLORS: Record<string, string> = {
    central: '#8b5cf6', committee: '#0ea5e9', department: '#10b981',
    oversight: '#f59e0b', federation_branch: '#ec4899', provincial: '#7c3aed',
}

const TreeNode: React.FC<{ node: OrgNode; isLast?: boolean }> = ({ node, isLast }) => {
    const [expanded, setExpanded] = React.useState(node.level < 2)
    const hasChildren = node.children.length > 0
    const color = TYPE_COLORS[node.type] || '#64748b'

    return (
        <div style={{ marginLeft: node.level > 0 ? 28 : 0 }}>
            <div
                className="flex items-center gap-3 p-3 rounded-xl border border-(--vct-border-subtle) bg-(--vct-bg-glass) hover:border-(--vct-accent-cyan) transition-all cursor-pointer mb-2"
                onClick={() => hasChildren && setExpanded(!expanded)}
            >
                {hasChildren && (
                    <button className="w-6 h-6 rounded-lg bg-(--vct-bg-elevated) flex items-center justify-center text-xs" style={{ color }}>
                        {expanded ? '−' : '+'}
                    </button>
                )}
                {!hasChildren && <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: color + '20', color }}><div className="w-2 h-2 rounded-full" style={{ background: color }} /></div>}
                <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-(--vct-text-primary) truncate">{node.name}</div>
                    {node.head && <div className="text-xs opacity-50 truncate">{node.head}</div>}
                </div>
                <div className="text-[10px] uppercase font-bold px-2 py-1 rounded-full" style={{ background: color + '15', color }}>{node.type}</div>
            </div>
            {expanded && hasChildren && (
                <div className="relative" style={{ borderLeft: `2px solid ${color}30`, marginLeft: 12, paddingLeft: 0 }}>
                    {node.children.map((child, i) => (
                        <TreeNode key={child.id} node={child} isLast={i === node.children.length - 1} />
                    ))}
                </div>
            )}
        </div>
    )
}

export const Page_federation_org_chart = () => {
    return (
        <VCT_PageContainer size="wide" animated>
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight text-(--vct-text-primary)">Sơ đồ Tổ chức</h1>
                <p className="text-sm text-(--vct-text-secondary) mt-1">Cơ cấu tổ chức Liên đoàn Võ cổ truyền Việt Nam — từ trung ương đến địa phương.</p>
            </div>

            <VCT_StatRow items={[
                { label: 'Ban chuyên môn', value: 5, icon: <VCT_Icons.Building2 size={18} />, color: '#0ea5e9' },
                { label: 'LĐ cấp tỉnh', value: 48, icon: <VCT_Icons.MapPin size={18} />, color: '#8b5cf6' },
                { label: 'Tổng nhân sự', value: 156, icon: <VCT_Icons.Users size={18} />, color: '#10b981' },
                { label: 'Vị trí trống', value: 12, icon: <VCT_Icons.AlertCircle size={18} />, color: '#f59e0b' },
            ] as StatItem[]} className="mb-6" />

            <div className="rounded-2xl border border-(--vct-border-subtle) bg-(--vct-bg-card) p-6">
                <TreeNode node={ORG_TREE} />
            </div>
        </VCT_PageContainer>
    )
}
