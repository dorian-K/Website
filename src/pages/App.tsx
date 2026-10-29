import "./App.css";

import { BrowserRouter, Route, Routes } from "react-router-dom";
import NewHome from "./NewHome";
import React from "react";
import CvPage from "./CvPage";

// Everything except the home page is loaded on demand, so the home page doesn't
// download the charting, math and simulation code of the other pages.
const Portfolio = React.lazy(() => import("./Home"));
const Acceptor = React.lazy(() => import("../experiments/redirector/Acceptor"));
const Sender = React.lazy(() => import("../experiments/redirector/Sender"));
const GeneticSim = React.lazy(() => import("../experiments/genetics/GeneticSim"));
const WasmGeneticSim = React.lazy(() => import("../experiments/genetics_rust/js/WasmGeneticSim"));
const GymWorkoutAnalyzer = React.lazy(() => import("./GymWorkoutAnalyzer"));
const ArithmeticGame = React.lazy(() => import("./ArithmeticGame"));
const Sims = React.lazy(() => import("./Sims"));

function App() {
	return (
		<>
			<BrowserRouter>
				<React.Suspense fallback={null}>
					<Routes>
						<Route path="/g" element={<GeneticSim />} />
						<Route path="/gr" element={<WasmGeneticSim />} />
						<Route path="/" element={<Strict><NewHome /></Strict>} />
						<Route path="/oldhome" element={<Strict><Portfolio /></Strict>} />
						<Route path="/a" element={<Strict><Acceptor /></Strict>} />
						<Route path="/b" element={<Strict><Sender /></Strict>} />
						<Route path="/cv" element={<Strict><CvPage /></Strict>} />
						<Route path="/gym-analysis" element={<Strict><GymWorkoutAnalyzer /></Strict>} />
						<Route path="/arithmetic" element={<Strict><ArithmeticGame /></Strict>} />

						<Route path="/sims/*" element={<Strict><Sims /></Strict>} />
					</Routes>
				</React.Suspense>
			</BrowserRouter>
		</>
	);
}

function Strict(props: {children: any}){
	return (
		<React.StrictMode>
			{props.children}
		</React.StrictMode>
	);
}

export default App;