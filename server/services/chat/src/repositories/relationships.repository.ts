//chat/src/repositories/relationships.repository.ts
import { db } from "../db.js";

export function getRelationship(a: number, b: number) {
  return db
    .prepare(
      `SELECT * FROM relationships WHERE user_id = ? AND target_id = ?`
    )
    .get(a, b);
}

export function createRelationship(
  a: number,
  b: number,
  status: "requested" | "accepted"
) {
  return db
    .prepare(
      `INSERT INTO relationships (user_id, target_id, status)
       VALUES (?, ?, ?)`
    )
    .run(a, b, status);
}

export function updateRelationship(
  a: number,
  b: number,
  status: "accepted"
) {
  return db
    .prepare(
      `UPDATE relationships SET status = ?
       WHERE user_id = ? AND target_id = ?`
    )
    .run(status, a, b);
}

export function deleteRelationship(a: number, b: number) {
  return db
    .prepare(
      `DELETE FROM relationships WHERE user_id = ? AND target_id = ?`
    )
    .run(a, b);
}
