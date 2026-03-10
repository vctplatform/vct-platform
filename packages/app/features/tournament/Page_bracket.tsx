'use client';
import * as React from 'react';
import { useState, useMemo, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
    VCT_Card, VCT_Button, VCT_Text, VCT_Stack, VCT_Badge, VCT_EmptyState, VCT_Toast
} from '../components/vct-ui';
import { VCT_PageContainer, VCT_StatRow } from '../components/vct-ui';
import type { StatItem } from '../components/VCT_StatRow';
import { VCT_Icons } from '../components/vct-icons';
import { HANG_CANS, NOI_DUNG_QUYENS } from '../data/mock-data';
import { repositories, useEntityCollection } from '../data/repository';
import { useRouteActionGuard } from '../hooks/use-route-action-guard';

// ════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════
interface BracketPlayer {
    id: string;
    ten: string;
    doan: string;
}

interface BracketMatch {
    id: string;
    match_no: string;
    round_key: string;
    red_athlete: BracketPlayer | null;
    blue_athlete: BracketPlayer | null;
    winner_id: string | null;
    status: string; // 'ChuaDau' | 'DangDau' | 'HoanThanh'
}

// ════════════════════════════════════════════════════════════════
// ROUND NAME MAPPING
// ════════════════════════════════════════════════════════════════
const getRoundNames = (numRounds: number): string[] => {
    // Build from final round backwards
    const names: string[] = [];
    const labels = ['Chung Kết', 'Bán Kết', 'Tứ Kết', 'Vòng 1/8', 'Vòng 1/16', 'Vòng 1/32', 'Vòng 1/64'];
    for (let i = 0; i < numRounds; i++) {
        names.unshift(labels[i] || `Vòng ${i + 1}`);
    }
    return names;
};

const getRoundKeys = (numRounds: number): string[] => {
    const keys: string[] = [];
    const keyMap = ['ChungKet', 'BanKet', 'TuKet', 'Vong1_8', 'Vong1_16', 'Vong1_32', 'Vong1_64'];
    for (let i = 0; i < numRounds; i++) {
        keys.unshift(keyMap[i] || `R${numRounds - i}`);
    }
    return keys;
};

// ════════════════════════════════════════════════════════════════
// MOCK DATA GENERATOR
// ════════════════════════════════════════════════════════════════
const DOAN_NAMES = ['CLB Bình Định', 'CLB Hà Nội', 'Đoàn TP.HCM', 'CLB Đà Nẵng', 'CLB Cần Thơ', 'Đoàn Nghệ An', 'CLB Huế', 'Đoàn Hải Phòng', 'CLB Gia Lai', 'Đoàn Đắk Lắk', 'CLB Long An', 'CLB Tây Ninh', 'Đoàn Bình Dương', 'CLB Vũng Tàu', 'CLB An Giang', 'Đoàn Quảng Nam'];
const VDV_HO = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Huỳnh', 'Phan', 'Vũ', 'Võ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ', 'Ngô', 'Dương', 'Lý'];
const VDV_TEN = ['Văn A', 'Thị B', 'Minh C', 'Hương D', 'Quốc E', 'Thu F', 'Đức G', 'Ngọc H', 'Anh I', 'Bảo J', 'Khánh K', 'Long L', 'Mai M', 'Nam N', 'Phúc O', 'Quang P'];

const generateMockSlots = (numSlots: number): (BracketPlayer | null)[] => {
    return Array.from({ length: numSlots }, (_, i) => ({
        id: `vdv_${i + 1}`,
        ten: `${VDV_HO[i % VDV_HO.length] || ''} ${VDV_TEN[i % VDV_TEN.length] || ''}`,
        doan: DOAN_NAMES[i % DOAN_NAMES.length] || '',
    }));
};

const generateSlotsFromStore = (
    numSlots: number,
    roster: Array<{ id: string; ten: string; doan: string }>
): (BracketPlayer | null)[] => {
    if (roster.length === 0) return generateMockSlots(numSlots);

    const uniqueRoster = Array.from(
        new Map(roster.map((item) => [item.id, item])).values()
    );

    return Array.from({ length: numSlots }, (_, index) => {
        const source = uniqueRoster[index];
        if (source) {
            return {
                id: source.id,
                ten: source.ten,
                doan: source.doan,
            };
        }
        return {
            id: `seed_${index + 1}`,
            ten: `${VDV_HO[index % VDV_HO.length] || ''} ${VDV_TEN[index % VDV_TEN.length] || ''}`,
            doan: DOAN_NAMES[index % DOAN_NAMES.length] || '',
        };
    });
};

const generateMockMatches = (numSlots: number): BracketMatch[] => {
    const numRounds = Math.log2(numSlots);
    const roundKeys = getRoundKeys(numRounds);
    const matches: BracketMatch[] = [];
    let matchCounter = 1;

    // Only generate first round matches with players assigned
    const firstRoundMatches = numSlots / 2;
    for (let i = 0; i < firstRoundMatches; i++) {
        matches.push({
            id: `match_${matchCounter}`,
            match_no: String(matchCounter).padStart(2, '0'),
            round_key: roundKeys[0] || '',
            red_athlete: { id: `vdv_${2 * i + 1}`, ten: `${VDV_HO[(2 * i) % VDV_HO.length] || ''} ${VDV_TEN[(2 * i) % VDV_TEN.length] || ''}`, doan: DOAN_NAMES[(2 * i) % DOAN_NAMES.length] || '' },
            blue_athlete: { id: `vdv_${2 * i + 2}`, ten: `${VDV_HO[(2 * i + 1) % VDV_HO.length] || ''} ${VDV_TEN[(2 * i + 1) % VDV_TEN.length] || ''}`, doan: DOAN_NAMES[(2 * i + 1) % DOAN_NAMES.length] || '' },
            winner_id: null,
            status: 'ChuaDau',
        });
        matchCounter++;
    }

    // Generate empty matches for subsequent rounds
    for (let r = 1; r < numRounds; r++) {
        const roundMatches = numSlots / Math.pow(2, r + 1);
        for (let i = 0; i < roundMatches; i++) {
            matches.push({
                id: `match_${matchCounter}`,
                match_no: String(matchCounter).padStart(2, '0'),
                round_key: roundKeys[r] || '',
                red_athlete: null,
                blue_athlete: null,
                winner_id: null,
                status: 'ChuaDau',
            });
            matchCounter++;
        }
    }

    return matches;
};

// ════════════════════════════════════════════════════════════════
// SVG SUB-COMPONENTS
// ════════════════════════════════════════════════════════════════
const CW = 220; // Card width
const CH = 60;  // Card height

const SVG_Card = ({ x, y, player, colorClass, isLoser, placeholderText, winnerId }: {
    x: number; y: number; player: BracketPlayer | null; colorClass: 'red' | 'blue';
    isLoser?: any; placeholderText?: string; winnerId?: string | null;
}) => {
    const isRed = colorClass === 'red';
    const accentColor = isRed ? '#e11d48' : '#2563eb';
    const bgTint = isRed ? '#fff1f2' : '#eff6ff';
    const nameColor = '#0f172a'; // Dark slate/navy for names
    const unitColor = '#1e293b'; // Slightly lighter for unit
    const loserOpacity = isLoser ? 0.4 : 1;
    const SIDE_W = 24;

    return (
        <g opacity={loserOpacity} transform={`translate(${x}, ${y})`}>
            {/* Card Shadow */}
            <rect width={CW} height={CH} rx={10} fill="white" filter="url(#card-shadow)" />

            {/* Main Background Tint */}
            <rect width={CW} height={CH} rx={10} fill={bgTint} />

            {/* Thick Side Accent Block */}
            <path d={`M0 10 A10 10 0 0 1 10 0 H${SIDE_W} V${CH} H10 A10 10 0 0 1 0 ${CH - 10} Z`} fill={accentColor} />

            {/* Inner Content Border */}
            <rect width={CW} height={CH} rx={10} fill="none" stroke={accentColor} strokeWidth={1.5} />

            {player ? (
                <>
                    <text x={SIDE_W + 12} y={26} fill={nameColor} fontSize={14} fontWeight={900} style={{ letterSpacing: '0.02em', textTransform: 'uppercase' }}>
                        {player.ten.toUpperCase()}
                    </text>
                    <text x={SIDE_W + 12} y={46} fill={unitColor} fontSize={11} fontWeight={500} fontStyle="italic" opacity={0.8}>
                        {player.doan}
                    </text>

                    {winnerId && winnerId === player.id && (
                        <g transform={`translate(${CW - 24}, ${CH / 2})`}>
                            <circle r={10} fill="#fef3c7" stroke="#fbbf24" strokeWidth={1} />
                            <text textAnchor="middle" y={4} fontSize={12}>🏆</text>
                        </g>
                    )}
                </>
            ) : (
                <text x={SIDE_W + 12} y={35} fill="#64748b" fontSize={11} fontStyle="italic" opacity={0.6}>
                    {placeholderText || 'CHỜ KẾT QUẢ...'}
                </text>
            )}

            {isLoser && (
                <line x1={SIDE_W + 5} y1={CH / 2} x2={CW - 5} y2={CH / 2} stroke="#94a3b8" strokeWidth={1.5} strokeDasharray="4,4" opacity={0.4} />
            )}
        </g>
    );
};

const MatchNode = ({ x, y, matchNo, onClick, isDone }: {
    x: number; y: number; matchNo: string; onClick: () => void; isDone: boolean;
}) => (
    <g onClick={onClick} style={{ cursor: 'pointer' }}>
        <defs>
            <radialGradient id="node-active-grad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#059669" />
            </radialGradient>
        </defs>
        <circle cx={x} cy={y} r={18} fill={isDone ? 'url(#node-active-grad)' : '#1e293b'}
            stroke={isDone ? '#10b981' : '#475569'} strokeWidth={2} filter="url(#card-shadow)" />
        <text x={x} y={y + 5} textAnchor="middle" fill="white" fontSize={11} fontWeight={800}>{matchNo}</text>
    </g>
);

const ChampionBox = ({ x, y, winner }: { x: number; y: number; winner: BracketPlayer | null }) => (
    <g transform={`translate(${x}, ${y})`}>
        <rect width={CW} height={CH + 10} rx={18}
            fill="rgba(245,158,11,0.05)" stroke="#f59e0b" strokeWidth={2.5} strokeDasharray={winner ? '0' : '8,5'}
            filter={winner ? 'url(#glow-gold)' : 'none'}
        />
        <text x={CW / 2} y={-12} textAnchor="middle" fill="#f59e0b" fontSize={12} fontWeight={900} style={{ letterSpacing: '0.1em' }}>NHÀ VÔ ĐỊCH</text>
        {winner ? (
            <SVG_Card x={0} y={5} player={winner} colorClass="red" winnerId={winner.id} />
        ) : (
            <text x={CW / 2} y={(CH + 10) / 2 + 5} textAnchor="middle" fill="#d97706" fontSize={13} fontStyle="italic" opacity={0.6}>Đang chờ...</text>
        )}
    </g>
);

// ════════════════════════════════════════════════════════════════
// GENERIC BRACKET ENGINE — renders any schema from 2 to 128
// ════════════════════════════════════════════════════════════════
const GenericBracket = ({ numSlots, slots, matches, onNodeClick }: {
    numSlots: number;
    slots: (BracketPlayer | null)[];
    matches: BracketMatch[];
    onNodeClick: (m: BracketMatch) => void;
}) => {
    const numRounds = Math.log2(numSlots);
    const roundNames = getRoundNames(numRounds);
    const roundKeys = getRoundKeys(numRounds);

    // ── Layout constants ──
    const GAP_X = 50;
    const START_X = 30;
    const START_Y = 60;
    const MATCH_SPACING = Math.max(150, 200 - numRounds * 10); // increased to avoid overlap
    const CARD_GAP = 14;

    // ── X coordinates per round ──
    const X_ROUNDS = Array.from({ length: numRounds }, (_, i) => START_X + i * (CW + GAP_X));
    const X_CHAMP = START_X + numRounds * (CW + GAP_X);
    const NX_ROUNDS = X_ROUNDS.map(x => x + CW + GAP_X / 2);

    // ── Y coordinates: build from round 0 (first round) outward ──
    const cY = (yTop: number) => yTop + CH / 2;

    // Round 0 (first round) — evenly spaced
    const matchesInRound0 = numSlots / 2;
    const Y_ROUND0 = Array.from({ length: matchesInRound0 }, (_, i) => {
        const topRed = START_Y + i * MATCH_SPACING;
        const topBlue = topRed + CH + CARD_GAP;
        const centerNode = (cY(topRed) + cY(topBlue)) / 2;
        return { r: topRed, b: topBlue, node: centerNode };
    });

    // Subsequent rounds: center between prev two nodes
    type RoundCoord = { r: number; b: number; node: number; prevNode1: number; prevNode2: number };
    const allRoundCoords: RoundCoord[][] = [
        Y_ROUND0.map(c => ({ ...c, prevNode1: cY(c.r), prevNode2: cY(c.b) }))
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

    // ── Data mapping per round ──
    const checkW = (m: BracketMatch | undefined, pid: string | undefined) => m?.winner_id && pid && m.winner_id === pid;

    // Round 0 data
    type RoundItem = {
        m: BracketMatch;
        pRed: BracketPlayer | null;
        pBlue: BracketPlayer | null;
        w: string | null;
        redWin: boolean;
        blueWin: boolean;
        phRed?: string;
        phBlue?: string;
    };
    const roundData: RoundItem[][] = [];

    const r0Data = Array.from({ length: matchesInRound0 }, (_, i) => {
        const pRed = slots[2 * i] || null;
        const pBlue = slots[2 * i + 1] || null;
        const match: BracketMatch = matches.find(m =>
            m.round_key === roundKeys[0] &&
            ((pRed && (m.red_athlete?.id === pRed.id || m.blue_athlete?.id === pRed.id)) ||
                (pBlue && (m.red_athlete?.id === pBlue.id || m.blue_athlete?.id === pBlue.id)))
        ) || { id: '', match_no: String(i + 1).padStart(2, '0'), round_key: roundKeys[0] || '', red_athlete: pRed, blue_athlete: pBlue, winner_id: null, status: 'ChuaDau' };

        const w = match.winner_id;
        return {
            m: match as BracketMatch,
            pRed, pBlue, w,
            redWin: !!checkW(match as BracketMatch, pRed?.id),
            blueWin: !!checkW(match as BracketMatch, pBlue?.id),
        };
    });
    roundData.push(r0Data);

    // Subsequent rounds
    for (let r = 1; r < numRounds; r++) {
        const prevData = roundData[r - 1] || [];
        const data: RoundItem[] = [];
        for (let i = 0; i < prevData.length / 2; i++) {
            const prev1 = prevData[2 * i];
            const prev2 = prevData[2 * i + 1];
            if (!prev1 || !prev2) continue;
            const pRed = prev1.w ? (prev1.redWin ? prev1.pRed : prev1.pBlue) : null;
            const pBlue = prev2.w ? (prev2.redWin ? prev2.pRed : prev2.pBlue) : null;

            // Find match for this round
            const roundMatchesSorted = matches.filter(m => m.round_key === roundKeys[r]).sort((a, b) => parseInt(a.match_no) - parseInt(b.match_no));
            const match: BracketMatch = roundMatchesSorted[i] || { id: '', match_no: '', round_key: roundKeys[r] || '', red_athlete: null, blue_athlete: null, winner_id: null, status: 'ChuaDau' };
            const w = match.winner_id;

            data.push({
                m: match,
                pRed, pBlue, w,
                redWin: !!checkW(match, pRed?.id),
                blueWin: !!checkW(match, pBlue?.id),
                phRed: `Thắng ${roundNames[r - 1] || ''} ${2 * i + 1}`,
                phBlue: `Thắng ${roundNames[r - 1] || ''} ${2 * i + 2}`,
            });
        }
        roundData.push(data);
    }

    // Champion data
    const finalRound = roundData[roundData.length - 1] || [];
    const finalData = finalRound[0];
    const champPlayer = finalData?.w ? (finalData.redWin ? finalData.pRed : finalData.pBlue) : null;

    // ── Drawing helpers ──
    const overlap = 2;
    const endX = (x: number) => x + CW;

    const drawBranch = (startX: number, startY: number, nodeX: number, nodeY: number, isActive: boolean, color: 'red' | 'blue') => {
        const d = `M${startX - overlap} ${startY} H${nodeX} V${nodeY}`;
        const activeColor = color === 'red' ? '#ef4444' : '#3b82f6';
        const glowId = color === 'red' ? 'glow-red' : 'glow-blue';
        return (
            <>
                <path d={d} fill="none" stroke="#e2e8f0" strokeWidth={2} />
                {isActive && <path d={d} fill="none" stroke={activeColor} strokeWidth={3} filter={`url(#${glowId})`} strokeLinecap="round" strokeLinejoin="round" />}
            </>
        );
    };

    const drawStraight = (startX: number, startY: number, eX: number, isActive: boolean, color: 'red' | 'blue') => {
        const d = `M${startX} ${startY} H${eX + overlap}`;
        const activeColor = color === 'red' ? '#ef4444' : '#3b82f6';
        const glowId = color === 'red' ? 'glow-red' : 'glow-blue';
        return (
            <>
                <path d={d} fill="none" stroke="#e2e8f0" strokeWidth={2} />
                {isActive && <path d={d} fill="none" stroke={activeColor} strokeWidth={3} filter={`url(#${glowId})`} strokeLinecap="round" />}
            </>
        );
    };

    // ── SVG dimensions ──
    const svgW = X_CHAMP + CW + 60;
    const lastMatch = Y_ROUND0[Y_ROUND0.length - 1];
    const svgH = (lastMatch?.b ?? 0) + CH + 60;

    return (
        <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} style={{ fontFamily: "'Be Vietnam Pro', 'Inter', sans-serif" }}>
            <style>
                {`@import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');`}
            </style>
            <defs>
                {/* Background Gradients for Cards */}
                <linearGradient id="grad-red" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#fff5f5" />
                    <stop offset="100%" stopColor="#fff" />
                </linearGradient>
                <linearGradient id="grad-blue" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#f0f7ff" />
                    <stop offset="100%" stopColor="#fff" />
                </linearGradient>

                {/* Indicator Gradients */}
                <linearGradient id="grad-red-indicator" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#fb7185" />
                    <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
                <linearGradient id="grad-blue-indicator" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#60a5fa" />
                    <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>

                {/* Filters */}
                <filter id="card-shadow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.08" />
                </filter>
                <filter id="glow-gold" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
                <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
                <filter id="glow-blue" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
            </defs>

            {/* Round headers */}
            {roundNames.map((name, i) => (
                <text key={`hdr-${i}`} x={(X_ROUNDS[i] ?? 0) + CW / 2} y={30} textAnchor="middle"
                    fill={i === numRounds - 1 ? '#dc2626' : '#64748b'} fontWeight={800} fontSize={14}>
                    {name.toUpperCase()}
                </text>
            ))}
            <text x={X_CHAMP + CW / 2} y={30} textAnchor="middle" fill="#f59e0b" fontWeight={800} fontSize={14}>VÔ ĐỊCH 🏆</text>

            {/* Render each round */}
            {roundData.map((rd, rIdx) =>
                rd.map((item, i) => {
                    const roundCoords = allRoundCoords[rIdx] || [];
                    const coords = roundCoords[i];
                    if (!coords) return null;
                    const x = X_ROUNDS[rIdx] ?? 0;
                    const nx = NX_ROUNDS[rIdx] ?? 0;
                    const nextX = rIdx < numRounds - 1 ? (X_ROUNDS[rIdx + 1] ?? X_CHAMP) : X_CHAMP;

                    // For round 0, card positions are r and b. For later rounds, align to prev nodes
                    const yRed = rIdx === 0 ? coords.r : coords.prevNode1 - CH / 2;
                    const yBlue = rIdx === 0 ? coords.b : coords.prevNode2 - CH / 2;

                    return (
                        <g key={`r${rIdx}-m${i}`}>
                            {/* Branch lines */}
                            {drawBranch(endX(x), yRed + CH / 2, nx, coords.node, item.redWin, 'red')}
                            {drawBranch(endX(x), yBlue + CH / 2, nx, coords.node, item.blueWin, 'blue')}
                            {drawStraight(nx, coords.node, nextX, !!item.w, item.redWin ? 'red' : 'blue')}

                            {/* Player cards */}
                            <SVG_Card x={x} y={yRed} player={item.pRed}
                                placeholderText={item.phRed} winnerId={item.w} colorClass="red"
                                isLoser={item.w && !item.redWin} />
                            <SVG_Card x={x} y={yBlue} player={item.pBlue}
                                placeholderText={item.phBlue} winnerId={item.w} colorClass="blue"
                                isLoser={item.w && !item.blueWin} />

                            {/* Match node */}
                            {item.m.match_no && (
                                <MatchNode x={nx} y={coords.node} matchNo={item.m.match_no}
                                    onClick={() => onNodeClick(item.m)} isDone={!!item.w} />
                            )}
                        </g>
                    );
                })
            )}

            {/* Champion */}
            <ChampionBox x={X_CHAMP} y={champY} winner={champPlayer} />
        </svg>
    );
};

// ════════════════════════════════════════════════════════════════
// CONTENT OPTIONS
// ════════════════════════════════════════════════════════════════
const NOI_DUNG_OPTIONS = [
    ...HANG_CANS.map(dk => ({ value: `dk_${dk.id}`, label: `ĐK ${dk.gioi === 'nam' ? 'Nam' : 'Nữ'} ${dk.can_den ? `${dk.can_tu}-${dk.can_den}kg` : `>${dk.can_tu}kg`}` })),
    ...NOI_DUNG_QUYENS.filter(q => q.hinh_thuc_thi_dau === 'dau_loai_ban_ket').map(q => ({ value: `q_${q.id}`, label: `Quyền: ${q.ten}` }))
];

const SCHEMA_OPTIONS = [2, 4, 8, 16, 32, 64, 128];

// ════════════════════════════════════════════════════════════════
// MAIN PAGE COMPONENT
// ════════════════════════════════════════════════════════════════
export const Page_bracket = () => {
    const combatStore = useEntityCollection(repositories.combatMatches.mock);
    const [selectedND, setSelectedND] = useState(NOI_DUNG_OPTIONS[0]?.value ?? '');
    const [selectedSchema, setSelectedSchema] = useState(8);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [selectedMatch, setSelectedMatch] = useState<BracketMatch | null>(null);
    const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });
    const containerRef = useRef<HTMLDivElement>(null);
    const showToast = useCallback((msg: string, type = 'success') => {
        setToast({ show: true, msg, type });
        setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3500);
    }, []);
    const { can, requireAction } = useRouteActionGuard('/bracket', {
        notifyDenied: (message) => showToast(message, 'error')
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

    const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

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
            <VCT_Toast isVisible={toast.show} message={toast.msg} type={toast.type} onClose={() => setToast(prev => ({ ...prev, show: false }))} />
            {/* Header */}
            <VCT_Stack direction="row" justify="space-between" align="center" style={{ marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <VCT_Text variant="h1" style={{ marginBottom: 4 }}>🌿 Sơ đồ nhánh thi đấu</VCT_Text>
                    <VCT_Text variant="small" style={{ opacity: 0.6 }}>
                        Single-elimination bracket — Zoom & kéo để xem chi tiết
                    </VCT_Text>
                </div>
                <VCT_Stack direction="row" gap={8} align="center">
                    <VCT_Badge text={`${selectedSchema} VĐV`} type="info" />
                    <VCT_Badge text={`${numRounds} vòng`} type="success" />
                    <VCT_Badge text={`${totalMatches} trận`} type="warning" />
                    <VCT_Button variant="secondary" icon={<VCT_Icons.Download size={14} />} onClick={handleExportBracket} disabled={!permissions.canExport}>
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
            <VCT_Card>
                <VCT_Stack direction="row" gap={16} align="center" style={{ flexWrap: 'wrap' }}>
                    {/* Nội dung selector */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, opacity: 0.5, textTransform: 'uppercase' as const, marginBottom: 4, display: 'block' }}>Nội dung</label>
                        <select
                            value={selectedND}
                            onChange={(e) => setSelectedND(e.target.value)}
                            style={{
                                padding: '8px 16px', borderRadius: 12, border: '1px solid var(--vct-border-subtle)',
                                background: 'var(--vct-bg-input)', color: 'var(--vct-text-primary)', fontSize: 13, fontWeight: 600,
                                outline: 'none', cursor: 'pointer', minWidth: 180,
                            }}
                        >
                            {NOI_DUNG_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </div>

                    {/* Schema selector */}
                    <div>
                        <label style={{ fontSize: 11, fontWeight: 700, opacity: 0.5, textTransform: 'uppercase' as const, marginBottom: 4, display: 'block' }}>Schema (Số VĐV)</label>
                        <VCT_Stack direction="row" gap={4}>
                            {SCHEMA_OPTIONS.map(s => (
                                <button key={s} onClick={() => handleSchemaChange(s)}
                                    style={{
                                        padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                                        fontWeight: 700, fontSize: 13, transition: 'all 0.2s',
                                        background: selectedSchema === s ? '#3b82f6' : 'var(--vct-bg-elevated)',
                                        color: selectedSchema === s ? '#fff' : 'var(--vct-text-secondary)',
                                    }}
                                    disabled={!permissions.canUpdate}
                                >
                                    {s}
                                </button>
                            ))}
                        </VCT_Stack>
                    </div>

                    <div className="flex-1" />

                    {/* Zoom controls */}
                    <VCT_Stack direction="row" gap={4} align="center">
                        <VCT_Button variant="secondary" onClick={() => setZoom(prev => Math.max(0.15, prev - 0.15))} style={{ minWidth: 36, padding: '6px' }}>−</VCT_Button>
                        <span style={{ fontSize: 12, fontWeight: 700, minWidth: 50, textAlign: 'center' as const, opacity: 0.6 }}>{Math.round(zoom * 100)}%</span>
                        <VCT_Button variant="secondary" onClick={() => setZoom(prev => Math.min(2, prev + 0.15))} style={{ minWidth: 36, padding: '6px' }}>+</VCT_Button>
                        <VCT_Button variant="secondary" onClick={resetView} style={{ fontSize: 12 }}>↻ Reset</VCT_Button>
                    </VCT_Stack>
                </VCT_Stack>
            </VCT_Card>

            {/* Bracket Canvas */}
            <div
                ref={containerRef}
                onWheel={handleWheel}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{
                    marginTop: 20, borderRadius: 20, border: '1px solid var(--vct-border-subtle)',
                    background: 'var(--vct-bg-card)', overflow: 'hidden', cursor: isDragging ? 'grabbing' : 'grab',
                    position: 'relative', minHeight: 500,
                }}
            >
                {/* Scroll hint */}
                <div style={{
                    position: 'absolute', top: 12, right: 12, zIndex: 10,
                    background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '6px 12px', borderRadius: 8,
                    fontSize: 11, fontWeight: 600, pointerEvents: 'none', opacity: 0.7,
                }}>
                    🖱 Scroll = Zoom | Kéo = Di chuyển
                </div>

                <div style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: '0 0',
                    transition: isDragging ? 'none' : 'transform 0.15s ease-out',
                    padding: 20,
                }}>
                    <GenericBracket
                        numSlots={selectedSchema}
                        slots={slots}
                        matches={matches}
                        onNodeClick={handleNodeClick}
                    />
                </div>
            </div>

            {/* Match Detail Popup */}
            {selectedMatch && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    style={{
                        position: 'fixed', bottom: 24, right: 24, zIndex: 100,
                        background: 'var(--vct-bg-elevated)', borderRadius: 20,
                        border: '1px solid var(--vct-border-subtle)', padding: 24,
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)', minWidth: 320, maxWidth: 400,
                    }}
                >
                    <VCT_Stack direction="row" justify="space-between" align="center" className="mb-4">
                        <VCT_Stack direction="row" gap={8} align="center">
                            <VCT_Badge text={`Trận #${selectedMatch.match_no}`} type="info" />
                            <VCT_Badge text={selectedMatch.round_key} type="success" />
                        </VCT_Stack>
                        <button onClick={() => setSelectedMatch(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', opacity: 0.5, fontSize: 18 }}>✕</button>
                    </VCT_Stack>

                    <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ flex: 1, padding: 12, borderRadius: 12, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', textAlign: 'center' as const }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', margin: '0 auto 6px' }} />
                            <div style={{ fontSize: 13, fontWeight: 700 }}>{selectedMatch.red_athlete?.ten || '—'}</div>
                            <div style={{ fontSize: 10, opacity: 0.5 }}>{selectedMatch.red_athlete?.doan || ''}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', fontWeight: 900, fontSize: 18, opacity: 0.3 }}>VS</div>
                        <div style={{ flex: 1, padding: 12, borderRadius: 12, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', textAlign: 'center' as const }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6', margin: '0 auto 6px' }} />
                            <div style={{ fontSize: 13, fontWeight: 700 }}>{selectedMatch.blue_athlete?.ten || '—'}</div>
                            <div style={{ fontSize: 10, opacity: 0.5 }}>{selectedMatch.blue_athlete?.doan || ''}</div>
                        </div>
                    </div>

                    <div style={{ marginTop: 12, textAlign: 'center' as const }}>
                        <VCT_Badge
                            text={selectedMatch.status === 'HoanThanh' ? '✅ Hoàn thành' : selectedMatch.status === 'DangDau' ? '🔴 Đang đấu' : '⏳ Chờ thi đấu'}
                            type={selectedMatch.status === 'HoanThanh' ? 'success' : selectedMatch.status === 'DangDau' ? 'warning' : 'info'}
                        />
                    </div>
                </motion.div>
            )}
        </VCT_PageContainer>
    );
};
