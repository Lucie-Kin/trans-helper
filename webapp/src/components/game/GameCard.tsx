import "../../style/game/gameCard.css";

export type GameCardType = "ai" | "random" | "invite";

type Props = {
  type: GameCardType;
  playerName?: string;
  waiting?: boolean;
  disabled?: boolean;
  onClick: () => void;
};

export default function GameCard({ type, playerName, waiting, disabled, onClick }: Props) {
  const getTitle = () => {
    if (type === "ai") return "Jouer contre l'IA";
    if (type === "random") return "Jouer contre Random";
    if (type === "invite" && playerName) return `Jouer avec ${playerName}`;
    return "Jouer";
  };

  const getIcon = () => {
    if (type === "ai") return "🤖";
    if (type === "random") return "🎲";
    if (type === "invite") return "👥";
    return "🎮";
  };

  const cardClass = `game-card ${type} ${waiting ? "waiting" : ""} ${disabled ? "disabled" : ""}`;

  return (
    <div className={cardClass} onClick={disabled ? undefined : onClick}>
      <div className="game-card-icon">{getIcon()}</div>
      <div className="game-card-title">{getTitle()}</div>
      {waiting && <div className="game-card-waiting">En attente de confirmation...</div>}
    </div>
  );
}
