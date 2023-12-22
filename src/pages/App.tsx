import "./App.css";

import Portfolio from "./Home";
import Acceptor from "../experiments/redirector/Acceptor";
import Sender from "../experiments/redirector/Sender";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import GeneticSim from "../experiments/genetics/GeneticSim";
import NewHome from "./NewHome";
import React from "react";
import WasmGeneticSim from "../experiments/genetics_rust/js/WasmGeneticSim";

function App() {
	return (
		<>
			<BrowserRouter>
				<Routes>
					<Route path="/g" element={<GeneticSim />} />
					<Route path="/gr" element={<WasmGeneticSim />} />
					<Route path="/" element={<Strict><NewHome /></Strict>} />
					<Route path="/oldhome" element={<Strict><Portfolio /></Strict>} />
					<Route path="/a" element={<Strict><Acceptor /></Strict>} />
					<Route path="/b" element={<Strict><Sender /></Strict>} />
				</Routes>
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
