import { PlayerLevel, getLevelFromRating, expandSearchRadius } from './elo.js';

export interface QueuedPlayer {
    oddPlayerId: string;
    oddMode: 'RANKED' | 'CASUAL' | 'RANDOM';
    eloRating: number;
    level: PlayerLevel;
    joinedAt: Date;
}

export interface MatchPair {
    playerA: QueuedPlayer;
    playerB: QueuedPlayer;
    matchType: 'RANKED' | 'CASUAL';
}

export class MatchmakingQueue {
    private queue: Map<string, QueuedPlayer> = new Map();
    addToQueue(player: QueuedPlayer): void {
        this.queue.set(player.oddPlayerId, player);
    }
    removeFromQueue(oddPlayerId: string): void {
        this.queue.delete(oddPlayerId);
    }
    isInQueue(oddPlayerId: string): boolean {
        return this.queue.has(oddPlayerId);
    }
    getQueueSize(): number {
        return this.queue.size;
    }
    getWaitingPlayers(mode?: 'RANKED' | 'CASUAL' | 'RANDOM'): QueuedPlayer[] {
        const players = Array.from(this.queue.values());
        if (mode) {
            return players.filter(p => p.oddMode == mode);
        }
        return players;
    }
    findRankedMatch(player: QueuedPlayer): QueuedPlayer | null {
        const candidates = this.getWaitingPlayers('RANKED').filter(p => p.oddPlayerId !== player.oddPlayerId);
        if (candidates.length === 0) return null;
        const searchRadius = expandSearchRadius(player.joinedAt);
        let bestMatch: QueuedPlayer | null = null;
        let smallestDiff = Infinity;
        for (const candidate of candidates) {
            const eloDiff = Math.abs(candidate.eloRating - player.eloRating);
            if (eloDiff <= searchRadius && eloDiff < smallestDiff) {
                smallestDiff = eloDiff;
                bestMatch = candidate;
            }
        }
        return bestMatch;
    }
    findCasualMatch(player: QueuedPlayer): QueuedPlayer | null {
        const candidates = this.getWaitingPlayers('CASUAL').filter(p => p.oddPlayerId !== player.oddPlayerId);
        if(candidates.length === 0) return null;
        const sameLevel = candidates.filter(c => c.level === player.level);
        if (sameLevel.length > 0) {
            return sameLevel[0];
        }
        return candidates[0];
    }
    findRandomMatch(player: QueuedPlayer): QueuedPlayer | null {
        const allWaiting = Array.from(this.queue.values()).filter(p => p.oddPlayerId !== player.oddPlayerId);
        if (allWaiting.length === 0) return null;
        const randomIndex = Math.floor(Math.random() * allWaiting.length);
        return allWaiting[randomIndex];
    }
    findMatch(player: QueuedPlayer): MatchPair | null {
        let opponent: QueuedPlayer | null = null;
        let matchType: 'RANKED' | 'CASUAL' = 'CASUAL';
        switch (player.oddMode) {
            case 'RANKED':
                opponent = this.findRankedMatch(player);
                matchType = 'RANKED';
                break;
            case 'CASUAL':
                opponent = this.findCasualMatch(player);
                matchType = 'CASUAL';
                break;
            case 'RANDOM':
                opponent = this.findRandomMatch(player);
                matchType = 'CASUAL';
                break;
        }
        if (!opponent) return null;
        this.removeFromQueue(player.oddPlayerId);
        this.removeFromQueue(opponent.oddPlayerId);
        return {
            playerA: player,
            playerB: opponent,
            matchType
        };
    }
    processQueue(): MatchPair[] {
        const matches: MatchPair[] = [];
        const processed = new Set<string>();
        for (const player of this.queue.values()) {
            if (processed.has(player.oddPlayerId)) continue;
            const match = this.findMatch(player);
            if (match) {
                matches.push(match);
                processed.add(match.playerA.oddPlayerId);
                processed.add(match.playerB.oddPlayerId);
            }
        }
        return matches;
    }
    cleanupExpired(maxWaitMinutes: number = 10): string[] {
        const now = Date.now();
        const expired: string[] = [];
        for (const [oddPlayerId, player] of this.queue.entries()) {
            const waitingMs = now - player.joinedAt.getTime();
            if (waitingMs > maxWaitMinutes * 60 * 1000) {
                expired.push(oddPlayerId);
                this.queue.delete(oddPlayerId);
            }
        }
        return expired;
    }
}

export const globalQueue = new MatchmakingQueue();
