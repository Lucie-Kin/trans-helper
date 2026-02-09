// chat/src/handlers/friends.ts
import { relationships } from "../services/relationship.service.js";
import { getSocketIds } from "../socketRegistry.js";
import { getRelationship } from "../repositories/relationships.repository.js";

// Extracts target user ID from payload (supports number or object with targetId)
function readTargetId(payload: any): number | null {
  if (typeof payload === "number") return payload;
  if (payload && typeof payload.targetId === "number") return payload.targetId;
  return null;
}

// Emits user state update to all sockets of the given userId (so all tabs get the update)
function emitToAllSocketsOf(io: any, userId: number, event: string, payload: any) {
  for (const sid of getSocketIds(userId)) {
    io.to(sid).emit(event, payload);
  }
}

// Emits user state update event to all sockets of the target user (other party)
function emitState(
  io: any,
  fromId: number,
  toId: number,
  state: string
) {
  emitToAllSocketsOf(io, toId, "user:state:update", {
    targetId: fromId,
    state,
  });
}

// Get friendship status ignoring block status (allows managing friendship even when blocked)
function getFriendshipState(me: number, other: number): "none" | "outgoing_request" | "incoming_request" | "friends" {
  const rel = getRelationship(me, other);
  const reverse = getRelationship(other, me);

  if (rel?.status === "requested") return "outgoing_request";
  if (reverse?.status === "requested") return "incoming_request";

  if (rel?.status === "accepted" && reverse?.status === "accepted") {
    return "friends";
  }

  return "none";
}

// Registers all friend-related socket event handlers
export function registerFriendHandlers(io: any, socket: any) {
  const me = socket.user.id;

  // SEND FRIEND REQUEST
  socket.on("friend:request", (payload: any) => {
    const targetId = readTargetId(payload);
    if (!targetId || targetId === me) return;

    const friendshipState = getFriendshipState(me, targetId);
       if (friendshipState !== "none") return;

    relationships.sendRequest(me, targetId);

    emitToAllSocketsOf(io, me, "user:state:update", { targetId, state: "outgoing" });
    emitState(io, me, targetId, "incoming");
  });

  // ACCEPT FRIEND REQUEST
  socket.on("friend:accept", (payload: any) => {
    const targetId = readTargetId(payload);
    if (!targetId) return;

    const friendshipState = getFriendshipState(me, targetId);
      if (friendshipState !== "incoming_request") return;
    relationships.acceptRequest(me, targetId);

    emitToAllSocketsOf(io, me, "user:state:update", { targetId, state: "friend" });
    emitState(io, me, targetId, "friend");
  });

  //  CANCEL OWN REQUEST
  socket.on("friend:cancel", (payload: any) => {
    const targetId = readTargetId(payload);
    if (!targetId) return;

    const friendshipState = getFriendshipState(me, targetId);
     if (friendshipState !== "outgoing_request") return;
    relationships.cancelRequest(me, targetId);

    emitToAllSocketsOf(io, me, "user:state:update", { targetId, state: "default" });
    emitState(io, me, targetId, "default");
  });

  // REJECT INCOMING REQUEST
  socket.on("friend:reject", (payload: any) => {
    const targetId = readTargetId(payload);
    if (!targetId) return;

    const friendshipState = getFriendshipState(me, targetId);
    if (friendshipState !== "incoming_request") return;
    
    relationships.rejectRequest(me, targetId);

    emitToAllSocketsOf(io, me, "user:state:update", { targetId, state: "default" });
    emitState(io, me, targetId, "default");
  });

  // REMOVE FRIEND
  socket.on("friend:remove", (payload: any) => {
    const targetId = readTargetId(payload);
    if (!targetId) return;

    const friendshipState = getFriendshipState(me, targetId);
    if (friendshipState !== "friends") return;
    relationships.removeFriend(me, targetId);

    emitToAllSocketsOf(io, me, "user:state:update", { targetId, state: "default" });
    emitState(io, me, targetId, "default");
  });
}
