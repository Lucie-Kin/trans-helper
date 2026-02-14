import { Player } from '../entities/player.js';
import { Ball } from '../entities/ball.js';
import { GameField } from './gameField.js';

export class AIController {
	public player!: Player; // AI paddle (P2)
	public opponent!: Player; // Opponent paddle (P1)
	public ball!: Ball;
	public field: GameField;

	private lastDecisionMs = -Infinity;
	private decisionCooldownMs = 1000;

	private targetCenterY = 0;
	private deadZonePx = 0;

	private shootOffsetPx = 0;
	private shotLocked = false;

	constructor(field: GameField) {
		this.field = field;
		this.targetCenterY = field.height / 2;
	}

	attach(player: Player, opponent: Player, ball: Ball) {
		this.player = player;
		this.opponent = opponent;
		this.ball = ball;
		this.targetCenterY = player.y + player.height / 2;
		this.deadZonePx = player.height * 0.08; // 8% de la raquette
	}

	onKickoff() {
		this.shotLocked = false;
		this.shootOffsetPx = 0;
		this.lastDecisionMs = -Infinity;
	}

	moveAI(nowMs: number) {
		if (nowMs - this.lastDecisionMs < this.decisionCooldownMs) return;
		this.lastDecisionMs = nowMs;

		if (this.ball.speedX <= 0) {
			this.shotLocked = false;
			return;
		}

		// Ball is coming toward the AI: choose the "aim offset" once per rally.
		// The idea is: don't always hit the ball with the paddle center.
		// Hitting above/below center changes the bounce angle, making it harder for P1.
		if (!this.shotLocked) {
			this.shootOffsetPx = this.chooseBestPunishOffset();
			this.shotLocked = true;
		}

		const impactY = this.predictImpactY(this.ball, this.player.x);

		// Desired paddle center is the predicted impact plus the chosen offset.
		const desired = impactY + this.shootOffsetPx;

		this.targetCenterY = this.clamp(
			desired,
			this.player.height / 2,
			this.field.height - this.player.height / 2
		);
	}

	getMoveAction(): 'up' | 'down' | 'stay' {
		const center = this.player.y + this.player.height / 2;
		const dy = this.targetCenterY - center;

		// Dead zone prevents jitter: if we're close enough to the target, don't move.
		if (dy < -this.deadZonePx) return 'up';
		if (dy > this.deadZonePx) return 'down';
		return 'stay';
	}

	setDifficulty(opts: { deadZonePx?: number; decisionCooldownMs?: number }) {
		if (opts.deadZonePx !== undefined) this.deadZonePx = opts.deadZonePx;
		if (opts.decisionCooldownMs !== undefined) this.decisionCooldownMs = opts.decisionCooldownMs;
	}

	public predictImpactY(ball: Ball, targetX: number): number {
		const radius = ball.radius;
		const { x: ballX, y: ballY, speedX: velX, speedY: velY } = ball;

		// If there is no horizontal velocity, we cannot compute a time to reach targetX.
		// Fallback to mid-field.
		if (velX === 0) return this.field.height / 2;

		// Time to reach targetX using linear motion: targetX = ballX + velX * t
		const timeToTarget = (targetX - ballX) / velX;

		if (timeToTarget < 0) return ballY;

		// Raw Y position without considering wall bounces.
		const yRaw = ballY + velY * timeToTarget;

		// ---- Wall-bounce handling (top/bottom) via "mirror mapping" ----
		//
		// The ball is constrained to [top, bot] where:
		//   top = radius
		//   bot = field.height - radius
		//
		// If we let the ball move freely, yRaw can be outside that range.
		// Instead of simulating multiple bounces, we fold yRaw into that segment
		// by using a periodic mirrored function:
		//   - one "down" traversal length is travelRange
		//   - a full down+up cycle is period = 2 * travelRange
		//
		// Then:
		//   offset in [0, travelRange]  => moving down:  y = top + offset
		//   offset in (travelRange, 2*travelRange] => moving up: y = bot - (offset - travelRange)
		const top = radius;
		const bot = this.field.height - radius;
		const travelRange = bot - top;
		const period = 2 * travelRange;

		// Map yRaw into a single bounce period (handle negatives too).
		let offset = (yRaw - top) % period;
		if (offset < 0) offset += period;

		// Convert the folded offset back to an in-bounds Y coordinate.
		return offset <= travelRange ? top + offset : bot - (offset - travelRange);
	}

	private chooseBestPunishOffset(): number {
		// Max offset we allow from the paddle center.
		const maxOffset = (this.player.height / 2) * 0.85;

		const impactY = this.predictImpactY(this.ball, this.player.x);

		const minCenter = this.player.height / 2;
		const maxCenter = this.field.height - this.player.height / 2;

		// We brute-force a small number of candidate offsets and keep the best-scoring one.
		const samples = 11;
		let bestOffset = 0;
		let bestScore = -Infinity;

		for (let i = 0; i < samples; i++) {
			// normalizedOffset in [0,1]
			const normalizedOffset = i / (samples - 1);

			// rawOffset in [-maxOffset, +maxOffset]
			const rawOffset = (normalizedOffset * 2 - 1) * maxOffset;

			// Clamp desired paddle center Y so it's physically reachable (within field bounds).
			const desiredCenter = this.clamp(impactY + rawOffset, minCenter, maxCenter);

			// Actual applied offset after clamping (could be smaller than rawOffset).
			const offset = desiredCenter - impactY;

			// Score this shot by estimating how hard it will be for P1 to reach the return.
			const score = this.scoreShotAgainstP1(impactY, desiredCenter);

			if (score > bestScore) {
				bestScore = score;
				bestOffset = offset;
			}
		}

		return bestOffset;
	}

	private scoreShotAgainstP1(impactY: number, desiredP2CenterY: number): number {
		// We approximate the bounce physics similarly to GameEngine.calculateBounce:
		// - compute normalized hit position
		// - convert to angle in [-maxAngle, +maxAngle]
		// - boost speed a bit and cap it
		const maxAngle = Math.PI / 3; // 60 degrees
		const maxSpeed = 14 * 60;

		// relativeY: where the ball hits relative to the paddle center
		const relativeY = impactY - desiredP2CenterY;

		// Normalize to [-1, +1] based on half paddle height
		let normalizedY = relativeY / (this.player.height / 2);
		normalizedY = Math.max(-1, Math.min(1, normalizedY));

		// Convert normalized hit position to an outgoing angle.
		const angle = normalizedY * maxAngle;

		// Increase speed slightly (like a rally gets faster), but cap it.
		const speed = Math.min(Math.hypot(this.ball.speedX, this.ball.speedY) * 1.05, maxSpeed);

		// The return should go toward P1, so X velocity is negative.
		const ballSpeedX = -Math.abs(speed * Math.cos(angle));
		const ballSpeedY = speed * Math.sin(angle);

		// If X speed is near zero, the ball would move almost vertically (bad/invalid).
		if (Math.abs(ballSpeedX) < 1e-6) return -Infinity;

		// Build a "virtual ball" right after bouncing off P2.
		const startX = this.player.x - this.ball.radius;
		const startBall = { ...this.ball, x: startX, y: impactY, speedX: ballSpeedX, speedY: ballSpeedY } as Ball;

		// X coordinate where the ball would "contact" P1 (right face of P1 + ball radius).
		const p1ContactX = this.opponent.x + this.opponent.width + this.ball.radius;

		// Predict where the returned ball will be (in Y) when it reaches P1 (with wall bounces).
		const yAtP1 = this.predictImpactY(startBall, p1ContactX);

		// Time for the ball to travel from P2 to P1 along X.
		const timeToP1 = (startX - p1ContactX) / Math.abs(ballSpeedX);

		// Approximate how far P1 can move in that time.
		const p1Center = this.opponent.y + this.opponent.height / 2;
		const p1Half = this.opponent.height / 2;
		const p1Reach = this.opponent.speed * timeToP1;

		// Score interpretation:
		// Distance from P1 center to ball arrival minus what P1 can cover (reach + half paddle).
		// Positive => ball lands outside P1's reachable area (good shot).
		// Negative => P1 can probably reach it (bad shot).
		return Math.abs(yAtP1 - p1Center) - (p1Reach + p1Half);
	}

	private clamp(n: number, min: number, max: number) {
		return Math.max(min, Math.min(max, n));
	}
}
