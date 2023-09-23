use wasm_bindgen::prelude::*;

mod node_logic;

#[wasm_bindgen]
extern {
    pub fn alert(s: &str);
}
