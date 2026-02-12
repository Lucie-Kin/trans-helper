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
    onCloseTournament: () => void;
    onChangeTournamentName: (name: string) => void;
    onNameSubmit: (matchId: number, player: "A" | "B", name: string) => void;
    tournamentId?: string;
    tournamentName?: string;
    tournamentPlayers?: TournamentPlayer[];
    tournamentMatches?: TournamentMatch[];
    currentUser?: { id: number; name: string };
};

export default function GameBox({
    gameState,
    invitedPlayers,
    onPlayCard,
    onStartTournament,
    onCloseTournament,
    onChangeTournamentName,
    onNameSubmit,
    tournamentId,
    tournamentName,
    tournamentPlayers = [],
    tournamentMatches = [],
    currentUser,
}: Props) {
    const isTournamentMode = invitedPlayers.length >= 2 || gameState === "tournament";

    if (isTournamentMode) {
        const meAsPlayer: TournamentPlayer | null = currentUser ? {
            id: currentUser.id,
            name: currentUser.name,
            isAI: false,
            confirmed: true,
        }: null;

        let allPlayers: TournamentPlayer[];
        if (tournamentPlayers.length > 0) {
            const hasMe = meAsPlayer && tournamentPlayers.some((p) => p.id === meAsPlayer.id);
            allPlayers = hasMe ? tournamentPlayers : [...(meAsPlayer ? [meAsPlayer] : []), ...tournamentPlayers];
        } else {
            allPlayers = [
                ...(meAsPlayer ? [meAsPlayer] : []),
                ...invitedPlayers
                .filter((p) => p.id !== currentUser?.id)
                .map((p) => ({
                    id: p.id,
                    name: p.name,
                    isAI: false,
                    confirmed: p.confirmed,
                })),
            ];
        }

        return (
            <div className="game-box-container">
                <TournamentBracket
                    tournamentId={tournamentId || "new"}
                    tournamentName={tournamentName}
                    players={allPlayers}
                    matches={tournamentMatches}
                    isOrganizer={true}
                    onStart={onStartTournament}
                    onClose={onCloseTournament}
                    onChangeName={onChangeTournamentName}
                    onNameSubmit={onNameSubmit}
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
