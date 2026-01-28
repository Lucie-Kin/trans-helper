import { useState, useEffect, useCallback } from "react";
import { getSocket } from "../socket";
import type { TournamentPlayer, TournamentMatch } from "../components/game/TournamentBracket";
import type { TournamentInfo } from "../components/game/TournamentList";

export type InvitedPlayer = {
  id: number;
  name: string;
  confirmed: boolean;
};

type GameState = "idle" | "playing" | "tournament";

export function useTournament(myUserId: number) {
  const socket = getSocket();

  const [invitedPlayers, setInvitedPlayers] = useState<InvitedPlayer[]>([]);
  const [gameState, setGameState] = useState<GameState>("idle");
  const [tournamentId, setTournamentId] = useState<string | undefined>();
  const [tournamentName, setTournamentName] = useState<string>("");
  const [tournamentPlayers, setTournamentPlayers] = useState<TournamentPlayer[]>([]);
  const [tournamentMatches, setTournamentMatches] = useState<TournamentMatch[]>([]);
  const [isOrganizer, setIsOrganizer] = useState(false);
  const [availableTournaments, setAvailableTournaments] = useState<TournamentInfo[]>([]);

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
    } catch (err) {
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
          player1Id: m.playerA?.playerId ? Number(m.playerA.playerId) : undefined,
          player2Id: m.playerB?.playerId ? Number(m.playerB.playerId) : undefined,
          winnerId: m.winnerId ? Number(m.winnerId) : undefined,
          score1: m.scoreA,
          score2: m.scoreB,
          status: m.status,
        }));
        setTournamentMatches(matches);
      }

      if (infoRes.ok) {
        const info = await infoRes.json();
        if (info.title) setTournamentName(info.title);
        setIsOrganizer(info.organizerId === String(myUserId));
      }
    } catch (err) {
      console.error("Failed to fetch bracket", err);
    }
  }, [myUserId]);

  useEffect(() => {
    const onGameStart = () => {
      setGameState("playing");
    };

    const onGameEnd = () => {
      setGameState("idle");
      setInvitedPlayers([]);
    };

    const onInviteAccepted = (data: { from: { id: number; login: string } }) => {
      setInvitedPlayers((prev) => {
        const exists = prev.find((p) => p.id === data.from.id);
        if (exists) {
          return prev.map((p) =>
            p.id === data.from.id ? { ...p, confirmed: true } : p
          );
        }
        return [...prev, { id: data.from.id, name: data.from.login, confirmed: true }];
      });
    };

    const onNotification = (payload: any) => {
      if (payload.type === "tournament") {
        if (payload.tournamentId) {
          setTournamentId(payload.tournamentId);
          setGameState("tournament");
          fetchTournamentBracket(payload.tournamentId);
        }
      }
    };

    socket.on("game:start", onGameStart);
    socket.on("game:end", onGameEnd);
    socket.on("game:invite:accepted", onInviteAccepted);
    socket.on("notification", onNotification);

    fetchTournaments();

    return () => {
      socket.off("game:start", onGameStart);
      socket.off("game:end", onGameEnd);
      socket.off("game:invite:accepted", onInviteAccepted);
      socket.off("notification", onNotification);
    };
  }, [socket, fetchTournaments, fetchTournamentBracket]);

  const addPendingInvite = useCallback((playerId: number, playerName: string) => {
    setInvitedPlayers((prev) => {
      const exists = prev.find((p) => p.id === playerId);
      if (exists) return prev;
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
    setGameState("playing");
  }, []);

  const playRandom = useCallback(() => {
    socket.emit("game:queue:join");
    setGameState("playing");
  }, [socket]);

  const playWithPlayer = useCallback(
    (playerId: number) => {
      const player = invitedPlayers.find((p) => p.id === playerId);
      if (player?.confirmed) {
        socket.emit("game:start:with", { targetId: playerId });
        setGameState("playing");
      }
    },
    [socket, invitedPlayers]
  );

  const startTournament = useCallback(async () => {
    if (tournamentId) {
      try {
        await fetch(`https://localhost:8443/tournament/${tournamentId}/start`, {
          method: "POST",
          credentials: "include",
        });
      } catch (err) {
        console.error("Failed to start tournament", err);
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
          setTournamentName(tournamentInfo.title);
          setIsOrganizer(true);
          setGameState("tournament");
          fetchTournamentBracket(tournamentInfo.id);
        }
      } catch (err) {
        console.error("Failed to create tournament", err);
      }
    }
  }, [tournamentId, invitedPlayers, tournamentName, myUserId, fetchTournamentBracket]);

  const changeTournamentName = useCallback((name: string) => {
    setTournamentName(name);
  }, []);

  const joinTournament = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`https://localhost:8443/tournament/${id}/join`, {
          method: "POST",
          credentials: "include",
        });
        if (res.ok) {
          setTournamentId(id);
          setGameState("tournament");
          fetchTournamentBracket(id);
        }
      } catch (err) {
        console.error("Failed to join tournament", err);
      }
    },
    [fetchTournamentBracket]
  );

  const exitGame = useCallback(() => {
    setGameState("idle");
  }, []);

  const clearInvites = useCallback(() => {
    setInvitedPlayers([]);
    setTournamentId(undefined);
    setTournamentName("");
    setTournamentPlayers([]);
    setTournamentMatches([]);
    setIsOrganizer(false);
    setGameState("idle");
  }, []);

  return {
    invitedPlayers,
    gameState,
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
