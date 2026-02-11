import { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import ChatBox from "../chat/chatBox";
import GameBox from '../game/GameBox';
import GameArea from '../game/GameArea';
import TournamentList from '../game/TournamentList';
import SettingsModal from './settingsModal';
import { useTournament } from '../../hooks/useTournament';
import { connectSocket } from "../../socket";
import { GameCardType, GameState } from '../share/sharedTypes';

import "../../style/homePage/homepage.css";
import "../../style/homePage/settings.css";

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

type AcceptedInvite = {
  playerId: number;
  expiresAt: number;
};

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

  const tournament = useTournament(user?.id || 0);

  const [gameState, setGameState] = useState<GameState>(GameState.Idle);
  const [activeCard, setActiveCard] = useState<GameCardType | null>(null);
  const [invitePlayerId, setInvitePlayerId] = useState<number | undefined>(undefined);
  const [acceptedInvite, setAcceptedInvite] = useState<AcceptedInvite | null>(null);
  
  const [showSettings, setShowSettings] = useState(false);
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

  // BOOTSTRAP //
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

  // INVITATION TIMEOUT //

  useEffect(() => {
    if (!acceptedInvite) return;
      const timer = setInterval(() => {
        if (Date.now() > acceptedInvite.expiresAt)
          setAcceptedInvite(null);
      }, 1000);

    return () => clearInterval(timer);
  }, [acceptedInvite]);

  // HANDLERS //

  const handleGameInviteSent = (playerId: number, playerLogin: string) => {
    tournament.addPendingInvite(playerId, playerLogin);
  };

  const handleGameInviteAccept = (playerId: number, playerLogin: string) => {
    tournament.addPendingInvite(playerId, playerLogin);
    tournament.confirmInvite(playerId);

    const expiresAt = Date.now() + 3 * 60 * 1000;
    setAcceptedInvite({ playerId, expiresAt });

    setActiveCard(GameCardType.Invite);
    setInvitePlayerId(playerId);
    setGameState(GameState.Idle);
  };

  const handlePlayCard = (type: GameCardType, playerId?: number) => {
    setActiveCard(type);
    if (playerId)
      setInvitePlayerId(playerId);
    setGameState(GameState.Playing);
  };

  const logout = async () => {
    await fetch('https://localhost:8443/auth/logout', {
      method: 'POST',
      credentials: 'include',
    });
    window.location.href = '/';
  };

  const exitGame = () => {
    setActiveCard(null);
    setInvitePlayerId(undefined);
    setGameState(GameState.Idle);
    if (tournament.tournamentId)
      tournament.exitGame();
    else
      tournament.clearInvites();
  };

  if (loading) return <div>Chargement…</div>;
  if (!user) return <div>Accès refusé. <a href="/">Connecte-toi</a>.</div>;

  return (
    <div className="homepage">

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

      <div className={`title-container ${gameState === GameState.Playing ? 'compact' : ''}`}>
        <h3>Transcendance</h3>
        <h4>Bienvenue, {user.displayName}</h4>
      </div>

      {gameState === GameState.Playing && activeCard ? (
        < GameArea
          onExit={exitGame}
          gameCardType={activeCard}
          player1Name={user.displayName || user.login}
          player2Name={
            activeCard === GameCardType.AI 
            ? "AI"
            : tournament.invitedPlayers.find(p => p.id === invitePlayerId)?.name || "Adversaire"
          }
          invitePlayerId={invitePlayerId}
        />
      ) : (
        <div className="boxes-wrapper">
          <div className="game-box">

            <GameBox
              gameState={gameState}
              invitedPlayers={tournament.invitedPlayers}
              onPlayCard={handlePlayCard}
              onStartTournament={tournament.startTournament}
              onChangeTournamentName={tournament.changeTournamentName}
              tournamentId={tournament.tournamentId}
              tournamentName={tournament.tournamentName}
              tournamentPlayers={tournament.tournamentPlayers}
              tournamentMatches={tournament.tournamentMatches}
              currentUser={user ? { id: user.id, name: user.displayName || user.login } : undefined}
            />
            {tournament.availableTournaments.length > 0 && (
              <div className="tournament-wrapper">
                <TournamentList
                  tournaments={tournament.availableTournaments}
                  onJoin={tournament.joinTournament}
                />
              </div>
            )}
          </div>

          <ChatBox 
            myUserId={user.id}
            onGameInviteSent={handleGameInviteSent}
            onGameInviteAccept={handleGameInviteAccept}
          />
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
