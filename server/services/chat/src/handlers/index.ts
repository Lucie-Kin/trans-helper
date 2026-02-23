import { registerBlockHandlers } from "./block.js";
import { registerFriendHandlers } from "./friends.js";
import { registerMessageHandlers } from "./messages.js";
import { registerInviteHandlers } from "./invite.js";
import { registerAuthHandlers } from "./auth.js";
import { registerTournamentHandlers } from "./tournament.js";

import { getAllSnapshotUsers } from "../repositories/users.repository.js";
import { isUserOnline } from "../socketRegistry.js";
import { getRelationship } from "../repositories/relationships.repository.js";
import { getPendingGameInviteBetween } from "../repositories/invites.repository.js";

type UserStatus = "default" | "outgoing" | "incoming" | "friend";

function getFriendshipStatus(me: number, other: number): UserStatus {
  const rel = getRelationship(me, other);
  const reverse = getRelationship(other, me);
  if (rel?.status === "requested") return "outgoing";
  if (reverse?.status === "requested") return "incoming";
  if (rel?.status === "accepted" && reverse?.status === "accepted") return "friend";
  return "default";
}

// Registers all socket event handlers for the chat service
export function registerAllHandlers(io: any, socket: any) {
  // auth
  registerAuthHandlers(io, socket);

  // users list (ONLY social statuses)
  socket.on("users:list", () => {
    const users = getAllSnapshotUsers()
      .filter((u) => u.id !== socket.user.id)
      .map((u) => {
        const friendshipStatus = getFriendshipStatus(socket.user.id, u.id);
        const gameInvite = getPendingGameInviteBetween(socket.user.id, u.id);

        return {
          id: u.id,
          login: u.login,
          avatar: u.avatar,
          status: friendshipStatus,
          online: isUserOnline(u.id),
          ...(gameInvite && {
            gameInviteStatus: gameInvite.status,
            gameInviteId: gameInvite.inviteId,
          }),
        };
      });

    socket.emit("users:list", users);
  });
  

  // block — SEPARATELY
  registerBlockHandlers(io, socket);

  // friends
  registerFriendHandlers(io, socket);

  // messages
  // blocking is checked INSIDE messages handlers
  registerMessageHandlers(io, socket);

  // invite
  registerInviteHandlers(io, socket);

  // tournament
  registerTournamentHandlers(io, socket);
}
