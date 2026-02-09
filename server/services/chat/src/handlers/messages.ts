// chat/src/handlers/messages.ts
import {
  saveMessage,
  getConversation,
} from "../repositories/messages.repository.js";
import { getSocketIds } from "../socketRegistry.js";
import { isBlocked } from "../repositories/blocks.repository.js";

const MAX_MESSAGE_LENGTH = 1000;

// Registers all message-related socket event handlers
export function registerMessageHandlers(io: any, socket: any) {
  // LOAD HISTORY
  socket.on("messages:load", (otherId: number) => {
    if (!otherId) return;

    // block in ANY direction
    if (
      isBlocked(socket.user.id, otherId) ||
      isBlocked(otherId, socket.user.id)
    ) {
      socket.emit("messages:list", []);
      return;
    }

    const messages = getConversation(socket.user.id, otherId);
    socket.emit("messages:list", messages);
  });

  // SEND MESSAGE
  socket.on("message:send", ({ toId, content }) => {
    if (!toId || typeof content !== "string") return;

    const trimmed = content.trim();

    //  empty message
    if (trimmed.length === 0) return;

    //  too long
    if (trimmed.length > MAX_MESSAGE_LENGTH) return;

    //  block in ANY direction
    if (
      isBlocked(socket.user.id, toId) ||
      isBlocked(toId, socket.user.id)
    ) {
      return;
    }

    const result = saveMessage(
      socket.user.id,
      toId,
      trimmed
    );

    const msg = {
      id: result.lastInsertRowid,
      fromId: socket.user.id,
      toId,
      content: trimmed,
    };

    //  to receiver (to all sockets)
    for (const sid of getSocketIds(toId)) {
      io.to(sid).emit("message:new", msg);
    }

    //  to sender (ONLY to current socket)
    socket.emit("message:new", msg);
  });
}
