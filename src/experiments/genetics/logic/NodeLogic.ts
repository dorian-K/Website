
function clamp(val: number, min: number, max: number) {
	return Math.max(Math.min(val, max), min);
}

function gaussianRandom(stdev = 1) {
	let u = 1 - Math.random(); // Converting [0,1) to (0,1]
	let v = Math.random();
	let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
	// Transform to the desired mean and standard deviation:
	return z * stdev;
}

// const LN_2 = Math.log(2);

class Layer {
	weights: Array<Float32Array>;
	biases: Float32Array;

	constructor(weights: Array<Float32Array>, biases: Float32Array) {
		this.weights = weights;
		this.biases = biases;
	}

	static rand(numIn: number, numOut: number): Layer {
		const w = new Array(numOut);
		const b = new Float32Array(numOut);
		// initialize bias to 0 for now

		// xavier initialization
		const boundary = Math.sqrt(6 / (numIn + numOut));

		for (let i = 0; i < numOut; i++) {
			let a = new Float32Array(numIn);
			for (let b = 0; b < numIn; b++)
				a[b] = boundary * (Math.random() * 2 - 1);
			w[i] = a;

			b[i] = 0;
		}

		return new Layer(w, b);
	}

	static mutate(
		n: Layer,
		mutationRate: number,
		expectedWeightMutations: number,
		expectedBiasMutations: number
	): Layer {
		const nw = new Array(n.weights.length);
		const nb = new Float32Array(n.biases.length);
		
		const totalWeights = n.weights.length * n.weights[0].length;
		const weightMutPrevalence = expectedWeightMutations / totalWeights;
		const biasMutPrevalence = expectedBiasMutations / n.biases.length;

		for (let i = 0; i < nw.length; i++) {
			let a = new Float32Array(n.weights[0].length);
			for (let b = 0; b < a.length; b++) {
				a[b] = n.weights[i][b];
				if (Math.random() < weightMutPrevalence)
					a[b] += gaussianRandom(mutationRate);
			}

			nw[i] = a;

			if (Math.random() < biasMutPrevalence)
				nb[i] = n.biases[i] + gaussianRandom(mutationRate);
		}
		return new Layer(nw, nb);
	}

	activation(x: number): number {
		// gelu
		//return 0.5 * x * (1 + Math.tanh(Math.sqrt(2/Math.PI) * (x * (1 + 0.044715 * x * x))));
		// softplus
		//return Math.log(1 + Math.exp(x)) / LN_2 - 1;
		return Math.tanh(x);
		/*if(x < 0)
			return -1;
		return 1;*/
	}

	forward(input: Float32Array): Float32Array {
		if (input.length !== this.weights[0].length)
			throw new Error("input size mismatch!");
		let output = new Float32Array(this.biases.length);

		for (let i = 0; i < output.length; i++) {
			let o = this.biases[i];
			for (let f = 0; f < this.weights[i].length; f++)
				o += input[f] * this.weights[i][f];
			output[i] = this.activation(o);
		}

		return output;
	}
}

class NodeLogic {
	layers: Array<Layer>;
	mutationRate: number;
	expectedWeightMutations: number;
	expectedBiasMutations: number;
	lastOutput: Float32Array;
	lastOperation: string;

	constructor(
		layers: Array<Layer>,
		mutationRate: number,
		expectedWeightMutations: number,
		expectedBiasMutations: number,
		lastOperation: string
	) {
		this.layers = layers;
		this.mutationRate = clamp(mutationRate, 0.001, 0.5);
		this.expectedWeightMutations = clamp(expectedWeightMutations, 0.01, 999999);
		this.expectedBiasMutations = clamp(expectedBiasMutations, 0.01, 999999);
		this.lastOutput = new Float32Array(this.layers[this.layers.length - 1].biases.length);
		this.lastOperation = lastOperation;
	}

	static rand(): NodeLogic {
		let layers = [];
		let numLayer = 4
		let numTotalIn = 7;
		let numTotalOut = 2;

		let lastOut = numTotalIn;
		for (let i = 1; i <= numLayer; i++) {
			let newOut = i === numLayer ? numTotalOut : 8;
			layers.push(Layer.rand(lastOut, newOut));
			lastOut = newOut;
		}
		return new NodeLogic(
			layers,
			clamp(0.3 + gaussianRandom(0.2), 0.1, 0.5),
			clamp(20 + gaussianRandom(8), 5, 40),
			clamp(2 + gaussianRandom(2), 0.3, 10),
			"random"
		);
	}

	static mutate(l1: NodeLogic) {
		let nl = new Array(l1.layers.length);
		for (let i = 0; i < nl.length; i++)
			nl[i] = Layer.mutate(
				l1.layers[i],
				l1.mutationRate,
				l1.expectedWeightMutations / nl.length,
				l1.expectedBiasMutations / nl.length
			);

		return this.mutateParameters(new NodeLogic(
			nl,
			l1.mutationRate,
			l1.expectedWeightMutations,
			l1.expectedBiasMutations,
			"mutation"
		), false);
	}

	static mutateParameters(l1: NodeLogic, addOp: boolean) {
		return new NodeLogic(
			l1.layers,
			l1.mutationRate *
			(1 + gaussianRandom(0.03)),
			l1.expectedWeightMutations *
			(1 + gaussianRandom(0.15)),
			l1.expectedBiasMutations *
			(1 + gaussianRandom(0.15)),
			addOp === true ? "parameter_mutation" : l1.lastOperation
		);
	}

	step(obj: Float32Array): Float32Array {
		let inp = obj;

		for (let i = 0; i < this.layers.length; i++)
			inp = this.layers[i].forward(inp);

		this.lastOutput = inp;
		return inp;
	}
}

export default NodeLogic;
