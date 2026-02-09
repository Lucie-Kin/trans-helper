import "../../style/game/gameBox.css";
import GameCard from "./GameCard";
import TournamentBracket from "./TournamentBracket";
import type { TournamentPlayer, TournamentMatch } from "./TournamentBracket";
import type { GameState } from "../share/sharedTypes";

export type InvitedPlayer = {
    id:number;
    name: string;
    confirmed: boolean;
};

type Props = {
    gameState: GameState;
    invitedPlayers: InvitedPlayer[];
    onPlayAi: () => void;
    onPlayRandom: () => void;
    onPlayWithPlayer: (playerId: number) => void;
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
    onPlayAi,
    onPlayRandom,
    onPlayWithPlayer,
    onStartTournament,
    onChangeTournamentName,
    tournamentId,
    tournamentName,
    tournamentPlayers = [],
    tournamentMatches = [],
    isOrganizer = false,
}: Props) {
    const isTournamentMode = invitedPlayers.length >= 2 || gameState === "tournament";

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
            <h2 className="game-box-title">Choose Game Mode</h2>
            <div className="game-card-grid">
                {singleInvite ? (
                    <GameCard
                        type="invite"
                        playerName={singleInvite.name}
                        waiting={!singleInvite.confirmed}
                        onClick={() => onPlayWithPlayer(singleInvite.id)}
                    />
                ) : (
                    <GameCard type="ai" onClick={onPlayAi}/>
                )}
                <GameCard type="random" onClick={onPlayRandom}/>
            </div>
        </div>
    );
}
