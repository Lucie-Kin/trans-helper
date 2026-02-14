import { useEffect, useState } from "react";
import "../../style/chat/profileModal.css";
import { useMatchHistory } from "../../hooks/useMatchHistory";
import { API_BASE } from "../../api";

type User = {
  id: number;
  login: string;
  avatar: string | null;
};

export default function MatchHistory({ onClose }: { onClose: () => void }) {
  const { items, loading, error } = useMatchHistory();
  const [usersMap, setUsersMap] = useState<Map<string, string>>(new Map());

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API_BASE}/auth/api/users`, {
          credentials: "include",
        });
        if (res.ok) {
          const users = (await res.json()) as User[];
          const map = new Map<string, string>();
          users.forEach((u) => {
            map.set(String(u.id), u.login);
          });
          setUsersMap(map);
        }
      } catch (err) {
        console.error("Failed to fetch users", err);
      }
    };

    if (items.length > 0) {
      fetchUsers();
    }
  }, [items]);

  const renderContent = () => {
    if (loading) return <div>Loading match history…</div>;
    if (error) return <div>Error loading match history: {error}</div>;
    if (!items.length) return <div>No matches played yet.</div>;

    return (
      <ul className="match-history-list">
        {items.map((m) => {
          const date = new Date(m.played_at);
          const formattedDate = isNaN(date.getTime())
            ? m.played_at
            : date.toLocaleString(undefined, {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
                hour: "2-digit",
                minute: "2-digit",
              });

          const outcomeLabel = m.result === "WIN" ? "Win " : "Loss ";
          const typeLabel = m.match_type === "TOURNAMENT" ? "Tournament " : "1v1 ";
          const opponentName = usersMap.get(m.opponent_id) || m.opponent_id;

          return (
            <li key={m.id} className="match-history-item">
              <div className="match-history-main">
                <span className={`match-result match-result-${m.result.toLowerCase()}`}>
                  {outcomeLabel}
                </span>
                <span className="match-vs">vs {opponentName} </span>
                <span className="match-score">
                  {m.score_for} : {m.score_against}
                </span>
              </div>
              <div className="match-history-meta">
                <span className="match-type">{typeLabel}</span>
                <span className="match-date">{formattedDate}</span>
              </div>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Match history</h3>
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>
        <div className="match-history-body">{renderContent()}</div>
      </div>
    </div>
  );
}


