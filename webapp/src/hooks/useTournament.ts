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

export type ActiveTournamentMatch = {
    matchId: number;
    round: number;
    position: number;
    playerAName: string;
    playerBName: string;
    isAIOpponent: boolean;
};

export type NextMatchNotification = {
    playerAName: string;
    playerBName: string;
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
    const [activeTournamentMatch, setActiveTournamentMatch] = useState<ActiveTournamentMatch | null>(null);
    const [nextMatchNotification, setNextMatchNotification] = useState<NextMatchNotification | null>(null);

    const fetchTournaments = useCallback(async () => {
        try {
            const res = await fetch("https://localhost:8443/tournament/list", {
                credentials: "include",
            });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data)) {
                    const normalizeStatus = (s: string) => {
                        const lower = (s || "").toLowerCase();
                        if (lower.includes("waiting") || lower === "waiting_for_players") return "waiting" as const;
                        if (lower.includes("progress") || lower === "in_progress") return "in_progress" as const;
                        if (lower.includes("finish") || lower === "completed") return "finished" as const;
                        return "waiting" as const;
                    };
                    setAvailableTournaments(
                        data.map((t: any) => ({
                            id: String(t.id),
                            name: t.title || t.name || `Tournament #${t.id}`,
                            playerCount: t.playerCount || t.players?.length || 0,
                            maxPlayers: t.maxPlayers || 8,
                            status: normalizeStatus(t.status),
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
                let matchCounter = 1;
                const matches: TournamentMatch[] = (bracket.matches || []).map((m: any) => ({
                    id: matchCounter++,
                    round: m.roundIndex,
                    position: m.bracketPosition,
                    playerA: m.playerA?.playerId ? {
                        id: Number(m.playerA.playerId),
                        name: m.playerA.username || `Player ${m.playerA.playerId}`,
                        isAI: m.playerA.isAI || false,
                        confirmed: true,
                    } : undefined,
                    playerB: m.playerB?.playerId ? {
                        id: Number(m.playerB.playerId),
                        name: m.playerB.username || `Player ${m.playerB.playerId}`,
                        isAI: m.playerB.isAI || false,
                        confirmed: true,
                    } : undefined,
                    winner: m.winnerId ? Number(m.winnerId) : undefined,
                    scoreA: m.scoreA,
                    scoreB: m.scoreB,
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

        const onTournamentNextMatch = (payload: { playerAName: string; playerBName: string; tournamentId: string }) => {
            setNextMatchNotification({ playerAName: payload.playerAName, playerBName: payload.playerBName });
        };
        socket.on("game:start", onGameStart);
        socket.on("game:end", onGameEnd);
        socket.on("game:invite:accepted", onInviteAccepted);
        socket.on("game:invite:rejected", onGameInviteRejected);
        socket.on("notification", onNotification);
        socket.on("tournament:nextMatch", onTournamentNextMatch);

        fetchTournaments();

        return () => {
            socket.off("game:start", onGameStart);
            socket.off("game:end", onGameEnd);
            socket.off("game:invite", onInviteAccepted);
            socket.off("game:invite:rejected", onGameInviteRejected);
            socket.off("notification", onNotification);
            socket.off("tournament:nextMatch", onTournamentNextMatch);
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

    const findFirstUnplayedMatch = useCallback((matches: TournamentMatch[]): TournamentMatch | null => {
        const sorted = [...matches].sort((a, b) => {
            if (a.round !== b.round) return a.round - b.round;
            return a.position - b.position;
        });
        return sorted.find((m) => m.winner === undefined && (m.playerA || m.playerB)) || null;
    }, []);

    const generateBracketMatches = useCallback((playerList: TournamentPlayer[]): TournamentMatch[] => {
        const slots = playerList.slice(0, 4);
        const generated: TournamentMatch[] = [];

        generated.push({
            id: 1, round: 1, position: 1,
            playerA: slots[0],
            playerB: slots[1],
        });
        generated.push({
            id: 2, round: 1, position: 2,
            playerA: slots[2],
            playerB: slots[3],
        });
        generated.push({
            id: 3, round: 2, position: 1,
        });

        return generated;
    }, []);

    useEffect(() => {
        if (tournamentMatches.length === 0 && invitedPlayers.length >= 2) {
            const allPlayers: TournamentPlayer[] = [
                ...(myUserId ? [{ id: myUserId, name: "Moi", isAI: false, confirmed: true }] : []),
                ...invitedPlayers
                    .filter((p) => p.id !== myUserId)
                    .map((p) => ({ id: p.id, name: p.name, isAI: false, confirmed: p.confirmed })),
            ];
            const matches = generateBracketMatches(allPlayers);
            if (matches.length > 0)
                setTournamentMatches(matches);
        }
    }, [invitedPlayers, myUserId, tournamentMatches.length, generateBracketMatches]);

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

    const startTournamentMatch = useCallback((): boolean => {
        let matches = tournamentMatches;

        if (matches.length === 0 && invitedPlayers.length > 0) {
            const allPlayers: TournamentPlayer[] = [
                ...(myUserId ? [{ id: myUserId, name: "Moi", isAI: false, confirmed: true }] : []),
                ...invitedPlayers
                    .filter((p) => p.id !== myUserId)
                    .map((p) => ({ id: p.id, name: p.name, isAI: false, confirmed: p.confirmed })),
            ];
            matches = generateBracketMatches(allPlayers);
            setTournamentMatches(matches);
        }

        const match = findFirstUnplayedMatch(matches);
        if (!match) return false;

        const pA = match.playerA;
        const pB = match.playerB;

        if (!pA || !pB) return false;

        setActiveTournamentMatch({
            matchId: match.id,
            round: match.round,
            position: match.position,
            playerAName: pA.name,
            playerBName: pB.name,
            isAIOpponent: false,
        });
        return true;
    }, [tournamentMatches, invitedPlayers, myUserId, findFirstUnplayedMatch, generateBracketMatches]);

    const handleNameSubmit = useCallback((matchId: number, slot: "A" | "B", name: string) => {
        const clean = name.trim();
        if (!clean) return;

        const guestPlayer: TournamentPlayer = {
            id: Date.now(),
            name: clean,
            isAI: false,
            confirmed: true,
            isGuest: true,
        };
        
        setTournamentMatches((prev) =>
            prev.map((m) => {
                if (m.id !== matchId)
                    return m;
                if (slot === "A")
                    return { ...m, playerA: guestPlayer };
                return { ...m, playerB: guestPlayer };
            })
        );
    }, []);

    const handleTournamentMatchEnd = useCallback((winnerSide: 1 | 2, scoreA: number, scoreB: number) => {
        if (!activeTournamentMatch) return;
        const { matchId, round, position } = activeTournamentMatch;

        setTournamentMatches((prev) => {
            const currentMatch = prev.find((m) => m.id === matchId);
            if (!currentMatch) return prev;

            const winnerPlayer = winnerSide === 1 ? currentMatch.playerA : currentMatch.playerB;
            if (!winnerPlayer) return prev;

            const winnerId = winnerPlayer.id;

            const nextRound = round + 1;
            const nextPosition = Math.ceil(position / 2);
            const slot = position % 2 === 1 ? "playerA" : "playerB";

            return prev.map((m) => {
                if (m.id === matchId) {
                    return { ...m, winner: winnerId, scoreA, scoreB };
                }
                if (m.round === nextRound && m.position === nextPosition) {
                    return { ...m, [slot]: { ...winnerPlayer } };
                }
                return m;
            });
        });

        setTimeout(() => {
            setActiveTournamentMatch(null);
            setGameState(GameState.Idle);

            setTournamentMatches((latestMatches) => {
                const nextMatch = findFirstUnplayedMatch(latestMatches);
                if (nextMatch) {
                    const pAName = nextMatch.playerA?.name || "AI";
                    const pBName = nextMatch.playerB?.name || "AI";
                    setNextMatchNotification({ playerAName: pAName, playerBName: pBName });

                    if (tournamentId) {
                        const participantIds = Array.from(
                            new Set(
                                latestMatches
                                    .flatMap((m) => [m.playerA, m.playerB])
                                    .filter((p) => p && !p.isAI && p.id > 0)
                                    .map((p) => p!.id)
                            )
                        );
                        socket.emit("tournament:nextMatch", {
                            tournamentId,
                            playerAName: pAName,
                            playerBName: pBName,
                            participantIds,
                        });
                    }
                }
                return latestMatches;
            });
        }, 2000);
    }, [activeTournamentMatch, findFirstUnplayedMatch, tournamentId, socket]);

    const startTournament = useCallback(async () => {
        if (tournamentId) {
            try {
                const res = await fetch(`https://localhost:8443/tournament/${tournamentId}/start`, {
                    method: "POST",
                    credentials: "include",
                });
                if (res.ok) {
                    fetchTournamentBracket(tournamentId);
                    fetchTournaments();
                }
            } catch (err) {
                console.log("Failed to start tournament", err);
            }
        } else if (tournamentPlayers.length >= 2) {
            try {
                const playerIds = tournamentPlayers.map(p => p.id);
                const res = await fetch("https://localhost:8443/tournament", {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        playerIds,
                        name: tournamentName || undefined,
                    }),
                });
                if (res.ok) {
                    const tournamentInfo = await res.json();
                    setTournamentId(tournamentInfo.id);
                    setTournamentName(tournamentInfo.name || tournamentName);
                    setIsOrganizer(true);
                    setGameState(GameState.Tournament);
                    fetchTournamentBracket(tournamentInfo.id);
                    fetchTournaments();
                }
            } catch (err) {
                console.log("Failed to create tournament via API, creating locally", err);
                const localId = `local-${Date.now()}`;
                setTournamentId(localId);
                setTournamentName(tournamentName || `Tournament #${localId}`);
                setIsOrganizer(true);
                setGameState(GameState.Tournament);
                const matches = generateBracketMatches(tournamentPlayers);
                setTournamentMatches(matches);
            }
        }
        startTournamentMatch();
    }, [
        tournamentId,
        tournamentName,
        tournamentPlayers,
        fetchTournamentBracket,
        fetchTournaments,
        startTournamentMatch,
    ]);

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

    const dismissNextMatchNotification = useCallback(() => {
        setNextMatchNotification(null);
    }, []);

    const clearInvites = useCallback(() => {
        setInvitedPlayers([]);
        setTournamentId(undefined);
        setTournamentName("");
        setTournamentPlayers([]);
        setTournamentMatches([]);
        setIsOrganizer(false);
        setActiveInviteId(undefined);
        setActiveTournamentMatch(null);
        setNextMatchNotification(null);
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
        activeTournamentMatch,
        nextMatchNotification,
        addPendingInvite,
        removeInvite,
        confirmInvite,
        playAI,
        playRandom,
        playWithPlayer,
        startTournament,
        startTournamentMatch,
        handleNameSubmit,
        handleTournamentMatchEnd,
        changeTournamentName,
        joinTournament,
        exitGame,
        clearInvites,
        dismissNextMatchNotification,
    };
}