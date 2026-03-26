'use client';
import * as React from 'react';
import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import {
    VCT_Button, VCT_Text, VCT_Stack, VCT_Badge, VCT_Toast,
} from '@vct/ui';
import { VCT_PageContainer, VCT_StatRow } from '@vct/ui';
import type { StatItem } from '@vct/ui';
import { VCT_Icons } from '@vct/ui';
import { useHangCans, useNoiDungQuyens } from '../hooks/useTournamentAPI';
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


// ════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ════════════════════════════════════════════════════════════════
export const Page_bracket = () => {
    const { data: hangCans } = useHangCans();
    const { data: noiDungQuyens } = useNoiDungQuyens();

    const noiDungOptions = useMemo(() => {
        const hc = hangCans || [];
        const nq = noiDungQuyens || [];
        return [
            ...hc.map(dk => ({
                value: `dk_${dk.id}`,
                label: `ĐK ${dk.gioi === 'nam' ? 'Nam' : 'Nữ'} ${dk.can_den ? `${dk.can_tu}-${dk.can_den}kg` : `>${dk.can_tu}kg`}`,
            })),
            ...nq
                .filter(q => q.hinh_thuc_thi_dau === 'dau_loai_ban_ket')
                .map(q => ({ value: `q_${q.id}`, label: `Quyền: ${q.ten}` })),
        ];
    }, [hangCans, noiDungQuyens]);

    const combatStore = useEntityCollection(repositories.combatMatches.mock);
    const [selectedND, setSelectedND] = useState('');

    useEffect(() => {
        if (!selectedND && noiDungOptions.length > 0) {
            setSelectedND(noiDungOptions[0]?.value || '');
        }
    }, [noiDungOptions, selectedND]);
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
                className="mb-6 flex-wrap gap-4">
                <div>
                    <VCT_Text variant="h1" className="mb-1">
                        🌿 Sơ đồ nhánh thi đấu
                    </VCT_Text>
                    <VCT_Text variant="small" className="opacity-60">
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
                { label: 'Schema', value: `${selectedSchema} VĐV`, icon: <VCT_Icons.GitMerge size={18} />, color: 'var(--vct-info)' },
                { label: 'Số vòng', value: numRounds, icon: <VCT_Icons.LayoutGrid size={18} />, color: 'var(--vct-accent-cyan)' },
                { label: 'Tổng trận', value: totalMatches, icon: <VCT_Icons.Swords size={18} />, color: 'var(--vct-warning)' },
                { label: 'Zoom', value: `${Math.round(zoom * 100)}%`, icon: <VCT_Icons.Search size={18} />, color: 'var(--vct-success)' },
            ] as StatItem[]} className="mb-6" />

            {/* Toolbar */}
            <BracketToolbar
                selectedND={selectedND}
                onNDChange={setSelectedND}
                contentOptions={noiDungOptions}
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
                className="mt-5 rounded-[20px] border border-(--vct-border-subtle) bg-(--vct-bg-card) overflow-hidden relative min-h-[500px]"
                {...{ style: { cursor: isDragging ? 'grabbing' : 'grab' } as React.CSSProperties }}
            >
                <div className="absolute top-3 right-3 z-10 bg-black/50 text-white px-3 py-1.5 rounded-lg text-[11px] font-semibold pointer-events-none opacity-70">
                    🖱 Scroll = Zoom | Kéo = Di chuyển
                </div>

                <div className="p-5" {...{ style: {
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: '0 0',
                    transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                } as React.CSSProperties }}>
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
