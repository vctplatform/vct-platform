import { useMemo } from 'react';
import { CW, CH, getRoundNames, getRoundKeys } from './BracketTypes';
import type { RoundCoord } from './BracketTypes';

// ════════════════════════════════════════════════════════════════
// VCT PLATFORM — BRACKET LAYOUT HOOK
// Calculates all coordinate positions for bracket rendering
// ════════════════════════════════════════════════════════════════

export interface BracketLayoutResult {
    numRounds: number;
    roundNames: string[];
    roundKeys: string[];
    /** X position of each round column */
    xRounds: number[];
    /** X position for champion column */
    xChamp: number;
    /** X position for match nodes per round */
    nxRounds: number[];
    /** Coordinates per round */
    allRoundCoords: RoundCoord[][];
    /** Y position for champion box */
    champY: number;
    /** Total SVG width */
    svgW: number;
    /** Total SVG height */
    svgH: number;
}

export const useBracketLayout = (numSlots: number): BracketLayoutResult => {
    return useMemo(() => {
        const numRounds = Math.log2(numSlots);
        const roundNames = getRoundNames(numRounds);
        const roundKeys = getRoundKeys(numRounds);

        // Layout constants
        const GAP_X = 50;
        const START_X = 30;
        const START_Y = 60;
        const MATCH_SPACING = Math.max(150, 200 - numRounds * 10);
        const CARD_GAP = 14;

        // X coordinates per round
        const xRounds = Array.from({ length: numRounds }, (_, i) => START_X + i * (CW + GAP_X));
        const xChamp = START_X + numRounds * (CW + GAP_X);
        const nxRounds = xRounds.map(x => x + CW + GAP_X / 2);

        // Y coordinate center of card
        const cY = (yTop: number) => yTop + CH / 2;

        // Round 0 — evenly spaced
        const matchesInRound0 = numSlots / 2;
        const yRound0 = Array.from({ length: matchesInRound0 }, (_, i) => {
            const topRed = START_Y + i * MATCH_SPACING;
            const topBlue = topRed + CH + CARD_GAP;
            const centerNode = (cY(topRed) + cY(topBlue)) / 2;
            return { r: topRed, b: topBlue, node: centerNode };
        });

        // Build all round coordinates
        const allRoundCoords: RoundCoord[][] = [
            yRound0.map(c => ({ ...c, prevNode1: cY(c.r), prevNode2: cY(c.b) })),
        ];

        for (let r = 1; r < numRounds; r++) {
            const prev = allRoundCoords[r - 1] || [];
            const coords: RoundCoord[] = [];
            for (let i = 0; i < prev.length / 2; i++) {
                const p1 = prev[2 * i];
                const p2 = prev[2 * i + 1];
                if (!p1 || !p2) continue;
                const node1 = p1.node;
                const node2 = p2.node;
                const centerNode = (node1 + node2) / 2;
                coords.push({
                    r: node1 - CH / 2,
                    b: node2 - CH / 2,
                    node: centerNode,
                    prevNode1: node1,
                    prevNode2: node2,
                });
            }
            allRoundCoords.push(coords);
        }

        // Champion Y
        const lastRound = allRoundCoords[allRoundCoords.length - 1] || [];
        const champY = (lastRound[0]?.node ?? 0) - CH / 2;

        // SVG dimensions
        const svgW = xChamp + CW + 60;
        const lastMatch = yRound0[yRound0.length - 1];
        const svgH = (lastMatch?.b ?? 0) + CH + 60;

        return {
            numRounds, roundNames, roundKeys,
            xRounds, xChamp, nxRounds,
            allRoundCoords, champY,
            svgW, svgH,
        };
    }, [numSlots]);
};
