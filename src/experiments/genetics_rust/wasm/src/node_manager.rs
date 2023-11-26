use rand::Rng;
use serde::Serialize;
use wasm_bindgen::prelude::*;
use crate::living_node::LivingNode;
use crate::node_logic::{NodeLogic};
use crate::vec::Vec2;
// use rayon::prelude::*;
extern crate web_sys;

#[derive(Clone)]
#[wasm_bindgen]
pub struct RepCand {
    fit: f64,
    logic: NodeLogic,
    num_used: i32
}

#[wasm_bindgen]
pub struct NodeManager {
    pub epoch: i32,
    nodes: Vec<LivingNode>,
    replacement_candidates: Vec<RepCand>,
    pub total_fitness: f64,
    pub bounds: Vec2,
    pub target_pos: Vec2,
    find_new_target_timeout: f64,
    ticks_since_new_target: i32
}

#[derive(Serialize)]
#[wasm_bindgen]
pub struct NodeRepr {
    pub x: f64,
    pub y: f64,
    pub last_operation: i32
}

const NUM_INITIAL_NODES: usize = 1000;
const NUM_REPLACEMENT_CANDIDATES: usize = 500;
const MAX_USE_COUNT: i32 = 30;


#[wasm_bindgen]
impl NodeManager {

    #[wasm_bindgen(constructor)]
    pub fn new(bounds: Vec2) -> NodeManager {
        let mut node_mgr = NodeManager {
            epoch: 0,
            nodes: Vec::with_capacity(NUM_INITIAL_NODES),
            replacement_candidates: Vec::with_capacity(NUM_REPLACEMENT_CANDIDATES),
            bounds,
            total_fitness: 0.0,
            find_new_target_timeout: 0.0,
            ticks_since_new_target: 0,
            target_pos: Vec2::new(0.0, 0.0)
        };

        for _ in 0..NUM_INITIAL_NODES {
            let new_node = node_mgr.construct_new_node();
            node_mgr.nodes.push(new_node);
        }

        node_mgr
    }

    pub fn get_nodes(&self) -> Result<JsValue, JsValue> {
        let moin: Vec<NodeRepr> = self.nodes.iter().map(|n| {
            NodeRepr {
                x: n.pos.x,
                y: n.pos.y,
                last_operation: n.logic.last_operation.to_number()
            }
        }).collect();
        Ok(serde_wasm_bindgen::to_value(&moin)?)
    }

    fn construct_new_node(&mut self) -> LivingNode {
        let mut rng = rand::thread_rng();

        let random_pos = Vec2::new(
            rng.gen_range(0.1..0.9) * self.bounds.x,
            rng.gen_range(0.1..0.9) * self.bounds.y
        );

        let rnd = rng.gen_range(0.0..1.1) * self.total_fitness;

        match self.find_replacement(rnd) {
            None => {
                LivingNode::new(NodeLogic::random(), self.bounds, random_pos)
            },
            Some(i) => {
                self.replacement_candidates[i].num_used += 1;
                let base_logic = &self.replacement_candidates[i].logic;

                let new_logic = if self.replacement_candidates[i].num_used == 1 && (i as f64) < (0.25 * self.replacement_candidates.len() as f64){
                    // copy original, but mutate parameters
                    NodeLogic::mutate_parameters(base_logic, true)
                } else {
                    // mutate and drop back in
                    NodeLogic::mutate(base_logic)
                };

                if self.replacement_candidates[i].num_used > MAX_USE_COUNT &&
                    self.replacement_candidates.len() >= NUM_REPLACEMENT_CANDIDATES / 2 {
                    // remove from list
                    self.total_fitness -= self.replacement_candidates[i].fit;
                    self.replacement_candidates.remove(i);
                }

                LivingNode::new(new_logic, self.bounds, random_pos)
            }
        }
    }

    fn find_replacement(&self, mut at_fitness: f64) -> Option<usize> {
        let mut i = 0;
        while i < self.replacement_candidates.len() {
            at_fitness -= self.replacement_candidates[i].fit;
            if at_fitness <= 0.0 {
                break;
            }
            i += 1;
        }
        if at_fitness > 0.0 || i >= self.replacement_candidates.len() {
            None
        } else {
            Some(i)
        }
    }

    pub fn tick(&mut self) {
        self.find_new_target_timeout -= 1.0;
        self.ticks_since_new_target += 1;

        let radius = f64::min(self.bounds.x * 0.15, self.bounds.y * 0.15);
        let mut divisor = 100.0;
        let mut center = Vec2::new(self.bounds.x * 0.3, self.bounds.y * 0.5);

        if self.epoch >= 50 {
            if self.epoch % 10 < 5 {
                center.x = self.bounds.x * 0.7;
            }
            if self.epoch % 4 < 2 {
                divisor = -divisor;
            }
        }

        self.target_pos = Vec2::new(
            center.x + f64::sin(self.ticks_since_new_target as f64 / divisor) * radius,
            center.y + f64::cos(self.ticks_since_new_target as f64 / divisor) * radius
        );


        self.nodes.iter_mut()
            .for_each(|n| {
                if n.is_dead() {
                    return;
                }
                let act = n.get_next_action(self.target_pos);
                n.tick(self.target_pos, act, self.ticks_since_new_target);
            });

        let all_dead = self.nodes.iter().all(|n| { n.is_dead() });

        if all_dead {
            self.next_epoch();
        }
    }

    fn next_epoch(&mut self) {
        // begin new epoch
        self.epoch += 1;
        self.find_new_target_timeout = 0.0;
        // all nodes are done, lets do the genetic algorithm
        // first calculate fitness and insert into replacement candidates
        self.replacement_candidates.clear();
        self.total_fitness = 0.0;

        for n in self.nodes.iter_mut() {
            // node is dead, calculate fitness
            let fit = n.get_fitness();

            // & insert its logic into the replacement candidates
            let mut e = 0;
            while e < self.replacement_candidates.len() {
                if fit > self.replacement_candidates[e].fit {
                    break;
                }
                e += 1;
            }

            if e >= NUM_REPLACEMENT_CANDIDATES {
                continue;
            }

            self.total_fitness += fit;

            let rep_cand = RepCand {
                fit,
                logic: n.logic.clone(),
                num_used: 0
            };

            if e < self.replacement_candidates.len() {
                self.replacement_candidates.insert(e, rep_cand);

                if self.replacement_candidates.len() > NUM_REPLACEMENT_CANDIDATES {
                    // remove last element from candidates
                    self.total_fitness -= self.replacement_candidates.pop().unwrap().fit;
                }
            } else {
                self.replacement_candidates.push(rep_cand);
            }
        }

        for i in 0..self.nodes.len() {
            self.nodes[i] = self.construct_new_node();
        }
    }

}