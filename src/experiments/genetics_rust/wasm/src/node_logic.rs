use wasm_bindgen::prelude::*;
use rand::Rng;

#[wasm_bindgen]
pub fn gaussian_random(stddev: f64) -> f64 {
	let mut rng = rand::thread_rng();
	let u: f64 = 1 - rng.gen();
	let v: f64 = rng.gen();
	let z = (-2 * u.ln()).sqrt() * (2 * v * std::f64::consts::PI).cos();
	return z * stddev;
}

pub struct Layer {
	weights: Vec<Vec<f64>>,
	biases: Vec<f64>
}

impl Layer {
	pub fn rand(num_in: i32, num_out: i32) -> Layer {
		let mut weights: Vec<Vec<f64>> = Vec::with_capacity(num_out as usize);
		let mut biases: Vec<f64> = Vec::with_capacity(num_out as usize);

		let boundary = (6.0 / (num_in + num_out) as f64).sqrt();

		let mut rng = rand::thread_rng();

		for i in 0..num_out {
			let mut a: Vec<f64> = Vec::with_capacity(num_in as usize);

			for _ in 0..num_in {
				let random_value = boundary * (rng.gen::<f64>() * 2.0 - 1.0);
				a.push(random_value);
			}

			weights.push(a);
			biases.push(0.0);
		}

		Layer { }
	}
}