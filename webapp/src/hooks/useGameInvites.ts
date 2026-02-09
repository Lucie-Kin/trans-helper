import { useEffect, useState, useCallback } from "react";
import { getSocket } from "../socket";

type GameInvite = {
    inviteId: number;
    from: {
        id: number;
        login: string;
    };
};

export function useGameInvites() {
    const socket = getSocket();
    const [invite, setInvite] = useState<GameInvite | null>(null);

    useEffect(() => {
        const onInvite = (payload: GameInvite) => {
            setInvite(payload);
        };
        const onReject = () => {
            setInvite(null);
        };
        const onGameStart = () => {
            setInvite(null);
        };

        socket.on("game:invite", onInvite);
        socket.on("game:invite:rejected", onReject);
        socket.on("game:start", onGameStart);

        return () => {
            socket.off("game:invite", onInvite);
            socket.off("game:invite:rejected", onReject);
            socket.off("game:start", onGameStart);
        };
    }, [socket]);

    const accept = useCallback(() => {
        if (!invite) return;
        socket.emit("game:invite:accept", {
            inviteId: invite.inviteId,
        });
        setInvite(null);
    }, [socket, invite]);

    const reject = useCallback(() => {
        if (!invite) return;
        socket.emit("game:invite:reject", {
            inviteId: invite.inviteId,
        });
        setInvite(null);
    }, [socket, invite]);

    return { invite, accept, reject };
}
