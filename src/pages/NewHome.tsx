import { ReactNode, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGithub, faGoogleScholar, faLinkedin, faXTwitter } from "@fortawesome/free-brands-svg-icons";
import { faArrowRight, faGraduationCap } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";
import "./NewHome.scss";
import { CV_PDF_URL } from "./CvPage";

interface CardProps {
	title: ReactNode;
	children?: ReactNode;
	// The title links to `to` (an app route) or `href` (any URL), and the whole card becomes clickable.
	to?: string;
	href?: string;
	newTab?: boolean;
}

function Card(props: CardProps) {
	const titleContent = <>
		{props.title}
		<FontAwesomeIcon className="card-title-arrow ms-2" icon={faArrowRight} />
	</>;
	let title: ReactNode = props.title;
	if (props.to) {
		title = <Link className="card-title-link" to={props.to}>{titleContent}</Link>;
	} else if (props.href) {
		title = <a className="card-title-link" href={props.href} {...(props.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{titleContent}</a>;
	}
	return (<div className="col-md-8 my-1">
		<div className={"card mx-1" + (props.to || props.href ? " card-linked" : "")}>
			<div className="card-body text-start">
				<h5 className="card-title">
					{title}
				</h5>
				{props.children}
			</div>
		</div>
	</div>);
}

// A row of links for cards that lead to more than one page.
function CardLinks(props: { links: { label: string, to: string }[] }) {
	return (<div className="card-links mb-2">
		{props.links.map(link => (
			<Link key={link.to} className="card-sublink" to={link.to}>
				{link.label}
				<FontAwesomeIcon className="card-title-arrow ms-1" icon={faArrowRight} />
			</Link>
		))}
	</div>);
}

function NewHome() {
	useEffect(() => {
		document.title = "Dorian Koch";
	}, []);

	return (
		<div id="text" className="new-home">
			<h1 className="portnametext text-white">Dorian Koch</h1>
			<div className="container transitionin">
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
						<CardLinks links={[{ label: "Planets", to: "/sims/planets" }, { label: "Graph", to: "/sims/graph" }]} />
						A gravity simulation of orbiting planets, and an animated plot of any formula in x, y and time.
					</Card>
					<Card title="Send & Receive links via QR code">
						<CardLinks links={[{ label: "Receive links", to: "/a" }, { label: "Send links", to: "/b" }]} />
						Show a <b>QR code</b> on a big screen, scan it with your phone, and send it a link to open.
					</Card>
					<Card title="Genetic Simulation in your Browser">
						<CardLinks links={[{ label: "TypeScript", to: "/g" }, { label: "WebAssembly", to: "/gr" }]} />
						Train a neural network to follow a red circle using a <b>Genetic Algorithm</b>, in TypeScript or as Rust compiled to WebAssembly.
					</Card>
				</div>
			</div>
		</div>
	);
}

export default NewHome;
