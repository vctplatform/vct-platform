'use client';
import * as React from 'react';
import { useState, useMemo, useRef, useCallback } from 'react';
import {
    VCT_Button, VCT_Text, VCT_Stack, VCT_Badge, VCT_Toast,
} from '../components/vct-ui';
import { VCT_PageContainer, VCT_StatRow } from '../components/vct-ui';
import type { StatItem } from '../components/VCT_StatRow';
import { VCT_Icons } from '../components/vct-icons';
import { HANG_CANS, NOI_DUNG_QUYENS } from '../data/mock-data';
import { repositories, useEntityCollection } from '../data/repository';
import { useRouteActionGuard } from '../hooks/use-route-action-guard';

// Import from bracket module
import {
    BracketEngine,
    BracketToolbar,
    BracketMatchDetail,
    generateSlotsFromStore,
    generateMockMatches,
    SCHEMA_OPTIONS,
} from './bracket';
import type { BracketMatch, SchemaSize } from './bracket';

// ════════════════════════════════════════════════════════════════
// CONTENT OPTIONS
// ════════════════════════════════════════════════════════════════
const NOI_DUNG_OPTIONS = [
    ...HANG_CANS.map(dk => ({
        value: `dk_${dk.id}`,
        label: `ĐK ${dk.gioi === 'nam' ? 'Nam' : 'Nữ'} ${dk.can_den ? `${dk.can_tu}-${dk.can_den}kg` : `>${dk.can_tu}kg`}`,
    })),
    ...NOI_DUNG_QUYENS
        .filter(q => q.hinh_thuc_thi_dau === 'dau_loai_ban_ket')
        .map(q => ({ value: `q_${q.id}`, label: `Quyền: ${q.ten}` })),
];

// ════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ════════════════════════════════════════════════════════════════
export const Page_bracket = () => {
    const combatStore = useEntityCollection(repositories.combatMatches.mock);
    const [selectedND, setSelectedND] = useState(NOI_DUNG_OPTIONS[0]?.value ?? '');
    const [selectedSchema, setSelectedSchema] = useState<number>(8);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [selectedMatch, setSelectedMatch] = useState<BracketMatch | null>(null);
    const [hoveredPlayerId, setHoveredPlayerId] = useState<string | null>(null);
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });
    const containerRef = useRef<HTMLDivElement>(null);

    const showToast = useCallback((msg: string, type = 'success') => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3500);
    }, []);

    const { can, requireAction } = useRouteActionGuard('/bracket', {
        notifyDenied: (message) => showToast(message, 'error'),
    });

    const permissions = useMemo(() => ({
        canUpdate: can('update'),
        canExport: can('export'),
    }), [can]);

    const liveRoster = useMemo(
        () =>
            combatStore.items.flatMap((match) => [
                { id: match.vdv_do.id, ten: match.vdv_do.ten, doan: match.vdv_do.doan },
                { id: match.vdv_xanh.id, ten: match.vdv_xanh.ten, doan: match.vdv_xanh.doan },
            ]),
        [combatStore.items]
    );

    const slots = useMemo(
        () => generateSlotsFromStore(selectedSchema, liveRoster),
        [selectedSchema, liveRoster]
    );
    const matches = useMemo(() => generateMockMatches(selectedSchema), [selectedSchema]);

    const numRounds = Math.log2(selectedSchema);
    const totalMatches = selectedSchema - 1;

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.08 : 0.08;
        setZoom(prev => Math.max(0.15, Math.min(2, prev + delta)));
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 0) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) {
            setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
        }
    };

    const handleMouseUp = () => setIsDragging(false);

    const resetView = () => {
        setZoom(1);
        setPan({ x: 0, y: 0 });
    };

    const handleNodeClick = (match: BracketMatch) => {
        setSelectedMatch(match);
    };

    const handleSchemaChange = (schema: number) => {
        if (!requireAction('update', 'điều chỉnh sơ đồ nhánh')) return;
        setSelectedSchema(schema);
        resetView();
    };

    const handleExportBracket = () => {
        if (!requireAction('export', 'xuất sơ đồ nhánh')) return;
        window.print();
        showToast('Đang mở bản in sơ đồ nhánh...', 'info');
    };

    return (
        <VCT_PageContainer size="wide" animated>
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type}
                onClose={() => setToast(prev => ({ ...prev, show: false }))} />

            {/* Header */}
            <VCT_Stack direction="row" justify="space-between" align="center"
                style={{ marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <VCT_Text variant="h1" style={{ marginBottom: 4 }}>
                        🌿 Sơ đồ nhánh thi đấu
                    </VCT_Text>
                    <VCT_Text variant="small" style={{ opacity: 0.6 }}>
                        Single-elimination bracket — Zoom & kéo để xem chi tiết
                    </VCT_Text>
                </div>
                <VCT_Stack direction="row" gap={8} align="center">
                    <VCT_Badge text={`${selectedSchema} VĐV`} type="info" />
                    <VCT_Badge text={`${numRounds} vòng`} type="success" />
                    <VCT_Badge text={`${totalMatches} trận`} type="warning" />
                    <VCT_Button variant="secondary"
                        icon={<VCT_Icons.Download size={14} />}
                        onClick={handleExportBracket}
                        disabled={!permissions.canExport}>
                        Xuất sơ đồ
                    </VCT_Button>
                </VCT_Stack>
            </VCT_Stack>

            {/* KPI */}
            <VCT_StatRow items={[
                { label: 'Schema', value: `${selectedSchema} VĐV`, icon: <VCT_Icons.GitMerge size={18} />, color: '#8b5cf6' },
                { label: 'Số vòng', value: numRounds, icon: <VCT_Icons.LayoutGrid size={18} />, color: '#0ea5e9' },
                { label: 'Tổng trận', value: totalMatches, icon: <VCT_Icons.Swords size={18} />, color: '#f59e0b' },
                { label: 'Zoom', value: `${Math.round(zoom * 100)}%`, icon: <VCT_Icons.Search size={18} />, color: '#10b981' },
            ] as StatItem[]} className="mb-6" />

            {/* Toolbar */}
            <BracketToolbar
                selectedND={selectedND}
                onNDChange={setSelectedND}
                contentOptions={NOI_DUNG_OPTIONS}
                selectedSchema={selectedSchema as SchemaSize}
                onSchemaChange={handleSchemaChange}
                canUpdate={permissions.canUpdate}
                zoom={zoom}
                onZoomIn={() => setZoom(prev => Math.min(2, prev + 0.15))}
                onZoomOut={() => setZoom(prev => Math.max(0.15, prev - 0.15))}
                onResetView={resetView}
            />

            {/* Bracket Canvas */}
            <div
                ref={containerRef}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{
                    marginTop: 20, borderRadius: 20,
                    border: '1px solid var(--vct-border-subtle)',
                    background: 'var(--vct-bg-card)', overflow: 'hidden',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    position: 'relative', minHeight: 500,
                }}
            >
                <div style={{
                    position: 'absolute', top: 12, right: 12, zIndex: 10,
                    background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '6px 12px',
                    borderRadius: 8, fontSize: 11, fontWeight: 600, pointerEvents: 'none', opacity: 0.7,
                }}>
                    🖱 Scroll = Zoom | Kéo = Di chuyển
                </div>

                <div style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: '0 0',
                    transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                    padding: 20,
                }}>
                    <BracketEngine
                        numSlots={selectedSchema}
                        slots={slots}
                        matches={matches}
                        onNodeClick={handleNodeClick}
                        hoveredPlayerId={hoveredPlayerId}
                        setHoveredPlayerId={setHoveredPlayerId}
                    />
                </div>
            </div>

            {/* Match Detail Popup */}
            {selectedMatch && (
                <BracketMatchDetail
                    match={selectedMatch}
                    onClose={() => setSelectedMatch(null)}
                />
            )}
        </VCT_PageContainer>
    );
};
