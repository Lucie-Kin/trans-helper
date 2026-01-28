// chat/src/repositories/users.repository.ts
import { db } from "../db.js";

type SnapshotUser = {
  userId: number;
  login: string;
  displayName: string;
  avatar: string | null;
};

/**
 * Вставляет или обновляет пользователя
 * @returns true если пользователь НОВЫЙ
 */
export function upsertUser(u: SnapshotUser): boolean {
  const existing = db
    .prepare(`SELECT 1 FROM users_snapshot WHERE user_id = ?`)
    .get(u.userId);

  if (existing) {
    db.prepare(`
      UPDATE users_snapshot
      SET
        login = ?,
        display_name = ?,
        avatar = ?
      WHERE user_id = ?
    `).run(u.login, u.displayName, u.avatar, u.userId);

    return false;
  }

  db.prepare(`
    INSERT INTO users_snapshot (user_id, login, display_name, avatar)
    VALUES (?, ?, ?, ?)
  `).run(u.userId, u.login, u.displayName, u.avatar);

  return true; // 🔥 новый пользователь
}

export function getAllSnapshotUsers() {
  return db.prepare(`
    SELECT
      user_id AS id,
      login,
      display_name AS displayName,
      avatar
    FROM users_snapshot
    ORDER BY login ASC
  `).all();
}
