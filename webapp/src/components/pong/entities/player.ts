export class Player {
	public x: number;
	public y: number;
	public speed: number;
	public readonly width: number;
	public readonly height: number;

	constructor (
		x: number,
		y: number,
		speed = 10,
		width = 10,
		height = 100
	) {
		this.x = x;
		this.y = y;
		this.speed = speed;
		this.width = width;
		this.height = height;
	}
}
