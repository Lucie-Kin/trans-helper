// webapp/src/components/chat/userRow.tsx
import "../../style/chat/userRow.css";
import {type GameInvitStatus, type UserStatus } from "./userRowTypes";

type Props = {
  id: number;
  login: string;
  status: UserStatus;
  selected: boolean;
  online: boolean;
  inviteStatus: GameInvitStatus;
  outgoingInvite: boolean;
  incomingInvite: boolean;
  onSelect: () => void;
  onFriend: () => void;
  onReject: () => void;
  onInvite: () => void;
  onProfile: () => void;
};

export default function UserRow({
  id,
  login,
  status,
  selected,
  online,
  inviteStatus = "none",
  outgoingInvite,
  incomingInvite,
  onSelect,
  onFriend,
  onReject,
  onInvite,
  onAcceptInvite,
}: Props) {
  const shortLogin =
    login.length > 7 ? login.slice(0, 7) + "..." : login;
  
  const statusClass =
    status === "outgoing"
      ? "friend-outgoing"
      : status === "incoming"
        ? "friend-incoming"
        : status === "friend"
          ? "friend-confirmed"
          : "friend-default";

  const gameInvitMap: Record<GameInvitStatus, string> = {
    none: "none",
    invited: "game-invited",
    inviting: "game-inviting",
    accepted: "game-accepted",
    rejected: "game-rejected",
  };
  const gameInvitClass = gameInvitMap[inviteStatus] || "none";

  return (
    <div
      className={`chat-user-item ${selected ? "selected" : ""}`}
      onClick={onSelect}
    >
      <span className="user-login">{shortLogin}</span>

      <div
        className="user-actions"
        onClick={(e) => e.stopPropagation()}
      >
        {status === "incoming" ? (
          <>
            <button
              className={`action-icon ${statusClass}`}
              title="Accept request"
              onClick={onFriend}
            >
              ✅
            </button>

            <button
              className="action-icon"
              title="Reject request"
              onClick={onReject}
            >
              ❌
            </button>
          </>
        ) : (
          <button
            className={`action-icon ${statusClass}`}
            onClick={onFriend}
          >
          <img src="src/assets/add-user.png" alt="Ajouter en ami" />
          </button>
        )}
        {incomingInvite? (
          <>
            <button className="action-icon game-invited" onClick={onAcceptInvite}>
              ✅
            </button>
            <button className="action-icon game-rejected" onClick={onReject}>
              ❌
            </button>
          </>
        ) : (
          <button className={`action-icon ${gameInvitClass}`} onClick={onInvite}
            //aria-label="Invite to Pong"
            //title="Inviter à jouer"
          >
            <img src="src/assets/game.png" alt="Inviter à jouer"/>
          </button>
        )}
      </div>
    </div>
  );
}
