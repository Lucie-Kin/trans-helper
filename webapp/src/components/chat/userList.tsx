// webapp/src/components/chat/userList.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import UserRow from "./userRow";
import { getSocket } from "../../socket";
import type { RealtimeGameInviteStatus, User } from "../share/sharedTypes";
import ProfileModal from "./profileModal";

type Props = {
  myUserId: number;
  selectedUserId: number | null;
  onSelectUser: (id: number, login: string) => void;
};

export default function UserList({
  myUserId,
  selectedUserId,
  onSelectUser,
}: Props) {
  const socket = getSocket();
  const navigate = useNavigate();

  const [users, setUsers] = useState<User[]>([]);
  const [viewingProfileId, setViewingProfileId] = useState<number | null>(null);
   // Track game invite statuses
  // Store: userId -> { status: "outgoing" | "incoming", inviteId?: number }
  const [gameInviteStatuses, setGameInviteStatuses] = 
    useState<
      Map<number, { status: RealtimeGameInviteStatus; inviteId?: number }>
    >(new Map());

  useEffect(() => {
    const refresh = () => socket.emit("users:list");

    const onUsersList = (data: any[]) => {
      // const mapped: User[] = data.map(u => ({
      //   ...u,
      //   inviteStatus: u.inviteStatus ?? "rejected",//or "invited"
      // }));
      const mapped: User[]= data;
      
      setUsers(mapped);
      setGameInviteStatuses((prev) => {
        const next = new Map(prev);
        for (const u of mapped) {
          if (u.realtimeGameInvite) {
            next.set(u.id, {
              status: u.realtimeGameInvite.status,
              inviteId: u.realtimeGameInvite.inviteId,
            });
          } else {
            next.delete(u.id);
          }
        }
        return next;
      });
    };

    const onUsersOnline = (onlineUsers: { id: number; login: string }[]) => {
      const onlineIds = new Set(onlineUsers.map((u) => u.id));
      setUsers((prev) =>
        prev.map((u) => ({ ...u, online: onlineIds.has(u.id) }))
      );
    };

      // Game invite handlers
      const onGameInvite = (data: { inviteId: number; from: { id: number; login: string } }) => {
        setGameInviteStatuses(prev => {
          const newMap = new Map(prev);
          newMap.set(data.from.id, { status: "incoming", inviteId: data.inviteId });
          return newMap;
        });
      };
  
      const onGameInviteRejected = ({ inviteId, by }: { inviteId: number; by: number }) => {
        setGameInviteStatuses(prev => {
          const newMap = new Map(prev);
          // Remove status for user who rejected
          newMap.delete(by);
          // Also remove outgoing status from sender
          for (const [userId, value] of newMap.entries()) {
            if (value.inviteId === inviteId) {
              newMap.delete(userId);
              break;
            }
          }
          return newMap;
        });
      };
  
      const onGameStart = ({ inviteId }: { inviteId: number }) => {
        setGameInviteStatuses(prev => {
          const newMap = new Map(prev);
          newMap.clear();
          return newMap;
        });
        navigate(`/pong/${inviteId}`);
      };
   
    refresh();

    socket.on("users:list", onUsersList);
    socket.on("users:online", onUsersOnline);
    socket.on("user:new", refresh);
    socket.on("user:state:update", refresh);
    socket.on("game:invite", onGameInvite);
    socket.on("game:invite:rejected", onGameInviteRejected);
    socket.on("game:start", onGameStart);
    
    return () => {
      socket.off("users:list", onUsersList);
      socket.off("users:online", onUsersOnline);
      socket.off("user:new", refresh);
      socket.off("user:state:update", refresh);
      socket.off("game:invite", onGameInvite);
      socket.off("game:invite:rejected", onGameInviteRejected);
      socket.off("game:start", onGameStart);
    };
  }, []);

  function handleFriendClick(user: User) {
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

  function handleGameInviteClick(user: User) {
    const inviteData = gameInviteStatuses.get(user.id);
    
    if (inviteData?.status === "incoming") {
      return;
    }
    
    if (inviteData?.status === "outgoing") {
      // Cancel outgoing invite
      socket.emit("game:invite:cancel", { targetId: user.id });

      // Reset local status
      setGameInviteStatuses(prev => {
        const newMap = new Map(prev);
        newMap.delete(user.id);
        return newMap;
      });
      return;
    }
    
    // Send invite
    socket.emit("game:invite", { targetId: user.id });
    
    // Set status to "outgoing" (inviteId will be received later)
    setGameInviteStatuses(prev => {
      const newMap = new Map(prev);
      newMap.set(user.id, { status: "outgoing" });
      return newMap;
    });
  }

  function handleGameInviteAccept(userId: number) {
    const inviteData = gameInviteStatuses.get(userId);
    if (!inviteData || inviteData.status !== "incoming" || !inviteData.inviteId) {
      return;
    }
    
    socket.emit("game:invite:accept", {
      inviteId: inviteData.inviteId,
    });
    
    setGameInviteStatuses(prev => {
      const newMap = new Map(prev);
      newMap.delete(userId);
      return newMap;
    });
  }

  function handleGameInviteReject(userId: number) {
    const inviteData = gameInviteStatuses.get(userId);
    if (!inviteData || inviteData.status !== "incoming" || !inviteData.inviteId) {
      return;
    }
    
    socket.emit("game:invite:reject", {
      inviteId: inviteData.inviteId,
    });
    
    setGameInviteStatuses(prev => {
      const newMap = new Map(prev);
      newMap.delete(userId);
      return newMap;
    });
  }

  const displayedUsers = users.filter((u) => u.id !== myUserId);

  console.log(displayedUsers[0]);

  return (
    <>
      <div className="user-list">
        {viewingProfileId !== null && (
          <ProfileModal
            userId={viewingProfileId}
            onClose={() => setViewingProfileId(null)}
          />
        )}
        {displayedUsers.map((u) => (
          <UserRow
            key={u.id}
            id={u.id}
            login={u.login}
            status={u.status}
            online={u.online}
            selected={u.id === selectedUserId}
            inviteStatus={u.inviteStatus}

            onProfile={() => setViewingProfileId(u.id)}
            onSelect={() => onSelectUser(u.id, u.login)}
            onFriend={() => handleFriendClick(u)}
            onReject={() => 
              socket.emit("friend:reject", { targetId: u.id })
            }

            onInvite={() => {
              console.log("invite");
              socket.emit("game:invite", { targetId: u.id });
              handleGameInviteClick(u)
            }}
            realtimeGameInvite={gameInviteStatuses.get(u.id)?.status || "none"}
            onGameInviteAccept={() => handleGameInviteAccept(u.id)}
            onGameInviteReject={() => handleGameInviteReject(u.id)}
          />
        ))}
      </div>
    </>
  );
}
