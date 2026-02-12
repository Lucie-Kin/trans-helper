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

    const addManualPlayerToMatch = useCallback(
        (matchId: number, slot: "A" | "B", name: string) => {

            const newPlayer: TournamentPlayer = {
                id: Date.now(),
                name,
                isAI: false,
                confirmed: true,
                isGuest: true,
            };

            setTournamentPlayers(prev => {
                if (prev.find(p => p.id === newPlayer.id))
                    return prev;
                return [...prev, newPlayer];
            });
        },
        []
    );

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

    const findFirstUnplayedMatch = useCallback((matches: TournamentMatch[]): TournamentMatch | null => {
        const sorted = [...matches].sort((a, b) => {
            if (a.round !== b.round) return a.round - b.round;
            return a.position - b.position;
        });
        return sorted.find((m) => m.winner === undefined && (m.playerA || m.playerB)) || null;
    }, []);

    const generateBracketMatches = useCallback((playerList: TournamentPlayer[]): TournamentMatch[] => {
        if (playerList.length < 2) return [];
        const totalSlots = Math.pow(2, Math.ceil(Math.log2(playerList.length)));
        const totalRounds = Math.log2(totalSlots);
        const generated: TournamentMatch[] = [];
        let matchId = 1;
        for (let r = 1; r <= totalRounds; r++) {
            const matchesInRound = totalSlots / Math.pow(2, r);
            for (let p = 1; p <= matchesInRound; p++) {
                const match: TournamentMatch = { id: matchId++, round: r, position: p };
                if (r === 1) {
                    const idxA = (p - 1) * 2;
                    const idxB = (p - 1) * 2 + 1;
                    if (idxA < playerList.length) match.playerA = playerList[idxA];
                    if (idxB < playerList.length) match.playerB = playerList[idxB];
                }
                generated.push(match);
            }
        }
        return generated;
    }, []);

    const addGuestPlayer = useCallback((name: string) => {
        const clean = name.trim();
        if (!clean) return;

        const newPlayer: TournamentPlayer = {
            id: Date.now(),
            name: clean,
            isAI: false,
            confirmed: true,
            isGuest: true,
        };

        setInvitedPlayers(prev => {
            if (prev.some(p => p.name === clean))
                return prev;
            return [...prev, newPlayer];
        });

        setTournamentPlayers(prev => {
            if (prev.some(p => p.id === newPlayer.id))
                return prev;
            return [...prev, newPlayer];
        });

    }, []);

    const startTournamentMatch = useCallback((): boolean => {
        if (tournamentMatches.length === 0)
            return false;

        const match = findFirstUnplayedMatch(tournamentMatches);
        if (!match)
            return false;

        let pA = match.playerA;
        let pB = match.playerB;

        if (!pA) pA = {id: -(match.id * 10 + 1), name: "AI", isAI: true, confirmed: true};
        if (!pB) pB = {id: -(match.id * 10 + 2), name: "AI", isAI: true, confirmed: true};
       
        setTournamentMatches(prev => 
            prev.map(m => m.id === match.id ? {...m, playerA: pA, playerB: pB} : m)
        );

        setActiveTournamentMatch({
            matchId: match.id,
            round: match.round,
            position: match.position,
            playerAName: pA.name,
            playerBName: pB.name,
            isAIOpponent: pA.isAI || pB.isAI,
        });
        return true;  
    }, [tournamentMatches, findFirstUnplayedMatch]);

    // const startTournamentMatch = useCallback((): boolean => {
    //     let matches = tournamentMatches;

    //     if (matches.length === 0 && invitedPlayers.length > 0) {
    //         const allPlayers: TournamentPlayer[] = [
    //             ...(myUserId ? [{ id: myUserId, name: "Moi", isAI: false, confirmed: true }] : []),
    //             ...invitedPlayers
    //                 .filter((p) => p.id !== myUserId)
    //                 .map((p) => ({ id: p.id, name: p.name, isAI: false, confirmed: p.confirmed })),
    //         ];
    //         matches = generateBracketMatches(allPlayers);
    //         setTournamentMatches(matches);
    //     }

    //     const match = findFirstUnplayedMatch(matches);
    //     if (!match) return false;

    //     let pA = match.playerA;
    //     let pB = match.playerB;

    //     if (!pA || !pB) {
    //         const aiPlayerA: TournamentPlayer | undefined = pA ? undefined : { id: -(match.id * 10 + 1), name: "AI", isAI: true, confirmed: true };
    //         const aiPlayerB: TournamentPlayer | undefined = pB ? undefined : { id: -(match.id * 10 + 2), name: "AI", isAI: true, confirmed: true };

    //         if (aiPlayerA || aiPlayerB) {
    //             matches = matches.map((m) =>
    //                 m.id === match.id
    //                     ? { ...m, playerA: aiPlayerA ?? m.playerA, playerB: aiPlayerB ?? m.playerB }
    //                     : m
    //             );
    //             setTournamentMatches(matches);
    //             pA = aiPlayerA ?? pA;
    //             pB = aiPlayerB ?? pB;
    //         }
    //     }

    //     const isAI = (pA?.isAI ?? false) || (pB?.isAI ?? false);

    //     setActiveTournamentMatch({
    //         matchId: match.id,
    //         round: match.round,
    //         position: match.position,
    //         playerAName: pA ? pA.name : "AI",
    //         playerBName: pB ? pB.name : "AI",
    //         isAIOpponent: isAI,
    //     });
    //     return true;
    // }, [tournamentMatches, invitedPlayers, myUserId, findFirstUnplayedMatch, generateBracketMatches]);

    const handleNameSubmit = (_matchId: number, _slot: "A" | "B", name: string) => {
        const clean = name.trim();
        if (!clean) return;

        setInvitedPlayers(prev => {
            if (prev.some(p => p.name === clean))
                return prev;

            const newGuest: TournamentPlayer = {
                id: Date.now(),
                name: clean,
                isAI: false,
                confirmed: true,
                isGuest: true,
            };
            return [...prev, newGuest];
        });
    };

    const handleTournamentMatchEnd = useCallback((winnerSide: 1 | 2, scoreA: number, scoreB: number) => {
        if (!activeTournamentMatch) return;
        const { matchId, round, position } = activeTournamentMatch;

        setTournamentMatches((prev) => {
            const currentMatch = prev.find((m) => m.id === matchId);
            if (!currentMatch) return prev;

            const winnerPlayer = winnerSide === 1 ? currentMatch.playerA : currentMatch.playerB;
            if (!winnerPlayer) return prev;
            
            // const winnerId = winnerPlayer?.id ?? -1;
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

        setTimeout(() => setActiveTournamentMatch(null), 3000);
    }, [activeTournamentMatch]);

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

    const clearInvites = useCallback(() => {
        setInvitedPlayers([]);
        setTournamentId(undefined);
        setTournamentName("");
        setTournamentPlayers([]);
        setTournamentMatches([]);
        setIsOrganizer(false);
        setActiveInviteId(undefined);
        setActiveTournamentMatch(null);
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
        addManualPlayerToMatch,
        addGuestPlayer
    };
}
