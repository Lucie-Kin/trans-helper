// chat/src/handlers/invite.ts
import {
  createGameInvite,
  getInviteById,
  updateInviteStatus,
  expireInvite,
  isInviteExpired,
} from "../repositories/invites.repository.js";
import { getSocketIds } from "../socketRegistry.js";

export function registerInviteHandlers(io: any, socket: any) {
  // 📩 SEND INVITE
  socket.on("game:invite", ({ targetId }) => {
    console.log("invite in backend", targetId);
    if (!targetId || targetId === socket.user.id) return;

    const invite = createGameInvite(socket.user.id, targetId);

    for (const sid of getSocketIds(targetId)) {
      io.to(sid).emit("game:invite", {
        inviteId: invite.lastInsertRowid,
        from: {
          id: socket.user.id,
          login: socket.user.login,
        },
      });
    }
  });

  // ✅ ACCEPT INVITE
  socket.on("game:invite:accept", ({ inviteId }) => {
    const invite = getInviteById(inviteId);
    if (!invite) return;

    if (invite.to_user_id !== socket.user.id) return;
    if (invite.status !== "pending") return;

    if (isInviteExpired(invite)) {
      expireInvite(inviteId);
      return;
    }

    updateInviteStatus(inviteId, "accepted");

    // 🔥 ТУТ СТАРТ ИГРЫ / РЕДИРЕКТ
    const payload = {
      type: "game:start",
      inviteId,
      players: [invite.from_user_id, invite.to_user_id],
    };

    for (const sid of getSocketIds(invite.from_user_id)) {
      io.to(sid).emit("game:start", payload);
    }

    socket.emit("game:start", payload);
  });

  // ❌ REJECT INVITE
  socket.on("game:invite:reject", ({ inviteId }) => {
    const invite = getInviteById(inviteId);
    if (!invite) return;

    if (invite.to_user_id !== socket.user.id) return;
    if (invite.status !== "pending") return;

    updateInviteStatus(inviteId, "rejected");

    for (const sid of getSocketIds(invite.from_user_id)) {
      io.to(sid).emit("game:invite:rejected", {
        inviteId,
        by: socket.user.id,
      });
    }
  });
}
