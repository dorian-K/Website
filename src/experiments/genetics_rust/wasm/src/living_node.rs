use crate::node_logic::{NodeLogic};
use crate::vec::Vec2;

#[derive(Clone)]
pub struct LivingNode {
    health: i32,
    pub pos: Vec2,
    vel: Vec2,
    pub logic: NodeLogic,
    reward: f64,
    bounds: Vec2
}

impl LivingNode {
    pub fn new(logic: NodeLogic, bounds: Vec2, pos: Vec2) -> LivingNode {
        LivingNode {
            health: 1400,
            pos,
            vel: Vec2 { x: 0.0, y: 0.0 },
            logic,
            reward: 0.0,
            bounds
        }
    }

    pub fn is_dead(&self) -> bool {
        self.health <= 0
    }

    fn snap_bounds(&mut self, prev_pos: &Vec2) {
        let size_x = 0.1 * 0.5 * self.bounds.x;
        let half_x_bound = self.bounds.x / 2.0;

        if (self.pos.x > half_x_bound - size_x && prev_pos.x <= half_x_bound - size_x) ||
            (self.pos.x < half_x_bound + size_x && prev_pos.x >= half_x_bound + size_x) {
            // crossed the border via x
            if self.pos.y > self.bounds.y * 0.2 && self.pos.y < self.bounds.y * 0.8 {
                if prev_pos.x > half_x_bound {
                    self.pos.x = half_x_bound + size_x;
                } else {
                    self.pos.x = half_x_bound - size_x;
                }
                self.vel.x = 0.0;
            }
        }

        if (self.pos.y < self.bounds.y * 0.8 && prev_pos.y >= self.bounds.y * 0.8) ||
            (self.pos.y > self.bounds.y * 0.2 && prev_pos.y <= self.bounds.y * 0.2) {
            // crossed the border via y
            if self.pos.x >= half_x_bound - size_x && self.pos.x <= half_x_bound + size_x {
                if prev_pos.y > self.bounds.y * 0.5 {
                    self.pos.y = self.bounds.y * 0.8;
                } else {
                    self.pos.y = self.bounds.y * 0.2;
                }
                self.vel.y = 0.0;
            }
        }

        // outer border
        if self.pos.x > self.bounds.x {
            self.pos.x = self.bounds.x;
            self.vel.x = 0.0;
        } else if self.pos.x < 0.0 {
            self.pos.x = 0.0;
            self.vel.x = 0.0;
        }

        if self.pos.y > self.bounds.y {
            self.pos.y = self.bounds.y;
            self.vel.y = 0.0;
        } else if self.pos.y < 0.0 {
            self.pos.y = 0.0;
            self.vel.y = 0.0;
        }
    }

    pub fn get_fitness(&self) -> f64 {
        self.reward
    }

    pub fn tick(&mut self, target_pos: &Vec2, _new_target_timeout: f64, ticks_since_new_target: i32) {
        if self.is_dead() {
            return;
        }

        let mut action = Vec2::from_vec(self.logic.step(Vec::from([
            self.pos.x / (self.bounds.x * 0.5) - 1.0,
            self.pos.y / (self.bounds.y * 0.5) - 1.0,
            self.vel.x,
            self.vel.y,
            target_pos.x / (self.bounds.x * 0.5) - 1.0,
            target_pos.y / (self.bounds.y * 0.5) - 1.0
        ])));

        let action_mag = action.length();
        if action_mag > 1.0 {
            action._div(action_mag);
        }

        self.vel.x += action.x.clamp(-1.0, 1.0) * 0.02;
        self.vel.y += action.y.clamp(-1.0, 1.0) * 0.02;

        let vel_len = self.vel.length();
        if vel_len > 1.0 {
            self.vel._div(vel_len);
        }

        let prev_pos = self.pos;
        self.pos._add(&self.vel);
        self.snap_bounds(&prev_pos);

        if self.health % 10 == 0 && ticks_since_new_target > 30 {
            let dist = self.pos.sub(&target_pos).length();
            let max_dist = self.bounds.length();

            self.reward += 1.0 - dist / max_dist;
            if dist < max_dist * 0.05 {
                self.reward += 0.5;
            }
        }

        self.health -= 1;
    }
}