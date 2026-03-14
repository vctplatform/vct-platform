import { useMemo } from 'react';
import type { BracketPlayer, BracketMatch, RoundItem } from './BracketTypes';
import { DOAN_NAMES, VDV_HO, VDV_TEN, getRoundKeys, getRoundNames } from './BracketTypes';

// ════════════════════════════════════════════════════════════════
// VCT PLATFORM — BRACKET DATA HOOK
// Mock data generation & round-level data mapping
// ════════════════════════════════════════════════════════════════

// ── Mock Data Generators ─────────────────────────────────────

export const generateMockSlots = (numSlots: number): (BracketPlayer | null)[] => {
    return Array.from({ length: numSlots }, (_, i) => ({
        id: `vdv_${i + 1}`,
        ten: `${VDV_HO[i % VDV_HO.length] || ''} ${VDV_TEN[i % VDV_TEN.length] || ''}`,
        doan: DOAN_NAMES[i % DOAN_NAMES.length] || '',
    }));
};

export const generateSlotsFromStore = (
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
            return { id: source.id, ten: source.ten, doan: source.doan };
        }
        return {
            id: `seed_${index + 1}`,
            ten: `${VDV_HO[index % VDV_HO.length] || ''} ${VDV_TEN[index % VDV_TEN.length] || ''}`,
            doan: DOAN_NAMES[index % DOAN_NAMES.length] || '',
        };
    });
};

export const generateMockMatches = (numSlots: number): BracketMatch[] => {
    const numRounds = Math.log2(numSlots);
    const roundKeys = getRoundKeys(numRounds);
    const matches: BracketMatch[] = [];
    let matchCounter = 1;

    // First round matches with players assigned
    const firstRoundMatches = numSlots / 2;
    for (let i = 0; i < firstRoundMatches; i++) {
        matches.push({
            id: `match_${matchCounter}`,
            match_no: String(matchCounter).padStart(2, '0'),
            round_key: roundKeys[0] || '',
            red_athlete: {
                id: `vdv_${2 * i + 1}`,
                ten: `${VDV_HO[(2 * i) % VDV_HO.length] || ''} ${VDV_TEN[(2 * i) % VDV_TEN.length] || ''}`,
                doan: DOAN_NAMES[(2 * i) % DOAN_NAMES.length] || '',
            },
            blue_athlete: {
                id: `vdv_${2 * i + 2}`,
                ten: `${VDV_HO[(2 * i + 1) % VDV_HO.length] || ''} ${VDV_TEN[(2 * i + 1) % VDV_TEN.length] || ''}`,
                doan: DOAN_NAMES[(2 * i + 1) % DOAN_NAMES.length] || '',
            },
            winner_id: null,
            status: 'ChuaDau',
        });
        matchCounter++;
    }

    // Empty matches for subsequent rounds
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

// ── Round Data Mapper ────────────────────────────────────────

export interface BracketDataResult {
    roundData: RoundItem[][];
    champPlayer: BracketPlayer | null;
}

export const useBracketData = (
    numSlots: number,
    slots: (BracketPlayer | null)[],
    matches: BracketMatch[]
): BracketDataResult => {
    return useMemo(() => {
        const numRounds = Math.log2(numSlots);
        const roundKeys = getRoundKeys(numRounds);
        const roundNames = getRoundNames(numRounds);

        const checkW = (m: BracketMatch | undefined, pid: string | undefined) =>
            m?.winner_id && pid && m.winner_id === pid;

        const roundData: RoundItem[][] = [];
        const matchesInRound0 = numSlots / 2;

        // Round 0 data
        const r0Data = Array.from({ length: matchesInRound0 }, (_, i) => {
            const pRed = slots[2 * i] || null;
            const pBlue = slots[2 * i + 1] || null;
            const match: BracketMatch = matches.find(m =>
                m.round_key === roundKeys[0] &&
                ((pRed && (m.red_athlete?.id === pRed.id || m.blue_athlete?.id === pRed.id)) ||
                    (pBlue && (m.red_athlete?.id === pBlue.id || m.blue_athlete?.id === pBlue.id)))
            ) || {
                id: '', match_no: String(i + 1).padStart(2, '0'),
                round_key: roundKeys[0] || '', red_athlete: pRed, blue_athlete: pBlue,
                winner_id: null, status: 'ChuaDau',
            };

            const w = match.winner_id;
            return {
                m: match,
                pRed, pBlue, w,
                redWin: !!checkW(match, pRed?.id),
                blueWin: !!checkW(match, pBlue?.id),
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

                const roundMatchesSorted = matches
                    .filter(m => m.round_key === roundKeys[r])
                    .sort((a, b) => parseInt(a.match_no) - parseInt(b.match_no));
                const match: BracketMatch = roundMatchesSorted[i] || {
                    id: '', match_no: '', round_key: roundKeys[r] || '',
                    red_athlete: null, blue_athlete: null, winner_id: null, status: 'ChuaDau',
                };
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

        // Champion
        const finalRound = roundData[roundData.length - 1] || [];
        const finalData = finalRound[0];
        const champPlayer = finalData?.w ? (finalData.redWin ? finalData.pRed : finalData.pBlue) : null;

        return { roundData, champPlayer };
    }, [numSlots, slots, matches]);
};
