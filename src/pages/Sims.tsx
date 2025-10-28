import React, { useEffect, useState, Suspense } from "react";
import "./NewHome.scss";
import { sketch2, makeSketch } from "../sket";
import { Link, Route, Routes } from "react-router-dom";
import { Sketch } from "@p5-wrapper/react";

const LazyP5Wrapper = React.lazy(() => import("@p5-wrapper/react").then(obj => ({ default: obj.ReactP5Wrapper })));

function BgComponent(props: { expression?: any, showVelocity?: boolean, numBodies: number, showCenter?: boolean }) {
	return (
		<Suspense>
			<div className="anim" style={{ pointerEvents: "auto" }}>
				<LazyP5Wrapper sketch={sketch2} expression={props.expression} showVelocity={props.showVelocity} numBodies={props.numBodies} showCenter={props.showCenter} />
			</div>
		</Suspense>
	);
}

function PlanetSim() {

	const [showVelocity, setShowVelocity] = useState(false);
	const [showCenter, setShowCenter] = useState(false);
	const [numBodies, setNumBodies] = useState(4);

	/*<div className="row align-items-center justify-content-center m-0 mt-4 w-100"
				style={{
					position: "fixed",
					bottom: "1.5em",
					zIndex: 1,
					display: "none"
				}}
			>
				<input
					onFocus={() => {setMakeTextTransparent(true)}}
					onBlur={() => {setMakeTextTransparent(false)}}
					type="text"
					className="form-control inpanim"
					style={{
						maxWidth: "90%",
						width: "600px",
						textAlign: "center",
					}}
					value={myExpression}
					onChange={(e) => {
						setMyExpression(e.target.value);
					}}
				></input>
			</div>*/

	/*<div className="flex-row  align-items-center justify-content-center m-0 mt-4 w-100 d-flex" >
					<button type="button" className="btn btn-primary mb-2" style={{ width: "auto" }} onClick={() => { setMakeTextTransparent(!makeTextTransparent) }}>
						{makeTextTransparent ? "Show Content" : "Hide Content"}
					</button>
				</div>*/

	const makeTextTransparent = true;
	const myExpression = "";

	return <>
		<BgComponent expression={myExpression} showVelocity={showVelocity} numBodies={numBodies} showCenter={showCenter} />
		<div className="w-100" style={{
			position: "fixed",
			bottom: "1.5em",
			zIndex: 1
		}}>

			<div className="flex-row align-items-center justify-content-center m-0 mt-4 w-100 d-flex"
			>
				<button type="button" className={`btn btn-secondary mb-2 mx-2 ${makeTextTransparent ? "" : "opacity-0 pe-none"}`} style={{ width: "auto" }} onClick={() => { setShowVelocity(!showVelocity) }}>
					{showVelocity ? "Hide Velocity" : "Show Velocity"}
				</button>
				<button type="button" className={`btn btn-secondary mb-2 mx-2 ${makeTextTransparent ? "" : "opacity-0 pe-none"}`} style={{ width: "auto" }} onClick={() => { setShowCenter(!showCenter) }}>
					{showCenter ? "Hide Center" : "Show Center"}
				</button>
				<button type="button" className={`btn btn-secondary mb-2 mx-2 ${makeTextTransparent ? "" : "opacity-0 pe-none"}`} disabled={numBodies >= 10} style={{ width: "auto" }} onClick={() => { setNumBodies(Math.min(10, numBodies + 1)) }}>
					Add Body
				</button>
				<button type="button" className={`btn btn-secondary mb-2 mx-2 ${makeTextTransparent ? "" : "opacity-0 pe-none"}`} disabled={numBodies <= 2} style={{ width: "auto" }} onClick={() => { setNumBodies(Math.max(2, numBodies - 1)) }}>
					Remove Body
				</button>


			</div>
		</div>
	</>
}


function MathBg(props: { expression: any }) {

	const [sketch, setSketch] = useState<Array<Sketch> | null>(null);

	useEffect(() => {
		(async () => {
			const myMath = await import("mathjs");
			const newMath = myMath.create(myMath.all, {});
			setSketch([makeSketch(newMath)]);
		})();
	}, []);

	if (sketch === null) {
		return (
			<div className="anim">
			</div>
		);
	}

	return (
		<Suspense>
			<div className="anim">
				<LazyP5Wrapper sketch={sketch[0]} expression={props.expression} />
			</div>
		</Suspense>
	);
}

function Graph() {
	let [myExpression, setMyExpression] = useState("sin(t + x * y * 0.2)");


	return (
		<>
			<MathBg expression={myExpression} />

			<div className="row align-items-center justify-content-center m-0 mt-4 w-100"
				style={{
					position: "fixed",
					bottom: "1.5em"
				}}
			>
				<input
					type="text"
					className="form-control inpanim"
					style={{
						maxWidth: "90%",
						width: "600px",
						textAlign: "center",
					}}
					value={myExpression}
					onChange={(e) => {
						setMyExpression(e.target.value);
					}}
				></input>
			</div>
		</>
	);
}


function Sims() {
	return (
		<Routes>
			<Route path="planets" element={<PlanetSim />} />
			<Route path="graph" element={<Graph />} />
		</Routes>
	);
}

export default Sims;
