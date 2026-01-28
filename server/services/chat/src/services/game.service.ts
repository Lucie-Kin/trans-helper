import { getInvitationStatus } from "../repositories/invites.repository.js"

export type GameInvitState =
  |  "none"
  |  "invited"
  |  "inviting"
  |  "accepted"
  |  "rejected";

class GameInvitService {
    getState(me: number, other: number): GameInvitState {
        const isInvitee = getInvitationStatus(me, other);
        const isInviter = getInvitationStatus(other, me);
        const meInvite = isInvitee?.status;
        const otherInvite = isInviter?.status;
        if (meInvite === "pending")
            return "invited";
        else if (otherInvite === "pending")
            return "inviting";
        else if (meInvite === "accepted" || otherInvite === "accepted" )
            return "accepted";
        else if (meInvite === "rejected" || otherInvite === "rejected" )
            return "rejected";
        else
            return "none";
    }
}

export const gameInvitService = new GameInvitService();