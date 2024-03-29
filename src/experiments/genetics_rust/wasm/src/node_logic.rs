use wasm_bindgen::prelude::*;
use rand::Rng;
use serde::{Serialize};

fn gaussian_random(stddev: f64) -> f64 {
	let mut rng = rand::thread_rng();
	let u: f64 = 1.0 - rng.gen::<f64>();
	let v: f64 = rng.gen();
	let z = (-2.0 * u.ln()).sqrt() * (2.0 * v * std::f64::consts::PI).cos();
	return z * stddev;
}

#[derive(Clone)]
pub struct Layer {
	weights: Vec<Vec<f64>>,
	biases: Vec<f64>,
	output_buffer: Vec<f64>
}
impl Layer {
	pub fn new(weights: Vec<Vec<f64>>, biases: Vec<f64>) -> Layer {
		let output_buffer =  vec![0.0; biases.len()];
		Layer { weights, biases, output_buffer }
	}
	fn rand(num_in: i32, num_out: i32) -> Layer {
		let mut weights: Vec<Vec<f64>> = Vec::with_capacity(num_out as usize);
		let mut biases: Vec<f64> = Vec::with_capacity(num_out as usize);

		let boundary = (6.0 / (num_in + num_out) as f64).sqrt();

		let mut rng = rand::thread_rng();

		for _ in 0..num_out {
			let mut a: Vec<f64> = Vec::with_capacity(num_in as usize);

			for _ in 0..num_in {
				let random_value = boundary * (rng.gen::<f64>() * 2.0 - 1.0);
				a.push(random_value);
			}

			weights.push(a);
			biases.push(0.0);
		}

		Layer::new(weights, biases)
	}

	fn mutate(&self, mutation_rate: f64, expected_weight_mutations: f64, expected_bias_mutations: f64) -> Layer {
		let total_weights = self.weights.iter().map(|row| row.len()).sum::<usize>();
		let weight_mut_prevalence = expected_weight_mutations / total_weights as f64;
		let bias_mut_prevalence = expected_bias_mutations / self.biases.len() as f64;

		let mut rng = rand::thread_rng();

		let new_weights: Vec<Vec<f64>> = self
			.weights
			.iter()
			.map(|row| {
				row.iter()
					.map(|&w| {
						let mut mutated_weight = w;
						if rng.gen::<f64>() < weight_mut_prevalence {
							mutated_weight += gaussian_random(mutation_rate);
						}
						mutated_weight
					})
					.collect()
			})
			.collect();

		let new_biases: Vec<f64> = self
			.biases
			.iter()
			.map(|&b| {
				let mut mutated_bias = b;
				if rng.gen::<f64>() < bias_mut_prevalence {
					mutated_bias += gaussian_random(mutation_rate);
				}
				mutated_bias
			})
			.collect();

		Layer::new(new_weights, new_biases)
	}

	#[inline(always)]
	fn activation(x: f64) -> f64 {
		x.tanh()
	}

	#[inline]
	fn forward(&mut self, input: &[f64]) -> &Vec<f64> {
		assert_eq!(input.len(), self.weights[0].len());

		for i in 0..self.biases.len() {
			let mut val = self.biases[i];
			for b in 0..self.weights[i].len() {
				val += input[b] * self.weights[i][b];
			}
			self.output_buffer[i] = Layer::activation(val);
		}

		&self.output_buffer
	}
}

#[derive(Copy, Clone, Serialize)]
#[wasm_bindgen]
pub enum OperationType {
	Mutation,
	ParameterMutation,
	Random
}

impl OperationType {
	pub fn to_number(&self) -> i32 {
		match self {
			OperationType::Mutation => 0,
			OperationType::ParameterMutation => 1,
			OperationType::Random => 2
		}
	}
}

#[derive(Clone)]
pub struct NodeLogic {
	pub layers: Vec<Layer>,
	pub mutation_rate: f64,
	pub expected_weight_mutations: f64,
	pub expected_bias_mutations: f64,
	pub last_operation: OperationType,
	output_buffer: Vec<f64>
}

const NUM_LAYERS: usize = 4;
pub const NUM_IN: i32 = 7;
const NUM_OUT: i32 = 2;

impl NodeLogic {
	pub fn step(&mut self, obj: &[f64]) -> &[f64] {
		let mut inp = obj;

		for layer in self.layers.iter_mut() {
			inp = layer.forward(inp)
		}

		self.output_buffer.clear();
		self.output_buffer.extend(inp);

		&self.output_buffer
	}
	pub fn random() -> NodeLogic {

		let mut layers = Vec::with_capacity(NUM_LAYERS);

		let mut last_out = NUM_IN;
		for i in 0..NUM_LAYERS {
			let new_out = if i == NUM_LAYERS - 1 { NUM_OUT } else { 20 };
			layers.push(Layer::rand(last_out, new_out));
			last_out = new_out;
		}

		NodeLogic::new(
			layers,
			(0.3 + gaussian_random(0.2)).clamp(0.1, 0.5),
			(20.0 + gaussian_random(8f64)).clamp(5f64, 40f64),
			(2.0 + gaussian_random(2f64)).clamp(0.3, 10f64),
			OperationType::Random
		)
	}

	pub fn mutate_parameters(l1: &NodeLogic, add_op: bool) -> NodeLogic {
		NodeLogic::new(
			l1.layers.clone(),
			l1.mutation_rate * (1.0 + gaussian_random(0.03)),
			l1.expected_weight_mutations * (1.0 + gaussian_random(0.15)),
			l1.expected_bias_mutations * (1.0 + gaussian_random(0.15)),
			if add_op { OperationType::ParameterMutation } else { l1.last_operation }
		)
	}

	pub fn mutate(l1: &NodeLogic) -> NodeLogic {
		let num_layers = l1.layers.len();
		let mut layers = Vec::with_capacity(num_layers);
		for i in 0..num_layers {
			layers.push(l1.layers[i].mutate(
				l1.mutation_rate,
				l1.expected_weight_mutations / num_layers as f64,
				l1.expected_bias_mutations / num_layers as f64));
		}

		let new = NodeLogic::new(
			layers,
			l1.mutation_rate,
			l1.expected_weight_mutations,
			l1.expected_bias_mutations,
			OperationType::Mutation);

		NodeLogic::mutate_parameters(&new, false)
	}
}
impl NodeLogic {
	fn new(layers: Vec<Layer>,
		   mutation_rate: f64,
		   expected_weight_mutations: f64,
		   expected_bias_mutations: f64,
		   last_operation: OperationType) -> NodeLogic {
		//let last_output = vec![0.0; layers.last().map(|x| x.biases.len()).unwrap_or(0)];
		NodeLogic {
			layers,
			mutation_rate: mutation_rate.clamp(0.001, 0.5),
			expected_weight_mutations: expected_weight_mutations.clamp(0.01, 999999f64),
			expected_bias_mutations: expected_bias_mutations.clamp(0.01, 999999f64),
			//last_output,
			last_operation,
			output_buffer: Vec::with_capacity(2)
		}
	}
}