// chat/src/services/authSync.ts
import { upsertUser } from "../repositories/users.repository.js";

type AuthUser = {
  id: number;
  login: string;
  avatar: string | null;
};

const AUTH_URL = "http://auth:3001";

let authReady = false;

export async function syncUsersFromAuth(): Promise<boolean> {
  try {
    const res = await fetch(`${AUTH_URL}/auth/internal/users`, {
      headers: {
        "x-internal": "chat",
      },
    });

    if (!res.ok) {
      console.error("Auth sync failed:", res.status);
      return false;
    }

    const users = (await res.json()) as AuthUser[];

    let hasNewUsers = false;

    for (const u of users) {
      const inserted = upsertUser({
        userId: u.id,
        login: u.login,
        displayName: u.login,
        avatar: u.avatar,
      });

      if (inserted) hasNewUsers = true;
    }

    if (!authReady) {
      console.log(`✅ Auth sync OK (${users.length} users)`);
      authReady = true;
    }

    return hasNewUsers;
  } catch (err) {
    if (!authReady) {
      console.warn("⏳ Auth not ready yet, retrying...");
    }
    return false;
  }
}
