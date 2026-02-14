import { Ball, BASE_KICKOFF_SPEED } from './../entities/ball.js';
import { Player } from './../entities/player.js';
import { GameField } from './gameField.js';
import { AIController } from './AIController.js';

export const WIN_SCORE = 1;

export class GameEngine {
	public AIController?: AIController;
	public gameOver: boolean = false;
	public winner: 1 | 2 | null = null;

	private started = false;

	constructor(
		public player1: Player,
		public player2: Player,
		public ball: Ball,
		public field: GameField,
		public scoreP1 = 0,
		public scoreP2 = 0,
		AI?: AIController
	) {
		this.player1 = player1;
		this.player2 = player2;
		this.ball = ball;
		this.field = field;
		this.scoreP1 = scoreP1;
		this.scoreP2 = scoreP2;

		if (AI) {
				this.AIController = AI;
				this.AIController.attach(player2, player1, ball);
		}
}


	movePlayer(player: Player, direction: 'up' | 'down', dt: number) {
		const dir = direction === 'up' ? -1 : 1;
		// Clamp movement so the paddle never leaves the playable area.
		player.y = this.clamp(player.y + dir * player.speed * dt, 0, this.field.height - player.height);
	}

	update(dt: number = 1 / 60) {
		if (!this.started) {
			this.started = true;
			this.resetBall(false);
		}

		// Avoid huge dt spikes (tab switch, debugger pause, etc.)
		const clampedDt = Math.min(dt, 0.05); // 50ms max
		// ---- Fixed-substep physics ----
		// Even after clamping dt, a single step can still be large enough to miss collisions
		// at high speed. We split the frame into smaller physics steps (120Hz) to make
		// collisions more stable.
		const maxStep = 1 / 120; // 120 Hz physics
		let remaining = clampedDt;

		while (remaining > 0) {
			const step = Math.min(remaining, maxStep);
			this.moveBall(step);
			this.checkCollisions();
			remaining -= step;
		}
		// AI decides at its own rate, but movement is applied every frame.
		if (this.AIController) {
			const now = performance.now();
			this.AIController.moveAI(now);
			const move = this.AIController.getMoveAction();
			if (move !== "stay") this.movePlayer(this.player2, move, clampedDt);
		}
	}

	private resetBall(kickoff: boolean = true) {
		this.ball.x = this.field.width / 2;
		this.ball.y = this.field.height / 2;

		if (!kickoff) {
		  this.ball.speedX = 0;
		  this.ball.speedY = 0;
		  return;
		}

		const angle = Math.random() * (Math.PI / 2) - Math.PI / 4;
		const direction = (this.scoreP1 + this.scoreP2) % 2 === 0 ? 1 : -1;

		this.ball.speedX = Math.cos(angle) * BASE_KICKOFF_SPEED * direction;
		this.ball.speedY = Math.sin(angle) * BASE_KICKOFF_SPEED;
		if (this.AIController)
			this.AIController.onKickoff();
	  }

	private moveBall(dt: number) {
		this.ball.x += this.ball.speedX * dt;
		this.ball.y += this.ball.speedY * dt;

		this.resolveWallBounce();
		this.checkScore();
	}

	private resolveWallBounce() {
		// The ball center must stay within [radius, height - radius] vertically.
		const top = this.ball.radius;
		const bot = this.field.height - this.ball.radius;
		// Small epsilon used to push the ball slightly off the boundary after correction.
		// This avoids "sticking" due to floating-point precision when the ball lands
		// exactly on the boundary and gets detected again next step.
		const epsilon = 1e-4;

		if (this.ball.y <= top) {
			// Compute penetration (how far the ball center went past the wall),
			// then mirror it back inside to preserve the bounce feel.
			const pen = top - this.ball.y;

			// Place the ball just inside, mirrored by penetration + tiny epsilon.
			this.ball.y = top + pen + epsilon;
			// Ensure the velocity points downward after bouncing off the top wall.
			this.ball.speedY = Math.abs(this.ball.speedY);
		} else if (this.ball.y >= bot) {
			const pen = this.ball.y - bot;
			this.ball.y = bot - pen - epsilon;

			// Ensure the velocity points upward after bouncing off the bottom wall.
			this.ball.speedY = -Math.abs(this.ball.speedY);
		}
	}

	private checkScore() {
		if (this.ball.x + this.ball.radius >= this.field.width) {
			this.scoreP1++;
			this.resetBall();
		} else if (this.ball.x - this.ball.radius <= 0) {
			this.scoreP2++;
			this.resetBall();
		}
	}

	private calculateBounce(player: Player, direction: 1 | -1) {
		// relativeY: ball position relative to paddle center
		const relativeY = this.ball.y - (player.y + player.height / 2);
		// Normalize to [-1, +1] based on half paddle height
		let normalizedY = relativeY / (player.height / 2);
		normalizedY = Math.max(-1, Math.min(1, normalizedY));
		// Normalize to [-1, +1] based on half paddle height
		const maxAngle = Math.PI / 3; //60 degrees
		const angle = normalizedY * maxAngle;

		const maxSpeed = 20 * 60;
		const speed = Math.min(Math.hypot(this.ball.speedX, this.ball.speedY) * 1.05, maxSpeed);

		this.ball.speedX = direction * Math.abs(speed * Math.cos(angle));
		this.ball.speedY = speed * Math.sin(angle);
	}

	private checkCollisions() {
		const ballLeft = this.ball.x - this.ball.radius;
		const ballRight = this.ball.x + this.ball.radius;
		const ballTop = this.ball.y - this.ball.radius;
		const ballBottom = this.ball.y + this.ball.radius;

		const p1Right = this.player1.x + this.player1.width;
		const p1Top = this.player1.y;
		const p1Bottom = this.player1.y + this.player1.height;

		const p2Left = this.player2.x;
		const p2Top = this.player2.y;
		const p2Bottom = this.player2.y + this.player2.height;

		const hitP1 =
			ballLeft <= p1Right &&
			ballBottom >= p1Top &&
			ballTop <= p1Bottom &&
			this.ball.speedX < 0;

		if (hitP1) {
			this.calculateBounce(this.player1, 1);
			this.ball.x = p1Right + this.ball.radius;
			return;
		}

		const hitP2 =
			ballRight >= p2Left &&
			ballBottom >= p2Top &&
			ballTop <= p2Bottom &&
			this.ball.speedX > 0;

		if (hitP2) {
			this.calculateBounce(this.player2, -1);
			this.ball.x = p2Left - this.ball.radius;
		}
	}

	private clamp(n: number, min: number, max: number) {
		return Math.max(min, Math.min(max, n));
	}

	public kickoff() {
		this.resetBall(true);
	  }
}
