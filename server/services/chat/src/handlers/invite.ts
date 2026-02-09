// chat/src/handlers/invite.ts
import {
  createGameInvite,
  getInviteById,
  updateInviteStatus,
  findLatestPendingInvite,
} from "../repositories/invites.repository.js";
import { getSocketIds } from "../socketRegistry.js";

// Emits event to all sockets of the given userId (so all tabs get the update)
function emitToAllSocketsOf(io: any, userId: number, event: string, payload: any) {
  for (const sid of getSocketIds(userId)) {
    io.to(sid).emit(event, payload);
  }
}

// Registers all game invite-related socket event handlers
export function registerInviteHandlers(io: any, socket: any) {
  // SEND INVITE
  socket.on("game:invite", ({ targetId }) => {
    console.log("invite in backend", targetId);
    if (!targetId || targetId === socket.user.id) return;

    const invite = createGameInvite(socket.user.id, targetId);

    emitToAllSocketsOf(io, targetId, "game:invite", {
      inviteId: invite.lastInsertRowid,
      from: {
        id: socket.user.id,
        login: socket.user.login,
      },
    });
    emitToAllSocketsOf(io, socket.user.id, "user:state:update", { targetId });
  });

   //  CANCEL OWN INVITE
   socket.on("game:invite:cancel", ({ targetId }) => {
    if (!targetId || targetId === socket.user.id) return;

    const invite = findLatestPendingInvite(socket.user.id, targetId);
    if (!invite) return;

    // Mark as rejected so it disappears for both sides
    updateInviteStatus(invite.id, "rejected");

  
    const payload = { inviteId: invite.id, by: socket.user.id };
    emitToAllSocketsOf(io, targetId, "game:invite:rejected", payload);
    emitToAllSocketsOf(io, socket.user.id, "game:invite:rejected", payload);
  });

  // ACCEPT INVITE
  socket.on("game:invite:accept", ({ inviteId }) => {
    const invite = getInviteById(inviteId);
    if (!invite) return;

    if (invite.to_user_id !== socket.user.id) return;
    if (invite.status !== "pending") return;

    updateInviteStatus(inviteId, "accepted");

    //  GAME START HERE / REDIRECT
    const payload = {
      type: "game:start",
      inviteId,
      players: [invite.from_user_id, invite.to_user_id],
    };

    for (const sid of getSocketIds(invite.from_user_id)) {
      io.to(sid).emit("game:start", payload);
    }
    for (const sid of getSocketIds(invite.to_user_id)) {
      io.to(sid).emit("game:start", payload);
    }
  });

  //  REJECT INVITE
  socket.on("game:invite:reject", ({ inviteId }) => {
    const invite = getInviteById(inviteId);
    if (!invite) return;

    if (invite.to_user_id !== socket.user.id) return;
    if (invite.status !== "pending") return;

    updateInviteStatus(inviteId, "rejected");

    const rejectedPayload = { inviteId, by: socket.user.id };
    emitToAllSocketsOf(io, invite.from_user_id, "game:invite:rejected", rejectedPayload);
    emitToAllSocketsOf(io, socket.user.id, "game:invite:rejected", rejectedPayload);
  });
}
