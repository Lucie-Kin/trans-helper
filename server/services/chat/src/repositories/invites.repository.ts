// chat/src/repositories/invites.repository.ts
import { db } from "../db.js";

const INVITE_TTL_MS = 5 * 60 * 1000; // 5 минут

export function createGameInvite(from: number, to: number) {
  return db.prepare(`
    INSERT INTO game_invites (from_user_id, to_user_id)
    VALUES (?, ?)
  `).run(from, to);
}

export function getInviteById(id: number) {
  return db.prepare(`
    SELECT *
    FROM game_invites
    WHERE id = ?
  `).get(id);
}

export function expireInvite(id: number) {
  db.prepare(`
    UPDATE game_invites
    SET status = 'expired'
    WHERE id = ?
  `).run(id);
}

export function updateInviteStatus(
  id: number,
  status: "accepted" | "rejected"
) {
  db.prepare(`
    UPDATE game_invites
    SET status = ?
    WHERE id = ?
  `).run(status, id);
}

export function isInviteExpired(invite: any): boolean {
  return (
    Date.now() - new Date(invite.created_at).getTime() >
    INVITE_TTL_MS
  );
}

export function getInvitationStatus(invitee: number, inviter: number) {
  return db.prepare(`
    SELECT id, status, MAX(created_at)
    FROM game_invites
    WHERE from_user_id = ? AND to_user_id = ?
    `).get(invitee, inviter);
}