'use client';
import * as React from 'react';
import { SCHEMA_OPTIONS } from './BracketTypes';
import type { SchemaSize } from './BracketTypes';
import {
    VCT_Card, VCT_Button, VCT_Stack,
} from '../../components/vct-ui';

// ════════════════════════════════════════════════════════════════
// VCT PLATFORM — BRACKET TOOLBAR
// Schema selector, zoom controls, content dropdown
// ════════════════════════════════════════════════════════════════

interface ContentOption {
    value: string;
    label: string;
}

interface BracketToolbarProps {
    selectedND: string;
    onNDChange: (value: string) => void;
    contentOptions: ContentOption[];
    selectedSchema: SchemaSize;
    onSchemaChange: (schema: number) => void;
    canUpdate: boolean;
    zoom: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onResetView: () => void;
}

export const BracketToolbar = ({
    selectedND, onNDChange, contentOptions,
    selectedSchema, onSchemaChange, canUpdate,
    zoom, onZoomIn, onZoomOut, onResetView,
}: BracketToolbarProps) => (
    <VCT_Card>
        <VCT_Stack direction="row" gap={16} align="center" style={{ flexWrap: 'wrap' }}>
            {/* Nội dung selector */}
            <div>
                <label style={{
                    fontSize: 11, fontWeight: 700, opacity: 0.5,
                    textTransform: 'uppercase' as const, marginBottom: 4, display: 'block',
                }}>
                    Nội dung
                </label>
                <select
                    value={selectedND}
                    onChange={(e) => onNDChange(e.target.value)}
                    style={{
                        padding: '8px 16px', borderRadius: 12,
                        border: '1px solid var(--vct-border-subtle)',
                        background: 'var(--vct-bg-input)',
                        color: 'var(--vct-text-primary)',
                        fontSize: 13, fontWeight: 600,
                        outline: 'none', cursor: 'pointer', minWidth: 180,
                    }}
                >
                    {contentOptions.map(o => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>
            </div>

            {/* Schema selector */}
            <div>
                <label style={{
                    fontSize: 11, fontWeight: 700, opacity: 0.5,
                    textTransform: 'uppercase' as const, marginBottom: 4, display: 'block',
                }}>
                    Schema (Số VĐV)
                </label>
                <VCT_Stack direction="row" gap={4}>
                    {SCHEMA_OPTIONS.map(s => (
                        <button
                            key={s}
                            onClick={() => onSchemaChange(s)}
                            style={{
                                padding: '8px 14px', borderRadius: 10, border: 'none',
                                cursor: 'pointer', fontWeight: 700, fontSize: 13,
                                transition: 'all 0.2s',
                                background: selectedSchema === s ? '#3b82f6' : 'var(--vct-bg-elevated)',
                                color: selectedSchema === s ? '#fff' : 'var(--vct-text-secondary)',
                            }}
                            disabled={!canUpdate}
                        >
                            {s}
                        </button>
                    ))}
                </VCT_Stack>
            </div>

            <div className="flex-1" />

            {/* Zoom controls */}
            <VCT_Stack direction="row" gap={4} align="center">
                <VCT_Button variant="secondary" onClick={onZoomOut}
                    style={{ minWidth: 36, padding: '6px' }}>−</VCT_Button>
                <span style={{
                    fontSize: 12, fontWeight: 700, minWidth: 50,
                    textAlign: 'center' as const, opacity: 0.6,
                }}>
                    {Math.round(zoom * 100)}%
                </span>
                <VCT_Button variant="secondary" onClick={onZoomIn}
                    style={{ minWidth: 36, padding: '6px' }}>+</VCT_Button>
                <VCT_Button variant="secondary" onClick={onResetView}
                    style={{ fontSize: 12 }}>↻ Reset</VCT_Button>
            </VCT_Stack>
        </VCT_Stack>
    </VCT_Card>
);
