import "../../style/game/gameArea.css";

type Props = {
  onExit: () => void;
};

export default function GameArea({ onExit }: Props) {
  return (
    <div className="game-area">
      <div className="game-placeholder">
        <div className="game-placeholder-text">Zone de jeu Pong</div>
        <div className="game-placeholder-hint">(Composant de jeu à intégrer)</div>
      </div>
      <button className="game-exit-btn" onClick={onExit}>
        Quitter la partie
      </button>
    </div>
  );
}
