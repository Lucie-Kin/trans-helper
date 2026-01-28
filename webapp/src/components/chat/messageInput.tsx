// webapp/src/components/chat/messageInput.tsx
import { useState, useEffect } from "react";
import { getSocket } from "../../socket";
import "../../style/chat/messageInput.css";

type Props = {
  activeUserId: number | null;
  isBlockedByMe: boolean;
  isBlockedByThem: boolean;
  onBlock: () => void;
};

export default function MessageInput({
  activeUserId,
  isBlockedByMe,
  isBlockedByThem,
  onBlock,
}: Props) {
  const socket = getSocket();
  const [text, setText] = useState("");

  const disabled = isBlockedByMe || isBlockedByThem || !activeUserId;

  useEffect(() => {
    if (isBlockedByMe || isBlockedByThem) {
      setText("");
    }
  }, [isBlockedByMe, isBlockedByThem]);

  const send = () => {
    if (disabled || !activeUserId) return;

    const content = text.trim();
    if (!content) return;

    socket.emit("message:send", {
      toId: activeUserId,
      content,
    });

    setText("");
  };

  const placeholder = isBlockedByMe
    ? "Vous avez bloqué cet utilisateur..."
    : isBlockedByThem
    ? "Vous êtes bloqué."
    : "Tapez un message...";

  return (
    <div className="message-input-bar">
      <textarea
        id="chat-message"
        name="message"
        className="message-textarea"
        value={text}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        onChange={(e) => {
          setText(e.target.value);
          e.target.style.height = "auto";
          e.target.style.height =
            Math.min(e.target.scrollHeight, 140) + "px";
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }}
      />

      <button
        className="message-btn send"
        onClick={send}
        disabled={disabled}
        type="button"
      >
        ➤
      </button>

      {/*BLOCK / UNBLOCK — ВСЕГДА ДОСТУПНА */}
      <button
        className={`message-btn block ${isBlockedByMe ? "active" : ""}`}
        onClick={onBlock}
        title={
          isBlockedByMe
            ? "Débloquer"
            : "Bloquer"
        }
        type="button"
      >
        {isBlockedByMe ? "🔓" : "🚫"}
      </button>
    </div>
  );
}
