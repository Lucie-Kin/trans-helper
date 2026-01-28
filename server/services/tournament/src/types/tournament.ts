export enum TournamentStatus {
    WAITING_FOR_PLAYERS = 'WAITING_FOR_PLAYERS',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED'
}

export enum InvitationStatus {
    PENDING = 'PENDING',
    ACCEPTED = 'ACCEPTED',
    DECLINED = 'DECLINED'
}

export enum ParticipantStatus {
    WAITING = 'WAITING',
    READY = 'READY',
    PLAYING = 'PLAYING',
    ELIMINATED = 'ELIMINATED',
    WINNER = 'WINNER'
}

export enum TournamentMatchStatus {
    SCHEDULED = 'SCHEDULED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED'
}

export interface TournamentParticipant {
    id?: string;
    tournamentId: string;
    playerId: string;
    isAi: boolean;
    aiLevel?: number;
    seed?: number;
    status?: ParticipantStatus;
    joinedAt?: Date;
}

export interface TournamentMatch {
    id?: string; // optional for inserts
    tournamentId: string;
    roundIndex?: number;
    bracketPosition: number;
    playerAId?: string | null;
    playerBId?: string | null;
    scoreA?: number;
    scoreB?: number;
    status?: TournamentMatchStatus;
    createdAt?: Date;
    completedAt?: Date | null;
    winnerId?: string | null;
}

export interface TournamentInvitation {
    id?: string;
    tournamentId: string;
    inviteeId: string;
    inviterId: string;
    status?: InvitationStatus;
    invitedAt?: Date;
    respondedAt?: Date;
}

export interface Tournament {
    id: string;
    organizerId: string;
    title: string;
    status: TournamentStatus;
    maxPlayers: number;
    currentRound?: number;
    createdAt?: Date;
    startedAt?: Date | null;
    completedAt?: Date | null;
}

