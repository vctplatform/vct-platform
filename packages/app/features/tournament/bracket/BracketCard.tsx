'use client';
import * as React from 'react';
import { CW, CH, SIDE_W } from './BracketTypes';
import type { BracketPlayer } from './BracketTypes';

// ════════════════════════════════════════════════════════════════
// VCT PLATFORM — BRACKET SVG CARD COMPONENTS
// ════════════════════════════════════════════════════════════════

// ── Player Card ──────────────────────────────────────────────
interface SVGCardProps {
    x: number;
    y: number;
    player: BracketPlayer | null;
    colorClass: 'red' | 'blue';
    isLoser?: boolean;
    placeholderText?: string;
    winnerId?: string | null;
    isHovered?: boolean;
    onHover?: (hovered: boolean) => void;
}

export const SVG_Card = ({
    x, y, player, colorClass, isLoser, placeholderText,
    winnerId, isHovered, onHover,
}: SVGCardProps) => {
    const isRed = colorClass === 'red';
    const accentColor = isHovered
        ? (isRed ? '#f43f5e' : 'var(--vct-info)')
        : (isRed ? '#e11d48' : 'var(--vct-info)');
    const bgTint = isHovered
        ? (isRed ? '#ffe4e6' : 'var(--vct-info-muted)')
        : (isRed ? '#fff1f2' : '#eff6ff');
    const nameColor = 'var(--vct-text-primary)';
    const unitColor = 'var(--vct-bg-input)';
    const loserOpacity = isLoser ? 0.4 : 1;

    return (
        <g
            opacity={loserOpacity}
            transform={`translate(${x}, ${y})`}
            onMouseEnter={() => onHover?.(true)}
            onMouseLeave={() => onHover?.(false)}
            style={{ cursor: player ? 'pointer' : 'default', transition: 'all 0.2s' }}
        >
            {/* Card Shadow */}
            <rect width={CW} height={CH} rx={10} fill="white"
                filter={isHovered ? "url(#card-shadow-hover)" : "url(#card-shadow)"} />

            {/* Main Background Tint */}
            <rect width={CW} height={CH} rx={10} fill={bgTint}
                style={{ transition: 'fill 0.2s' }} />

            {/* Thick Side Accent Block */}
            <path
                d={`M0 10 A10 10 0 0 1 10 0 H${SIDE_W} V${CH} H10 A10 10 0 0 1 0 ${CH - 10} Z`}
                fill={accentColor}
                style={{ transition: 'fill 0.2s' }}
            />

            {/* Inner Content Border */}
            <rect width={CW} height={CH} rx={10} fill="none"
                stroke={accentColor} strokeWidth={isHovered ? 2 : 1.5}
                style={{ transition: 'stroke 0.2s, stroke-width 0.2s' }} />

            {player ? (
                <>
                    <text x={SIDE_W + 12} y={26} fill={nameColor} fontSize={14}
                        fontWeight={900} style={{ letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                        {player.ten.toUpperCase()}
                    </text>
                    <text x={SIDE_W + 12} y={46} fill={unitColor} fontSize={11}
                        fontWeight={500} fontStyle="italic" opacity={0.8}>
                        {player.doan}
                    </text>

                    {winnerId && winnerId === player.id && (
                        <g transform={`translate(${CW - 24}, ${CH / 2})`}>
                            <circle r={10} fill="#fef3c7" stroke="var(--vct-warning)" strokeWidth={1} />
                            <text textAnchor="middle" y={4} fontSize={12}>🏆</text>
                        </g>
                    )}
                </>
            ) : (
                <text x={SIDE_W + 12} y={35} fill="var(--vct-text-tertiary)" fontSize={11}
                    fontStyle="italic" opacity={0.6}>
                    {placeholderText || 'CHỜ KẾT QUẢ...'}
                </text>
            )}

            {isLoser && (
                <line x1={SIDE_W + 5} y1={CH / 2} x2={CW - 5} y2={CH / 2}
                    stroke="var(--vct-text-tertiary)" strokeWidth={1.5} strokeDasharray="4,4" opacity={0.4} />
            )}
        </g>
    );
};

// ── Match Node ───────────────────────────────────────────────
interface MatchNodeProps {
    x: number;
    y: number;
    matchNo: string;
    onClick: () => void;
    isDone: boolean;
}

export const BracketMatchNode = ({ x, y, matchNo, onClick, isDone }: MatchNodeProps) => (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
        <circle cx={x} cy={y} r={18}
            fill={isDone ? 'url(#node-active-grad)' : 'var(--vct-bg-input)'}
            stroke={isDone ? 'var(--vct-success)' : 'var(--vct-text-secondary)'} strokeWidth={2}
            filter="url(#card-shadow)" />
        <text x={x} y={y + 5} textAnchor="middle" fill="white"
            fontSize={11} fontWeight={800}>
            {matchNo}
        </text>
    </g>
);

// ── Champion Box ─────────────────────────────────────────────
interface ChampionBoxProps {
    x: number;
    y: number;
    winner: BracketPlayer | null;
    isHovered?: boolean;
    onHover?: (h: boolean) => void;
}

export const BracketChampionBox = ({ x, y, winner, isHovered, onHover }: ChampionBoxProps) => (
    <g transform={`translate(${x}, ${y})`}>
        <rect width={CW} height={CH + 10} rx={18}
            fill={isHovered ? "rgba(245,158,11,0.15)" : "rgba(245,158,11,0.05)"}
            stroke="var(--vct-warning)" strokeWidth={isHovered ? 3.5 : 2.5}
            strokeDasharray={winner ? '0' : '8,5'}
            filter={winner || isHovered ? 'url(#glow-gold)' : 'none'}
            style={{ transition: 'all 0.2s' }}
        />
        <text x={CW / 2} y={-12} textAnchor="middle" fill="var(--vct-warning)"
            fontSize={12} fontWeight={900} style={{ letterSpacing: '0.1em' }}>
            NHÀ VÔ ĐỊCH
        </text>
        {winner ? (
            <SVG_Card x={0} y={5} player={winner} colorClass="red"
                winnerId={winner.id} isHovered={isHovered} onHover={onHover} />
        ) : (
            <text x={CW / 2} y={(CH + 10) / 2 + 5} textAnchor="middle"
                fill="var(--vct-warning)" fontSize={13} fontStyle="italic" opacity={0.6}>
                Đang chờ...
            </text>
        )}
    </g>
);
