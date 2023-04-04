
function lerp(start: number, end: number, t: number) {
	return (1 - t) * start + t * end;
}

function clamp(val: number, min: number, max: number) {
	return Math.max(Math.min(val, max), min);
}

function gaussianRandom(stdev=1) {
    let u = 1 - Math.random(); // Converting [0,1) to (0,1]
    let v = Math.random();
    let z = Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
    // Transform to the desired mean and standard deviation:
    return z * stdev;
}

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
		mutationPrevalence: number
	): Layer {
		const nw = new Array(n.weights.length);
		const nb = new Float32Array(n.biases.length);

		for (let i = 0; i < nw.length; i++) {
			let a = new Float32Array(n.weights[0].length);
			for (let b = 0; b < a.length; b++) {
				a[b] = n.weights[i][b];
				if (Math.random() < mutationPrevalence)
					a[b] += (Math.random() * 2 - 1) * mutationRate;
			}

			nw[i] = a;

			if (Math.random() < mutationPrevalence * n.weights[0].length)
				nb[i] = n.biases[i] + (Math.random() * 2 - 1) * mutationRate;
		}
		return new Layer(nw, nb);
	}

	activation(x: number): number {
		return Math.tanh(x);
		//return x;
	}

	forward(input: Float32Array): Float32Array {
		if(input.length !== this.weights[0].length)
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
	mutationPrevalence: number;
	lastOutput: Float32Array;

	constructor(
		layers: Array<Layer>,
		mutationRate: number,
		mutationPrevalence: number
	) {
		this.layers = layers;
		this.mutationRate = clamp(mutationRate, 0.001, 0.5);
		this.mutationPrevalence = clamp(mutationPrevalence, 0.01, 1);
		this.lastOutput = new Float32Array(this.layers[this.layers.length - 1].biases.length);
	}

	static rand(): NodeLogic {
		let layers = [];
		let numLayer = 5;

		let numTotalIn = 1;
		let numTotalOut = 2;
		
		let lastOut = numTotalIn; 
		for (let i = 1; i <= numLayer; i++) {
			let newOut = i === numLayer ? numTotalOut : 6;
			layers.push(Layer.rand(lastOut, newOut));
			lastOut = newOut;
		}
		return new NodeLogic(
			layers,
			Math.random() * 0.5,
			Math.random() * 0.3
		);
	}

	static mutate(l1: NodeLogic) {
		let nl = new Array(l1.layers.length);
		for (let i = 0; i < nl.length; i++)
			nl[i] = Layer.mutate(
				l1.layers[i],
				l1.mutationRate,
				l1.mutationPrevalence
			);

		return new NodeLogic(
			nl,
			l1.mutationRate *
				(1 + (Math.random() * 2 - 1) * 0.05),
			l1.mutationPrevalence *
				(1 + (Math.random() * 2 - 1) * 0.05)
		);
	}

	step(obj: Array<number>): Float32Array {
		let defInp = new Float32Array(obj);
		let inp = defInp;
		//let inp = new Float32Array(this.lastOutput.length);
		//inp.set(defInp);
		//inp.set(this.lastOutput.subarray(defInp.length), defInp.length);
		
		for (let i = 0; i < this.layers.length; i++)
			inp = this.layers[i].forward(inp);

		this.lastOutput = inp;
		return inp;
	}
}

export default NodeLogic;
