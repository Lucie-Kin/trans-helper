//chat/src/repositories/relationships.repository.ts
import { db } from "../db.js";

// Retrieves the relationship record between two users
export function getRelationship(a: number, b: number) {
  return db
    .prepare(
      `SELECT * FROM relationships WHERE user_id = ? AND target_id = ?`
    )
    .get(a, b);
}

// Creates a new relationship record between two users
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

// Updates the status of an existing relationship
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

// Deletes a relationship record between two users
export function deleteRelationship(a: number, b: number) {
  return db
    .prepare(
      `DELETE FROM relationships WHERE user_id = ? AND target_id = ?`
    )
    .run(a, b);
}
