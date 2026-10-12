import { GameSettings, Problem, generateProblem } from "./problems";
import type { ProblemRecord, RunEventType, RunRecord } from "./runStore";

/**
 * Targeted practice: problems are grouped into "skill cells" (e.g. "8 × a number ending in 4",
 * "subtraction with a borrow"), each cell's typical solve time is estimated from the player's own
 * history, and slow cells are drawn more often. Recent attempts only, so the targets move as the
 * player improves. Within a game, problems that went slowly or wrong come back a few problems
 * later (spaced retrieval of the exact item), so the answer is recalled rather than recomputed.
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
/** A solve slower than this multiple of the typical time sends the problem back for review. */
const REVIEW_SLOW_FACTOR = 1.5;
/** Problems shown in between before each review: the first comes back soon, the second later. */
const REVIEW_GAPS = [4, 10];
/** A deletion this long after the last change means the player believed a wrong answer, not a typo. */
const MISCALCULATION_MS = 350;

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
			// Reviews are answered from short-term memory, which would make a cell look learned too early.
			if (problem.solvedAt === null || problem.review || wasInterrupted(run, problem)) continue;
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

/** `targeted` and `review` are set only by the targeted source; plain random play leaves them out. */
export type GeneratedProblem = { problem: Problem; targeted?: boolean; review?: boolean };

/** Supplies a game's problems; `solved` lets an adaptive source react to how each one went. */
export type ProblemSource = {
	next: () => GeneratedProblem;
	solved?: (record: ProblemRecord) => void;
};

/** Whether a wrong answer stood long enough to be a believed miscalculation rather than a typo. */
export function hadMiscalculation(record: ProblemRecord): boolean {
	return record.inputs.some(
		(input, i) =>
			i > 0 &&
			input.inputType.startsWith("delete") &&
			record.inputs[i - 1].value !== "" &&
			input.t - record.inputs[i - 1].t >= MISCALCULATION_MS,
	);
}

/**
 * Returns a problem source for one game. A due review comes first; otherwise it draws a weak cell
 * (weighted by how slow it is, among the cells the settings can produce) and then a random problem
 * from that cell, or, for 1 − TARGETED_SHARE of problems, a plain random problem.
 */
export function targetedGenerator(
	model: WeaknessModel,
	settings: GameSettings,
	rng: () => number = Math.random,
): ProblemSource {
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

	// Problems waiting to come back, with how many more problems must pass first.
	const reviews: { problem: Problem; wait: number; done: number }[] = [];
	let current: { problem: Problem; reviewsDone: number } | null = null;

	const next = (): GeneratedProblem => {
		reviews.forEach((r) => r.wait--);
		const due = reviews.findIndex((r) => r.wait <= 0);
		let result: GeneratedProblem;
		if (due !== -1) {
			const [review] = reviews.splice(due, 1);
			result = { problem: review.problem, targeted: true, review: true };
			current = { problem: review.problem, reviewsDone: review.done + 1 };
		} else {
			// Avoid showing the exact same problem twice in a row, which small cells make likely.
			result = draw();
			if (result.problem.text === previousText) result = draw();
			current = { problem: result.problem, reviewsDone: 0 };
		}
		previousText = result.problem.text;
		return result;
	};

	const solved = (record: ProblemRecord) => {
		if (!current || record.solvedAt === null) return;
		const struggled =
			record.solvedAt - record.shownAt > REVIEW_SLOW_FACTOR * model.typicalMs || hadMiscalculation(record);
		const { problem, reviewsDone } = current;
		// A clean, quick review means it stuck; otherwise it comes back once more, further out.
		if (struggled && reviewsDone < REVIEW_GAPS.length) {
			reviews.push({ problem, wait: REVIEW_GAPS[reviewsDone], done: reviewsDone });
		}
	};

	return { next, solved };
}
