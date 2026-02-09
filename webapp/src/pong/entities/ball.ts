export class Ball {
	constructor (
		public x: number,
		public y: number,
		public speedX: number,
		public speedY: number,
		public readonly radius: number,
	) {}
}

export const BASE_KICKOFF_SPEED = 4.2;