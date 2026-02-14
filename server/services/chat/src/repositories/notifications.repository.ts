import { db } from "../db.js";

// Saves a notification for a user (used when user is offline)
export function saveNotification(userId: number, payload: any) {
  return db
    .prepare(`
      INSERT INTO notifications (user_id, type, payload)
      VALUES (?, ?, ?)
    `)
    .run(userId, payload.type ?? "system", JSON.stringify(payload));
}
