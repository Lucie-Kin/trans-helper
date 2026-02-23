import "../../style/game/tournamentList.css";
import { useLanguage } from "../../language/LanguageContext";

export type TournamentInfo = {
    id: string;
    name: string;
    playerCount: number;
    maxPlayers: number;
    status: "waiting" | "in_progress" | "finished";
    organizerName: string;
};

type Props = {
    tournaments: TournamentInfo[];
    onJoin: (tournamentId: string) => void;
};

export default function TournamentList({ tournaments, onJoin }: Props) {
    const activeTournaments = tournaments.filter((t) => t.status !== "finished");
    const { translate } = useLanguage();

    if (tournaments.length === 0 || activeTournaments.length === 0) {
        return (
            <div className="tournament-list-empty">
                <div className="empty-icon">🏆</div>
                <div className="empty-text">{translate("tournament.null")}</div>
            </div>
        );
    }

    return (
        <div className="tournament-list">
            <div className="tournament-list-title">{translate("tournament.title")}</div>
            <div className="tournament-list-items">
                {activeTournaments.map((t)  => (
                    <div key={t.id} className={`tournament-item ${t.status}`}>
                        <div className="tournament-item-info">
                            <div className="tournament-item-name">{t.name}</div>
                            <div className="tournament-item-details">
                                {translate("tournament.for")}Par {t.organizerName} • {t.playerCount}/{t.maxPlayers} {translate("tournament.player")}
                            </div>
                        </div>
                        {t.status === "waiting" && (
                            <button className="tournament-join-btn" onClick={() => onJoin(t.id)}>
                                {translate("tournament.join")}
                            </button>
                        )}
                        {t.status === "in_progress" && (
                            <span className="tournament-status-badge">{translate("tournament.status")}</span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}