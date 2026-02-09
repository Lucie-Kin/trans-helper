import { useEffect, useState } from "react";
import { getSocket } from "../socket";

type OnlineUser = { id: number; login: string };

export function useOnlineUsers(): number[] {
  const socket = getSocket();
  const [onlineIds, setOnlineIds] = useState<number[]>([]);

  useEffect(() => {
    const onUsersList = (users: { id: number; online: boolean }[]) => {
      setOnlineIds(users.filter((u) => u.online).map((u) => u.id));
    };

    const onUsersOnline = (users: OnlineUser[]) => {
      setOnlineIds(users.map((u) => u.id));
    };

    socket.on("users:list", onUsersList);
    socket.on("users:online", onUsersOnline);

    socket.emit("users:list");

    return () => {
      socket.off("users:list", onUsersList);
      socket.off("users:online", onUsersOnline);
    };
  }, [socket]);

  return onlineIds;
}
