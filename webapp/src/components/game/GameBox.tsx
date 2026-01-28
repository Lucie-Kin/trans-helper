import GameCard from "./GameCard";
import GameArea from "./GameArea";
import TournamentBracket, { type TournamentPlayer, type TournamentMatch } from "./TournamentBracket";
import "../../style/game/gameBox.css";

export type InvitedPlayer = {
  id: number;
  name: string;
  confirmed: boolean;
};

type GameState = "idle" | "playing" | "tournament";

type Props = {
  gameState: GameState;
  invitedPlayers: InvitedPlayer[];
  onPlayAI: () => void;
  onPlayRandom: () => void;
  onPlayWithPlayer: (playerId: number) => void;
  onExitGame: () => void;
  onStartTournament: () => void;
  onChangeTournamentName: (name: string) => void;
  tournamentId?: string;
  tournamentName?: string;
  tournamentPlayers?: TournamentPlayer[];
  tournamentMatches?: TournamentMatch[];
  isOrganizer?: boolean;
};

export default function GameBox({
  gameState,
  invitedPlayers,
  onPlayAI,
  onPlayRandom,
  onPlayWithPlayer,
  onExitGame,
  onStartTournament,
  onChangeTournamentName,
  tournamentId,
  tournamentName,
  tournamentPlayers = [],
  tournamentMatches = [],
  isOrganizer = false,
}: Props) {
  const isTournamentMode = invitedPlayers.length >= 2 || gameState === "tournament";

  if (gameState === "playing") {
    return (
      <div className="game-box-container">
        <GameArea onExit={onExitGame} />
      </div>
    );
  }

  if (isTournamentMode) {
    const allPlayers: TournamentPlayer[] = tournamentPlayers.length > 0
      ? tournamentPlayers
      : invitedPlayers.map((p) => ({
          id: p.id,
          name: p.name,
          isAI: false,
          confirmed: p.confirmed,
        }));

    return (
      <div className="game-box-container">
        <TournamentBracket
          tournamentId={tournamentId || "new"}
          tournamentName={tournamentName}
          players={allPlayers}
          matches={tournamentMatches}
          isOrganizer={isOrganizer}
          onStart={onStartTournament}
          onChangeName={onChangeTournamentName}
        />
      </div>
    );
  }

  const singleInvite = invitedPlayers.length === 1 ? invitedPlayers[0] : null;

  return (
    <div className="game-box-container">
      <div className="game-cards-grid">
        {singleInvite ? (
          <GameCard
            type="invite"
            playerName={singleInvite.name}
            waiting={!singleInvite.confirmed}
            onClick={() => onPlayWithPlayer(singleInvite.id)}
          />
        ) : (
          <GameCard type="ai" onClick={onPlayAI} />
        )}
        <GameCard type="random" onClick={onPlayRandom} />
      </div>
    </div>
  );
}
