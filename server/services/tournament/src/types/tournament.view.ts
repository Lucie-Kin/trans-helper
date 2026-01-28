import { TournamentStatus, TournamentMatchStatus } from './tournament';

export enum MatchStatus {
    WAITING = 'WAITING',
    PLAYING = 'PLAYING',
    WON = 'WON',
    LOST = 'LOST'
}

export interface TournamentInfo {
    id: string;
    title: string;
    organizerId: string;
    organizerName: string;
    status: TournamentStatus;
    playerCount: number;
    maxPlayers: number;
    currentRound?: number;
    totalRounds?: number;
}

export interface BracketSlot {
    playerId: string | null;
    username: string | null;
    isAI: boolean;
    status: MatchStatus;
}

export interface BracketMatchView {
    roundIndex: number;
    bracketPosition: number;
    playerA: BracketSlot;
    playerB: BracketSlot;
    winnerId: string | null;
    status: TournamentMatchStatus;
    scoreA: number;
    scoreB: number;
}

export interface TournamentBracketView {
    tournamentId: string;
    totalRounds: number;
    currentRound: number;
    matches: BracketMatchView[];
}
