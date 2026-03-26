'use client';
import * as React from 'react';

// ════════════════════════════════════════════════════════════════
// VCT PLATFORM — BRACKET CONNECTOR LINES
// Branch and straight connector drawing with glow effects
// ════════════════════════════════════════════════════════════════

interface ConnectorProps {
    isActive: boolean;
    color: 'red' | 'blue';
    isHovered?: boolean;
}

const getConnectorStyle = ({ isActive, color, isHovered }: ConnectorProps) => {
    const activeColor = color === 'red' ? 'var(--vct-danger)' : 'var(--vct-info)';
    const glowId = color === 'red' ? 'glow-red' : 'glow-blue';
    const strokeW = isHovered ? 4 : (isActive ? 3 : 2);
    const strokeC = isHovered ? activeColor : (isActive ? activeColor : 'var(--vct-border-subtle)');
    return { activeColor, glowId, strokeW, strokeC };
};

// ── Branch Connector (L-shaped) ──────────────────────────────
interface DrawBranchProps extends ConnectorProps {
    startX: number;
    startY: number;
    nodeX: number;
    nodeY: number;
}

export const BracketBranch = ({ startX, startY, nodeX, nodeY, isActive, color, isHovered = false }: DrawBranchProps) => {
    const overlap = 2;
    const d = `M${startX - overlap} ${startY} H${nodeX} V${nodeY}`;
    const { activeColor, glowId, strokeW, strokeC } = getConnectorStyle({ isActive, color, isHovered });

    return (
        <>
            <path d={d} fill="none" stroke={strokeC} strokeWidth={strokeW}
                style={{ transition: 'stroke 0.2s, stroke-width 0.2s' }} />
            {(isActive || isHovered) && (
                <path d={d} fill="none" stroke={activeColor} strokeWidth={strokeW}
                    filter={`url(#${glowId})`} strokeLinecap="round" strokeLinejoin="round"
                    style={{ transition: 'stroke-width 0.2s' }} />
            )}
        </>
    );
};

// ── Straight Connector ───────────────────────────────────────
interface DrawStraightProps extends ConnectorProps {
    startX: number;
    startY: number;
    endX: number;
}

export const BracketStraight = ({ startX, startY, endX, isActive, color, isHovered = false }: DrawStraightProps) => {
    const overlap = 2;
    const d = `M${startX} ${startY} H${endX + overlap}`;
    const { activeColor, glowId, strokeW, strokeC } = getConnectorStyle({ isActive, color, isHovered });

    return (
        <>
            <path d={d} fill="none" stroke={strokeC} strokeWidth={strokeW}
                style={{ transition: 'stroke 0.2s, stroke-width 0.2s' }} />
            {(isActive || isHovered) && (
                <path d={d} fill="none" stroke={activeColor} strokeWidth={strokeW}
                    filter={`url(#${glowId})`} strokeLinecap="round"
                    style={{ transition: 'stroke-width 0.2s' }} />
            )}
        </>
    );
};
