import { TournamentRepository } from '../repository/tournament.repository';
import { TournamentStatus, InvitationStatus, TournamentMatchStatus, ParticipantStatus } from '../types/tournament';
import { TournamentInvitation } from '../types/tournament';
import { BracketMatchView, MatchStatus, TournamentBracketView } from '../types/tournament.view';
import { BracketStructure, generateBracket, getNextMatchSlot } from './bracket';

export class TournamentManager {
    constructor(private readonly repo: TournamentRepository) {};

    private canStart(participantsCount: number, status: TournamentStatus) {
        return status == TournamentStatus.WAITING_FOR_PLAYERS && participantsCount >= 2;
    }

    async createTournament(name: string, organizedId: string) {
        const id = await this.repo.createTournament(name, organizedId);
        return this.repo.getTournamentById(id);
    }
    async getTournament(id:string) {
        return this.repo.getTournamentById(id);
    }
    async listActiveTournaments() {
        const tournaments = await this.repo.getActiveTournaments();
        const result = [];
        for (const t of tournaments) {
            const playerCount = await this.repo.getParticipantCount(t.id);
            result.push({
                id: t.id,
                title: t.title,
                organizerId: t.organizerId ?? t.organizer_id,
                status: t.status,
                playerCount,
                maxPlayers: 8,
            });
        }
        return result;
    }
    async getTournamentInfo(id: string) {
        const t = await this.repo.getTournamentById(id);
        if (!t)
            return null;
        const playerCount = await this.repo.getParticipantCount(id);
        return {
            id: t.id,
            title: t.title,
            organizer_id: t.organizedId,
            status: t.status,
            playerCount,
            maxPlayers: 8
        };
    }
    async startTournament(tournamentId: string): Promise<boolean> {
        const tournament = await this.getTournament(tournamentId);
        if (!tournament)
            return false;
        if (!this.canStart(tournament.participantCount, tournament.status))//switch to participant.length if participantCount is not up-to-date !!
            return false;
        const participants = await this.repo.getParticipants(tournamentId);
        const participantsByPlayerId = new Map<string, string>(participants.map((p: any) => [p.playerId, p.id]));
        const bracket: BracketStructure = generateBracket(
            participants.map((p: any) => ({ playerId: p.playerId, isAi: p.isAi }))
        );
        for (const match of bracket.matches) {
            await this.repo.createMatch({
                tournamentId: tournament.id,
                roundIndex: match.roundIndex,
                bracketPosition: match.bracketPosition,
                playerAId: match.playerAId ? participantsByPlayerId.get(match.playerAId) ?? null : null,
                playerBId: match.playerBId ? participantsByPlayerId.get(match.playerBId) ?? null : null,
                scoreA: 0,
                scoreB: 0,
                status: TournamentMatchStatus.SCHEDULED,
            });
        }
        await this.repo.updateStatus(tournamentId, TournamentStatus.IN_PROGRESS);
        return true;
    }
    async sendInvitation(tournamentId: string, inviteeId: string, inviterId: string): Promise<boolean> {
        const tournament = await this.getTournament(tournamentId);
        if (!tournament)
            return false;
        const participants = await this.repo.getParticipants(tournamentId);
        const invitations: TournamentInvitation[] = await this.repo.getInvitations(tournamentId);
        const alreadyParticipant = participants.some(p => p.playerId === inviteeId);
        const alreadyInvited = invitations.some(i => i.inviteeId === inviteeId && i.status !== InvitationStatus.DECLINED);
        if (alreadyParticipant || alreadyInvited)
            return false;
        await this.repo.createInvitation({
            tournamentId: tournament.id,
            inviterId,
            inviteeId,
            status: InvitationStatus.PENDING,
            invitedAt: new Date()
        });
        return true;
    }
    async respondToInvitation(tournamentId: string, playerId: string, accept: boolean): Promise<boolean> {
        const tournament = await this.getTournament(tournamentId);
        if (!tournament)
            return false;
        const invitation = await this.repo.getInvitation(tournamentId, playerId);
        if (!invitation || invitation.status !== InvitationStatus.PENDING)
            return false;
        const newStatus = accept? InvitationStatus.ACCEPTED : InvitationStatus.DECLINED;
        await this.repo.updateInvitationStatus(invitation.id, newStatus, new Date());
        if (accept) {
            await this.repo.createParticipant({
                tournamentId,
                playerId,
                isAi: false,
                status: ParticipantStatus.READY
            });
        }
        return true;
    }
    async reportMatchResult(matchId: string, winnerId: string): Promise<boolean> {
        return this.repo.withTransaction(async () => {
            const match = await this.repo.getMatchById(matchId);
            if (!match || match.winnerId)
                return false;
            if (![match.playerAId, match.playerBId].includes(winnerId))
                return false;
            const completedAt = new Date();
            await this.repo.updateMatchResult(matchId, winnerId, new Date());
            const thisRound = match.roundIndex;
            if (!thisRound)
                return false;
            const { nextRoundIndex, nextBracketPosition, slot } = getNextMatchSlot(thisRound, match.bracketPosition);
            const nextMatch = await this.repo.getMatchByPosition(match.tournamentId, nextRoundIndex, nextBracketPosition);
            if (nextMatch)
                await this.repo.updateMatchPlayer(nextMatch.id, winnerId, slot);
            const db = this.repo.getDb();
            const matchDetails = await db.get<{
                player_a_id: string | null;
                player_b_id: string | null;
                score_a: number | null;
                score_b: number | null;
            }>(
                `
                SELECT 
                    pa.player_id AS player_a_id,
                    pb.player_id AS player_b_id,
                    tm.score_a,
                    tm.score_b
                FROM tournament_match tm
                LEFT JOIN tournament_participant pa ON tm.player_a_id = pa.id
                LEFT JOIN tournament_participant pb ON tm.player_b_id = pb.id
                WHERE tm.id = ?
                `,
                matchId
            );

            if (matchDetails && matchDetails.player_a_id && matchDetails.player_b_id) {
                const isAWin = winnerId === match.playerAId;
                const winnerUserId = isAWin ? matchDetails.player_a_id : matchDetails.player_b_id;
                const loserUserId = isAWin ? matchDetails.player_b_id : matchDetails.player_a_id;
                const scoreWinner = isAWin ? (matchDetails.score_a ?? 0) : (matchDetails.score_b ?? 0);
                const scoreLoser = isAWin ? (matchDetails.score_b ?? 0) : (matchDetails.score_a ?? 0);

                await this.repo.addMatchHistory(
                    winnerUserId,
                    loserUserId,
                    'WIN',
                    scoreWinner,
                    scoreLoser,
                    'TOURNAMENT',
                    completedAt,
                    matchId
                );

                await this.repo.addMatchHistory(
                    loserUserId,
                    winnerUserId,
                    'LOSE',
                    scoreLoser,
                    scoreWinner,
                    'TOURNAMENT',
                    completedAt,
                    matchId
                );
            }
            const remainingMatches = await this.repo.countPendingMatches(match.tournamentId);
            if (remainingMatches === 0)
                await this.repo.updateTournament(match.tournamentId, TournamentStatus.COMPLETED, winnerId, new Date());
            return true;
        });
    }
    async cancelTournament(id: string): Promise<boolean> {
        const tournament = await this.repo.getTournamentById(id);
        if (!tournament || tournament.status === TournamentStatus.IN_PROGRESS )
            return false;
        await this.repo.updateStatus(id, TournamentStatus.CANCELLED);
        return true;
    }
    async getTournamentBracket(tournamentId: string): Promise<TournamentBracketView | null> {
        const tournament = await this.repo.getTournamentById(tournamentId);
        if (!tournament)
            return null;
        const matches = await this.repo.getMatchesForTournament(tournamentId);
        const matchViews: BracketMatchView[] = matches.map(m => ({
            roundIndex: m.roundIndex!,
            bracketPosition: m.bracketPosition,
            playerA: {
                playerId: m.playerAId ?? null,
                username: null,
                isAI: false,
                status: MatchStatus.WAITING
            },
            playerB: {
                playerId: m.playerBId ?? null,
                username: null,
                isAI: false,
                status: MatchStatus.WAITING
            },
            winnerId: m.winnerId ?? null,
            status: m.status ?? TournamentMatchStatus.SCHEDULED,
            scoreA: m.scoreA ?? 0,
            scoreB: m.scoreB ?? 0
        }));
        return {
            tournamentId,
            totalRounds: Math.max(...matches.map(m => m.roundIndex ?? 0)) + 1,
            currentRound: Math.min(...matches.filter(m => !m.winnerId).map(m => m.roundIndex ?? 0)),
            matches: matchViews
        };
    }
}
