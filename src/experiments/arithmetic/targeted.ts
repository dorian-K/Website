import { GameSettings, Problem, generateProblem } from "./problems";
import type { ProblemRecord, RunEventType, RunRecord } from "./runStore";

/**
 * Targeted practice: problems are grouped into "skill cells" (e.g. "8 × a number ending in 4",
 * "subtraction with a borrow"), each cell's typical solve time is estimated from the player's own
 * history, and slow cells are drawn more often. Recent attempts only, so the targets move as the
 * player improves.
 */

export type SkillCell = { key: string; label: string };

export type CellEstimate = {
	cell: SkillCell;
	/** Typical solve time (geometric mean of recent attempts, shrunk towards the overall typical time). */
	estimateMs: number;
	/** Number of recent attempts the estimate is based on (at most RECENT_ATTEMPTS). */
	attempts: number;
};

export type WeaknessModel = {
	cells: Map<string, CellEstimate>;
	/** Typical solve time over all recent attempts; unseen cells are assumed to take this long. */
	typicalMs: number;
};

/** Share of problems drawn from weak cells; the rest are ordinary random problems. */
const TARGETED_SHARE = 0.75;
/** Only the latest attempts per cell count, so old slowness fades out. */
const RECENT_ATTEMPTS = 15;
/** Pseudo-attempts at the typical time added to every cell, so a single slow attempt doesn't dominate. */
const PRIOR_ATTEMPTS = 3;
/** Longer solves are clipped: past this the player most likely looked away. */
const MAX_COUNTED_MS = 20_000;
/** How sharply slow cells are favoured: weight = (estimate / typical) ^ WEIGHT_EXPONENT. */
const WEIGHT_EXPONENT = 3;
/** Random draws used to find which cells the settings can produce, and how often. */
const REACHABILITY_SAMPLES = 4000;
/** Upper bound on random draws when looking for a problem in the chosen cell. */
const MAX_DRAWS_PER_PROBLEM = 5000;

const INTERRUPTIONS: RunEventType[] = ["visibility-hidden", "window-blur", "answer-blur"];

/**
 * The skill a problem exercises. Multiplication and division are keyed by the single-digit
 * factor and the units digit of the other factor (which decides whether the units step carries);
 * addition and subtraction by carry/borrow and whether the numbers cross 100.
 */
export function skillCell(problem: Pick<Problem, "operation" | "left" | "right" | "answer">): SkillCell {
	const { operation, left, right, answer } = problem;
	switch (operation) {
		case "mul":
		case "div": {
			// For division the display is (f × p) ÷ f, so f is the divisor and p the answer.
			const factor = Math.abs(operation === "mul" ? left : right);
			const partner = Math.abs(operation === "mul" ? right : answer);
			if (partner < 13) {
				return {
					key: `${operation}:${factor}:table`,
					label: operation === "mul" ? `${factor} × 2–12` : `÷ ${factor}, answer up to 12`,
				};
			}
			const units = partner % 10;
			return {
				key: `${operation}:${factor}:${units}`,
				label: operation === "mul" ? `${factor} × …${units}` : `÷ ${factor}, answer ending in ${units}`,
			};
		}
		case "add": {
			const carry = (Math.abs(left) % 10) + (Math.abs(right) % 10) >= 10;
			const big = Math.abs(answer) >= 100;
			return {
				key: `add:${carry ? "carry" : "nocarry"}:${big ? "100" : "lt100"}`,
				label: `+ ${carry ? "with" : "without"} carry, sum ${big ? "100 or more" : "below 100"}`,
			};
		}
		case "sub": {
			const borrow = Math.abs(left) % 10 < Math.abs(right) % 10;
			const big = Math.abs(left) >= 100;
			return {
				key: `sub:${borrow ? "borrow" : "noborrow"}:${big ? "100" : "lt100"}`,
				label: `− ${borrow ? "with" : "without"} borrow, from ${big ? "100 or more" : "below 100"}`,
			};
		}
	}
}

function wasInterrupted(run: RunRecord, problem: ProblemRecord): boolean {
	const end = problem.solvedAt ?? Infinity;
	return run.events.some((e) => INTERRUPTIONS.includes(e.type) && e.t >= problem.shownAt && e.t <= end);
}

/** Builds the per-cell time estimates from all finished runs, whatever their settings or mode. */
export function buildWeaknessModel(runs: RunRecord[]): WeaknessModel {
	const attemptsByCell = new Map<string, { cell: SkillCell; logs: number[] }>();
	const allLogs: number[] = [];
	const finished = runs.filter((run) => run.status !== "in-progress").sort((a, b) => a.startedAt - b.startedAt);
	for (const run of finished) {
		for (const problem of run.problems) {
			if (problem.solvedAt === null || wasInterrupted(run, problem)) continue;
			const ms = Math.min(Math.max(problem.solvedAt - problem.shownAt, 1), MAX_COUNTED_MS);
			const cell = skillCell(problem);
			const entry = attemptsByCell.get(cell.key) ?? { cell, logs: [] };
			entry.logs.push(Math.log(ms));
			attemptsByCell.set(cell.key, entry);
			allLogs.push(Math.log(ms));
		}
	}

	// Typical time from recent attempts overall, so it tracks the player's current level too.
	const recentAll = allLogs.slice(-RECENT_ATTEMPTS * 20);
	const typicalLog = recentAll.length ? recentAll.reduce((a, b) => a + b, 0) / recentAll.length : Math.log(3000);

	const cells = new Map<string, CellEstimate>();
	for (const [key, { cell, logs }] of attemptsByCell) {
		const recent = logs.slice(-RECENT_ATTEMPTS);
		const shrunk = (PRIOR_ATTEMPTS * typicalLog + recent.reduce((a, b) => a + b, 0)) / (PRIOR_ATTEMPTS + recent.length);
		cells.set(key, { cell, estimateMs: Math.exp(shrunk), attempts: recent.length });
	}
	return { cells, typicalMs: Math.exp(typicalLog) };
}

function estimateFor(model: WeaknessModel, cell: SkillCell): CellEstimate {
	return model.cells.get(cell.key) ?? { cell, estimateMs: model.typicalMs, attempts: 0 };
}

/** The cells these settings can produce, with how often plain random generation hits each. */
function reachableCells(settings: GameSettings, rng: () => number): Map<string, { cell: SkillCell; share: number }> {
	const counts = new Map<string, { cell: SkillCell; share: number }>();
	for (let i = 0; i < REACHABILITY_SAMPLES; i++) {
		const cell = skillCell(generateProblem(settings, rng));
		const entry = counts.get(cell.key) ?? { cell, share: 0 };
		entry.share += 1 / REACHABILITY_SAMPLES;
		counts.set(cell.key, entry);
	}
	return counts;
}

/** The slowest cells these settings can produce, slowest first. */
export function weakSpots(model: WeaknessModel, settings: GameSettings, limit: number): CellEstimate[] {
	return [...reachableCells(settings, Math.random).values()]
		.map(({ cell }) => estimateFor(model, cell))
		.filter((estimate) => estimate.attempts > 0)
		.sort((a, b) => b.estimateMs - a.estimateMs)
		.slice(0, limit);
}

/** `targeted` is set only by the targeted generator; plain random play leaves it out. */
export type GeneratedProblem = { problem: Problem; targeted?: boolean };

/**
 * Returns a problem source for one game. Each call draws a weak cell (weighted by how slow it is,
 * among the cells the settings can produce) and then a random problem from that cell, or, for
 * 1 − TARGETED_SHARE of problems, a plain random problem.
 */
export function targetedGenerator(
	model: WeaknessModel,
	settings: GameSettings,
	rng: () => number = Math.random,
): () => GeneratedProblem {
	const candidates = [...reachableCells(settings, rng).values()].map(({ cell }) => ({
		cell,
		weight: (estimateFor(model, cell).estimateMs / model.typicalMs) ** WEIGHT_EXPONENT,
	}));
	const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);

	const pickCell = (): SkillCell => {
		let r = rng() * totalWeight;
		for (const candidate of candidates) {
			r -= candidate.weight;
			if (r <= 0) return candidate.cell;
		}
		return candidates[candidates.length - 1].cell;
	};

	let previousText: string | null = null;
	const draw = (): GeneratedProblem => {
		if (candidates.length === 0 || rng() >= TARGETED_SHARE) {
			return { problem: generateProblem(settings, rng), targeted: false };
		}
		// Rejection sampling keeps the operand distribution inside the cell exactly as in normal play.
		const target = pickCell().key;
		for (let i = 0; i < MAX_DRAWS_PER_PROBLEM; i++) {
			const problem = generateProblem(settings, rng);
			if (skillCell(problem).key === target) return { problem, targeted: true };
		}
		return { problem: generateProblem(settings, rng), targeted: false };
	};

	return () => {
		// Avoid showing the exact same problem twice in a row, which small cells make likely.
		let next = draw();
		if (next.problem.text === previousText) next = draw();
		previousText = next.problem.text;
		return next;
	};
}
