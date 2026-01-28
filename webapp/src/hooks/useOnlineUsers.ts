import { useEffect, useState } from "react";
import { getSocket } from "../socket";

type UserData = {
  id: number;
  online: boolean;
};

export function useOnlineUsers(): number[] {
  const socket = getSocket();
  const [onlineIds, setOnlineIds] = useState<number[]>([]);

  useEffect(() => {
    const handler = (users: UserData[]) => {
      setOnlineIds(
        users.filter((u) => u.online).map((u) => u.id)
      );
    };

    socket.on("users:list", handler);

    socket.emit("users:list");

    return () => {
      socket.off("users:list", handler);
    };
  }, [socket]);

  return onlineIds;
}
