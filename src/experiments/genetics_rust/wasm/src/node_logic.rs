use wasm_bindgen::prelude::*;
use rand::Rng;

fn gaussian_random(stddev: f64) -> f64 {
	let mut rng = rand::thread_rng();
	let u: f64 = 1.0 - rng.gen::<f64>();
	let v: f64 = rng.gen();
	let z = (-2.0 * u.ln()).sqrt() * (2.0 * v * std::f64::consts::PI).cos();
	return z * stddev;
}

#[wasm_bindgen]
pub struct Layer {
	weights: Vec<Vec<f64>>,
	biases: Vec<f64>
}
impl Layer {
	fn new(weights: Vec<Vec<f64>>, biases: Vec<f64>) -> Layer {
		Layer { weights, biases }
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

		Layer { weights, biases }
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

	fn activation(&self, x: f64) -> f64 {
		x.tanh()
	}

	fn forward(&self, input: Vec<f64>) -> Vec<f64> {
		assert_eq!(input.len(), self.weights[0].len());

		self.biases
			.iter()
			.zip(&self.weights)
			.map(|(bias, weights)| {
				let dot_product = input
					.iter()
					.zip(weights.iter())
					.map(|(&x, &w)| x * w)
					.sum::<f64>();
				bias + dot_product
			})
			.collect()
	}
}

pub struct NodeLogic {
	layers: Vec<Layer>,
	mutation_rate: f64,
	expected_weight_mutations: f64,
	expected_bias_mutations: f64,
	last_output: Vec<f64>,
	last_operation: String
}

impl NodeLogic {
	fn new(layers: Vec<Layer>,
		   mutation_rate: f64,
		   expected_weight_mutations: f64,
		   expected_bias_mutations: f64,
		   last_operation: String) -> NodeLogic {
		let last_output = vec![0.0; layers.last().map(|x| x.biases.len()).unwrap_or(0)];
		NodeLogic{
			layers,
			mutation_rate: mutation_rate.clamp(0.001, 0.5),
			expected_weight_mutations: expected_weight_mutations.clamp(0.01, 999999f64),
			expected_bias_mutations: expected_bias_mutations.clamp(0.01, 999999f64),
			last_output,
			last_operation
		}
	}

	fn random() -> NodeLogic {
		const NUM_LAYERS: usize = 4;
		const NUM_IN: i32 = 6;
		const NUM_OUT: i32 = 2;
		let mut layers = Vec::with_capacity(NUM_LAYERS);

		let mut last_out = NUM_IN;
		for i in 0..NUM_LAYERS {
			let new_out = if i == NUM_LAYERS - 1 { NUM_OUT } else { 8 };
			layers.push(Layer::rand(last_out, new_out));
			last_out = new_out;
		}

		NodeLogic::new(
			layers,
			(0.3 + gaussian_random(0.2)).clamp(0.1, 0.5),
			(20.0 + gaussian_random(8f64)).clamp(5f64, 40f64),
			(2.0 + gaussian_random(2f64)).clamp(0.3, 10f64),
			String::from("random")
		)
	}

	fn mutate(&self) -> NodeLogic {
		
	}
}