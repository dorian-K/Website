use wasm_bindgen::prelude::*;

mod node_logic;
mod living_node;
mod node_manager;
mod vec;

#[wasm_bindgen]
extern {
    pub fn alert(s: &str);
}
