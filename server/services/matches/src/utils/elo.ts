export enum PlayerLevel {
    NOOB = 'NOOB',
    MID = 'MID',
    PRO ='PRO'
}

export const LEVEL_DISPLAY_NAMES: Record<PlayerLevel, string> = {
    [PlayerLevel.NOOB]: 'Cheese Sticks',
    [PlayerLevel.MID]: 'Cheese Roll',
    [PlayerLevel.PRO]: 'Buffala della Nonna'
};

const K_FACTORS: Record<PlayerLevel, number> = {
    [PlayerLevel.NOOB]: 32,
    [PlayerLevel.MID]: 24,
    [PlayerLevel.PRO]: 16
};

const LEVEL_THRESHOLDS = {
    NOOB: { min: 0, max: 1199},
    MID: { min: 1200, max: 1599 },
    PRO: { min: 1600, max: Infinity }
};

export function calculateExpectedScore(playerRating: number, opponentRating: number): number {
    return 1 / (1 + Math.pow(10, (opponentRating - playerRating) / 400));
}

export function calculateNewRating(
    currentRating: number,
    expectedScore: number,
    actualScore: number,
    level: PlayerLevel
): number {
    const kFactor = K_FACTORS[level];
    const newRating = Math.round(currentRating + kFactor * (actualScore - expectedScore));
    return Math.max(0, newRating);
}

export function getLevelFromRating(eloRating: number): PlayerLevel {
    if (eloRating >= LEVEL_THRESHOLDS.PRO.min) {
        return PlayerLevel.PRO;
    } else if (eloRating >= LEVEL_THRESHOLDS.MID.min) {
        return PlayerLevel.MID;
    }
    return PlayerLevel.NOOB;
}

export function getLevelDisplayName(level: PlayerLevel): string {
    return LEVEL_DISPLAY_NAMES[level];
}

export interface EloUpdateResult {
    winnerNewRating: number;
    loserNewRating: number;
    winnerChange: number;
    loserChange: number;
}

export function processMatchResult(
    winnerRating: number,
    loserRating: number,
    winnerLevel: PlayerLevel,
    loserLevel: PlayerLevel
): EloUpdateResult {
    const winnerExpected = calculateExpectedScore(winnerRating, loserRating);
    const loserExpected = calculateExpectedScore(loserRating, winnerRating);
    const winnerNewRating = calculateNewRating(winnerRating, winnerExpected, 1, winnerLevel);
    const loserNewRating = calculateNewRating(loserRating, loserExpected, 0, loserLevel);
    
    return {
        winnerNewRating,
        loserNewRating,
        winnerChange: winnerNewRating - winnerRating,
        loserChange: loserNewRating - loserRating
    };
}

export function findClosestMatch(
    playerElo: number,
    candidates: Array<{ oddplayerId: string; eloRating: number }>,
    maxEloDifference: number = 200
): { oddplayerId: string; eloRating: number }| null {
    let closest: { oddplayerId: string; eloRating: number }| null = null;
    let smallestDiff = Infinity;

    for (const candidate of candidates) {
        const diff = Math.abs(candidate.eloRating - playerElo);
        if (diff <= maxEloDifference && diff < smallestDiff) {
            smallestDiff = diff;
            closest = candidate;
        }
    }
    return closest;
}

export function expandSearchRadius(
    joinedAt: Date,
    baseRadius: number = 100,
    expansionPerMinute: number = 50,
    maxRadius = 500
): number {
    const waitingMinutes = (Date.now() - joinedAt.getTime()) / 60000;
    const expandedRadius = baseRadius + (waitingMinutes * expansionPerMinute);
    return Math.min(expandedRadius, maxRadius);
}
