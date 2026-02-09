export class GameField {
	public width: number;
	public height: number;

	constructor (
		width: number,
		height: number
	) {
		this.width = width;
		this.height = height;
	}

	//isInsideX(x: number): boolean {
	//	return (x >= 0 && x <= this.width);
	//}

	//isInsideY(y: number): boolean {
	//	return (y >= 0 && y <= this.height);
	//}
}