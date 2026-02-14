// webapp/src/components/chat/userRow.tsx
import "../../style/chat/userRow.css";
import type {GameInviteLifecycleStatus, FriendStatus, RealtimeGameInviteStatus } from "../share/sharedTypes";
import { useLanguage } from "../../language/LanguageContext";

type Props = {
  id: number;
  login: string;
  status: FriendStatus;
  selected: boolean;
  online: boolean;
  inviteStatus: GameInviteLifecycleStatus;

  realtimeGameInvite: RealtimeGameInviteStatus;

  onSelect: () => void;
  onFriend: () => void;
  onReject: () => void;
  onInvite: () => void;
  onProfile: () => void;
  onGameInviteAccept: () => void;
  onGameInviteReject: () => void;
};

export default function UserRow({
  login,
  status,
  selected,
  online,
  inviteStatus,
  realtimeGameInvite = "none",
  onSelect,
  onFriend,
  onReject,
  onInvite,
  onProfile,
  onGameInviteAccept,
  onGameInviteReject,
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

  const gameInviteStatusClass =
    realtimeGameInvite === "outgoing"
      ? "game-invite-outgoing"
      : realtimeGameInvite === "incoming"
        ? "game-invite-incoming"
        : "game-invite-default";

  const isInviteDisabled =
    inviteStatus === "accepted" || inviteStatus === "rejected";

  const { translate } = useLanguage();
  return (
    <div
      className={`chat-user-item ${selected ? "selected" : ""}`}
      onClick={onSelect}
    >
      <span
        className={`user-login ${online ? "online" : "offline"}`}
        title={online ? "Online" : "Offline"}
        onClick={onProfile}
      >
        {shortLogin}
      </span>

      <div
        className="user-actions"
        onClick={(e) => e.stopPropagation()}
      >
        {/* FRIEND ACTIONS */}
        {status === "incoming" ? (
          <>
            <button
              className={`action-icon ${statusClass}`}
              title={translate("chat.accept_friend")}
              onClick={onFriend}
            >
              ✅
            </button>

            <button
              className="action-icon"
              title={translate("chat.decline_friend")}
              onClick={onReject}
            >
              ❌
            </button>
          </>
        ) : (
          <button
            className={`action-icon ${statusClass}`}
            title={translate("chat.friend_request")}
            onClick={onFriend}
          >

          <img src="src/assets/add-user.png" alt="Ajouter en ami" />
          </button>
        )}

        {/* GAME INVITE ACTIONS */}
        {realtimeGameInvite === "incoming" ? (
          <>
            <button
              className="action-icon game-invite-accept"
              title={translate("chat.accept_invite")}
              onClick={onGameInviteAccept}
            >
              ✅
            </button>

            <button
              className="action-icon game-invite-reject"
              title={translate("chat.decline_invite")}
              onClick={onGameInviteReject}
            >
              ❌
            </button>
          </>
        ) : (
          <button
            className={`action-icon ${gameInviteStatusClass}`}
            onClick={onInvite}
            disabled={isInviteDisabled}
            title={
              realtimeGameInvite === "outgoing"
                ? translate("chat.cancel_invite")
                : translate("chat.invite_game")
            }
          >
            <img src="src/assets/game.png" alt="Inviter à jouer" />
          </button>
        )}
      </div>
    </div>
  );
}
