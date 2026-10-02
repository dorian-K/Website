import type { GameSettings, Operation } from "./problems";
import type { ProblemRecord, RunRecord } from "./runStore";

export const OPERATION_LABELS: Record<Operation, string> = {
	add: "Addition",
	sub: "Subtraction",
	mul: "Multiplication",
	div: "Division",
};

export type OperationStats = {
	operation: Operation | "all";
	/** Number of solved problems. */
	solved: number;
	/** Time from a problem appearing to its correct answer being typed. */
	meanMs: number | null;
	medianMs: number | null;
	fastestMs: number | null;
	slowestMs: number | null;
	totalMs: number;
	/** Time from a problem appearing to the first change in the answer box. */
	meanFirstInputMs: number | null;
	/** Solved problems where something was deleted before the correct answer was reached. */
	corrected: number;
};

const median = (sorted: number[]) => {
	if (sorted.length === 0) return null;
	const mid = Math.floor(sorted.length / 2);
	return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const mean = (values: number[]) => (values.length ? values.reduce((a, b) => a + b, 0) / values.length : null);

function statsFor(operation: OperationStats["operation"], problems: ProblemRecord[]): OperationStats {
	const solved = problems.filter((p) => p.solvedAt !== null);
	const times = solved.map((p) => p.solvedAt! - p.shownAt).sort((a, b) => a - b);
	const firstInputs = solved.filter((p) => p.inputs.length > 0).map((p) => p.inputs[0].t - p.shownAt);
	return {
		operation,
		solved: solved.length,
		meanMs: mean(times),
		medianMs: median(times),
		fastestMs: times.length ? times[0] : null,
		slowestMs: times.length ? times[times.length - 1] : null,
		totalMs: times.reduce((a, b) => a + b, 0),
		meanFirstInputMs: mean(firstInputs),
		corrected: solved.filter((p) => p.inputs.some((input) => input.inputType.startsWith("delete"))).length,
	};
}

/**
 * Per-operation stats over all problems of the given runs, plus an "all" row.
 * Only operations enabled in at least one of the runs are included.
 */
export function operationStats(runs: RunRecord[]): OperationStats[] {
	const problems = runs.flatMap((run) => run.problems);
	const operations = (Object.keys(OPERATION_LABELS) as Operation[]).filter((op) =>
		runs.some((run) => run.settings.operations[op]),
	);
	return [
		...operations.map((op) => statsFor(op, problems.filter((p) => p.operation === op))),
		statsFor("all", problems),
	];
}

/** Settings equality, ignoring key order. */
export function sameSettings(a: GameSettings, b: GameSettings): boolean {
	const canonical = (s: GameSettings) =>
		JSON.stringify([
			s.durationSeconds,
			s.operations.add, s.operations.sub, s.operations.mul, s.operations.div,
			s.addLeft.min, s.addLeft.max, s.addRight.min, s.addRight.max,
			s.mulLeft.min, s.mulLeft.max, s.mulRight.min, s.mulRight.max,
		]);
	return canonical(a) === canonical(b);
}

/** Completed runs played with the same settings, oldest first. */
export function comparableRuns(runs: RunRecord[], settings: GameSettings): RunRecord[] {
	return runs
		.filter((run) => run.status === "completed" && sameSettings(run.settings, settings))
		.sort((a, b) => a.startedAt - b.startedAt);
}
