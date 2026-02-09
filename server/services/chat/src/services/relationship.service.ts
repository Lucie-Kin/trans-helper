// chat/src/services/relationship.service.ts
import {
  getRelationship,
  createRelationship,
  updateRelationship,
  deleteRelationship,
} from "../repositories/relationships.repository.js";

class RelationshipService {
  // Get friendship status ignoring block status (allows managing friendship even when blocked)
    private getFriendshipState(me: number, other: number): "none" | "outgoing_request" | "incoming_request" | "friends" {
      const rel = getRelationship(me, other);
      const reverse = getRelationship(other, me);
  
      if (rel?.status === "requested") return "outgoing_request";
      if (reverse?.status === "requested") return "incoming_request";
  
      if (rel?.status === "accepted" && reverse?.status === "accepted") {
        return "friends";
      }
  
      return "none";
    }
  
    //  send request (idempotent)
  sendRequest(me: number, other: number) {
    const state = this.getFriendshipState(me, other);
    if (state !== "none") return;

    createRelationship(me, other, "requested");
  }

  // accept request
  acceptRequest(me: number, other: number) {
    const state = this.getFriendshipState(me, other);
    if (state !== "incoming_request") return;

    updateRelationship(other, me, "accepted");
    createRelationship(me, other, "accepted");
  }

  //  cancel OWN request
  cancelRequest(me: number, other: number) {
    const state = this.getFriendshipState(me, other);
    if (state !== "outgoing_request") return;

    deleteRelationship(me, other);
  }

  //  reject OTHER'S request
  rejectRequest(me: number, other: number) {
    const state = this.getFriendshipState(me, other);
    if (state !== "incoming_request") return;

    deleteRelationship(other, me);
  }

  //  remove from friends
  removeFriend(me: number, other: number) {
    const state = this.getFriendshipState(me, other);
    if (state !== "friends") return;

    deleteRelationship(me, other);
    deleteRelationship(other, me);
  }
}

export const relationships = new RelationshipService();
