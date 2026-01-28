import { TournamentStatus } from '../services/tournament/src/types/tournament';

export interface Participant {
    playerId: string;
    isAi: boolean;
    aiLevel?: number;
}

export interface TournamentInfo {
    id: string,
    title: string,
    organizerId: string,
    organizerName: string,
    status: TournamentStatus,
    playerCount: number,
    maxPlayers: number,
    currentRound: number,
    totalRounds: number | undefined,
}

export interface TournamentBracketInfo {
    roundIndex: number;
    bracketPosition: number | undefined;
    playerAId: string | null;
    playerBId: string | null;
}
