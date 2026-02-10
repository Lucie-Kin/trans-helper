import { PlayerLevel, getLevelFromRating, expandSearchRadius } from './elo.js';

export interface QueuedPlayer {
    oddPlayerId: string;
    eloRating: number;
    level: PlayerLevel;
    joinedAt: Date;
}

export interface MatchPair {
    playerA: QueuedPlayer;
    playerB: QueuedPlayer;
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

    getWaitingPlayers(): QueuedPlayer[] {
        return Array.from(this.queue.values());
    }

    findMatch(player: QueuedPlayer): MatchPair | null {
        const candidates = this.getWaitingPlayers().filter(p => p.oddPlayerId !== player.oddPlayerId);
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

        if (!bestMatch) return null;

        this.removeFromQueue(player.oddPlayerId);
        this.removeFromQueue(bestMatch.oddPlayerId);

        return {
            playerA: player,
            playerB: bestMatch,
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
