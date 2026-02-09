// chat/src/repositories/invites.repository.ts
import { db } from "../db.js";

// Creates a new game invite between two users
export function createGameInvite(from: number, to: number) {
  return db.prepare(`
    INSERT INTO game_invites (from_user_id, to_user_id)
    VALUES (?, ?)
  `).run(from, to);
}

// Gets a game invite by its ID
export function getInviteById(id: number) {
  return db.prepare(`
    SELECT *
    FROM game_invites
    WHERE id = ?
  `).get(id);
}

// Updates the status of a game invite (accepted or rejected)
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

// Finds latest pending invite from one user to another
export function findLatestPendingInvite(
  fromUserId: number,
  toUserId: number
) {
  return db
    .prepare(
      `
      SELECT *
      FROM game_invites
      WHERE from_user_id = ? AND to_user_id = ? AND status = 'pending'
      ORDER BY created_at DESC
      LIMIT 1
    `
    )
    .get(fromUserId, toUserId);
}

/** Pending game invite between me and other user. Used to restore state after refresh. */
export function getPendingGameInviteBetween(
  meId: number,
  otherId: number
): { status: "outgoing" | "incoming"; inviteId: number } | null {
  const outgoing = findLatestPendingInvite(meId, otherId);
  if (outgoing) return { status: "outgoing", inviteId: outgoing.id };
  const incoming = findLatestPendingInvite(otherId, meId);
  if (incoming) return { status: "incoming", inviteId: incoming.id };
  return null;
}

export function getInvitationStatus(invitee: number, inviter: number) {
  return db.prepare(`
    SELECT id, status, MAX(created_at)
    FROM game_invites
    WHERE from_user_id = ? AND to_user_id = ?
    `).get(invitee, inviter);
}
