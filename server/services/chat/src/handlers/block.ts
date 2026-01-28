// chat/src/handlers/block.ts
import {
  blockUser,
  unblockUser,
  isBlocked,
  getBlockedUsers,
  getBlockedByUsers,
} from "../repositories/blocks.repository.js";
import { getSocketIds } from "../socketRegistry.js";

function readTargetId(payload: any): number | null {
  if (typeof payload === "number") return payload;
  if (payload && typeof payload.targetId === "number") return payload.targetId;
  return null;
}

export function registerBlockHandlers(io: any, socket: any) {
  // 📋 отдать списки блоков текущему пользователю
  socket.on("blocks:list", () => {
    const me = socket.user.id;
    socket.emit("blocks:list", {
      blockedByMe: getBlockedUsers(me),
      blockedMe: getBlockedByUsers(me),
    });
  });

  // 🚫 block / 🔓 unblock
  socket.on("user:block", (payload: any) => {
    const targetId = readTargetId(payload);
    if (!targetId || targetId === socket.user.id) return;

    const me = socket.user.id;
    const iBlockedHim = isBlocked(me, targetId);

    if (iBlockedHim) {
      // 🔓 UNBLOCK
      unblockUser(me, targetId);
    } else {
      // 🚫 BLOCK
      blockUser(me, targetId);
    }

    // 🔁 обновляем блок-листы у себя
    socket.emit("blocks:list", {
      blockedByMe: getBlockedUsers(me),
      blockedMe: getBlockedByUsers(me),
    });

    // 🔁 и у второго пользователя (во всех его вкладках)
    for (const sid of getSocketIds(targetId)) {
      io.to(sid).emit("blocks:list", {
        blockedByMe: getBlockedUsers(targetId),
        blockedMe: getBlockedByUsers(targetId),
      });
    }

    // 🔄 триггер обновления UI (users:list)
    socket.emit("user:state:update", {});
    for (const sid of getSocketIds(targetId)) {
      io.to(sid).emit("user:state:update", {});
    }
  });
}
