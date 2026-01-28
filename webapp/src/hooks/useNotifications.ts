import { useEffect, useState } from "react";
import { getSocket } from "../socket";

type Notification = {
  type: "tournament" | "system";
  event?: string;
  matchId?: number;
  opponent?: {
    id: number;
    login: string;
  };
};

export function useNotifications() {
  const socket = getSocket();
  const [notification, setNotification] = useState<Notification | null>(null);

  useEffect(() => {
    const handler = (payload: Notification) => {
      setNotification(payload);
    };

    socket.on("notification", handler);

    return () => {
      socket.off("notification", handler);
    }
  }, [socket]);

  function clear() {
    setNotification(null);
  }

  return { notification, clear };
}
