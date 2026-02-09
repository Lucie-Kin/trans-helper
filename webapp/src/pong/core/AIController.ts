// core/AIController.ts
import { Player } from '../entities/player';
import { Ball } from '../entities/ball';
import { GameField } from './gameField';

export class AIController {
  public player!: Player;     // P2 (IA)
  public oppenent!: Player;   // P1
  public ball!: Ball;
  public field: GameField;

  // --- décision (1 fois / seconde)
  private lastDecisionMs = -Infinity;
  private decisionCooldownMs = 1000;

  // cible en pixels (centre Y visé)
  private targetCenterY = 0;

  // réglages difficulté
  private aimNoisePx = 0;         // ex: 10..40 pour rendre l'IA moins parfaite
  private deadZonePx = 8;         // seuil pour éviter tremblements
  private fallbackCenter = true;  // si balle part vers P1: revenir centre

  constructor(field: GameField) {
    this.field = field;
    this.targetCenterY = field.height / 2;
  }

  attach(player: Player, oppenent: Player, ball: Ball) {
    this.player = player;
    this.oppenent = oppenent;
    this.ball = ball;
    this.targetCenterY = player.y + player.height / 2;
  }

  /**
   * Appelé au kickoff / resetBall : décision immédiate (pas de cooldown)
   */
  onKickoff() {
    this.decideTarget(true);
  }

  /**
   * Appelé en boucle (chaque frame), mais ne recalculera la cible
   * qu'une fois par seconde max.
   */
  tick(nowMs: number) {
    this.decideTarget(false, nowMs);
  }

  getMoveAction(): 'up' | 'down' | 'stay' {
    const center = this.player.y + this.player.height / 2;
    const dy = this.targetCenterY - center;

    if (dy < -this.deadZonePx) return 'up';
    if (dy > this.deadZonePx) return 'down';
    return 'stay';
  }

  // ----------------- core logic -----------------

  private decideTarget(force: boolean, nowMs: number = performance.now()) {
    if (!force) {
      if ((nowMs - this.lastDecisionMs) < this.decisionCooldownMs) return;
    }
    this.lastDecisionMs = nowMs;

    // Si la balle va vers P2 : on prédit l'impact
    if (this.ball.speedX > 0) {
      const impactY = this.predictImpactY(this.ball, this.player.x);
      const noisy = impactY + this.randomNoise(this.aimNoisePx);
      this.targetCenterY = this.clamp(noisy, this.player.height / 2, this.field.height - this.player.height / 2);
      return;
    }

    // Si la balle s'éloigne (vers P1) : comportement simple
    if (this.fallbackCenter) {
      this.targetCenterY = this.field.height / 2;
    } else {
      // sinon: rester où on est
      this.targetCenterY = this.player.y + this.player.height / 2;
    }
  }

  /**
   * Prédit Y quand la balle atteindra targetX (ex: x de P2)
   * en simulant rebonds haut/bas. (Sans tenir compte des raquettes)
   */
  private predictImpactY(ball: Ball, targetX: number): number {
    const r = ball.radius;

    let x = ball.x;
    let y = ball.y;
    let vx = ball.speedX;
    let vy = ball.speedY;

    // Si vx <= 0, on n'a pas d'impact vers targetX
    if (vx <= 0) return this.field.height / 2;

    // temps pour atteindre targetX
    const dx = targetX - x;
    const t = dx / vx;

    // y "brut" sans rebond
    let yRaw = y + vy * t;

    // rebonds haut/bas (miroir)
    const top = r;
    const bot = this.field.height - r;
    const span = bot - top;

    // on ramène dans [top, bot] avec réflexion
    // (méthode miroir: period = 2*span)
    const yShift = yRaw - top;
    const period = 2 * span;

    let m = yShift % period;
    if (m < 0) m += period;

    let yIn;
    if (m <= span) yIn = top + m;
    else yIn = bot - (m - span);

    return yIn;
  }

  private clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
  }

  private randomNoise(px: number) {
    if (px <= 0) return 0;
    return (Math.random() * 2 - 1) * px; // [-px, +px]
  }

  // (optionnel) réglages
  setDifficulty(opts: { aimNoisePx?: number; deadZonePx?: number; fallbackCenter?: boolean}) {
    if (opts.aimNoisePx !== undefined) this.aimNoisePx = opts.aimNoisePx;
    if (opts.deadZonePx !== undefined) this.deadZonePx = opts.deadZonePx;
    if (opts.fallbackCenter !== undefined) this.fallbackCenter = opts.fallbackCenter;
  }

}