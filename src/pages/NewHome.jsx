import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub } from "@fortawesome/free-brands-svg-icons";

import { ReactP5Wrapper } from "react-p5-wrapper";
import "./NewHome.css";
import { sketch } from "../sket";

function BgComponent(props) {
	return (
		<div className="anim">
			<ReactP5Wrapper sketch={sketch} expression={props.expression} />
		</div>
	);
}

function Card(props){
	return (<div className="col">
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

function NewHome(props) {
	let [myExpression, setMyExpression] = useState("sin(t + x * y * 0.2)");

	useEffect(() => {
	  document.title = "Dorian Koch - Portfolio"
	}, [])

	return (
		<>
			<BgComponent expression={myExpression} />
			<div id="text" className="">
				<p className="portnametext text-white">Dorian Koch</p>
				<p className="text-white">Socials</p>
				<div className="d-flex flex-nowrap justify-content-center">
					<a href="https://github.com/dorian-k" className="mx-2" title="Github">
						<FontAwesomeIcon className="porticon" icon={faGithub} />
					</a>
				</div>
				<p className="mt-1 text-white">Experiments</p>
				<div className="container">
					<div className="row">
						<Card title="Sender boi" text="Send the boi">
							ye
						</Card>
						<Card>
							Genetic boi
						</Card>
					</div>
					
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

export default NewHome;
