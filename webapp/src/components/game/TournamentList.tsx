import "../../style/game/tournamentList.css";

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
  if (tournaments.length === 0) {
    return (
      <div className="tournament-list-empty">
        <div className="empty-icon">🏆</div>
        <div className="empty-text">Aucun tournoi en cours</div>
      </div>
    );
  }

  return (
    <div className="tournament-list">
      <div className="tournament-list-title">Tournois disponibles</div>
      <div className="tournament-list-items">
        {tournaments.map((t) => (
          <div key={t.id} className={`tournament-item ${t.status}`}>
            <div className="tournament-item-info">
              <div className="tournament-item-name">{t.name}</div>
              <div className="tournament-item-details">
                Par {t.organizerName} • {t.playerCount}/{t.maxPlayers} joueurs
              </div>
            </div>
            {t.status === "waiting" && (
              <button className="tournament-join-btn" onClick={() => onJoin(t.id)}>
                Rejoindre
              </button>
            )}
            {t.status === "in_progress" && (
              <span className="tournament-status-badge">En cours</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
