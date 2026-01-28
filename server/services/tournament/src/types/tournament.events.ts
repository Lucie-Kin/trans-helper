export interface TournamentMatchReadyPayLoad {
    tournamentId: string;
    tournamentTitle: string;
    matchId: string;
    opponent: { id: string, isAI: boolean };
    roundIndex: number;
    bracketPosition: number;
}

export interface TournamentEndedPayLoad {
    tournamentId: string;
    winnerId: string;
}
