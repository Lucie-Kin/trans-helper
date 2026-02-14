import { useOnlineUsers } from "../../hooks/useOnlineUsers";
import "../../style/chat/chatHeader.css";
import { useLanguage } from "../../language/LanguageContext";

export default function ChatHeader({
  userId,
  login,
  onOpenProfile,
}: {
  userId: number;
  login: string | null;
  onOpenProfile: () => void;
}) {
  const onlineUsers = useOnlineUsers();
  const isOnline = onlineUsers.includes(userId);
  const { translate } = useLanguage();
  return (
    <div className="chat-header" onClick={onOpenProfile}>
      <div className="chat-header-left">
        <div className="avatar-wrapper">
          <span
            className={`status-dot ${isOnline ? "online" : "offline"}`}
          />
        </div>

        <div className="chat-header-info">
          <div className="chat-login">{login ?? "…"}</div>
          <div className="chat-status">
            {isOnline ? translate("chat.online") : translate("chat.offline")}
          </div>
        </div>
      </div>
    </div>
  );
}
