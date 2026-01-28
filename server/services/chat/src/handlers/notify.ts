// chat/src/handlers/notify.ts
import { getSocketIds } from "../socketRegistry.js";
import { saveNotification } from "../repositories/notifications.repository.js";

export function notify(io: any, userId: number, payload: any) {
  const socketIds = getSocketIds(userId);

  if (socketIds.length > 0) {
    for (const socketId of socketIds) {
      io.to(socketId).emit("notification", payload);
    }
  } else {
    // пользователь оффлайн → сохраняем
    saveNotification(userId, payload);
  }
}
