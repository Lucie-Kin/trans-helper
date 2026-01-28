// chat/src/handlers/auth.ts
import { unregisterSocket, getAllUsers } from "../socketRegistry.js";

export function registerAuthHandlers(io: any, socket: any) {
  if (socket.user) {
    io.emit("users:online", getAllUsers());
  }

  socket.on("logout", () => {
    if (!socket.user) {
      socket.disconnect(true);
      return;
    }

    const wentOffline = unregisterSocket(socket.user.id, socket.id);

    if (wentOffline) {
      io.emit("users:online", getAllUsers());
    }

    socket.disconnect(true);
  });
}
