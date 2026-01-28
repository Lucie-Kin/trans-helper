// webapp/src/components/chat/chatHeader.tsx
import { useEffect, useState } from "react";
import { useOnlineUsers } from "../../hooks/useOnlineUsers";
import { useUserCache } from "../../hooks/useUserCache";
import "../../style/chat/chatHeader.css";

export default function ChatHeader({
  userId,
  onOpenProfile,
}: {
  userId: number;
  onOpenProfile: () => void;
}) {
  const onlineUsers = useOnlineUsers();
  const { get } = useUserCache();

  const [login, setLogin] = useState("...");
  const isOnline = onlineUsers.includes(userId);

  useEffect(() => {
    let cancelled = false;

    const cached = get(userId);
    if (cached) {
      setLogin(cached);
      return;
    }

    // if no cache == load via API
    fetch(`/auth/api/profile/${userId}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled && data?.login) setLogin(data.login);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // const initials = login.slice(0, 10);

  return (
    <div className="chat-header" onClick={onOpenProfile}>
      <div className="chat-header-left">
        <div className="avatar-wrapper">
          <span
            className={`status-dot ${isOnline ? "online" : "offline"}`}
          />
        </div>

        <div className="chat-header-info">
          <div className="chat-login">{login}</div>
          <div className="chat-status">
            {isOnline ? "online" : "offline"}
          </div>
        </div>
      </div>
    </div>
  );
}