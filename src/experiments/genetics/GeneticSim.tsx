import { P5CanvasInstance, ReactP5Wrapper, SketchProps } from "react-p5-wrapper";
import NodeManager from "./logic/NodeManager";
import { Mutex } from "async-mutex";
import LivingNode from "./logic/LivingNode";

function drawFunc(p: P5CanvasInstance<SketchProps>) {
	// let firstFrame = 0;
	let nodeMgr = new NodeManager({ x: 100, y: 100 });
	let nodeMtx = new Mutex();
	let simScale = 3;

	let lastNodeList: Array<LivingNode> = [];

	let runner = async () => {
		await nodeMtx.runExclusive(() => {
			for (let i = 0; i < 3; i++) nodeMgr.tick();
			lastNodeList = nodeMgr.nodes;
		});

		setTimeout(runner, 0);
	};

	p.setup = () => {
		nodeMtx.runExclusive(() => {
			nodeMgr = new NodeManager({
				x: window.innerWidth / simScale,
				y: window.innerHeight / simScale,
			});
			setTimeout(runner, 8);
		});

		p.createCanvas(window.innerWidth, window.innerHeight, p.P2D);
		window.onresize = function () {
			nodeMtx.runExclusive(() => {
				nodeMgr = new NodeManager({
					x: window.innerWidth / simScale,
					y: window.innerHeight / simScale,
				});
			});
			p.createCanvas(window.innerWidth, window.innerHeight, p.P2D);
		};
		// firstFrame = p.frameCount;
	};

	p.draw = () => {
		// let fCount = Math.max(1, p.frameCount - firstFrame - 5);

		p.background(0);
		p.fill(200);
		p.textSize(32);
		p.text(
			"Avg Fitness in top "+nodeMgr.replacementCandidates.length+": " +
			(
				nodeMgr.totalFitness / nodeMgr.replacementCandidates.length
			).toFixed(2),
			window.innerWidth / 2,
			30
		);
		if (nodeMgr.replacementCandidates.length > 0) {
			p.text(
				"Top Fitness: " +
				nodeMgr.replacementCandidates[0].fit.toFixed(2),
				window.innerWidth / 2,
				60
			);
			p.text(
				"Top Rates: " +
				nodeMgr.replacementCandidates[0].logic.mutationRate.toFixed(
					4
				) +
				" " +
				nodeMgr.replacementCandidates[0].logic.expectedWeightMutations.toFixed(
					4
				) +
				" " +
				nodeMgr.replacementCandidates[0].logic.expectedBiasMutations.toFixed(
					4
				) +
				" ",
				window.innerWidth / 2,
				90
			);
			let avgMut = 0;
			let avgWeightMut = 0, avgBiasMut = 0;
			nodeMgr.replacementCandidates.forEach((e) => {
				avgMut += e.logic.mutationRate;
				avgWeightMut += e.logic.expectedWeightMutations;
				avgBiasMut += e.logic.expectedBiasMutations
			});

			avgMut /= nodeMgr.replacementCandidates.length;
			avgWeightMut /= nodeMgr.replacementCandidates.length;
			avgBiasMut /=  nodeMgr.replacementCandidates.length;

			p.text(
				"Avg Rates: " +
				avgMut.toFixed(4) +
				" " +
				avgWeightMut.toFixed(4) +
				" " +
				avgBiasMut.toFixed(4) +
				" ",
				window.innerWidth / 2,
				120
			);
		}

		p.noFill();
		p.stroke(255, 50, 50);
		p.strokeWeight(5);
		p.circle(nodeMgr.targetPos.x * simScale, nodeMgr.targetPos.y * simScale, 20);
		//nodeMgr.targetPos.x = locX;
		//nodeMgr.targetPos.y = locY;

		p.noStroke();
		p.fill(255);

		lastNodeList.forEach((e) => {
			p.circle(e.posX * simScale, e.posY * simScale, 5);
		});
	};
}

export default function GeneticSim() {
	return (
		<div className="anim">
			<ReactP5Wrapper sketch={drawFunc} />
		</div>
	);
}
