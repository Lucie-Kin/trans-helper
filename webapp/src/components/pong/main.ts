// webapp/src/pong/main.ts
import { GameField } from "./core/gameField";
import { Player } from "./entities/player";
import { Ball } from "./entities/ball";
import { GameEngine } from "./core/gameEngine";
import { AIController } from "./core/AIController";
import { GameCardType } from "../share/sharedTypes";

export type MatchResult = {
  winner: 1 | 2;
  scoreP1: number;
  scoreP2: number;
  player1Name: string;
  player2Name: string;
};

function getRank(elo: number): string {
  if (elo >= 1600) return "Pro";
  if (elo >= 1200) return "Mid";
  return "Noob";
}

function getKFactor(elo: number): number {
  if (elo >= 1600) return 16;
  if (elo >= 1200) return 24;
  return 32;
}

function computeEloChange(winnerElo: number, loserElo: number): { winnerNew: number; loserNew: number } {
  const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  const expectedLoser = 1 / (1 + Math.pow(10, (winnerElo - loserElo) / 400));
  const winnerNew = Math.max(0, Math.round(winnerElo + getKFactor(winnerElo) * (1 - expectedWinner)));
  const loserNew = Math.max(0, Math.round(loserElo + getKFactor(loserElo) * (0 - expectedLoser)));
  return { winnerNew, loserNew };
}

export function startPong(
  canvas: HTMLCanvasElement,
  mode: GameCardType,
  player1Name: string = "Player 1",
  player2Name: string = "Player 2",
  invitePlayerId?: number,
  onGameEnd?: (result: MatchResult) => void,
  player1Elo: number = 1000,
  player2Elo: number = 1000
) {
  if (invitePlayerId) console.log("invite player id: ", invitePlayerId);
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // On se cale sur la taille du canvas React
  const field = new GameField(canvas.width, canvas.height);
  const paddleHeight = 100;

  let player1: Player;
  let player2: Player;
  let ai: AIController | undefined;
  const ball = new Ball(field.width / 2, field.height / 2, 0, 0, 10);

  const p2Name = mode === GameCardType.AI ? "AI" : player2Name;

  switch (mode) {
    case GameCardType.AI:
      player1 = new Player(30, (field.height - paddleHeight) / 2, 10, 10, paddleHeight);
      player2 = new Player(field.width - 40, (field.height - paddleHeight) / 2, 10, 10, paddleHeight);
      ai = new AIController(field);
      break;
    case GameCardType.Random:
    case GameCardType.Invite:
      player1 = new Player(30, (field.height - paddleHeight) / 2, 10, 10, paddleHeight);
      player2 = new Player(field.width - 40, (field.height - paddleHeight) / 2, 10, 10, paddleHeight);
      ai = undefined;
      break;
  };

  const engine = new GameEngine(player1, player2, ball, field, 0, 0, ai);

  const pressed = new Set<string>();
  let paused = false;
  let externallyPaused = false;
  let gameEnded = false;
  let rafId = 0;
  let last = performance.now();
  let countdown = 0;
  let countdownStart = 0;
  const COUTDOWN_DURATION = 3;

  let waitingForSpace = true;

  const startCountdown = (now: number) => {
    countdown = COUTDOWN_DURATION;
    countdownStart = now;
  };
  
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.code === "Space" && waitingForSpace) {
      e.preventDefault();
      waitingForSpace = false;
      paused = false;
      externallyPaused = false;
      startCountdown(performance.now());
      return;
    }

    if (e.key === "w" || e.key === "s") pressed.add(e.key);
    if (e.key === "ArrowUp" || e.key === "ArrowDown") pressed.add(e.key);

    if (e.key === "p" && !gameEnded) paused = !paused;
  };

  const onKeyUp = (e: KeyboardEvent) => {
    pressed.delete(e.key);
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  const setPaused = (value: boolean, now: number) => {
    if (externallyPaused === value) return;
    externallyPaused = value;
    if (!externallyPaused) {
      last = now;
      if (!waitingForSpace)
        startCountdown(now);
    }
  };

  const cleanup = () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
  };

  const handleInput = () => {
    if (pressed.has("w")) engine.movePlayer(player1, "up");
    if (pressed.has("s")) engine.movePlayer(player1, "down");

    if (mode !== GameCardType.AI) {
      if (pressed.has("ArrowUp")) engine.movePlayer(player2, "up");
      if (pressed.has("ArrowDown")) engine.movePlayer(player2, "down");
    }
  };

  const renderGameOver = () => {
    const w = engine.winner!;
    const winnerName = w === 1 ? player1Name : p2Name;
    const loserName = w === 2 ? p2Name : player1Name;
    const loserScore = w === 1 ? engine.scoreP2 : engine.scoreP1;
    const winnerCurrentElo = w === 1 ? player1Elo : player2Elo;
    const loserCurrentElo = w === 1 ? player2Elo : player1Elo;
    const eloResult = computeEloChange(winnerCurrentElo, loserCurrentElo);
    const winnerRank = getRank(eloResult.winnerNew);

    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    ctx.shadowColor = "#ffd700";
    ctx.shadowBlur = 30;
    ctx.fillStyle = "#ffd700";
    ctx.font = "42px Chakra_bold";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("VICTOIRE", cx, cy - 100);
    ctx.shadowBlur = 0;

    ctx.shadowColor = "#ffd700";
    ctx.shadowBlur = 20;
    ctx.fillStyle = "#ffffff";
    ctx.font = "32px Chakra_bold";
    ctx.fillText(winnerName, cx, cy - 55);
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#cccccc";
    ctx.font = "22px Chakra";
    ctx.fillText(`${engine.scoreP1} - ${engine.scoreP2}`, cx, cy - 15);

    ctx.fillStyle = "#aaaaaa";
    ctx.font = "18px Chakra";
    const eloChange = eloResult.winnerNew - winnerCurrentElo;
    ctx.fillText(`ELO: ${eloResult.winnerNew} (+${eloChange})`, cx, cy + 20);

    ctx.fillStyle = winnerRank === "Pro" ? "#ffd700" : winnerRank === "Mid" ? "#87ceeb" : "#aaaaaa";
    ctx.font = "20px Chakra_bold";
    ctx.fillText(`Rank: ${winnerRank}`, cx, cy + 50);

    ctx.fillStyle = "#888888";
    ctx.font = "16px Chakra";
    ctx.fillText(`${loserName} - ${loserScore} pts`, cx, cy + 90);
  };

  const renderWaitingForSpace = () => {
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = "white";
    ctx.fillRect(player1.x, player1.y, player1.width, player1.height);
    ctx.fillRect(player2.x, player2.y, player2.width, player2.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ffffff";
    ctx.font = "24px Chakra_bold";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(player1Name, canvas.width * 0.25, cy - 40);
    ctx.fillText("VS", cx, cy - 40);
    ctx.fillText(p2Name, canvas.width * 0.75, cy - 40);

    ctx.fillStyle = "#cccccc";
    ctx.font = "18px Chakra";
    ctx.fillText("Appuyez sur Espace pour commencer", cx, cy + 20);
  };

  const render = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (waitingForSpace) {
      renderWaitingForSpace();
      return;
    }

    if (engine.gameOver) {
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "white";
      ctx.fillRect(player1.x, player1.y, player1.width, player1.height);
      ctx.fillRect(player2.x, player2.y, player2.width, player2.height);
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = "24px Chakra_bold";
      ctx.fillText(`${engine.scoreP1} | ${engine.scoreP2}`, canvas.width / 2 - 25, 30);

      renderGameOver();

      if (!gameEnded) {
        gameEnded = true;
        if (onGameEnd && engine.winner) {
          onGameEnd({
            winner: engine.winner,
            scoreP1: engine.scoreP1,
            scoreP2: engine.scoreP2,
            player1Name,
            player2Name: p2Name,
          });
        }
      }
      return;
    }

    // fond
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // raquettes
    ctx.fillStyle = "white";
    ctx.fillRect(player1.x, player1.y, player1.width, player1.height);
    ctx.fillRect(player2.x, player2.y, player2.width, player2.height);

    // balle
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    // score (simple, sans DOM)
    ctx.font = "24px Chakra_bold";
    ctx.fillText(`${engine.scoreP1} | ${engine.scoreP2}`, canvas.width / 2 - 25, 30);

    if (paused) {
      ctx.font = "28px Chakra_bold";
      ctx.fillText("PAUSE (p)", canvas.width / 2 - 70, canvas.height / 2);
    }

    if (externallyPaused) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "white";
      ctx.font = "28px Chakra_bold";
      ctx.textAlign = "center";
      ctx.fillText(
        "PAUSED",
        canvas.width / 2,
        canvas.height / 2 - 10
      );
      ctx.font = "20px Chakra_bold";
      ctx.textAlign = "center";
      ctx.fillText(
        "Game not in focus",
        canvas.width / 2,
        canvas.height / 2 + 20
      );
    }

    if (countdown > 0) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "white";
      ctx.font = "96px Chakra_bold";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        countdown.toString(),
        canvas.width / 2,
        canvas.height / 2
      );
    }
  };

  const loop = (now: number) => {
    const dt = now - last;
    last = now;

    if (!waitingForSpace)
      handleInput();

    if (countdown > 0) {
      const elapsed = (now - countdownStart) / 1000;
      countdown = Math.max(COUTDOWN_DURATION - Math.floor(elapsed), 0);
    } else if (!paused && !externallyPaused && !engine.gameOver)
      engine.update(dt);

    render();
    rafId = requestAnimationFrame(loop);
  };
  last = performance.now();
  rafId = requestAnimationFrame(loop);

  // super important pour React : on nettoie quand on quitte la page
  return {
    cleanup,
    setPaused: (value: boolean) => setPaused(value, last)
  };
}
