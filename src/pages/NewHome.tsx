import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import { faRadio, faRightToBracket, faWaveSquare } from "@fortawesome/free-solid-svg-icons"

import { ReactP5Wrapper } from "react-p5-wrapper";
import "./NewHome.scss";
import { sketch2 } from "../sket";
import { useNavigate } from "react-router-dom";

function BgComponent(props: {expression: any}) {
	return (
		<div className="anim" style={{pointerEvents: "auto"}}>
			<ReactP5Wrapper sketch={sketch2} expression={props.expression} />
		</div>
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

	return (
		<>
			<BgComponent expression={myExpression} />
			<div id="text">
				<p className="portnametext text-white" >Dorian Koch</p>
				<div className={"container "+ (makeTextTransparent ? "transitionout" : "transitionin")}>
					<div className="d-flex flex-nowrap justify-content-center">
						<a href="https://github.com/dorian-k" className="mx-2" title="Github">
							<FontAwesomeIcon className="whiteicon bigfont" icon={faGithub} />
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
							<br /><b>Never manually type presentation URL's again!</b>

						</Card>
						<Card title="Genetic Simulation">
							<div>
							<button type="button" className="btn btn-primary mb-2" onClick={() => {navigate("/g")}}>
									Open
									<FontAwesomeIcon className="whiteicon mx-1" icon={faRightToBracket} />
								</button>
							</div>
							"Train" a neural network to follow a red circle using a <b>Genetic Algorithm</b>.
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
		</>
	);
}

export default NewHome;
