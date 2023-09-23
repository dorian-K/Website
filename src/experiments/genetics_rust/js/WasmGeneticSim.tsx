import { P5CanvasInstance, ReactP5Wrapper, SketchProps } from "@p5-wrapper/react";
import NodeManager from "./logic/NodeManager";
import { Mutex } from "async-mutex";
import LivingNode from "./logic/LivingNode";
import { useState } from "react";
import { useEffect } from "react";
import init from "../wasm/pkg/wasm"
import { OperationType } from "../wasm/pkg/wasm";

type MyProps = SketchProps & {
	showRand?: boolean,
	showMut?: boolean
}

function drawFunc(p: P5CanvasInstance<MyProps>) {
	// let firstFrame = 0;
	let nodeMgr = new NodeManager({ x: 100, y: 100 });
	let simScale = 3;
	let showRandom = true;
	let showMut = true;

	let lastNodeList: Array<LivingNode> = [];

	let runner = async () => {
		let start = performance.now();
		for (let i = 0; i < 4; i++) nodeMgr.tick();
		let end = performance.now();
		//console.log(`tick took ${end - start}`);
		lastNodeList = nodeMgr.nodes;

		setTimeout(runner, 0);
	};

	p.updateWithProps = (props: MyProps) => {
		showRandom = props.showRand === true;
		showMut = props.showMut === true;
	};

	p.setup = () => {
		
		nodeMgr = new NodeManager({
			x: window.innerWidth / simScale,
			y: window.innerHeight / simScale,
		});
		setTimeout(runner, 8);
		

		p.createCanvas(window.innerWidth, window.innerHeight, p.P2D);
		window.onresize = function () {
			nodeMgr = new NodeManager({
				x: window.innerWidth / simScale,
				y: window.innerHeight / simScale,
			});
			
			p.createCanvas(window.innerWidth, window.innerHeight, p.P2D);
		};
		// firstFrame = p.frameCount;
	};

	p.draw = () => {
		// let fCount = Math.max(1, p.frameCount - firstFrame - 5);
		p.noStroke();
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
				nodeMgr.replacementCandidates[0].logic.mutation_rate.toFixed(
					4
				) +
				" " +
				nodeMgr.replacementCandidates[0].logic.expected_weight_mutations.toFixed(
					4
				) +
				" " +
				nodeMgr.replacementCandidates[0].logic.expected_bias_mutations.toFixed(
					4
				) +
				" ",
				window.innerWidth / 2,
				90
			);
			let avgMut = 0;
			let avgWeightMut = 0, avgBiasMut = 0;
			nodeMgr.replacementCandidates.forEach((e) => {
				avgMut += e.logic.mutation_rate;
				avgWeightMut += e.logic.expected_weight_mutations;
				avgBiasMut += e.logic.expected_bias_mutations
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
			p.text(
				"Epoch: "+nodeMgr.epoch,
				window.innerWidth / 2,
				150
			);
		}

		//nodeMgr.targetPos.x = locX;
		//nodeMgr.targetPos.y = locY;
		p.noFill();
		p.stroke(255, 255, 255);
		p.strokeWeight(1);
		//p.line(nodeMgr.bounds.x * 0.5 * simScale, 0, nodeMgr.bounds.x * 0.5 * simScale, nodeMgr.bounds.y * 0.4 * simScale);
		//p.line(nodeMgr.bounds.x * 0.5 * simScale, nodeMgr.bounds.y * 0.6 * simScale, nodeMgr.bounds.x * 0.5 * simScale, nodeMgr.bounds.y * simScale);
		p.rect(nodeMgr.bounds.x * 0.45 * simScale, nodeMgr.bounds.y * 0.2 * simScale, 
			nodeMgr.bounds.x * 0.1 * simScale, nodeMgr.bounds.y * 0.6 * simScale);

		p.noStroke();
		p.fill(255);
		

		lastNodeList.forEach((e) => {
			if(e.logic.last_operation === OperationType.Random && !showRandom)
				return;
			if(e.logic.last_operation === OperationType.Mutation && !showMut)
				return;
			if(e.logic.last_operation === OperationType.Random)
				p.fill(150, 150, 255);
			else if(e.logic.last_operation === OperationType.ParameterMutation)
				p.fill(255, 100, 100);
			else
				p.fill(255);
			p.circle(e.pos.x * simScale, e.pos.y * simScale, 5);
		});

		p.noFill();
		p.stroke(255, 50, 50);
		p.strokeWeight(5);
		p.circle(nodeMgr.targetPos.x * simScale, nodeMgr.targetPos.y * simScale, 20);
		
	};
}

export default function WasmGeneticSim() {

	const [showRandom, setShowRandom] = useState(true);
	const [showMut, setShowMut] = useState(true);
	const [shouldMount, setShouldMount] = useState(false);

	const onKeyDown = (ev: KeyboardEvent) => {
		if(ev.key === '1')
			setShowRandom(!showRandom); 
		if(ev.key === '2')
			setShowMut(!showMut); 
	};

	useEffect(() => {
		init().then(() => {
			setShouldMount(true);
		});
		document.addEventListener("keydown", onKeyDown);

		return () => {
			document.removeEventListener("keydown", onKeyDown);
		}
	}, [])

	if(!shouldMount)
		return (
			<div className="anim">
				<h2>Loading webassembly...</h2>
			</div>
		);

	return (
		<div className="anim">
			<ReactP5Wrapper sketch={drawFunc} showRand={showRandom} showMut={showMut} />
		</div>
	);
}
