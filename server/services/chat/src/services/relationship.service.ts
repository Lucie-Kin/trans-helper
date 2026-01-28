// chat/src/services/relationship.service.ts
import {
  getRelationship,
  createRelationship,
  updateRelationship,
  deleteRelationship,
} from "../repositories/relationships.repository.js";
import { isBlocked } from "../repositories/blocks.repository.js";

export type RelationshipState =
  | "none"
  | "outgoing_request"
  | "incoming_request"
  | "friends"
  | "blocked"
  | "blocked_by";

class RelationshipService {
  getState(me: number, other: number): RelationshipState {
    if (isBlocked(me, other)) return "blocked";
    if (isBlocked(other, me)) return "blocked_by";

    const rel = getRelationship(me, other);
    const reverse = getRelationship(other, me);

    if (rel?.status === "requested") return "outgoing_request";
    if (reverse?.status === "requested") return "incoming_request";

    if (rel?.status === "accepted" && reverse?.status === "accepted") {
      return "friends";
    }

    return "none";
  }

  // 📩 отправить заявку (idempotent)
  sendRequest(me: number, other: number) {
    const state = this.getState(me, other);
    if (state !== "none") return;

    createRelationship(me, other, "requested");
  }

  // ✅ принять заявку
  acceptRequest(me: number, other: number) {
    const state = this.getState(me, other);
    if (state !== "incoming_request") return;

    updateRelationship(other, me, "accepted");
    createRelationship(me, other, "accepted");
  }

  // ❌ отменить СВОЮ заявку
  cancelRequest(me: number, other: number) {
    const state = this.getState(me, other);
    if (state !== "outgoing_request") return;

    deleteRelationship(me, other);
  }

  // ❌ отклонить ЧУЖУЮ заявку
  rejectRequest(me: number, other: number) {
    const state = this.getState(me, other);
    if (state !== "incoming_request") return;

    deleteRelationship(other, me);
  }

  // 🧹 удалить из друзей
  removeFriend(me: number, other: number) {
    const state = this.getState(me, other);
    if (state !== "friends") return;

    deleteRelationship(me, other);
    deleteRelationship(other, me);
  }
}

export const relationships = new RelationshipService();
