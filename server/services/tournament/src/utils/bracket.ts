import { Participant } from "../types/bracket.types";

export interface BracketMatch {
    roundIndex: number;
    bracketPosition: number;
    playerAId: string | null;
    playerBId: string | null;
}

export interface BracketStructure {
    totalRounds: number;
    matches: BracketMatch[];
    participants: Participant[];
}

export function createAiParticipants(count: number, baseLevel: number = 1): Participant[] {
    const aiPlayers: Participant[] = [];
    for (let i = 0; i < count; i++) {
        aiPlayers.push({
            playerId: `AI_${i + 1}`,
            isAI: true,
            aiLevel: baseLevel
        });
    }
    return aiPlayers;
}

export function distributePlayersWithAi(realPlayers: Participant[], aiPlayers: Participant[]): Participant[] {
    const realCount = realPlayers.length;
    const aiCount = aiPlayers.length;
    const totalSlots = getNextPowerOfTwo(realCount + aiCount);
    const allParticipants: Participant[] = new Array(totalSlots);
    if (aiCount === 0) {
        return realPlayers;
    }
    const spacing = Math.floor(totalSlots / aiCount);
    const aiPositions: number[] = [];
    for (let i = 0; i < aiCount; i++) {
        let position = (i * spacing) + Math.floor(spacing / 2);
        position = position % totalSlots;
        while (aiPositions.includes(position)) {
            position = (position + 1) % totalSlots;
        }
        aiPositions.push(position);
    }
    let realIndex = 0;
    let aiIndex = 0;
    for (let i = 0; i < totalSlots; i++) {
        if (aiPositions.includes(i) && aiIndex < aiCount) {
            allParticipants[i] = aiPlayers[aiIndex];
            aiIndex++;
        } else if (realIndex < realCount) {
            allParticipants[i] = realPlayers[realIndex];
            realIndex++;
        }
    }
    return allParticipants;
}

export function generateBracket(realPlayers: Participant[]): BracketStructure {
    const playerCount = realPlayers.length;
    if (playerCount < 2) {
        throw new Error('Need at least 2 players for a tournament');
    }
    const bracketSize = getNextPowerOfTwo(playerCount);
    const aiNeeded = bracketSize - playerCount;
    const aiPlayers = createAiParticipants(aiNeeded);
    const allParticipants = distributePlayersWithAi(realPlayers, aiPlayers);
    const totalRounds = calculateTotalRounds(bracketSize);
    const matches: BracketMatch[] = [];
    for (let round = 0; round < totalRounds; round++) {
        const matchesInRound = bracketSize / Math.pow(2, round + 1);
        for (let position = 0; position < matchesInRound; position++) {
            if (round === 0) {
                const playerAIndex = position * 2;
                const playerBIndex = position * 2 + 1;
                matches.push({
                    roundIndex: round,
                    bracketPosition: position,
                    playerAId: allParticipants[playerAIndex]?.playerId || null,
                    playerBId: allParticipants[playerBIndex]?.playerId || null
                });
            } else {
                matches.push({
                    roundIndex: round,
                    bracketPosition: position,
                    playerAId: null,
                    playerBId: null
                });
            }
        }
    }
    return {
        totalRounds,
        matches,
        participants: allParticipants
    };
}

export function advanceWinner(
    bracket: BracketStructure,
    roundIndex: number,
    bracketPosition: number,
    winnerId: string
): BracketStructure {
    const nextRound = roundIndex + 1;
    if (nextRound >= bracket.totalRounds) {
        return bracket;
    }
    const nextPosition = Math.floor(bracketPosition / 2);
    const isPlayerA = bracketPosition % 2 === 0;
    const updatedMatches = bracket.matches.map(match => {
        if (match.roundIndex === nextRound && match.bracketPosition === nextPosition) {
            return {
                ...match,
                playerAId: isPlayerA ? winnerId : match.playerAId,
                playerBId: isPlayerA ? match.playerBId : winnerId
            };
        }
        return match;
    });
    return {
        ...bracket,
        matches: updatedMatches
    };
}

export function calculateTotalRounds(participantCount: number): number {
    const bracketSize = getNextPowerOfTwo(participantCount);
    return Math.log2(bracketSize);
}

export function getNextPowerOfTwo(n: number): number {
    let power = 2;
    while (power < n) {
        power *= 2;
    }
    return power;
}

export function getNextMatchSlot(roundIndex: number, bracketPosition: number): {
    nextRoundIndex: number,
    nextBracketPosition: number;
    slot: 'A' | 'B';
} {
    return {
        nextRoundIndex: roundIndex + 1,
        nextBracketPosition: Math.floor(bracketPosition / 2),
        slot: bracketPosition % 2 === 0 ? 'A' : 'B',
    };
}

export function getMatchesForRound(bracket: BracketStructure, roundIndex: number): BracketMatch[] {
    return bracket.matches.filter(m => m.roundIndex === roundIndex);
}

export function getBracketVisualization(bracket: BracketStructure): string[][] {
    const rounds: string[][] = [];
    for (let round = 0; round < bracket.totalRounds; round++) {
        const matchesInRound = getMatchesForRound(bracket, round);
        const roundDisplay: string[] = [];
        for (const match of matchesInRound) {
            const playerA = match.playerAId || '???';
            const playerB = match.playerBId || '???';
            roundDisplay.push(`${playerA} vs ${playerB}`);
        }
        rounds.push(roundDisplay);
    }
    return rounds;
}
