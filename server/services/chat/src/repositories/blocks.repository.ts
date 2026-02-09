// chat/src/repositories/blocks.repository.ts
import { db } from "../db.js";

// Blocks a user by creating a block record in the database
export function blockUser(blockerId: number, blockedId: number) {
  return db
    .prepare(`
      INSERT OR IGNORE INTO blocks (blocker_id, blocked_id)
      VALUES (?, ?)
    `)
    .run(blockerId, blockedId);
}

// Checks if user A has blocked user B
export function isBlocked(a: number, b: number): boolean {
  const row = db
    .prepare(`SELECT 1 FROM blocks WHERE blocker_id = ? AND blocked_id = ?`)
    .get(a, b);
  return !!row;
}

// Unblocks a user by removing the block record from the database
export function unblockUser(blockerId: number, blockedId: number) {
  return db
    .prepare(`
      DELETE FROM blocks
      WHERE blocker_id = ? AND blocked_id = ?
    `)
    .run(blockerId, blockedId);
}

// Gets list of user IDs that the current user has blocked
export function getBlockedUsers(me: number): number[] {
  const rows = db
    .prepare(`SELECT blocked_id AS id FROM blocks WHERE blocker_id = ?`)
    .all(me) as { id: number }[];

  return rows.map((r) => r.id);
}

// Gets list of user IDs that have blocked the current user
export function getBlockedByUsers(me: number): number[] {
  const rows = db
    .prepare(`SELECT blocker_id AS id FROM blocks WHERE blocked_id = ?`)
    .all(me) as { id: number }[];

  return rows.map((r) => r.id);
}
