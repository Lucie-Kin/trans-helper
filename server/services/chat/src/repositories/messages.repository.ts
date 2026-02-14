import { db } from "../db.js";

// Saves a direct message to the database
export function saveMessage(
  senderId: number,
  receiverId: number,
  content: string
) {
  return db
    .prepare(`
      INSERT INTO direct_messages (sender_id, receiver_id, content)
      VALUES (?, ?, ?)
    `)
    .run(senderId, receiverId, content);
}

// Gets all messages in a conversation between two users
export function getConversation(a: number, b: number) {
  return db
    .prepare(`
      SELECT
        id,
        sender_id AS fromId,
        receiver_id AS toId,
        content
      FROM direct_messages
      WHERE (sender_id = ? AND receiver_id = ?)
         OR (sender_id = ? AND receiver_id = ?)
      ORDER BY created_at ASC
    `)
    .all(a, b, b, a);
}
