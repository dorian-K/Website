import { Suspense, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { faRadio, faWaveSquare } from "@fortawesome/free-solid-svg-icons"
import { Link } from 'react-router-dom'
import "./Home.css";
import { makeSketch } from "../sket";
import React from "react";

const LazyP5Wrapper = React.lazy(() => import("@p5-wrapper/react").then(obj => ({ default: obj.ReactP5Wrapper })));

function BgComponent(props) {

	const [sketch, setSketch] = useState(null);

	useEffect(() => {
		(async () => {
			const myMath = await import("mathjs");
			const newMath = myMath.create(myMath.all, myMath.config);
			setSketch({ "lol": makeSketch(newMath) });
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
				<LazyP5Wrapper sketch={sketch.lol} expression={props.expression} />
			</div>
		</Suspense>
	);
}

function Portfolio(props) {
	let [myExpression, setMyExpression] = useState("sin(t + x * y * 0.2)");

	useEffect(() => {
		document.title = "Dorian Koch - Portfolio"
	}, [])

	return (
		<>
			<BgComponent expression={myExpression} />
			<div id="text" className="">
				<p id="nametext">Dorian Koch</p>
				<div className="d-flex flex-nowrap justify-content-center">
					<a href="https://github.com/dorian-k" className="mx-2" title="Github">
						<FontAwesomeIcon className="porticon" icon={faGithub} />
					</a>
				</div>

				<div className="d-flex flex-nowrap justify-content-center mt-3">
					<Link to="/a" className="mx-2" title="Accept links">
						<FontAwesomeIcon className="porticon" icon={faRadio} />
					</Link>
					<Link to="/b" className="mx-2" title="Send links">
						<FontAwesomeIcon className="porticon" icon={faWaveSquare} />
					</Link>
				</div>


			</div>

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

export default Portfolio;
