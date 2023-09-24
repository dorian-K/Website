import { P5CanvasInstance, ReactP5Wrapper, SketchProps } from "@p5-wrapper/react";
import { useRef, useState } from "react";
import { useEffect } from "react";
import { OperationType } from "../wasm/pkg/wasm";
import * as Comlink from 'comlink';
import { HandlerRet } from "./GeneticWebWorker";

type MyProps = SketchProps & {
	showRand: boolean,
	showMut: boolean,
}

function drawFunc(p: P5CanvasInstance<MyProps>, handlers: React.MutableRefObject<HandlerRet | undefined>) {
	p.disableFriendlyErrors = true;


	// let firstFrame = 0;
	let simScale = 3;
	let showRandom = true;
	let showMut = true;
	let perfTimes: Array<number> = [];

	let epoch = -1;
	let targetPos = { x: -1, y: -1 };
	let bounds = { x: 1, y: 1 };

	let lastNodeList: Array<{x: number, y: number, last_operation: number }> = [];

	let runnerStillRunning = false;

	let runner = async () => {
		if(runnerStillRunning === true || handlers.current === null)
			return;
		runnerStillRunning = true;
		const data = await handlers.current!.tickGetNodes()
		perfTimes.push(data.time);
		if(perfTimes.length > 300)
			perfTimes.shift();
		
		lastNodeList = data.lastNodeList;
		epoch = data.epoch;
		targetPos = data.targetPos;
		runnerStillRunning = false;
	};

	let interv = setInterval(runner, 8);

	const oldRemove = p.remove;
	p.remove = () => {
		oldRemove();
		clearInterval(interv);
	}

	p.updateWithProps = (props: MyProps) => {
		showRandom = props.showRand === true;
		showMut = props.showMut === true;
	};

	let myFont: object | null = null;

	p.preload = () => {
		myFont = p.loadFont("Roboto-Regular.ttf");
	}

	p.setup = () => {
		bounds = {
			x: window.innerWidth / simScale,
			y: window.innerHeight / simScale 
		};
		handlers.current!.newNodeManager(bounds.x, bounds.y);

		p.createCanvas(window.innerWidth, window.innerHeight, p.P2D);
		
		window.onresize = function () {
			bounds = {
				x: window.innerWidth / simScale,
				y: window.innerHeight / simScale
			};
			handlers.current!.newNodeManager(bounds.x, bounds.y);
			
			p.createCanvas(window.innerWidth, window.innerHeight, p.P2D);
		};
	};

	p.draw = () => {
		// let fCount = Math.max(1, p.frameCount - firstFrame - 5);
		
		//p.translate(-window.innerWidth / 2, -window.innerHeight / 2);
		p.textFont(myFont!);
		p.noStroke();
		p.background(0);
		p.fill(200);
		p.textSize(32);

		if(perfTimes.length > 0){
			let avgPerf = 0;
			perfTimes.forEach(p => {
				avgPerf += p;
			})
			avgPerf /= perfTimes.length;
			p.text(
				"ms/iter: " + avgPerf.toFixed(2),
				10,
				30
			);
		}

		/*
		let replacementCandidates: Array<{fit: number, logic: any, num_used: number}> = nodeMgr.get_replacement_candidates();

		p.text(
			"Avg Fitness in top "+replacementCandidates.length+": " +
			(
				nodeMgr.total_fitness / replacementCandidates.length
			).toFixed(2),
			window.innerWidth / 2,
			30
		);
		if (replacementCandidates.length > 0) {
			p.text(
				"Top Fitness: " +
				replacementCandidates[0].fit.toFixed(2),
				window.innerWidth / 2,
				60
			);
			p.text(
				"Top Rates: " +
				replacementCandidates[0].logic.mutation_rate.toFixed(
					4
				) +
				" " +
				replacementCandidates[0].logic.expected_weight_mutations.toFixed(
					4
				) +
				" " +
				replacementCandidates[0].logic.expected_bias_mutations.toFixed(
					4
				) +
				" ",
				window.innerWidth / 2,
				90
			);
			let avgMut = 0;
			let avgWeightMut = 0, avgBiasMut = 0;
			replacementCandidates.forEach((e) => {
				avgMut += e.logic.mutation_rate;
				avgWeightMut += e.logic.expected_weight_mutations;
				avgBiasMut += e.logic.expected_bias_mutations
			});

			avgMut /= replacementCandidates.length;
			avgWeightMut /= replacementCandidates.length;
			avgBiasMut /=  replacementCandidates.length;

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
			);*/
			p.text(
				"Epoch: "+epoch,
				window.innerWidth / 2,
				150
			);
		//}

		//nodeMgr.targetPos.x = locX;
		//nodeMgr.targetPos.y = locY;
		p.noFill();
		p.stroke(255, 255, 255);
		p.strokeWeight(1);
		//p.line(nodeMgr.bounds.x * 0.5 * simScale, 0, nodeMgr.bounds.x * 0.5 * simScale, nodeMgr.bounds.y * 0.4 * simScale);
		//p.line(nodeMgr.bounds.x * 0.5 * simScale, nodeMgr.bounds.y * 0.6 * simScale, nodeMgr.bounds.x * 0.5 * simScale, nodeMgr.bounds.y * simScale);
		p.rect(bounds.x * 0.45 * simScale, bounds.y * 0.2 * simScale, 
			bounds.x * 0.1 * simScale, bounds.y * 0.6 * simScale);

		p.noStroke();
		p.fill(255);
		
		lastNodeList.forEach((e) => {
			if (e.last_operation == OperationType.Random && showRandom === false)
				return;
			if (e.last_operation == OperationType.Mutation && showMut === false)
				return;
			if (e.last_operation == OperationType.Random)
				p.fill(150, 150, 255);
			else if (e.last_operation == OperationType.ParameterMutation)
				p.fill(255, 100, 100);
			else {
				p.fill(255);
			}
				
			p.circle(e.x * simScale, e.y * simScale, 5);
		});

		p.noFill();
		p.stroke(255, 50, 50);
		p.strokeWeight(5);
		p.circle(targetPos.x * simScale, targetPos.y * simScale, 20);1
		
	};
}

export default function WasmGeneticSim() {

	const [showRandom, setShowRandom] = useState(true);
	const [showMut, setShowMut] = useState(true);
	const [shouldMount, setShouldMount] = useState(false);
	const handlers = useRef<HandlerRet>();

	const onKeyDown = (ev: KeyboardEvent) => {
		if(ev.key === '1')
			setShowRandom(showRandom === false); 
		if(ev.key === '2')
			setShowMut(showMut === false); 
	};

	useEffect(() => {
		Comlink.wrap<{handlers: Promise<HandlerRet>}>(
			new Worker(new URL('./GeneticWebWorker.tsx', import.meta.url), {
				type: 'module'
			})
		).handlers.then(handler => { 
			handlers.current = handler;
			setShouldMount(true);
		}
			)
	}, []);

	useEffect(() => {
		document.addEventListener("keydown", onKeyDown);

		return () => {
			document.removeEventListener("keydown", onKeyDown);
		}
	}, [onKeyDown])

	if(shouldMount === false)
		return (
			<div className="anim">
				<h2>Loading webassembly...</h2>
			</div>
		);

	return (
		<div className="anim">
			<ReactP5Wrapper sketch={(p5: any) => { drawFunc(p5, handlers) }} showRand={showRandom} showMut={showMut} />
		</div>
	);
}
