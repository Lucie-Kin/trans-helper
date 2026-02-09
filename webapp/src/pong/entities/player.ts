export class Player {
	constructor (
		public x: number,
		public y: number,
		public speed: number = 10,
		public readonly width: number = 10,
		public readonly height: number = 100
	) {}
}