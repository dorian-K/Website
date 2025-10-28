import React, { useEffect, useState, Suspense } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub, faLinkedin } from "@fortawesome/free-brands-svg-icons";
import { faRadio, faRightToBracket, faWaveSquare } from "@fortawesome/free-solid-svg-icons"
import "./NewHome.scss";
import { sketch2 } from "../sket";
import { useNavigate } from "react-router-dom";


function Card(props: {title?: any, text?: any, children?: any}) {
	return (<div className="col-md-6 my-1">
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
	

	// when makeTextTransparent is true, scroll will be disabled, so make sure to scroll to top
	useEffect(() => {
		if (makeTextTransparent) {
			document.getElementById("text")!.scrollTo(0, 0);
		}
	}, [makeTextTransparent])

	return (
		<>
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
						<Card title="RWTH Gym">
							<div>
								<a className="btn btn-primary mb-2 me-2" href="https://rwtf.dorianko.ch/">
									Open
									<FontAwesomeIcon className="whiteicon mx-1" icon={faRightToBracket} />
								</a>
							</div>
							View the utilization of the RWTH Aachen University gym over time and compare it with past data.
						</Card>
						<Card title="Visualizations">
							<div>
								<button type="button" className="btn btn-primary mb-2 me-2" onClick={() => {navigate("/sims/planets")}}>
									Planets
									<FontAwesomeIcon className="whiteicon mx-1" icon={faRightToBracket} />
								</button>
								<button type="button" className="btn btn-primary mb-2" onClick={() => {navigate("/sims/graph")}}>
									Graph
									<FontAwesomeIcon className="whiteicon mx-1" icon={faRightToBracket} />
								</button>
							</div>
							
						</Card>
					</div>

				</div>
			</div>
			
		</>
	);
}

export default NewHome;
