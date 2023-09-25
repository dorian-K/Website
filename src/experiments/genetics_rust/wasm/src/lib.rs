use wasm_bindgen::prelude::*;
mod node_logic;
mod living_node;
mod node_manager;
mod vec;

pub use wasm_bindgen_rayon::init_thread_pool;

#[wasm_bindgen]
extern {
    pub fn alert(s: &str);
}
