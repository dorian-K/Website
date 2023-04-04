import LivingNode from "./LivingNode";
import NodeLogic from "./NodeLogic";

class NodeManager {
	nodes: Array<LivingNode>;
	replacementCandidates: Array<{
		fit: number;
		logic: NodeLogic;
		numUsed: number;
	}>;
	totalFitness = 0;
	maxUseCount = 50;
	numReplacementCandidates = 500;
	numInitialNodes = 1000;
	bounds: { x: number; y: number };
	targetPos: { x: number; y: number } = { x: 100, y: 100 };
	findNewTargetTimeout: number = 0;

	constructor(bounds: { x: number; y: number }) {
		this.nodes = [];
		this.replacementCandidates = [];
		this.bounds = bounds;
		for (let i = 0; i < this.numInitialNodes; i++) {
			this.nodes.push(this.constructNewNode());
		}
	}

	findReplacement(atFitness: number): number {
		let i = 0;
		for (; i < this.replacementCandidates.length; i++) {
			atFitness -= this.replacementCandidates[i].fit;
			if (atFitness <= 0) break;
		}
		if (atFitness > 0 || i >= this.replacementCandidates.length) return -1;
		return i;
	}

	constructNewNode(): LivingNode {
		let randomPos = {
			x: (Math.random() * 0.8 + 0.1) * this.bounds.x,
			y: (Math.random() * 0.8 + 0.1) * this.bounds.y,
		};
		let rnd = 1.1 * Math.random() * this.totalFitness;
		let i = this.findReplacement(rnd);

		if (i === -1)
			return new LivingNode(NodeLogic.rand(), this.bounds, randomPos);

		let baseLogic = this.replacementCandidates[i].logic;
		this.replacementCandidates[i].numUsed += 1;
		if (
			this.replacementCandidates[i].numUsed > this.maxUseCount &&
			this.replacementCandidates.length >= this.numReplacementCandidates
		) {
			// remove from list
			this.totalFitness -= this.replacementCandidates[i].fit;
			this.replacementCandidates.splice(i, 1);
		}

		if (this.replacementCandidates[i].numUsed === 1)
			// copy original, but mutate parameters
			return new LivingNode(NodeLogic.mutateParameters(baseLogic), this.bounds, randomPos);

		// mutate and drop back in
		let mutated = NodeLogic.mutate(baseLogic);
		return new LivingNode(mutated, this.bounds, randomPos);
		/*if (Math.random() < 0.5) {
			let myLogic = baseLogic;
			if(Math.random() < 0.3){
				// cross with random
				myLogic = NodeLogic.lerpLogic(
					baseLogic,
					NodeLogic.rand(),
					baseLogic.lerpRate
				);
			}
			
			let mutated = NodeLogic.mutate(myLogic);
			return new LivingNode(mutated, this.bounds, randomPos);
		} else {
			// cross with other logic
			let rnd = Math.random() * this.totalFitness;
			let i = this.findReplacement(rnd);

			let other;
			if (i === -1) other = NodeLogic.rand();
			else other = this.replacementCandidates[i].logic;

			let lerpedLogic = NodeLogic.lerpLogic(baseLogic, other, 0.5);
			let mutated = NodeLogic.mutate(lerpedLogic);
			return new LivingNode(mutated, this.bounds, randomPos);
		}*/
	}

	async tick() {
		this.findNewTargetTimeout--;
		if (this.findNewTargetTimeout <= 0) {
			this.findNewTargetTimeout = 340;
			this.targetPos.x = (Math.random() * 0.8 + 0.1) * this.bounds.x;
			this.targetPos.y = (Math.random() * 0.8 + 0.1) * this.bounds.y;
		}
		let ticks: Promise<void>[] = [];
		this.nodes.forEach((n) => {
			if (n.isDead()) return;
			ticks.push(n.tick(this.targetPos));
		});
		await Promise.allSettled(ticks);

		let anyAlive = false;
		for (let i = 0; i < this.nodes.length; i++) {
			let n = this.nodes[i];
			if (!n.isDead()) {
				anyAlive = true;
				break;
			}
		}

		if (anyAlive) return;

		this.findNewTargetTimeout = 0;
		// all nodes are done, lets do the genetic algorithm
		// first calculate fitness and insert into replacement candidates
		this.replacementCandidates = [];
		this.totalFitness = 0;
		for (let i = 0; i < this.nodes.length; i++) {
			let n = this.nodes[i];
			n.endEpisode();
			// node is dead, calculate fitness
			let fit = n.getFitness();

			// & insert its logic into the replacement candidates
			let e = 0;
			for (; e < this.replacementCandidates.length; e++)
				if (fit > this.replacementCandidates[e].fit) break;

			if (e < this.numReplacementCandidates) {
				this.totalFitness += fit;
				if (e < this.replacementCandidates.length) {
					this.replacementCandidates.splice(e, 0, {
						fit,
						logic: n.logic,
						numUsed: 0,
					});
					if (
						this.replacementCandidates.length >
						this.numReplacementCandidates
					) {
						// remove last element from candidates
						this.totalFitness -=
							this.replacementCandidates[
								this.numReplacementCandidates
							].fit;
						this.replacementCandidates.pop();
					}
				} else
					this.replacementCandidates.push({
						fit,
						logic: n.logic,
						numUsed: 0,
					});
			}
		}

		{
			let avgMut = 0;
			let avgPrev = 0;
			this.replacementCandidates.forEach((e) => {
				avgMut += e.logic.mutationRate;
				avgPrev += e.logic.mutationPrevalence;
			});

			avgMut /= this.replacementCandidates.length;
			avgPrev /= this.replacementCandidates.length;

			console.log("Avg fitness: " + (this.totalFitness / this.replacementCandidates.length));
			console.log("Avg mutationRate: " + avgMut + " \tmutationPrevalence: " + avgPrev);
		}

		for (let i = 0; i < this.nodes.length; i++)
			this.nodes[i] = this.constructNewNode();
	}
}

export default NodeManager;
