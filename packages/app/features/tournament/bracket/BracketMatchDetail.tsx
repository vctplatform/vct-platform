'use client';
import * as React from 'react';
import { motion } from 'framer-motion';
import type { BracketMatch } from './BracketTypes';
import { VCT_Stack, VCT_Badge } from '../../components/vct-ui';

// ════════════════════════════════════════════════════════════════
// VCT PLATFORM — BRACKET MATCH DETAIL PANEL
// Floating popup showing selected match info
// ════════════════════════════════════════════════════════════════

interface BracketMatchDetailProps {
    match: BracketMatch;
    onClose: () => void;
}

export const BracketMatchDetail = ({ match, onClose }: BracketMatchDetailProps) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 100,
            background: 'var(--vct-bg-elevated)', borderRadius: 20,
            border: '1px solid var(--vct-border-subtle)', padding: 24,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            minWidth: 320, maxWidth: 400,
        }}
    >
        <VCT_Stack direction="row" justify="space-between" align="center" className="mb-4">
            <VCT_Stack direction="row" gap={8} align="center">
                <VCT_Badge text={`Trận #${match.match_no}`} type="info" />
                <VCT_Badge text={match.round_key} type="success" />
            </VCT_Stack>
            <button
                onClick={onClose}
                style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, fontSize: 18 }}
            >
                ✕
            </button>
        </VCT_Stack>

        <div style={{ display: 'flex', gap: 12 }}>
            {/* Red athlete */}
            <div style={{
                flex: 1, padding: 12, borderRadius: 12,
                background: 'rgba(239,68,68,0.06)',
                border: '1px solid rgba(239,68,68,0.2)',
                textAlign: 'center' as const,
            }}>
                <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: '#ef4444', margin: '0 auto 6px',
                }} />
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                    {match.red_athlete?.ten || '—'}
                </div>
                <div style={{ fontSize: 10, opacity: 0.5 }}>
                    {match.red_athlete?.doan || ''}
                </div>
            </div>

            <div style={{
                display: 'flex', alignItems: 'center',
                fontWeight: 900, fontSize: 18, opacity: 0.3,
            }}>
                VS
            </div>

            {/* Blue athlete */}
            <div style={{
                flex: 1, padding: 12, borderRadius: 12,
                background: 'rgba(59,130,246,0.06)',
                border: '1px solid rgba(59,130,246,0.2)',
                textAlign: 'center' as const,
            }}>
                <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: '#3b82f6', margin: '0 auto 6px',
                }} />
                <div style={{ fontSize: 13, fontWeight: 700 }}>
                    {match.blue_athlete?.ten || '—'}
                </div>
                <div style={{ fontSize: 10, opacity: 0.5 }}>
                    {match.blue_athlete?.doan || ''}
                </div>
            </div>
        </div>

        <div style={{ marginTop: 12, textAlign: 'center' as const }}>
            <VCT_Badge
                text={
                    match.status === 'HoanThanh' ? '✅ Hoàn thành' :
                    match.status === 'DangDau' ? '🔴 Đang đấu' :
                    '⏳ Chờ thi đấu'
                }
                type={
                    match.status === 'HoanThanh' ? 'success' :
                    match.status === 'DangDau' ? 'warning' :
                    'info'
                }
            />
        </div>
    </motion.div>
);
