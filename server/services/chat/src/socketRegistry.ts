// chat/src/socketRegistry.ts

export type OnlineUser = {
  id: number;
  login: string;
};

type SocketSet = Set<string>;

// userId → Set<socketId>
const userSockets = new Map<number, SocketSet>();

// userId → user info (храним 1 раз)
const users = new Map<number, OnlineUser>();

/**
 * Регистрируем socket пользователя
 * (поддерживает несколько вкладок / устройств)
 */
export function registerSocket(
  user: OnlineUser,
  socketId: string
) {
  users.set(user.id, user);

  let sockets = userSockets.get(user.id);
  if (!sockets) {
    sockets = new Set();
    userSockets.set(user.id, sockets);
  }

  sockets.add(socketId);
}

/**
 * Удаляем конкретный socketId пользователя
 * @returns true если пользователь полностью оффлайн
 */
export function unregisterSocket(
  userId: number,
  socketId: string
): boolean {
  const sockets = userSockets.get(userId);
  if (!sockets) return true;

  sockets.delete(socketId);

  if (sockets.size === 0) {
    userSockets.delete(userId);
    users.delete(userId);
    return true;
  }

  return false;
}

/**
 * Получить ВСЕ socketId пользователя
 * (используется для io.to(...).emit)
 */
export function getSocketIds(userId: number): string[] {
  return Array.from(userSockets.get(userId) ?? []);
}

/**
 * Список онлайн-пользователей (уникальные)
 */
export function getAllUsers(): OnlineUser[] {
  return Array.from(users.values());
}

export function isUserOnline(userId: number): boolean {
  const sockets = userSockets.get(userId);
  return !!sockets && sockets.size > 0;
}


