export type FriendStatus =
  | "default"
  | "outgoing"
  | "incoming"
  | "friend";//UserStatus

export type GameInviteLifecycleStatus = 
  | "invited"
  | "inviting"
  | "accepted"
  | "rejected";//GameInvitStatus

export type RealtimeGameInviteStatus =
  | "none"
  | "outgoing"
  | "incoming";//GameInviteStatus

export const GameState = {
  Idle: "idle",
  Playing: "playing",
  Tournament: "tournament",
}as const;

export type GameState = (typeof GameState)[keyof typeof GameState];

export const GameCardType = {
  AI: "ai",
  Random: "random",
  Invite: "invite",
}as const;

export type GameCardType = (typeof GameCardType)[keyof typeof GameCardType];

export type User = {
  id: number;
  login: string;
  avatar: string | null;
  //friends
  status: FriendStatus;//UserStatus
  //backend game history
  inviteStatus: GameInviteLifecycleStatus;//GameInvitStatus
  //presence
  online: boolean;
  //realtime pond invite
  realtimeGameInvite?: {
    status: RealtimeGameInviteStatus;//GameInviteStatus
    inviteId?: number;
  }
}
