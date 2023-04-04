import P5Wrapper from "react-p5-wrapper";
import NodeManager from "./logic/NodeManager";
import { Mutex } from "async-mutex";

function drawFunc(p) {
	// let firstFrame = 0;
	let nodeMgr = new NodeManager({ x: 100, y: 100 });
	let nodeMtx = new Mutex();
	let simScale = 3;

	let lastNodeList = [];

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

	p.updateWithProps = (props) => {
		try {
			if (props.expression) {
			}
		} catch (e) {}
	};

	p.myCustomRedrawAccordingToNewPropsHandler = (props) => {
		try {
			if (props.expression) {
			}
		} catch (e) {}
	};

	p.draw = () => {
		// let fCount = Math.max(1, p.frameCount - firstFrame - 5);

		p.background(0);

		//let locX = p.mouseX / simScale;
		//if (locX < nodeMgr.bounds.x * 0.1) locX = nodeMgr.bounds.x * 0.1;
		//else if (locX > nodeMgr.bounds.x * 0.9) locX = nodeMgr.bounds.x * 0.9;
		//let locY = p.mouseY / simScale;
		//if (locY < nodeMgr.bounds.y * 0.1) locY = nodeMgr.bounds.y * 0.1;
		//else if (locY > nodeMgr.bounds.y * 0.9) locY = nodeMgr.bounds.y * 0.9;

		p.fill(200);
		p.textSize(32);
		p.text(
			"Avg Fitness in top 500: " +
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
					nodeMgr.replacementCandidates[0].logic.lerpRate.toFixed(4) +
					" " +
					nodeMgr.replacementCandidates[0].logic.mutationRate.toFixed(
						4
					) +
					" " +
					nodeMgr.replacementCandidates[0].logic.mutationPrevalence.toFixed(
						4
					) +
					" ",
				window.innerWidth / 2,
				90
			);
			let avgLerp = 0;
			let avgMut = 0;
			let avgPrev = 0;
			nodeMgr.replacementCandidates.forEach((e) => {
				avgLerp += e.logic.lerpRate;
				avgMut += e.logic.mutationRate;
				avgPrev += e.logic.mutationPrevalence;
			});

			avgLerp /= nodeMgr.replacementCandidates.length;
			avgMut /= nodeMgr.replacementCandidates.length;
			avgPrev /= nodeMgr.replacementCandidates.length;

			p.text(
				"Avg Rates: " +
					avgLerp.toFixed(4) +
					" " +
					avgMut.toFixed(4) +
					" " +
					avgPrev.toFixed(4) +
					" ",
				window.innerWidth / 2,
				120
			);
		}

		p.noFill();
		p.stroke(200);
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

export default function GeneticSim(props) {
	return (
		<div className="anim">
			<P5Wrapper sketch={drawFunc} expression={props.expression} />
		</div>
	);
}
