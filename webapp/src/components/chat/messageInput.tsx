import { useState, useEffect } from "react";
import { getSocket } from "../../socket";
import "../../style/chat/messageInput.css";
import { useLanguage } from "../../language/LanguageContext";

type Props = {
  activeUserId: number | null;
  isBlockedByMe: boolean;
  isBlockedByThem: boolean;
  onBlock: () => void;
};

const MAX_LENGTH = 512;

export default function MessageInput({
  activeUserId,
  isBlockedByMe,
  isBlockedByThem,
  onBlock,
}: Props) {
  const socket = getSocket();
  const [text, setText] = useState("");

  const disabled = isBlockedByMe || isBlockedByThem || !activeUserId;
  const { translate } = useLanguage();
    //clear text on block
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
    ? translate("chat.block")
    : isBlockedByThem
    ? translate("chat.blocked")
    : translate("chat.text_zone");

  return (
    <div className="message-input-bar">
      <textarea
        maxLength={MAX_LENGTH}
        id="chat-message"
        name="message"
        className="message-textarea"
        value={text}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        onChange={(e) => {
          const value = e.target.value.slice(0, MAX_LENGTH);
          setText(value);
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

      {/* 🚫 BLOCK / 🔓 UNBLOCK — ALWAYS AVAILABLE */}
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
