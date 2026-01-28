import { useState } from "react";
import "../../style/game/tournamentBracket.css";

export type TournamentPlayer = {
  id: number;
  name: string;
  isAI: boolean;
  confirmed: boolean;
};

export type TournamentMatch = {
  id: number;
  round: number;
  position: number;
  player1?: TournamentPlayer;
  player2?: TournamentPlayer;
  winner?: number;
};

type Props = {
  tournamentId: string;
  tournamentName?: string;
  players: TournamentPlayer[];
  matches: TournamentMatch[];
  isOrganizer: boolean;
  onStart: () => void;
  onChangeName: (name: string) => void;
};

export default function TournamentBracket({
  tournamentId,
  tournamentName,
  players,
  matches,
  isOrganizer,
  onStart,
  onChangeName,
}: Props) {
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(tournamentName || "");

  const displayName = tournamentName || `Tournament #${tournamentId}`;

  const handleNameSubmit = () => {
    onChangeName(nameInput);
    setEditingName(false);
  };

  const rounds = matches.length > 0 ? Math.max(...matches.map((m) => m.round), 0) : 0;
  const matchesByRound: TournamentMatch[][] = [];
  for (let r = 1; r <= rounds; r++) {
    matchesByRound.push(matches.filter((m) => m.round === r).sort((a, b) => a.position - b.position));
  }

  const getRoundName = (round: number, total: number) => {
    if (round === total) return "Finale";
    if (round === total - 1) return "Demi-finales";
    if (round === total - 2) return "Quarts";
    return `Tour ${round}`;
  };

  const hasNoMatches = matches.length === 0;

  return (
    <div className="tournament-bracket">
      <div className="tournament-header">
        {editingName && isOrganizer ? (
          <div className="tournament-name-edit">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Nom du tournoi"
              autoFocus
            />
            <button onClick={handleNameSubmit}>OK</button>
          </div>
        ) : (
          <h3 className="tournament-name" onClick={() => isOrganizer && setEditingName(true)}>
            {displayName}
            {isOrganizer && <span className="edit-hint">✏️</span>}
          </h3>
        )}
        <div className="tournament-players-count">{players.length} joueurs</div>
      </div>

      {hasNoMatches ? (
        <div className="bracket-empty">
          <div className="bracket-empty-icon">🏆</div>
          <div className="bracket-empty-text">En attente de joueurs...</div>
          <div className="bracket-empty-hint">
            Invitez des joueurs puis lancez le tournoi
          </div>
          {players.length > 0 && (
            <div className="bracket-players-preview">
              {players.map((p) => (
                <span key={p.id} className={`player-tag ${p.isAI ? "ai" : ""} ${p.confirmed ? "" : "pending"}`}>
                  {p.isAI && "🤖 "}{p.name}
                </span>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="bracket-container">
          {matchesByRound.map((roundMatches, idx) => (
            <div key={idx} className="bracket-round">
              <div className="round-title">{getRoundName(idx + 1, rounds)}</div>
              <div className="round-matches">
                {roundMatches.map((match) => (
                  <div key={match.id} className="bracket-match">
                    <div className={`bracket-player ${match.winner === match.player1?.id ? "winner" : ""}`}>
                      {match.player1 ? (
                        <>
                          {match.player1.isAI && <span className="ai-badge">🤖</span>}
                          <span className={match.player1.confirmed ? "" : "unconfirmed"}>
                            {match.player1.name}
                          </span>
                        </>
                      ) : (
                        <span className="tbd">TBD</span>
                      )}
                    </div>
                    <div className="bracket-vs">VS</div>
                    <div className={`bracket-player ${match.winner === match.player2?.id ? "winner" : ""}`}>
                      {match.player2 ? (
                        <>
                          {match.player2.isAI && <span className="ai-badge">🤖</span>}
                          <span className={match.player2.confirmed ? "" : "unconfirmed"}>
                            {match.player2.name}
                          </span>
                        </>
                      ) : (
                        <span className="tbd">TBD</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {isOrganizer && (
        <button className="tournament-start-btn" onClick={onStart}>
          Jouer
        </button>
      )}
    </div>
  );
}
