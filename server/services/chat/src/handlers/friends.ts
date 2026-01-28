// chat/src/handlers/friends.ts
import { relationships } from "../services/relationship.service.js";
import { getSocketIds } from "../socketRegistry.js";

function readTargetId(payload: any): number | null {
  if (typeof payload === "number") return payload;
  if (payload && typeof payload.targetId === "number") return payload.targetId;
  return null;
}

function emitState(
  io: any,
  fromId: number,
  toId: number,
  state: string
) {
  const socketIds = getSocketIds(toId);

  for (const sid of socketIds) {
    io.to(sid).emit("user:state:update", {
      targetId: fromId,
      state,
    });
  }
}

export function registerFriendHandlers(io: any, socket: any) {
  const me = socket.user.id;

  // 📩 SEND FRIEND REQUEST
  socket.on("friend:request", (payload: any) => {
    const targetId = readTargetId(payload);
    if (!targetId || targetId === me) return;

    const state = relationships.getState(me, targetId);
    if (state !== "none") return;

    relationships.sendRequest(me, targetId);

    socket.emit("user:state:update", {
      targetId,
      state: "outgoing",
    });

    emitState(io, me, targetId, "incoming");
  });

  // ✅ ACCEPT FRIEND REQUEST
  socket.on("friend:accept", (payload: any) => {
    const targetId = readTargetId(payload);
    if (!targetId) return;

    const state = relationships.getState(me, targetId);
    if (state !== "incoming_request") return;

    relationships.acceptRequest(me, targetId);

    socket.emit("user:state:update", {
      targetId,
      state: "friend",
    });

    emitState(io, me, targetId, "friend");
  });

  // ❌ CANCEL OWN REQUEST
  socket.on("friend:cancel", (payload: any) => {
    const targetId = readTargetId(payload);
    if (!targetId) return;

    const state = relationships.getState(me, targetId);
    if (state !== "outgoing_request") return;

    relationships.cancelRequest(me, targetId);

    socket.emit("user:state:update", {
      targetId,
      state: "default",
    });

    emitState(io, me, targetId, "default");
  });

  // ❌ REJECT INCOMING REQUEST
  socket.on("friend:reject", (payload: any) => {
    const targetId = readTargetId(payload);
    if (!targetId) return;

    const state = relationships.getState(me, targetId);
    if (state !== "incoming_request") return;

    relationships.rejectRequest(me, targetId);

    socket.emit("user:state:update", {
      targetId,
      state: "default",
    });

    emitState(io, me, targetId, "default");
  });

  // 🧹 REMOVE FRIEND
  socket.on("friend:remove", (payload: any) => {
    const targetId = readTargetId(payload);
    if (!targetId) return;

    const state = relationships.getState(me, targetId);
    if (state !== "friends") return;

    relationships.removeFriend(me, targetId);

    socket.emit("user:state:update", {
      targetId,
      state: "default",
    });

    emitState(io, me, targetId, "default");
  });
}
