// chat/src/socketRegistry.ts

export type OnlineUser = {
  id: number;
  login: string;
};

type SocketSet = Set<string>;

// userId → Set<socketId>
const userSockets = new Map<number, SocketSet>();

// userId → user info (store once)
const users = new Map<number, OnlineUser>();

/*users = {
  5: { id: 5, login: "alice" },
  7: { id: 7, login: "bob" },
}*/

// Register user socket (supports multiple tabs / devices)
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

// Remove specific user socketId, returns true if user is completely offline
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

// Get ALL user socketIds (used for io.to(...).emit)
export function getSocketIds(userId: number): string[] {
  return Array.from(userSockets.get(userId) ?? []);
}

// Get list of online users (unique)
export function getAllUsers(): OnlineUser[] {
  return Array.from(users.values());
}

// Checks if a user is currently online
export function isUserOnline(userId: number): boolean {
  const sockets = userSockets.get(userId);
  return !!sockets && sockets.size > 0;
}


