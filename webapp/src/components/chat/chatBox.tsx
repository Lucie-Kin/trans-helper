import { useState, useEffect } from "react";
import { getSocket } from "../../socket";
import UserList from "./userList";
import MessageList from "./messageList";
import MessageInput from "./messageInput";
import ChatHeader from "./chatHeader";
import ProfileModal from "./profileModal";
import TournamentList from "../game/TournamentList";
import type { TournamentInfo } from "../game/TournamentList";
import "../../style/chat/chatBox.css";
import { useLanguage } from "../../language/LanguageContext";

type Props = {
  myUserId: number;
  onGameInviteSent: (playerId: number, playerLogin: string) => void;
  onGameInviteAccept: (playerId: number, playerLogin: string) => void;
  availableTournaments?: TournamentInfo[];
  onJoinTournament?: (id: string) => void;
};

export default function ChatBox({ myUserId, onGameInviteSent, onGameInviteAccept, availableTournaments = [], onJoinTournament }: Props) {
  const socket = getSocket();

  const [isConnected, setIsConnected] = useState(socket.connected);
  const [activeUserId, setActiveUserId] = useState<number | null>(null);
  const [activeUserLogin, setActiveUserLogin] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [blockedByMe, setBlockedByMe] = useState<number[]>([]);
  const [blockedMe, setBlockedMe] = useState<number[]>([]);
  const { translate } = useLanguage();

  useEffect(() => {
    const s = getSocket();

    const onConnect = () => {
      console.log("CHAT SOCKET CONNECTED");
      setIsConnected(true);
      s.emit("blocks:list");
    };
    const onDisconnect = () => {
      console.log("CHAT SOCKET DISCONNECTED");
      setIsConnected(false);
    };
    const onBlocksList = (data: any) => {
      setBlockedByMe(data?.blockedByMe ?? []);
      setBlockedMe(data?.blockedMe ?? []);
    };

    //  co only if not co
    if (!s.connected) s.connect();

    s.on("connect", onConnect);
    s.on("disconnect", onDisconnect);
    s.on("blocks:list", onBlocksList);

    // closing : component is destroyed
    return () => {
      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("blocks:list", onBlocksList);

      // force one shared socket
      if (s.connected) s.disconnect();
    };
  }, []); // dependancies empty, executed ONCE

  const isBlockedByMe =
    activeUserId !== null && blockedByMe.includes(activeUserId);
  const isBlockedByThem =
    activeUserId !== null && blockedMe.includes(activeUserId);

  if (!isConnected) {
    return <div className="chat-placeholder">Connexion au chat...</div>;
  }

  return (
    <div className="chat-box">
      <div className="chat-left">
        <div className={`chat-box-top ${activeUserId ? "compact": ""}`}>
          <div className="chat-box-title">{translate("chat.message")}</div>
          <div className="chat-box-subtitle">{translate("chat.select")}</div>
        </div>
        <UserList
          myUserId={myUserId}
          selectedUserId={activeUserId}
          onSelectUser={(id, login) => {
            setActiveUserId(id);
            setActiveUserLogin(login);
            setShowProfile(false);
          }}
          onGameInviteSent={onGameInviteSent}
          onGameInviteAccept={onGameInviteAccept}
        />
      </div>

      <div className="chat-right">
        {activeUserId !== null ? (
          <>
            <div className="chat-header-wrapper">
              <ChatHeader
                userId={activeUserId}
                login={activeUserLogin}
                onOpenProfile={() => setShowProfile(true)}
              />
              <button
                className="chat-close-btn"
                onClick={() => {
                  setActiveUserId(null);
                  setActiveUserLogin(null);
                  setShowProfile(false);
                }}
                title="Fermer le chat"
                aria-label="Fermer le chat"
              >
                ✕
              </button>
            </div>

            <MessageList activeUserId={activeUserId} myUserId={myUserId} />

            <MessageInput
              activeUserId={activeUserId}
              isBlockedByMe={isBlockedByMe}
              isBlockedByThem={isBlockedByThem}
              onBlock={() =>
                socket.emit("user:block", { targetId: activeUserId })
              }
            />

            {showProfile && (
              <ProfileModal
                userId={activeUserId}
                onClose={() => setShowProfile(false)}
              />
            )}
          </>
        ) : (
          // {/* TOURNAMENT */}
          <div className="tournament-wrapper">
            <TournamentList
              tournaments={availableTournaments}
              onJoin={(id) => onJoinTournament ? onJoinTournament(id) : socket.emit("tournament:join", id)}
             />
          </div>
        )
        }
      </div>
    </div>
  );
}
