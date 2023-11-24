use wasm_bindgen::prelude::*;
mod living_node;
mod node_logic;
mod node_manager;
mod vec;

// pub use wasm_bindgen_rayon::init_thread_pool;

#[wasm_bindgen]
extern "C" {
    pub fn alert(s: &str);
}
