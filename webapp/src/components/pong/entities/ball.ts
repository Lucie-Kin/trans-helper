export class Ball {
	public x: number;
	public y: number;
	public speedX: number;
	public speedY: number;
	public readonly radius: number;

	constructor (
		x: number,
		y: number,
		speedX: number,
		speedY: number,
		radius: number,
	) {
		this.x = x;
		this.y = y;
		this.speedX = speedX;
		this.speedY = speedY;
		this.radius = radius;
	}
}

export const BASE_KICKOFF_SPEED = 7 * 60;
