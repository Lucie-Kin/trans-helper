import { Ball, BASE_KICKOFF_SPEED } from '../entities/ball';
import { Player } from '../entities/player';
import { GameField } from './gameField';
import { AIController } from './AIController';

export const WIN_SCORE = 11;

export class GameEngine {
        public AIController?: AIController;

        public player1: Player;
        public player2: Player;
        public ball: Ball;
        public field: GameField;
        public scoreP1: number = 0;
        public scoreP2: number = 0;
        public gameOver: boolean = false;
        public winner: 1 | 2 | null = null;

        private startGame: boolean = true;

        constructor (
                player1: Player,
                player2: Player,
                ball: Ball,
                field: GameField,
                scoreP1 = 0,
                scoreP2 = 0,
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

        movePlayer(player: Player, direction: 'up' | 'down') {
                if (direction === 'up')
                        player.y = Math.max(0, player.y - player.speed)
                else
                        player.y = Math.min(this.field.height - player.height, player.y + player.speed);
        }

        private resetBall() {
                const angle = (Math.random() * Math.PI / 2) - (Math.PI / 4); // angle aléatoire entre -45° et +45° (en radians)
                const direction = ((this.scoreP1 + this.scoreP2) % 2 === 0) ? 1 : -1; //envoie a gauche ou a droite
                this.ball.x = this.field.width / 2;
                this.ball.y = this.field.height / 2;
                this.ball.speedX = Math.cos(angle) * BASE_KICKOFF_SPEED * direction;
                this.ball.speedY = Math.sin(angle) * BASE_KICKOFF_SPEED;
                this.AIController?.onKickoff();
        }

        private moveBall() {
                this.ball.x += this.ball.speedX;
                this.ball.y += this.ball.speedY;
                this.checkScore();
                if (this.ball.y - this.ball.radius <= 0 || this.ball.y + this.ball.radius >= this.field.height) //changer la trajectoire apres collision
                        this.ball.speedY *= -1;
        }

        private checkScore() {
                if (this.ball.x + this.ball.radius >= this.field.width) {
                        this.scoreP1++;
                        if (this.scoreP1 >= WIN_SCORE) {
                                this.gameOver = true;
                                this.winner = 1;
                                return;
                        }
                        this.resetBall();
                }
                else if (this.ball.x - this.ball.radius <= 0) {
                        this.scoreP2++;
                        if (this.scoreP2 >= WIN_SCORE) {
                                this.gameOver = true;
                                this.winner = 2;
                                return;
                        }
                        this.resetBall();
                }
        }

        private calculateBounce(player: Player, direction: 1 | -1) {
                const relativeY = (this.ball.y - (player.y + player.height / 2)); //Ou est-ce que la balle touche la raquette
                const normalizedY = relativeY / (player.height / 2); //valeur entre -1 et 1 si haut, milieu ou bas de la raquette
                const maxAngle = Math.PI / 3; //angle max de renvoi
                const angle = normalizedY * maxAngle; //angle calcule
                const maxSpeed = 14;
                const speed = Math.min(Math.sqrt(this.ball.speedX**2 + this.ball.speedY**2) * 1.05, maxSpeed);
                this.ball.speedX = direction * Math.abs(speed * Math.cos(angle));
                this.ball.speedY = speed * Math.sin(angle);
        }

        private checkCollisions() {
                const ballLeft = this.ball.x - this.ball.radius;
                const ballRight = this.ball.x + this.ball.radius;
                const ballTop = this.ball.y - this.ball.radius;
                const ballBottom = this.ball.y + this.ball.radius;
                const p1Right = this.player1.x + this.player1.width;
                const p1Bottom = this.player1.y + this.player1.height;
                const p2Bottom = this.player2.y + this.player2.height;

                if (ballLeft <= p1Right && ballBottom >= this.player1.y && ballTop <= p1Bottom && this.ball.speedX < 0) {
                        this.calculateBounce(this.player1, 1);
                        this.ball.x = p1Right + this.ball.radius;
                }
                if (ballRight >= this.player2.x && ballBottom >= this.player2.y && ballTop <= p2Bottom && this.ball.speedX > 0) {
                        this.calculateBounce(this.player2, -1);
                        this.ball.x = this.player2.x - this.ball.radius;
                }
        }

        update(_deltaTime: number = 16) {
                if (this.gameOver) return;

                if (this.startGame) {
                  this.startGame = false;
                  this.resetBall();
                }

                this.moveBall();
                this.checkCollisions();

                if (this.AIController) {
                        this.AIController.tick(performance.now());
                        const move = this.AIController.getMoveAction();
                        if (move !== 'stay') this.movePlayer(this.player2, move);
                }
        }
}