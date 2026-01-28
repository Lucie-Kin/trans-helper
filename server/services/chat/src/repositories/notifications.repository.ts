// chat/src/repositories/notifications.repository.ts
import { db } from "../db.js";

export function saveNotification(userId: number, payload: any) {
  return db
    .prepare(`
      INSERT INTO notifications (user_id, type, payload)
      VALUES (?, ?, ?)
    `)
    .run(userId, payload.type ?? "system", JSON.stringify(payload));
}
