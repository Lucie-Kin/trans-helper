import { useEffect, useState } from "react";
import { getSocket } from "../socket";
import { useNavigate } from "react-router-dom";

type GameInvite = {
  inviteId: number;
  from: {
    id: number;
    login: string;
  };
};

export function useGameInvites() {
  const socket = getSocket();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<GameInvite | null>(null);

  useEffect(() => {
    const onInvite = (data: GameInvite) => {
      setInvite(data);
    };

    const onRejected = ({ inviteId }: { inviteId: number }) => {
      setInvite((current) =>
        current && current.inviteId === inviteId ? null : current
      );
    };

    const onGameStart = ({ inviteId }: { inviteId: number }) => {
      setInvite(null);
      navigate(`/pong/${inviteId}`);
    };

    socket.on("game:invite", onInvite);
    socket.on("game:invite:rejected", onRejected);
    socket.on("game:start", onGameStart);

    return () => {
      socket.off("game:invite", onInvite);
      socket.off("game:invite:rejected", onRejected);
      socket.off("game:start", onGameStart);
    };
  }, [socket, navigate]);

  function accept() {
    if (!invite) return;

    socket.emit("game:invite:accept", {
      inviteId: invite.inviteId,
    });

    setInvite(null);
  }

  function reject() {
    if (!invite) return;

    socket.emit("game:invite:reject", {
      inviteId: invite.inviteId,
    });

    setInvite(null);
  }

  return {
    invite,
    accept,
    reject,
  };
}
