use wasm_bindgen::prelude::*;
#[derive(Clone, Copy)]
#[wasm_bindgen]
pub struct Vec2 {
    pub x: f64,
    pub y: f64
}


#[wasm_bindgen]
impl Vec2 {

    #[wasm_bindgen(constructor)]
    pub fn new(x: f64, y: f64) -> Vec2 {
        Vec2 { x, y }
    }

    pub fn sub(&self, other: &Vec2) -> Vec2 {
        Vec2 { x: self.x - other.x, y: self.y - other.y }
    }

    pub fn _add(&mut self, other: &Vec2) {
        self.x += other.x;
        self.y += other.y;
    }

    pub fn _div(&mut self, val: f64) {
        self.x /= val;
        self.y /= val;
    }

    pub fn from_vec(vec: Vec<f64>) -> Vec2 {
        assert_eq!(vec.len(), 2);

        Vec2 { x: vec[0], y: vec[1] }
    }

    pub fn length(&self) -> f64 {
        (self.x * self.x + self.y * self.y).sqrt()
    }

}