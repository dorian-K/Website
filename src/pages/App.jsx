import "./App.css";

import Portfolio from "./Home";
import Acceptor from "../experiments/redirector/Acceptor";
import Sender from "../experiments/redirector/Sender";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import GeneticSim from "../experiments/genetics/GeneticSim";
import NewHome from "./NewHome";

function App() {
	return (
		<>
			<Router>
				<Switch>
					<Route path="/newhome" exact component={() => <NewHome />} />
					<Route path="/" exact component={() => <Portfolio />} />
					<Route path="/a" exact component={() => <Acceptor />} />
					<Route path="/b" exact component={() => <Sender />} />
					<Route path="/g" exact component={() => <GeneticSim />} />
				</Switch>
			</Router>
		</>
	);
}

export default App;
