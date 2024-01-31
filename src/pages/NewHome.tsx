import React, { useEffect, useState, Suspense } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub, faLinkedin } from "@fortawesome/free-brands-svg-icons";
import { faRadio, faRightToBracket, faWaveSquare } from "@fortawesome/free-solid-svg-icons"
import "./NewHome.scss";
import { sketch2 } from "../sket";
import { useNavigate } from "react-router-dom";

const LazyP5Wrapper = React.lazy(() => import("@p5-wrapper/react").then(obj => ({default: obj.ReactP5Wrapper})));

function BgComponent(props: {expression?: any, showVelocity?: boolean, numBodies: number, showCenter?: boolean}) {
	return (
		<Suspense>
			<div className="anim" style={{pointerEvents: "auto"}}>
				<LazyP5Wrapper sketch={sketch2} expression={props.expression} showVelocity={props.showVelocity} numBodies={props.numBodies} showCenter={props.showCenter}/>
			</div>
		</Suspense>
	);
}

function Card(props: {title?: any, text?: any, children?: any}) {
	return (<div className="col-md-5 flex-fill my-1">
		<div className="card mx-1"> 
			<div className="card-body text-start">
				<h5 className="card-title">
					{props.title}
				</h5>
				<p className="card-text">
					{props.text}
				</p>
				{props.children}
			</div>
		</div>


	</div>);
}

function NewHome() {
	let [myExpression, setMyExpression] = useState("sin(t + x * y * 0.2)");

	useEffect(() => {
		document.title = "Dorian Koch - Portfolio"
	}, [])

	const navigate = useNavigate();
	const [makeTextTransparent, setMakeTextTransparent] = useState(false);
	const [showVelocity, setShowVelocity] = useState(false);
	const [showCenter, setShowCenter] = useState(false);
	const [numBodies, setNumBodies] = useState(3);

	// when makeTextTransparent is true, scroll will be disabled, so make sure to scroll to top
	useEffect(() => {
		if (makeTextTransparent) {
			document.getElementById("text")!.scrollTo(0, 0);
		}
	}, [makeTextTransparent])

	return (
		<>
			<BgComponent expression={myExpression} showVelocity={showVelocity} numBodies={numBodies} showCenter={showCenter} />
			<div id="text" style={{display: "auto"}} className={makeTextTransparent ? "overflow-hidden" : ""}>
				<p className="portnametext text-white" >Dorian Koch</p>
				<div className={"container "+ (makeTextTransparent ? "transitionout pe-none" : "transitionin")}>
					<div className="d-flex flex-nowrap justify-content-center">
						<a href="https://github.com/dorian-k" className="mx-2" title="Github">
							<FontAwesomeIcon className="whiteicon bigfont" icon={faGithub} />
						</a>
						<a href="https://www.linkedin.com/in/dorian-koch-847851279" className="mx-2" title="LinkedIn">
							<FontAwesomeIcon className="whiteicon bigfont" icon={faLinkedin} />
						</a>
					</div>
					<div className="d-flex flex-wrap mt-3">
						<Card title="Send & Receive links">
							<div>
								<button type="button" className="btn btn-primary mb-2" onClick={() => {navigate("/a")}}>
									Receive links
									<FontAwesomeIcon className="whiteicon mx-1" icon={faRadio} />
								</button>
								<br />
								<button type="button" className="btn btn-primary" onClick={() => {navigate("/b")}}>
									Send links
									<FontAwesomeIcon className="whiteicon mx-1" icon={faWaveSquare} />
								</button>
							</div>

							<br />
							One page displays a <b>QR code</b>, while the second page allows you to input an URL.
							<br /><b> Scan the QR code with your phone</b>, enter the URL on the second page, and click "Submit" to view the web page on the big screen.
							<br /><b>Never manually type presentation URLs again!</b>

						</Card>
						<Card title="Genetic Simulation">
							<div>
								<button type="button" className="btn btn-primary mb-2 me-2" onClick={() => {navigate("/g")}}>
									Open
									<FontAwesomeIcon className="whiteicon mx-1" icon={faRightToBracket} />
								</button>
								<button type="button" className="btn btn-primary mb-2" onClick={() => {navigate("/gr")}}>
									Open WASM
									<FontAwesomeIcon className="whiteicon mx-1" icon={faRightToBracket} />
								</button>
							</div>
							Train a neural network to follow a red circle using a <b>Genetic Algorithm</b>.
							The <b>WASM</b> version uses WebAssembly.
						</Card>
					</div>

				</div>
			</div>

			<div className="row align-items-center justify-content-center m-0 mt-4 w-100"
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
			</div>
			<div className="w-100" style={{
				position: "fixed",
				bottom: "1.5em",
				zIndex: 1
			}}>
				<div className="flex-row  align-items-center justify-content-center m-0 mt-4 w-100 d-flex" >
					<button type="button" className="btn btn-primary mb-2" style={{ width: "auto" }} onClick={() => { setMakeTextTransparent(!makeTextTransparent) }}>
						{makeTextTransparent ? "Show Content" : "Hide Content"}
					</button>
				</div>
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
	);
}

export default NewHome;
