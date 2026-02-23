// tournament/src/mappers/tournament.mapper.ts
import { Tournament, TournamentMatch, TournamentParticipant } from '../types/tournament';
import { TournamentInfo } from '../types/tournament.view';

type TournamentWithRelations = Tournament &  {
    participants: TournamentParticipant[],
    matches: TournamentMatch[],
};

export function toTournamentInfo(t: TournamentWithRelations & { participants: any[] }, organizerName: string) : TournamentInfo {
    return {
        id: t.id,
        title: t.title,
        organizerId: t.organizerId,
        organizerName,
        status: t.status,
        playerCount: t.participants.length,
        maxPlayers: 8,
        currentRound: t.currentRound ?? 0,
        totalRounds: Math.log2(t.maxPlayers),
    };
}

export function toCurrentMatchesInfo(match: TournamentMatch | null) {
    if (!match) return null;
    return {
        roundIndex: match.roundIndex,
        bracketPosition: match.bracketPosition,
        playerAId: match.playerAId,
        playerBId: match.playerBId,
    };
}