// webapp/src/pong/main.ts
import { GameField } from "./core/gameField";
import { Player } from "./entities/player";
import { Ball } from "./entities/ball";
import { GameEngine } from "./core/gameEngine";
import { AIController } from "./core/AIController";

export function startPong(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // On se cale sur la taille du canvas React
  const field = new GameField(canvas.width, canvas.height);

  const player1 = new Player(30, field.height / 2 - 50);
  const player2 = new Player(field.width - 40, field.height / 2 - 50);
  const ball = new Ball(field.width / 2, field.height / 2, 0, 0, 10);

  const ai = new AIController(field);
  const engine = new GameEngine(player1, player2, ball, field, 0, 0, ai);

  const pressed = new Set<string>();
  let paused = false;
  let rafId = 0;
  let last = performance.now();

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "w" || e.key === "s") pressed.add(e.key);
    if (e.key === "p") paused = !paused;
  };

  const onKeyUp = (e: KeyboardEvent) => {
    pressed.delete(e.key);
  };

  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

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
  };

  const loop = (now: number) => {
    const dt = now - last;
    last = now;

    handleInput();
    if (!paused) engine.update(dt);

    render();
    rafId = requestAnimationFrame(loop);
  };

  rafId = requestAnimationFrame(loop);

  // super important pour React : on nettoie quand on quitte la page
  return () => {
    cancelAnimationFrame(rafId);
    window.removeEventListener("keydown", onKeyDown);
    window.removeEventListener("keyup", onKeyUp);
  };
}
