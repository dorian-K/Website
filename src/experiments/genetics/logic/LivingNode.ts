import NodeLogic from "./NodeLogic";

function clamp(val: number, min: number, max: number) {
	return Math.max(Math.min(val, max), min);
}

class LivingNode {
	health: number;
	posX: number;
	posY: number;
	logic: NodeLogic;
	reward: number;
	distanceMoved: number;
	bounds: { x: number; y: number };

	constructor(
		logic: NodeLogic,
		bounds: { x: number; y: number },
		pos: { x: number; y: number }
	) {
		this.health = 1400;
		this.posX = pos.x;
		this.posY = pos.y;
		this.logic = logic;
		this.reward = 0;
		this.bounds = bounds;
		this.distanceMoved = 0;
	}

	async tick(targetPos: { x: number; y: number }) {
		if (this.isDead()) return;
		let dx = this.posX - targetPos.x;
		let dy = this.posY - targetPos.y;
		const action = this.logic.step([
			this.posX / (this.bounds.x * 0.5) - 1, this.posY / (this.bounds.y * 0.5) - 1,
			targetPos.x / (this.bounds.x * 0.5) - 1, targetPos.y / (this.bounds.y * 0.5) - 1
		]);
		//console.log(action[0], " ", action[1]);
		// action is an array with 2 values: x and y movement
		let dist = Math.sqrt(action[0] * action[0] + action[1] * action[1]);
		this.distanceMoved += dist;

		if (dist > 1) {
			action[0] /= dist;
			action[1] /= dist;
		}
		this.posX += clamp(action[0], -1, 1) * 2;
		this.posY += clamp(action[1], -1, 1) * 2;
		this.snapBounds();

		if (this.health % 10 === 0) {
			let dist = Math.sqrt(dx * dx + dy * dy);
			let maxDist = Math.sqrt(
				this.bounds.x * this.bounds.x + this.bounds.y * this.bounds.y
			);

			this.reward += (maxDist - dist) / 100;
		}
		this.health -= 1; // loose 1 health per tick
		//this.health -= dist; // loose health proportional to movement
	}

	getFitness() {
		return this.reward;
	}

	endEpisode() {
		//if (this.distanceMoved < 10) this.reward -= 1000;
	}

	isDead() {
		return this.health <= 0;
	}

	snapBounds() {
		let valid = 0;
		if (this.posX > this.bounds.x) this.posX = this.bounds.x;
		else if (this.posX < 0) this.posX = 0;
		else valid += 1;

		if (this.posY > this.bounds.y) this.posY = this.bounds.y;
		else if (this.posY < 0) this.posY = 0;
		else valid += 1;

		if (valid !== 2) {
			//this.health = 0;
			//this.reward -= 0.5;
		}
	}
}

export default LivingNode;
