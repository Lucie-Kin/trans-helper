import "../../style/chat/messageList.css";
import { useEffect, useRef, useState } from "react";
import { getSocket } from "../../socket";

type Message = {
  id: number;
  fromId: number;
  toId: number;
  content: string;
};

type Props = {
  activeUserId: number | null;
  myUserId: number;
};

export default function MessageList({
  activeUserId,
  myUserId,
}: Props) {
  const socket = getSocket();
  const [messages, setMessages] = useState<Message[]>([]);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const firstLoadRef = useRef(true);

  //  загрузка истории + подписки
  useEffect(() => {
    setMessages([]);
    firstLoadRef.current = true;

    if (!activeUserId) return;

    socket.emit("messages:load", activeUserId);

    const onList = (data: Message[]) => {
      setMessages(Array.isArray(data) ? data : []);
    };

    const onNew = (msg: Message) => {
      if (
        msg &&
        (msg.fromId === activeUserId || msg.toId === activeUserId)
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    };

    socket.on("messages:list", onList);
    socket.on("message:new", onNew);

    return () => {
      socket.off("messages:list", onList);
      socket.off("message:new", onNew);
    };
  }, [activeUserId]); //  socket НЕ добавляем

  //  автоскролл
  useEffect(() => {
    if (!bottomRef.current) return;

    bottomRef.current.scrollIntoView({
      behavior: firstLoadRef.current ? "auto" : "smooth",
    });

    firstLoadRef.current = false;
  }, [messages]);

  return (
    <div className="messages-area">
      {messages.map((m) => {
        const isOwn =
          typeof myUserId === "number" && m.fromId === myUserId;

        return (
          <div
            key={m.id}
            className={`message-row ${
              isOwn ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`message-bubble ${
                isOwn ? "own" : "other"
              }`}
            >
              {m.content}
            </div>
          </div>
        );
      })}

      <div ref={bottomRef} />
    </div>
  );
}
