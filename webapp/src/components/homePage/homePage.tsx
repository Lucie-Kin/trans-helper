import { useEffect, useState } from 'react';
import "../../style/homePage/homepage.css";
import "../../style/homePage/settings.css";
import SettingsModal from './settingsModal';
import { useNavigate } from "react-router-dom";
import ChatBox from "../chat/chatBox";
import GameBox from "../game/GameBox";
import TournamentList from "../game/TournamentList";
import { useGameInvites } from '../../hooks/useGameInvites';
import { useNotifications } from "../../hooks/useNotifications";
import { useTournament } from "../../hooks/useTournament";
import { connectSocket } from "../../socket";

type User = {
  id: number;
  login: string;
  email?: string;
  image?: string;
  displayName?: string;
  is2faEnabled: boolean;
  twofaPassed: boolean;
} | null;


export default function HomePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const { invite, accept, reject } = useGameInvites();
  const { notification, clear } = useNotifications();
  const [menuOpen, setMenuOpen] = useState(false);

  const tournament = useTournament(user?.id || 0);

  const refreshUser = async () => {
    try {
      const res = await fetch('https://localhost:8443/auth/session', {
        credentials: "include",
      });
      if (!res.ok) return;
      const { user } = await res.json();
      const defaultAvatar = "/avatar.png";
      if (!user.image) user.image = defaultAvatar;
      setUser(user);
    } catch (err) {
      console.error("Failed to refresh user",err);
    }
  };
  

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('https://localhost:8443/auth/session', {
          credentials: 'include',
        });
        const defaultAvatar = "/avatar.png";

        if (res.ok) {
          const { user } = await res.json();
          if (!user.image)
            user.image = defaultAvatar;
          if (user.is2faEnabled && !user.twofaPassed) {
            setLoading(false);
            navigate("/2fa");
            return;
          }
          connectSocket();
          setUser(user);
        } else {
          setUser(null);
        }

      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const logout = async () => {
    await fetch('https://localhost:8443/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    window.location.href = '/';
  };

  if (loading) return <div>Chargement…</div>;
  if (!user) return <div>Accès refusé. <a href="/">Connecte-toi</a>.</div>;

  return (
    <div className="homepage">

      {notification?.type === "tournament" && (
        <div className="tournament-popup">
          <p>
            Prochain match contre{" "}
            <strong>{notification.opponent?.login}</strong>
          </p>

          <button
            onClick={() =>
              navigate(`/pong/${notification.matchId}`)
            }
          >
            Acceder au match
          </button>

          <button onClick={clear}>Fermer</button>
        </div>
      )}


      {invite && (
        <div className="invite-popup">
          <p>
            <strong>{invite.from.login}</strong> souhaite jouer avec vous
          </p>

          <div className="invite-actions">
            <button onClick={accept}>Accepter</button>
            <button onClick={reject}>Refuser</button>
          </div>
        </div>
      )}


      {showSettings && user && (
        <SettingsModal
          user={{
            id: user.id,
            login: user.login,
            email: user.email || '',
            image: user.image,
            displayName: user.displayName,
            is2faEnabled: user.is2faEnabled,
          }}
          onClose={() => setShowSettings(false)}
          refreshUser={refreshUser}
        />
      )}

      <div className="title-container">
        <h3>Transcendance</h3>
        <h4>Bienvenue, {user.displayName}</h4>
      </div>

      <div className="gameBox">
        <GameBox
          gameState={tournament.gameState}
          invitedPlayers={tournament.invitedPlayers}
          onPlayAI={tournament.playAI}
          onPlayRandom={tournament.playRandom}
          onPlayWithPlayer={tournament.playWithPlayer}
          onExitGame={tournament.exitGame}
          onStartTournament={tournament.startTournament}
          onChangeTournamentName={tournament.changeTournamentName}
          tournamentId={tournament.tournamentId}
          tournamentName={tournament.tournamentName}
          tournamentPlayers={tournament.tournamentPlayers}
          tournamentMatches={tournament.tournamentMatches}
          isOrganizer={tournament.isOrganizer}
        />
      </div>


      <ChatBox myUserId={user.id} />

      <div className="tournaments-sidebar">
        <TournamentList
          tournaments={tournament.availableTournaments}
          onJoin={tournament.joinTournament}
        />
      </div>


      <div className="profileArea" onClick={() => setMenuOpen(!menuOpen)}>
        <div className="settingsBox">
          <img className="avatarHomePage" src={user.image} alt="Avatar" />
        </div>
        <div className="loginHomePage">{user.displayName}</div>
      </div>


      {menuOpen && (
        <div className="profileMenu">
          <button type="button" onClick={() => { setMenuOpen(false); setShowSettings(true); }}>
            Settings
          </button>

          <button type="button" onClick={logout}>
            Déconnexion
          </button>
        </div>
      )}


    </div>
  );
}
