// chat/src/handlers/block.ts
import {
  blockUser,
  unblockUser,
  isBlocked,
  getBlockedUsers,
  getBlockedByUsers,
} from "../repositories/blocks.repository.js";
import { getSocketIds } from "../socketRegistry.js";

// Extracts target user ID from payload (supports number or object with targetId)
function readTargetId(payload: any): number | null {
  if (typeof payload === "number") return payload;
  if (payload && typeof payload.targetId === "number") return payload.targetId;
  return null;
}

// Registers all block-related socket event handlers
export function registerBlockHandlers(io: any, socket: any) {
  // send block lists to current user
  socket.on("blocks:list", () => {
    const me = socket.user.id;
    socket.emit("blocks:list", {
      blockedByMe: getBlockedUsers(me),
      blockedMe: getBlockedByUsers(me),
    });
  });

  // block / unblock
  socket.on("user:block", (payload: any) => {
    const targetId = readTargetId(payload);
    if (!targetId || targetId === socket.user.id) return;

    const me = socket.user.id;
    const iBlockedHim = isBlocked(me, targetId);

    if (iBlockedHim) {
      unblockUser(me, targetId);
    } else {
      blockUser(me, targetId);
    }

    // update block lists for ourselves
    socket.emit("blocks:list", {
      blockedByMe: getBlockedUsers(me),
      blockedMe: getBlockedByUsers(me),
    });

    // and for the second user (in all their tabs)
    for (const sid of getSocketIds(targetId)) {
      io.to(sid).emit("blocks:list", {
        blockedByMe: getBlockedUsers(targetId),
        blockedMe: getBlockedByUsers(targetId),
      });
    }

    // trigger UI update (users:list)
    socket.emit("user:state:update", {});
    for (const sid of getSocketIds(targetId)) {
      io.to(sid).emit("user:state:update", {});
    }
  });
}
