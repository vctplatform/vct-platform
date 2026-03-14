'use client';
import * as React from 'react';
import { CW, CH } from './BracketTypes';
import type { BracketPlayer, BracketMatch } from './BracketTypes';
import { BracketSVGDefs, BRACKET_FONT_IMPORT } from './BracketSVGDefs';
import { SVG_Card, BracketMatchNode, BracketChampionBox } from './BracketCard';
import { BracketBranch, BracketStraight } from './BracketConnectors';
import { useBracketLayout } from './useBracketLayout';
import { useBracketData } from './useBracketData';

// ════════════════════════════════════════════════════════════════
// VCT PLATFORM — BRACKET ENGINE
// Generic SVG bracket renderer for any schema (2→128)
// ════════════════════════════════════════════════════════════════

interface BracketEngineProps {
    numSlots: number;
    slots: (BracketPlayer | null)[];
    matches: BracketMatch[];
    onNodeClick: (m: BracketMatch) => void;
    hoveredPlayerId?: string | null;
    setHoveredPlayerId?: (id: string | null) => void;
    /** If true, renders a compact preview (no interaction) */
    preview?: boolean;
}

export const BracketEngine = ({
    numSlots, slots, matches, onNodeClick,
    hoveredPlayerId, setHoveredPlayerId, preview,
}: BracketEngineProps) => {
    const layout = useBracketLayout(numSlots);
    const { roundData, champPlayer } = useBracketData(numSlots, slots, matches);

    const {
        numRounds, roundNames,
        xRounds, xChamp, nxRounds,
        allRoundCoords, champY,
        svgW, svgH,
    } = layout;

    const endX = (x: number) => x + CW;

    return (
        <svg
            width={svgW}
            height={svgH}
            viewBox={`0 0 ${svgW} ${svgH}`}
            style={{
                fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif",
                ...(preview ? { pointerEvents: 'none' } : {}),
            }}
        >
            <style>{BRACKET_FONT_IMPORT}</style>
            <BracketSVGDefs />

            {/* Round headers */}
            {roundNames.map((name, i) => (
                <text
                    key={`hdr-${i}`}
                    x={(xRounds[i] ?? 0) + CW / 2}
                    y={30}
                    textAnchor="middle"
                    fill={i === numRounds - 1 ? '#dc2626' : '#64748b'}
                    fontWeight={800}
                    fontSize={preview ? 10 : 14}
                >
                    {name.toUpperCase()}
                </text>
            ))}
            <text
                x={xChamp + CW / 2}
                y={30}
                textAnchor="middle"
                fill="#f59e0b"
                fontWeight={800}
                fontSize={preview ? 10 : 14}
            >
                VÔ ĐỊCH 🏆
            </text>

            {/* Render each round */}
            {roundData.map((rd, rIdx) =>
                rd.map((item, i) => {
                    const roundCoords = allRoundCoords[rIdx] || [];
                    const coords = roundCoords[i];
                    if (!coords) return null;
                    const x = xRounds[rIdx] ?? 0;
                    const nx = nxRounds[rIdx] ?? 0;
                    const nextX = rIdx < numRounds - 1 ? (xRounds[rIdx + 1] ?? xChamp) : xChamp;

                    const yRed = rIdx === 0 ? coords.r : coords.prevNode1 - CH / 2;
                    const yBlue = rIdx === 0 ? coords.b : coords.prevNode2 - CH / 2;

                    const isRedHovered = hoveredPlayerId && item.pRed?.id === hoveredPlayerId;
                    const isBlueHovered = hoveredPlayerId && item.pBlue?.id === hoveredPlayerId;

                    return (
                        <g key={`r${rIdx}-m${i}`}>
                            {/* Branch lines */}
                            <BracketBranch
                                startX={endX(x)} startY={yRed + CH / 2}
                                nodeX={nx} nodeY={coords.node}
                                isActive={item.redWin} color="red"
                                isHovered={!!isRedHovered}
                            />
                            <BracketBranch
                                startX={endX(x)} startY={yBlue + CH / 2}
                                nodeX={nx} nodeY={coords.node}
                                isActive={item.blueWin} color="blue"
                                isHovered={!!isBlueHovered}
                            />
                            <BracketStraight
                                startX={nx} startY={coords.node} endX={nextX}
                                isActive={!!item.w}
                                color={item.redWin ? 'red' : 'blue'}
                                isHovered={!!(item.w && (
                                    (item.redWin && isRedHovered) ||
                                    (item.blueWin && isBlueHovered)
                                ))}
                            />

                            {/* Player cards */}
                            <SVG_Card
                                x={x} y={yRed} player={item.pRed}
                                placeholderText={item.phRed} winnerId={item.w}
                                colorClass="red"
                                isLoser={!!(item.w && !item.redWin)}
                                isHovered={!!isRedHovered}
                                onHover={(h) => setHoveredPlayerId?.(h && item.pRed ? item.pRed.id : null)}
                            />
                            <SVG_Card
                                x={x} y={yBlue} player={item.pBlue}
                                placeholderText={item.phBlue} winnerId={item.w}
                                colorClass="blue"
                                isLoser={!!(item.w && !item.blueWin)}
                                isHovered={!!isBlueHovered}
                                onHover={(h) => setHoveredPlayerId?.(h && item.pBlue ? item.pBlue.id : null)}
                            />

                            {/* Match node */}
                            {item.m.match_no && (
                                <BracketMatchNode
                                    x={nx} y={coords.node}
                                    matchNo={item.m.match_no}
                                    onClick={() => onNodeClick(item.m)}
                                    isDone={!!item.w}
                                />
                            )}
                        </g>
                    );
                })
            )}

            {/* Champion */}
            <BracketChampionBox
                x={xChamp} y={champY} winner={champPlayer}
                isHovered={!!(hoveredPlayerId && champPlayer?.id === hoveredPlayerId)}
                onHover={(h) => setHoveredPlayerId?.(h && champPlayer ? champPlayer.id : null)}
            />
        </svg>
    );
};
