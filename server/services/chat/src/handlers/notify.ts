// chat/src/handlers/notify.ts
import { getSocketIds } from "../socketRegistry.js";
import { saveNotification } from "../repositories/notifications.repository.js";

// Sends notification to user if online, otherwise saves it for later
export function notify(io: any, userId: number, payload: any) {
  const socketIds = getSocketIds(userId);

  if (socketIds.length > 0) {
    for (const socketId of socketIds) {
      io.to(socketId).emit("notification", payload);
    }
  } else {
    // user offline → save
    saveNotification(userId, payload);
  }
}
