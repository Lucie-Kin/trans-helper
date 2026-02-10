import "../../style/game/gameBox.css";
import GameCard from "./GameCard";
import TournamentBracket from "./TournamentBracket";
import type { TournamentPlayer, TournamentMatch } from "./TournamentBracket";
import type { GameState } from "../share/sharedTypes";
import { GameCardType } from "../share/sharedTypes";

export type InvitedPlayer = {
    id:number;
    name: string;
    confirmed: boolean;
};

type Props = {
    gameState: GameState;
    invitedPlayers: InvitedPlayer[];
    onPlayCard: (type: GameCardType, playerId?: number) => void;
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
    onPlayCard,
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
                    isOrganizer={isOrganizer || !tournamentId}
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
                        type={GameCardType.Invite}
                        playerName={singleInvite.name}
                        waiting={!singleInvite.confirmed}
                        disabled={!singleInvite.confirmed}
                        onClick={() => onPlayCard(GameCardType.Invite, singleInvite.id)}
                    />
                ) : (
                    <GameCard type={GameCardType.AI} onClick={() => onPlayCard(GameCardType.AI)}/>
                )}
                <GameCard type={GameCardType.Random} onClick={() => onPlayCard(GameCardType.Random)}/>
            </div>
        </div>
    );
}
