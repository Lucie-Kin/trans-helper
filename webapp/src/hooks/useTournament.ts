import { useState, useEffect, useCallback } from "react";
import { getSocket } from "../socket";
import type { TournamentPlayer, TournamentMatch } from "../components/game/TournamentBracket";
import type { TournamentInfo } from "../components/game/TournamentList";
import { GameState } from "../components/share/sharedTypes";

export type InvitedPlayer = {
    id: number;
    name: string;
    confirmed: boolean;
};

export function useTournament(myUserId: number) {
    const socket = getSocket();

    const [invitedPlayers, setInvitedPlayers] = useState<InvitedPlayer[]>([]);
    const [gameState, setGameState] = useState<GameState>(GameState.Idle);
    const [tournamentId, setTournamentId] = useState<string | undefined>();
    const [tournamentName, setTournamentName] = useState<string>("");
    const [tournamentPlayers, setTournamentPlayers] = useState<TournamentPlayer[]>([]);
    const [tournamentMatches, setTournamentMatches] = useState<TournamentMatch[]>([]);
    const [isOrganizer, setIsOrganizer] = useState(false);
    const [availableTournaments, setAvailableTournaments] = useState<TournamentInfo[]>([]);
    const [activeInviteId, setActiveInviteId] = useState<number | undefined>();

    const fetchTournaments = useCallback(async () => {
        try {
            const res = await fetch("https://localhost:8443/tournament/list", {
                credentials: "include",
            });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    setAvailableTournaments(
                        data.map((t: any) => ({
                            id: t.id,
                            name: t.title || `Tournament #${t.id}`,
                            playerCount: t.playerCount || 0,
                            maxPlayers: t.maxPlayers || 8,
                            status: t.status || "WAITING_FOR_PLAYERS",
                            organizerName: t.organizerName || "Unknown",
                        }))
                    );
                }
            }
        } catch(err) {
            console.error("Failed to fetch tournaments", err);
        }
    }, []);

    const fetchTournamentBracket = useCallback(async (id: string) => {
        try {
            const [bracketRes, infoRes] = await Promise.all([
                fetch(`https://localhost:8443/tournament/${id}/bracket`, { credentials: "include" }),
                fetch(`https://localhost:8443/tournament/${id}`, { credentials: "include" }),
            ]);
            if (bracketRes.ok) {
                const bracket = await bracketRes.json();
                const matches: TournamentMatch[] = (bracket.matches || []).map((m: any) => ({
                    id: `${m.roundIndex}-${m.bracketPosition}`,
                    round: m.roundIndex,
                    position: m.bracketPosition,
                    playerAId: m.playerA?.playerId ? Number(m.playerA.playerId) : undefined,
                    playerBId: m.playerB?.playerId ? Number(m.playerB.playerId) : undefined,
                    winnerId: m.winnerId ? Number(m.winnerId) : undefined,
                    scoreA: m.scoreA,
                    scoreB: m.scoreB,
                    status: m.status,
                }));
                setTournamentMatches(matches);
            }

            if (infoRes) {
                const info = await infoRes.json();
                if (info.title)
                    setTournamentName(info.title)
                setIsOrganizer(info.organizerId === String(myUserId));
            }
        } catch(err) {
            console.error("Failed to fetch bracket", err);
        }
    }, [myUserId]);

    useEffect(() => {
        const onGameStart = (data: { invitedId: number; players: number[] }) => {
            const otherPlayerId = data.players.find(id => id !== myUserId);
            if (otherPlayerId) {
                setInvitedPlayers((prev) => {
                    const exists = prev.find((p) => p.id === otherPlayerId);
                    if (exists) {
                        return prev.map((p) =>
                            p.id === otherPlayerId ? { ...p, confirmed: true } : p
                        );
                    }
                    return prev;
                });
            }
            setActiveInviteId(data.invitedId);
        };

        const onGameEnd = () => {
            setGameState(GameState.Idle);
            setInvitedPlayers([]);
            setActiveInviteId(undefined);
        };

        const onInviteAccepted = (data: { from: { id: number; login: string } }) => {
            setInvitedPlayers((prev) => {
                const exists= prev.find((p) => p.id === data.from.id);
                if (exists) {
                    return prev.map((p) =>
                        p.id === data.from.id ? {...p, confirmed: true} : p
                    );
                }
                return [...prev, { id: data.from.id, name: data.from.login, confirmed: true }];
            });
        };

        const onGameInviteRejected = (data: { by: number }) => {
            setInvitedPlayers((prev) => prev.filter((p) => p.id !== data.by));
        };

        const onNotification = (payload: any) => {
            if (payload.type === "tournament") {
                if (payload.tournamentId) {
                    setTournamentId(payload.tournamentId);
                    setGameState(GameState.Tournament);
                    fetchTournamentBracket(payload.tournamentId);
                }
            }
        };
        socket.on("game:start", onGameStart);
        socket.on("game:end", onGameEnd);
        socket.on("game:invite:accepted", onInviteAccepted);
        socket.on("game:invite:rejected", onGameInviteRejected);
        socket.on("notification", onNotification);

        fetchTournaments();

        return () => {
            socket.off("game:start", onGameStart);
            socket.off("game:end", onGameEnd);
            socket.off("game:invite", onInviteAccepted);
            socket.off("game:invite:rejected", onGameInviteRejected);
            socket.off("notification", onNotification);
        };
    }, [socket, myUserId, fetchTournaments, fetchTournamentBracket]);

    const addPendingInvite = useCallback((playerId: number, playerName: string) => {
        setInvitedPlayers((prev) => {
            const exists = prev.find((p) => p.id === playerId);
            if (exists)
                return prev;
            return [...prev, { id: playerId, name: playerName, confirmed: false }];
        });
    }, []);
    
    const removeInvite = useCallback((playerId: number) => {
        setInvitedPlayers((prev) => prev.filter((p) => p.id !== playerId));
    }, []);

    const confirmInvite = useCallback((playerId: number) => {
        setInvitedPlayers((prev) => 
            prev.map((p) => (p.id === playerId ? { ...p, confirmed: true } : p))
        );
    }, []);

    const playAI = useCallback(() => {
        setGameState(GameState.Playing);
    }, []);

    const playRandom = useCallback(() => {
        socket.emit("game:queue:join");
        setGameState(GameState.Playing);
    }, [socket]);

    const playWithPlayer = useCallback((playerId: number) => {
        const player = invitedPlayers.find((p) => p.id === playerId);
        if (player?.confirmed) {
            socket.emit("game:start:with", { targetId: playerId });
            setGameState(GameState.Playing);
        }
    }, [socket, invitedPlayers]);

    const startTournament =useCallback(async() => {
        if (tournamentId) {
            try {
                await fetch(`https://localhost:8443/tournament/${tournamentId}/start`, {
                    method: "POST",
                    credentials: "include",
                });
            } catch(err) {
                console.log("Failed to start tournament", err);
            }
        } else if (invitedPlayers.length >= 2) {
            try {
                const res = await fetch("https://localhost:8443/tournament", {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        playerIds: [myUserId, ...invitedPlayers.map((p) => p.id)],
                        name: tournamentName || undefined,
                    }),
                });
                if (res.ok) {
                    const tournamentInfo = await res.json();
                    setTournamentId(tournamentInfo.id);
                    setTournamentName(tournamentInfo.name);
                    setIsOrganizer(true);
                    setGameState(GameState.Tournament);
                    fetchTournamentBracket(tournamentInfo.id);
                }
            } catch(err) {
                console.log("Failed to create tournament", err);
            }
        }
    }, [tournamentId, invitedPlayers, tournamentName, myUserId, fetchTournamentBracket]);

    const changeTournamentName = useCallback((name: string) => {
        setTournamentName(name);
    }, []);

    const joinTournament = useCallback(async(id: string) => {
        try {
            const res = await fetch(`https://localhost:8443/tournament/${id}/join`, {
                method: "POST",
                credentials: "include",
            });
            if (res.ok) {
                setTournamentId(id);
                setGameState(GameState.Tournament);
                fetchTournamentBracket(id);
            }
        } catch(err) {
            console.log("Failed to join tournament", err);
        }
    }, [fetchTournamentBracket]);

    const exitGame = useCallback(() => {
        setGameState(GameState.Idle);
    }, []);

    const clearInvites = useCallback(() => {
        setInvitedPlayers([]);
        setTournamentId(undefined);
        setTournamentName("");
        setTournamentPlayers([]);
        setTournamentMatches([]);
        setIsOrganizer(false);
        setActiveInviteId(undefined);
        setGameState(GameState.Idle);
    }, []);

    return {
        invitedPlayers,
        gameState,
        activeInviteId,
        tournamentId,
        tournamentName,
        tournamentPlayers,
        tournamentMatches,
        isOrganizer,
        availableTournaments,
        addPendingInvite,
        removeInvite,
        confirmInvite,
        playAI,
        playRandom,
        playWithPlayer,
        startTournament,
        changeTournamentName,
        joinTournament,
        exitGame,
        clearInvites,
    };
}
