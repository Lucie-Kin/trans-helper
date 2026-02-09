import { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import "../../style/homePage/homepage.css";
import "../../style/homePage/settings.css";
import SettingsModal from './settingsModal';
import ChatBox from "../chat/chatBox";
import GameBox from '../game/GameBox';
import GameArea from '../game/GameArea';
import { useGameInvites } from '../../hooks/useGameInvites';
import { useNotifications } from "../../hooks/useNotifications";
import { useTournament } from '../../hooks/useTournament';
import { connectSocket } from "../../socket";

import { GameState } from '../share/sharedTypes';


////////////
const DEV_MODE = false;
const DEV_USER: User = {
  id: 1,
  login: "dev-user",
  email: "dev@local",
  image: "/avatar.png",
  displayName: "Dev Mode",
  is2faEnabled: false,
  twofaPassed: true,
};
//////////// 

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
  const { notification, clear } = useNotifications();
  const gameInvites = useGameInvites();
  const tournament = useTournament(user?.id || 0);
  const [menuOpen, setMenuOpen] = useState(false);

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
      if (DEV_MODE) {
        setUser(DEV_USER);
        setLoading(false);
        return;
      }
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
            Accèder au match
          </button>

          <button onClick={clear}>Fermer</button>
        </div>
      )}

      {gameInvites.invite && (
        <div className="invite-popup">
          <p>
            <strong>{gameInvites.invite.from.login}</strong> souhaite jouer avec vous
          </p>

          <div className="invite-actions">
            <button onClick={gameInvites.accept}>Accepter</button>
            <button onClick={gameInvites.reject}>Refuser</button>
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

      <div className={`title-container ${tournament.gameState === GameState.Playing ? 'compact' : ''}`}>
        <h3>Transcendance</h3>
        <h4>Bienvenue, {user.displayName}</h4>
      </div>

      {tournament.gameState === GameState.Playing ? (
        < GameArea onExit={tournament.exitGame} />
      ) : (
        <div className="boxes-wrapper">
          <div className="game-box">

            {/* <div className="pong-frame">
            <img className="pong-classic"
              src="/images/pongHomePage.png"
              alt="Pong"
            /></div>
            <div className="play">
              <LinkButton
                text="Jouer"
                href="https://localhost:8443/play"
              />
            </div> */}

            <GameBox
              gameState={tournament.gameState}
              invitedPlayers={tournament.invitedPlayers}
              onPlayAi={tournament.playAI}
              onPlayRandom={tournament.playRandom}
              onPlayWithPlayer={tournament.playWithPlayer}
              onStartTournament={tournament.startTournament}
              onChangeTournamentName={tournament.changeTournamentName}
              tournamentId={tournament.tournamentId}
              tournamentName={tournament.tournamentName}
              tournamentPlayers={tournament.tournamentPlayers}
              tournamentMatches={tournament.tournamentMatches}
              isOrganizer={tournament.isOrganizer}
            />
          </div>
          {/* <div className="play">
            <LinkButton
              text="Jouer"
              href="https://localhost:8443/pong"
            />
          </div> */}

          <ChatBox myUserId={user.id} />
        </div>
      )}

      <div className="profile-box">
        <div className="profile-area" onClick={() => setMenuOpen(!menuOpen)}>
          <div className="settings-box">
            <img className="avatar-home-page" src={user.image} alt="Avatar" />
          </div>
          <div className="login-home-page">{user.displayName}</div>
        </div>
      </div>

      {menuOpen && (
        <div className="profile-menu">
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
