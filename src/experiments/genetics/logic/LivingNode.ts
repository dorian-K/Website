import NodeLogic from "./NodeLogic";

function clamp(val: number, min: number, max: number) {
	return Math.max(Math.min(val, max), min);
}

class LivingNode {
	health: number;
	pos: {x: number, y: number};
	vel: {x: number, y: number};
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
		this.pos = pos;
		this.vel = { x: 0, y: 0 };
		this.logic = logic;
		this.reward = 0;
		this.bounds = bounds;
		this.distanceMoved = 0;
	}

	async tick(targetPos: { x: number; y: number }, newTargetTimeout: number, ticksSinceNewTarget: number) {
		if (this.isDead()) return;
		let dx = this.pos.x - targetPos.x;
		let dy = this.pos.y - targetPos.y;
		const action = this.logic.step(new Float32Array([
			this.pos.x / (this.bounds.x * 0.5) - 1, this.pos.y / (this.bounds.y * 0.5) - 1,
			this.vel.x, this.vel.y,
			targetPos.x / (this.bounds.x * 0.5) - 1, targetPos.y / (this.bounds.y * 0.5) - 1/*,
			newTargetTimeout * 2 - 1*/
		]));
		//console.log(action[0], " ", action[1]);
		// action is an array with 2 values: x and y movement
		let dist = Math.sqrt(action[0] * action[0] + action[1] * action[1]);
		//this.distanceMoved += dist;

		if (dist > 1) {
			action[0] /= dist;
			action[1] /= dist;
		}
		this.vel.x += clamp(action[0], -1, 1) * 0.02;
		this.vel.y += clamp(action[1], -1, 1) * 0.02;
		const velMag = Math.sqrt(this.vel.x * this.vel.x + this.vel.y + this.vel.y);
		if(velMag > 1){
			this.vel.x /= velMag;
			this.vel.y /= velMag;
		}
		const prevPos = {x : this.pos.x, y: this.pos.y };
		this.pos.x += this.vel.x;
		this.pos.y += this.vel.y;
		this.snapBounds(prevPos);

		if (this.health % 10 === 0 && ticksSinceNewTarget > 30) {
			let dist = Math.sqrt(dx * dx + dy * dy);
			let maxDist = Math.sqrt(
				this.bounds.x * this.bounds.x + this.bounds.y * this.bounds.y
			);
			/*let dist = Math.abs(dx) + Math.abs(dy);
			let maxDist = Math.abs(this.bounds.x) + Math.abs(this.bounds.y);*/

			this.reward += 1 - dist / maxDist;
			if(dist < maxDist * 0.05)
				this.reward += 0.5;
			
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

	snapBounds(prevPos: { x: number, y: number }) {
		// Line in the middle that constricts to center
		const sizeOfBarrier = 0.1 * 0.5 *  this.bounds.x;
		const halfXBound = this.bounds.x / 2;
		if((this.pos.x > halfXBound - sizeOfBarrier && prevPos.x <= halfXBound - sizeOfBarrier) || 
			(this.pos.x < halfXBound + sizeOfBarrier && prevPos.x >= halfXBound + sizeOfBarrier)){
				// crossed the border via x
				if(this.pos.y > this.bounds.y * 0.2 && this.pos.y < this.bounds.y * 0.8){
					
					if(prevPos.x > halfXBound)
						this.pos.x = halfXBound + sizeOfBarrier;
					else
						this.pos.x = halfXBound - sizeOfBarrier;
					this.vel.x = 0;
				}
			}
		if((this.pos.y < this.bounds.y * 0.8 && prevPos.y >= this.bounds.y * 0.8) || 
			(this.pos.y > this.bounds.y * 0.2 && prevPos.y <= this.bounds.y * 0.2)){
				if(this.pos.x >= halfXBound - sizeOfBarrier && this.pos.x <= halfXBound + sizeOfBarrier){
					
					if(prevPos.y > this.bounds.y * 0.5)
						this.pos.y = this.bounds.y * 0.8;
					else
						this.pos.y = this.bounds.y * 0.2;
					this.vel.y = 0;
				}
			}

		// Outer border
		if (this.pos.x > this.bounds.x) {
			this.pos.x = this.bounds.x;
			this.vel.x = 0;
		} else if (this.pos.x < 0) {
			this.pos.x = 0;
			this.vel.x = 0;
		}

		if (this.pos.y > this.bounds.y) {
			this.pos.y = this.bounds.y;
			this.vel.y = 0;
		} else if (this.pos.y < 0) {
			this.pos.y = 0;
			this.vel.y = 0;
		}
	}
}

export default LivingNode;
