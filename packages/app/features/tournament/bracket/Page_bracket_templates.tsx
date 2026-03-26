'use client';
import * as React from 'react';
import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    VCT_PageContainer, VCT_Text, VCT_Stack, VCT_Badge, VCT_StatRow, VCT_Card, VCT_Button, VCT_Toast,
} from '@vct/ui';
import type { StatItem } from '@vct/ui';
import { VCT_Icons } from '@vct/ui';
import {
    SCHEMA_OPTIONS, getBracketSchemaInfo,
    generateMockSlots, generateMockMatches,
    BracketEngine,
} from './index';
import type { SchemaSize, BracketMatch } from './BracketTypes';

// ════════════════════════════════════════════════════════════════
// VCT PLATFORM — BRACKET TEMPLATE GALLERY
// Hiển thị tất cả template sơ đồ nhánh từ 2 → 128 VĐV
// ════════════════════════════════════════════════════════════════

const CARD_ANIMATION = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: (i: number) => ({
        opacity: 1, y: 0, scale: 1,
        transition: { delay: i * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
    }),
};

// ── Template Preview Card ────────────────────────────────────
const BracketTemplateCard = ({
    schema, index, selectedSchema, onSelect,
}: {
    schema: SchemaSize;
    index: number;
    selectedSchema: SchemaSize | null;
    onSelect: (s: SchemaSize) => void;
}) => {
    const info = getBracketSchemaInfo(schema);
    const isSelected = selectedSchema === schema;

    const slots = useMemo(() => generateMockSlots(schema), [schema]);
    const matches = useMemo(() => generateMockMatches(schema), [schema]);

    // Calculate preview viewport size
    const previewHeight = Math.min(schema * 12 + 80, 320);

    return (
        <motion.div
            custom={index}
            initial="hidden"
            animate="visible"
            variants={CARD_ANIMATION}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            onClick={() => onSelect(schema)}
            style={{
                cursor: 'pointer',
                borderRadius: 20,
                border: isSelected
                    ? `2.5px solid ${info.color}`
                    : '1px solid var(--vct-border-subtle)',
                background: isSelected
                    ? `linear-gradient(135deg, ${info.color}08, ${info.color}15)`
                    : 'var(--vct-bg-card)',
                overflow: 'hidden',
                transition: 'all 0.3s cubic-bezier(0.22, 1, 0.36, 1)',
                boxShadow: isSelected
                    ? `0 12px 40px ${info.color}30`
                    : '0 4px 16px rgba(0,0,0,0.06)',
                position: 'relative',
            }}
        >
            {/* Header */}
            <div style={{
                padding: '20px 20px 12px',
                borderBottom: '1px solid var(--vct-border-subtle)',
                background: isSelected
                    ? `linear-gradient(135deg, ${info.color}15, transparent)`
                    : 'transparent',
            }}>
                <VCT_Stack direction="row" justify="space-between" align="center">
                    <VCT_Stack direction="row" gap={10} align="center">
                        <div style={{
                            width: 44, height: 44, borderRadius: 14,
                            background: `linear-gradient(135deg, ${info.color}20, ${info.color}40)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 22,
                        }}>
                            {info.icon}
                        </div>
                        <div>
                            <VCT_Text variant="h3" style={{ fontSize: 16, marginBottom: 2 }}>
                                Schema {schema}
                            </VCT_Text>
                            <VCT_Text variant="small" style={{ opacity: 0.5, fontSize: 11 }}>
                                {info.label}
                            </VCT_Text>
                        </div>
                    </VCT_Stack>
                    <div style={{
                        background: info.color,
                        color: 'var(--vct-bg-elevated)',
                        padding: '4px 12px',
                        borderRadius: 20,
                        fontSize: 13,
                        fontWeight: 800,
                    }}>
                        {schema} VĐV
                    </div>
                </VCT_Stack>
            </div>

            {/* Stats Row */}
            <div style={{
                padding: '10px 20px',
                display: 'flex', gap: 16,
                background: 'var(--vct-bg-elevated)',
                borderBottom: '1px solid var(--vct-border-subtle)',
            }}>
                <div style={{ flex: 1, textAlign: 'center' as const }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: info.color }}>{info.numRounds}</div>
                    <div style={{ fontSize: 10, opacity: 0.5, fontWeight: 600, textTransform: 'uppercase' as const }}>Vòng đấu</div>
                </div>
                <div style={{ width: 1, background: 'var(--vct-border-subtle)' }} />
                <div style={{ flex: 1, textAlign: 'center' as const }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: info.color }}>{info.totalMatches}</div>
                    <div style={{ fontSize: 10, opacity: 0.5, fontWeight: 600, textTransform: 'uppercase' as const }}>Tổng trận</div>
                </div>
                <div style={{ width: 1, background: 'var(--vct-border-subtle)' }} />
                <div style={{ flex: 1, textAlign: 'center' as const }}>
                    <div style={{ fontSize: 18, fontWeight: 900, color: info.color }}>{schema / 2}</div>
                    <div style={{ fontSize: 10, opacity: 0.5, fontWeight: 600, textTransform: 'uppercase' as const }}>Trận vòng 1</div>
                </div>
            </div>

            {/* SVG Bracket Preview */}
            <div style={{
                padding: '12px',
                overflow: 'hidden',
                height: previewHeight,
                position: 'relative',
            }}>
                <div style={{
                    transform: schema <= 4
                        ? 'scale(0.55) translateX(-20%)'
                        : schema <= 8
                            ? 'scale(0.35) translateX(-30%) translateY(-20%)'
                            : schema <= 16
                                ? 'scale(0.2) translateX(-35%) translateY(-30%)'
                                : schema <= 32
                                    ? 'scale(0.12) translateX(-38%) translateY(-35%)'
                                    : schema <= 64
                                        ? 'scale(0.07) translateX(-40%) translateY(-38%)'
                                        : 'scale(0.04) translateX(-42%) translateY(-40%)',
                    transformOrigin: '0 0',
                    pointerEvents: 'none',
                }}>
                    <BracketEngine
                        numSlots={schema}
                        slots={slots}
                        matches={matches}
                        onNodeClick={() => {}}
                        preview
                    />
                </div>

                {/* Gradient overlay */}
                <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0,
                    height: 60,
                    background: isSelected
                        ? `linear-gradient(transparent, ${info.color}08)`
                        : 'linear-gradient(transparent, var(--vct-bg-card))',
                    pointerEvents: 'none',
                }} />
            </div>

            {/* Footer Description */}
            <div style={{
                padding: '12px 20px 16px',
                borderTop: '1px solid var(--vct-border-subtle)',
            }}>
                <VCT_Text variant="small" style={{ opacity: 0.6, fontSize: 11, lineHeight: 1.5 }}>
                    {info.description}
                </VCT_Text>
            </div>

            {/* Selection indicator */}
            {isSelected && (
                <div style={{
                    position: 'absolute', top: 12, right: 12,
                    width: 28, height: 28, borderRadius: '50%',
                    background: info.color, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                }}>
                    <span style={{ color: 'var(--vct-bg-elevated)', fontWeight: 900, fontSize: 14 }}>✓</span>
                </div>
            )}
        </motion.div>
    );
};

// ── Expanded Preview Panel ───────────────────────────────────
const ExpandedPreview = ({
    schema, onClose,
}: {
    schema: SchemaSize;
    onClose: () => void;
}) => {
    const info = getBracketSchemaInfo(schema);
    const slots = useMemo(() => generateMockSlots(schema), [schema]);
    const matches = useMemo(() => generateMockMatches(schema), [schema]);
    const [zoom, setZoom] = useState(schema <= 8 ? 0.9 : schema <= 16 ? 0.6 : schema <= 32 ? 0.4 : schema <= 64 ? 0.25 : 0.15);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.08 : 0.08;
        setZoom(prev => Math.max(0.03, Math.min(2, prev + delta)));
    };
    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button === 0) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
        }
    };
    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging) setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    };
    const handleMouseUp = () => setIsDragging(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            style={{ marginTop: 24 }}
        >
            <VCT_Card>
                <VCT_Stack direction="row" justify="space-between" align="center" style={{ marginBottom: 16 }}>
                    <VCT_Stack direction="row" gap={12} align="center">
                        <span style={{ fontSize: 28 }}>{info.icon}</span>
                        <div>
                            <VCT_Text variant="h2" style={{ fontSize: 20 }}>
                                Schema {schema} — {info.label}
                            </VCT_Text>
                            <VCT_Text variant="small" style={{ opacity: 0.5 }}>
                                {info.description}
                            </VCT_Text>
                        </div>
                    </VCT_Stack>
                    <VCT_Stack direction="row" gap={8} align="center">
                        <VCT_Badge text={`${info.numRounds} vòng`} type="info" />
                        <VCT_Badge text={`${info.totalMatches} trận`} type="warning" />
                        <VCT_Button variant="secondary" onClick={() => setZoom(prev => Math.max(0.03, prev - 0.1))}
                            style={{ minWidth: 36, padding: '6px' }}>−</VCT_Button>
                        <span style={{ fontSize: 11, fontWeight: 700, minWidth: 44, textAlign: 'center' as const, opacity: 0.6 }}>
                            {Math.round(zoom * 100)}%
                        </span>
                        <VCT_Button variant="secondary" onClick={() => setZoom(prev => Math.min(2, prev + 0.1))}
                            style={{ minWidth: 36, padding: '6px' }}>+</VCT_Button>
                        <VCT_Button variant="secondary"
                            onClick={() => { setZoom(schema <= 8 ? 0.9 : schema <= 16 ? 0.6 : schema <= 32 ? 0.4 : schema <= 64 ? 0.25 : 0.15); setPan({ x: 0, y: 0 }); }}
                            style={{ fontSize: 11 }}>↻</VCT_Button>
                        <VCT_Button variant="secondary" onClick={onClose}
                            icon={<VCT_Icons.X size={14} />}>
                            Đóng
                        </VCT_Button>
                    </VCT_Stack>
                </VCT_Stack>

                {/* Bracket Canvas */}
                <div
                    onWheel={handleWheel}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    style={{
                        borderRadius: 16, border: '1px solid var(--vct-border-subtle)',
                        background: 'var(--vct-bg-elevated)', overflow: 'hidden',
                        cursor: isDragging ? 'grabbing' : 'grab',
                        position: 'relative', minHeight: 500,
                    }}
                >
                    <div style={{
                        position: 'absolute', top: 10, right: 10, zIndex: 10,
                        background: 'rgba(0,0,0,0.5)', color: 'var(--vct-bg-elevated)', padding: '5px 10px',
                        borderRadius: 8, fontSize: 10, fontWeight: 600, pointerEvents: 'none', opacity: 0.7,
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
                            numSlots={schema}
                            slots={slots}
                            matches={matches}
                            onNodeClick={() => {}}
                        />
                    </div>
                </div>
            </VCT_Card>
        </motion.div>
    );
};

// ════════════════════════════════════════════════════════════════
// MAIN GALLERY PAGE
// ════════════════════════════════════════════════════════════════
export const Page_bracket_templates = () => {
    const [selectedSchema, setSelectedSchema] = useState<SchemaSize | null>(null);
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });

    const showToast = useCallback((msg: string, type = 'success') => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3500);
    }, []);

    const handleSelectSchema = (s: SchemaSize) => {
        setSelectedSchema(prev => prev === s ? null : s);
        if (selectedSchema !== s) {
            showToast(`Đã chọn Schema ${s} VĐV`, 'info');
        }
    };

    // Overall stats
    const totalSchemas = SCHEMA_OPTIONS.length;
    const maxRounds = Math.log2(128);

    return (
        <VCT_PageContainer size="wide" animated>
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type}
                onClose={() => setToast(prev => ({ ...prev, show: false }))} />

            {/* Header */}
            <VCT_Stack direction="row" justify="space-between" align="center"
                style={{ marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <VCT_Text variant="h1" style={{ marginBottom: 4 }}>
                        🌿 Bộ Template Sơ đồ nhánh
                    </VCT_Text>
                    <VCT_Text variant="small" style={{ opacity: 0.6 }}>
                        Single-elimination bracket templates — Schema từ 2 đến 128 VĐV
                    </VCT_Text>
                </div>
                <VCT_Stack direction="row" gap={8} align="center">
                    <VCT_Badge text={`${totalSchemas} templates`} type="info" />
                    <VCT_Badge text={`Tối đa ${maxRounds} vòng`} type="success" />
                </VCT_Stack>
            </VCT_Stack>

            {/* KPI Stats */}
            <VCT_StatRow items={[
                { label: 'Templates', value: totalSchemas, icon: <VCT_Icons.LayoutGrid size={18} />, color: 'var(--vct-info)' },
                { label: 'Min VĐV', value: 2, icon: <VCT_Icons.Users size={18} />, color: 'var(--vct-danger)' },
                { label: 'Max VĐV', value: 128, icon: <VCT_Icons.Users size={18} />, color: 'var(--vct-info)' },
                { label: 'Max vòng', value: maxRounds, icon: <VCT_Icons.GitMerge size={18} />, color: 'var(--vct-success)' },
            ] as StatItem[]} className="mb-6" />

            {/* Template Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340, 1fr))',
                gap: 20,
                marginTop: 20,
            }}>
                {SCHEMA_OPTIONS.map((schema, idx) => (
                    <BracketTemplateCard
                        key={schema}
                        schema={schema}
                        index={idx}
                        selectedSchema={selectedSchema}
                        onSelect={handleSelectSchema}
                    />
                ))}
            </div>

            {/* Expanded Preview */}
            {selectedSchema && (
                <ExpandedPreview
                    schema={selectedSchema}
                    onClose={() => setSelectedSchema(null)}
                />
            )}
        </VCT_PageContainer>
    );
};
