// webapp/src/components/chat/userList.tsx
import { useEffect, useState } from "react";
import UserRow from "./userRow";
import { getSocket } from "../../socket";
import ProfileModal from "./profileModal";
import { useUserCache } from "../../hooks/useUserCache";
import { type GameInvitStatus } from "../chat/userRow";

export type UserStatus =
  | "default"
  | "outgoing"
  | "incoming"
  | "friend";

export type UserWithStatus = {
  id: number;
  login: string;
  avatar: string | null;
  status: UserStatus;
  online:boolean;
};

export type UserWithInvite = {
  id: number;
  login: string;
  avatar?: string;
  status: UserStatus;
  inviteStatus: GameInvitStatus;
  online: boolean;
};

type Props = {
  users: UserWithInvite[];
  myUserId: number;
  selectedUserId: number | null;
  onSelectUser: (id: number) => void;
  onInvite: (userId: number) => void;
};

export default function UserList({
  
  myUserId,
  selectedUserId,
  onSelectUser,
  onInvite,
}: Props) {
  const socket = getSocket();
  const { update } = useUserCache();

  const [users, setUsers] = useState<UserWithInvite[]>([]);
  const [viewingProfileId, setViewingProfileId] =
    useState<number | null>(null);

  useEffect(() => {
    const refresh = () => socket.emit("users:list");

    const onUsersList = (data: any[]) => {
      const mapped: UserWithInvite[] = data.map(u => ({
        ...u,
        inviteStatus: u.inviteStatus ?? "none",
      }));
      update(mapped);
      setUsers(mapped);
    };

    refresh();

    socket.on("users:list", onUsersList);
    socket.on("user:new", refresh);
    socket.on("user:state:update", refresh);
    //socket.on("users:online", refresh);

    return () => {
      socket.off("users:list", onUsersList);
      socket.off("user:new", refresh);
      socket.off("user:state:update", refresh);
     // socket.off("users:online", refresh);
    };
  }, []);

  function handleFriendClick(user: UserWithStatus) {
    switch (user.status) {
      case "default":
        socket.emit("friend:request", { targetId: user.id });
        break;
      case "outgoing":
        socket.emit("friend:cancel", { targetId: user.id });
        break;
      case "incoming":
        socket.emit("friend:accept", { targetId: user.id });
        break;
      case "friend":
        socket.emit("friend:remove", { targetId: user.id });
        break;
    }
  }

  const displayedUsers = users.filter((u) => u.id !== myUserId);

  console.log(displayedUsers[0]);

  return (
    <>
      <div className="user-list">
        {displayedUsers.map((u) => (
          <UserRow
            key={u.id}
            id={u.id}
            login={u.login}
            status={u.status}
            selected={u.id === selectedUserId}
            online={u.online}
            inviteStatus={u.inviteStatus}
            onSelect={() => onSelectUser(u.id)}
            onFriend={() => handleFriendClick(u)}
            onReject={() => {
              socket.emit("friend:reject", { targetId: u.id });
            }}
            onInvite={() => {
              console.log("invite");
              socket.emit("game:invite", { targetId: u.id });
            }}
            onProfile={() => setViewingProfileId(u.id)}
          />
        ))}
      </div>

      {viewingProfileId !== null && (
        <ProfileModal
          userId={viewingProfileId}
          onClose={() => setViewingProfileId(null)}
        />
      )}
    </>
  );
}
