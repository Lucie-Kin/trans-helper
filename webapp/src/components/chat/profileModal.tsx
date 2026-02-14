import { useEffect, useState } from "react";
import { useOnlineUsers } from "../../hooks/useOnlineUsers";
import "../../style/chat/profileModal.css";

type ProfileInfo = {
    userId: number;
    login: string;
    avatar: string | null;
    displayName?: string | null;
  };
  

type Props = {
  userId: number;
  onClose: () => void;
};

export default function ProfileModal({ userId, onClose }: Props) {
  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [stats, setStats] = useState<{ wins: number; losses: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const onlineUsers = useOnlineUsers();
  const isOnline = onlineUsers.includes(userId);

  useEffect(() => {
    setLoading(true);
    setError(null);

    fetch(`/auth/api/profile/${userId}`, {
      credentials: "include",
    })
      .then(async (r) => {
        if (!r.ok) {
          const t = await r.text();
          throw new Error(t);
        }
        return r.json();
      })
      .then((data) => {
        setProfile(data);
      })
      .catch((err) => {
        console.error("ProfileModal fetch error:", err);
        setError("Failed to load profile");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId]);


    useEffect(() => {
    fetch(`/tournament/match-history/stats?userId=${userId}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { wins: 0, losses: 0 }))
      .then(setStats)
      .catch(() => setStats({ wins: 0, losses: 0 }));
  }, [userId]);

  return (
    <div className="profile-overlay" onClick={onClose}>
      <div
        className="profile-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close-btn" onClick={onClose}>
          ✕
        </button>

        {loading && <div>Chargement…</div>}

        {error && <div className="empty">{error}</div>}

        {!loading && profile && (
          <>
            <div className="profile-header">
              <img
                src={profile.avatar || "/avatar.png"}
                alt={profile.login}
                className="profile-avatar"
              />

              <div>
                <h2>{profile.login}</h2>
                <span className={isOnline ? "online" : "offline"}>
                  {isOnline ? "online" : "offline"}
                </span>
              </div>
            </div>
            {stats !== null && (
              <div className="profile-stats">
                <div>
                  <strong>{stats.wins}</strong>
                  <span>Wins</span>
                </div>
                <div>
                  <strong>{stats.losses}</strong>
                  <span>Losses</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
