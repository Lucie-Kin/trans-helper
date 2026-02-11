import sqlite3 from 'sqlite3';
import { Database } from 'sqlite';
import { getDb } from '../db';
import { v4 as uuidv4 } from 'uuid';
import {
    TournamentMatch,
    TournamentInvitation,
    TournamentParticipant,
    TournamentMatchStatus,
    TournamentStatus,
    InvitationStatus
} from '../types/tournament';

export class TournamentRepository {
    private db!: Database<sqlite3.Database, sqlite3.Statement>;

    async init() {
        this.db = await getDb();
    }
    getDb() {
        return this.db;
    }
    async withTransaction<T>(fn: () => Promise<T>): Promise<T> {
        try {
            await this.db.exec('BEGIN');
            const result = await fn();
            await this.db.exec('COMMIT');
            return result;
        } catch(err) {
            await this.db.exec('ROLLBACK');
            throw err;
        }
    }

    // CREATE //
    async createTournament(title: string, organizerId: string): Promise<string> {
        const id = uuidv4();
    
        await this.db.run(
            `
            INSERT INTO tournament (id, title, organizer_id, status)
            VALUES (?, ?, ?, 'WAITING_FOR_PLAYERS')
            `,
            id,
            title,
            organizerId
        );
        return id;
    }
    async createMatch(match: TournamentMatch) {
        const keys = Object.keys(match);
        const placeholders = keys.map(() => '?').join(',');
        const values = Object.values(match);

        await this.db.run(
            `
            INSERT INTO tournament_match (${keys.join(',')})
            VALUES (${placeholders})
            `,
            ...values
        );
    }
    async createInvitation(invit: TournamentInvitation) {
        const keys = Object.keys(invit);
        const placeholders = keys.map(() => '?').join(',');
        const values = Object.values(invit);

        await this.db.run(
            `
            INSERT INTO tournament_invitation (${keys.join(',')})
            VALUES (${placeholders})
            `,
            ...values
        );
    }
    async createParticipant(participant: TournamentParticipant) {
        const keys = Object.keys(participant);
        const placeholders = keys.map(() => '?').join(',');
        const values = Object.values(participant);
        await this.db.run(
            `
            INSERT INTO tournament_participant (${keys.join(',')})
            VALUES (${placeholders})
            `,
            ...values
        );
    }

    // GETTERS //
    async getTournamentById(id: string) {
        return this.db.get(
            `SELECT * FROM tournament WHERE id = ?`,
            id
        );
    }
    async getParticipants(tournamentId: string): Promise<TournamentParticipant[]> {
        return this.db.all<TournamentParticipant[]>(
            `SELECT * FROM tournament_participant WHERE tournament_id = ?`,
            tournamentId
        );
    }
    async getInvitations(tournamentId: string): Promise<TournamentInvitation[]> {
        return this.db.all<TournamentInvitation[]>(
            `SELECT * FROM tournament_invitation WHERE tournament_id = ?`,
            tournamentId
        );
    }
    async getInvitation(tournamentId: string, playerId: string) {
        return this.db.get(
            `
            SELECT * FROM tournament_invitation
            WHERE tournament_id = ? AND inviteeId = ?
            `,
            tournamentId,
            playerId
        );
    }
    async getMatchById(matchId: string): Promise<TournamentMatch | undefined> {
        return this.db.get<TournamentMatch>(
            `SELECT * FROM tournament_match WHERE id = ?`,
            matchId
        );
    }
    async getMatchesForTournament(tournamentId: string): Promise<TournamentMatch[]> {
        return this.db.all<TournamentMatch[]>(
            `SELECT * FROM tournament_match WHERE tournament_id = ?`,
            tournamentId
        );
    }
    async getMatchByPosition(tournamentId: string, roundIndex: number, bracketPosition: number) {
        return this.db.get(
            `
            SELECT * FROM tournament_match
            WHERE tournament_id = ?
            AND round_index = ?
            AND bracket_position = ?
            `,
            tournamentId,
            roundIndex,
            bracketPosition
        );
    }
    async getCurrentMatch(tournamentId: string) {
        return this.db.get(
            `
            SELECT * FROM tournament_match
            WHERE tournament_id = ? AND winner_id IS NULL
            ORDER BY round_index ASC
            LIMIT 1
            `,
            tournamentId
        );
    }
    async getInvitationStatus(tournamentId: string, playerId: string)  {
        return this.db.get(
            `
            SELECT * FROM tournament_invitation
            WHERE tournament_id = ? AND invitee_id = ?
            `,
            tournamentId,
            playerId
        );
    }
    async getActiveTournaments() {
        return this.db.all(
            `SELECT * FROM tournament WHERE status IN (?, ?)`,
            TournamentStatus.WAITING_FOR_PLAYERS,
            TournamentStatus.IN_PROGRESS
        );
    }
    async getTournamentsByPlayer(playerId: string) {
        return this.db.all(
            `
            SELECT t.* 
            FROM tournament t
            JOIN tournament_participant p ON p.tournament_id = t.id
            WHERE p.player_id = ?
            `,
            playerId
        );
    }
    async getTournamentsByOrganizer(organizerId: string) {
        return this.db.all(
            `SELECT * FORM tournament WHERE organizer_id = ?`,
            organizerId
        );
    }

    // COUNT //
    async getParticipantCount(tournamentId: string): Promise<number> {
        const row = await this.db.get<{ count: number }>(
            `SELECT count(*) as count FROM tournament_participant WHERE tournament_id = ?`,
            tournamentId
        );
        return row?.count ?? 0;
    }
    async getAcceptedCount(tournamentId: string): Promise <number> {
        const row = await this.db.get<{ count: number }>(
            `
            SELECT count(*) as count 
            FROM tournament_invitation 
            WHERE tournament_id = ? AND status = ?
            `,
            tournamentId,
            InvitationStatus.ACCEPTED
        );
        return row?.count ?? 0;
    }
    async getPendingCount(tournamentId: string): Promise<number> {
        const row = await this.db.get<{ count: number }>(
            `
            SELECT count(*) as count 
            FROM tournament_invitation 
            WHERE tournament_id = ? AND status = ?
            `,
            tournamentId,
            InvitationStatus.PENDING
        );
        return row?.count ?? 0;
    }
    async countPendingMatches(tournamentId: string): Promise<number> {
        const row = await this.db.get<{ count: number }>(
            `
            SELECT count(*) as count
            FROM tournament_match
            WHERE tournament_id = ? AND status != ?
            `,
            tournamentId,
            TournamentMatchStatus.COMPLETED,

        );
        return row?.count ?? 0;
    }

    // UPDATE //
    async updateStatus(id: string, status: string) {
        return this.db.run(
            `UPDATE tournament SET status = ? WHERE id = ?`,
            status,
            id
        );
    }
    async updateInvitationStatus(invitationId: string, newStatus: string, newDate: Date) {
        return this.db.run(
            `
            UPDATE tournament_invitation
            SET status = ?, respondedAt = ?
            WHERE id = ?
            `,
            newStatus,
            newDate,
            invitationId
        );
    }
    async updateMatchResult(matchId: string, winnerId: string, completedAt?: Date) {
        return this.db.run(
            `
            UPDATE tournament_match
            SET winner_id = ?, status = ?, completed_at = ?
            WHERE id = ?
            `,
            winnerId,
            TournamentMatchStatus.COMPLETED,
            completedAt?? new Date(),
            matchId
        );
    }
    async updateMatchPlayer(matchId: string, playerA: string, playerB: string, scheduledAt?: Date) {
        return this.db.run(
            `
            UPDATE tournament_match
            SET player_a_id = ?, player_b_id = ?, status = ?, scheduled_at = ?
            WHERE id = ?
            `,
            playerA,
            playerB,
            TournamentMatchStatus.SCHEDULED,
            scheduledAt?? new Date(),
            matchId
        );
    }
    async updateTournament(tournamentId: string, status: string, winnerId: string, completedAt?: Date) {
        return this.db.run(
            `
            UPDATE tournament
            SET status = ?, winner_id = ?, completed_at = ?
            WHERE tournament_id = ?
            `,
            status,
            winnerId,
            completedAt?? new Date(),
            tournamentId
        );
    }
}
