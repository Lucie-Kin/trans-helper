// webapp/src/pong/main.ts
import { GameField } from "./core/gameField";
import { Player } from "./entities/player";
import { Ball } from "./entities/ball";
import { GameEngine } from "./core/gameEngine";
import { AIController } from "./core/AIController";
import { GameCardType } from "../share/sharedTypes";

export function startPong(
  canvas: HTMLCanvasElement,
  mode: GameCardType,
  invitePlayerId?: number
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
  let rafId = 0;
  let last = performance.now();
  let countdown = 0;
  let countdownStart = 0;
  const COUTDOWN_DURATION = 3;

  const startCountdown = (now: number) => {
    countdown = COUTDOWN_DURATION;
    countdownStart = now;
  };
  
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "w" || e.key === "s") pressed.add(e.key);
    if (e.key === "p") paused = !paused;
    if (mode !== GameCardType.AI) {
      if (pressed.has("ArrowUp")) engine.movePlayer(player2, "up");
      if (pressed.has("ArrowDown")) engine.movePlayer(player2, "down");
    }
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
      startCountdown(now);
    }
  };

  const handleInput = () => {
    if (pressed.has("w")) engine.movePlayer(player1, "up");
    if (pressed.has("s")) engine.movePlayer(player1, "down");
  };

  const render = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

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
    ctx.font = "24px Arial";
    ctx.fillText(`${engine.scoreP1} | ${engine.scoreP2}`, canvas.width / 2 - 25, 30);

    if (paused) {
      ctx.font = "28px Arial";
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

    handleInput();

    if (countdown > 0) {
      const elapsed = (now - countdownStart) / 1000;
      countdown = Math.max(COUTDOWN_DURATION - Math.floor(elapsed), 0);
    } else if (!paused && !externallyPaused)
      engine.update(dt);

    render();
    // last = performance.now();
    // startCountdown(last);
    rafId = requestAnimationFrame(loop);
  };
  last = performance.now();
  startCountdown(last);
  rafId = requestAnimationFrame(loop);

  // super important pour React : on nettoie quand on quitte la page
  return {
    cleanup: () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    },
    setPaused: (value: boolean) => setPaused(value, last)
  };
}
