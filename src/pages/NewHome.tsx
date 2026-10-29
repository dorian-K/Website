import React, { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub, faGoogleScholar, faLinkedin, faXTwitter } from "@fortawesome/free-brands-svg-icons";
import { faArrowRight, faRadio, faRightToBracket, faWaveSquare, faGraduationCap } from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate } from "react-router-dom";
import "./NewHome.scss";
import { sketch2 } from "../sket";
import { CV_PDF_URL } from "./CvPage";


function Card(props: { title?: any, text?: any, children?: any, size?: number, to?: string, href?: string, newTab?: boolean }) {
	const titleContent = <>
		{props.title}
		<FontAwesomeIcon className="card-title-arrow ms-2" icon={faArrowRight} />
	</>;
	let title = props.title;
	if (props.to) {
		title = <Link className="card-title-link" to={props.to}>{titleContent}</Link>;
	} else if (props.href) {
		title = <a className="card-title-link" href={props.href} {...(props.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{titleContent}</a>;
	}
	return (<div className={"col-md-" + (props.size ?? 8) + " my-1"}>
		<div className={"card mx-1" + (props.to || props.href ? " card-linked" : "")}>
			<div className="card-body text-start">
				<h5 className="card-title">
					{title}
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
		<div id="text" style={{ display: "auto" }} className={"new-home" + (makeTextTransparent ? " overflow-hidden" : "")}>
			<p className="portnametext text-white" >Dorian Koch</p>
			<div className={"container " + (makeTextTransparent ? "transitionout pe-none" : "transitionin")}>
				<div className="d-flex flex-wrap justify-content-center row-gap-2">
					<a href="https://github.com/dorian-k" target="_blank" rel="noopener noreferrer" className="social-link mx-2" title="Github">
						<FontAwesomeIcon className="whiteicon bigfont" icon={faGithub} />
						<span className="social-label">GitHub</span>
					</a>
					<a href="https://www.linkedin.com/in/dorian-koch-847851279" target="_blank" rel="noopener noreferrer" className="social-link mx-2" title="LinkedIn">
						<FontAwesomeIcon className="whiteicon bigfont" icon={faLinkedin} />
						<span className="social-label">LinkedIn</span>
					</a>
					<a href="https://x.com/the_dorian_koch" target="_blank" rel="noopener noreferrer" className="social-link mx-2" title="X">
						<FontAwesomeIcon className="whiteicon bigfont" icon={faXTwitter} />
						<span className="social-label">X</span>
					</a>
					<a href="https://scholar.google.com/citations?user=3XNe4AcAAAAJ" target="_blank" rel="noopener noreferrer" className="social-link mx-2" title="Google Scholar">
						<FontAwesomeIcon className="whiteicon bigfont" icon={faGoogleScholar} />
						<span className="social-label">Scholar</span>
					</a>
					<a href={CV_PDF_URL} target="_blank" rel="noopener noreferrer" className="social-link mx-2" title="Curriculum Vitae">
						<FontAwesomeIcon className="whiteicon bigfont" icon={faGraduationCap} />
						<span className="social-label">CV</span>
					</a>
				</div>
				<div className="d-flex flex-column align-items-center mt-3 w-100">
					<Card title="Curriculum Vitae" href={CV_PDF_URL} newTab>
						View my curriculum vitae, including education, work experience, skills, and projects.
					</Card>
					<Card title="RWTH Gym Tracker" href="https://rwtf.dorianko.ch/">
						View the utilization of the RWTH Aachen University gym over time and compare it with past data.
					</Card>
					<Card title="Game Jam 2026" href="/gamejam-2026/index.html">
						Our team's winning entry for the 48h RWTH Game Jam 2026, hosted by the student council I/1.
					</Card>
					<h2 className="text-white mt-3">Other stuff</h2>
					<Card title="AlphaProgression Gym Workout CSV Analyzer" to="/gym-analysis">
						Drop in a CSV export of your AlphaProgression workouts and get in-browser analysis of sets, reps, duration, volume, and exercise trends.
					</Card>
					<Card title="Arithmetic Speed Drill" to="/arithmetic">
						A copy of the Zetamac arithmetic game, with additional stats for learning.
					</Card>
					<Card title="Visualizations I made">
						<div>
							<button type="button" className="btn btn-primary mb-2 me-2" onClick={() => { navigate("/sims/planets") }}>
								Planets
								<FontAwesomeIcon className="whiteicon mx-1" icon={faRightToBracket} />
							</button>
							<button type="button" className="btn btn-primary mb-2" onClick={() => { navigate("/sims/graph") }}>
								Graph
								<FontAwesomeIcon className="whiteicon mx-1" icon={faRightToBracket} />
							</button>
						</div>

					</Card>
					<Card title="Send & Receive links via QR code">
						<div>
							<button type="button" className="btn btn-primary mb-2" onClick={() => { navigate("/a") }}>
								Receive links
								<FontAwesomeIcon className="whiteicon mx-1" icon={faRadio} />
							</button>
							<br />
							<button type="button" className="btn btn-primary mb-2" onClick={() => { navigate("/b") }}>
								Send links
								<FontAwesomeIcon className="whiteicon mx-1" icon={faWaveSquare} />
							</button>
						</div>

						Show a <b>QR code</b> on a big screen, scan it with your phone, and send it a link to open.
					</Card>
					<Card title="Genetic Simulation in your Browser">
						<div>
							<button type="button" className="btn btn-primary mb-2 me-2" onClick={() => { navigate("/g") }}>
								Open
								<FontAwesomeIcon className="whiteicon mx-1" icon={faRightToBracket} />
							</button>
							<button type="button" className="btn btn-primary mb-2" onClick={() => { navigate("/gr") }}>
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
	);
}

export default NewHome;
