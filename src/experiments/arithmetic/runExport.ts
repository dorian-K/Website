import type { GameSettings } from "./problems";
import type { ProblemRecord, RunEventType, RunRecord } from "./runStore";
import { sameSettings } from "./runStats";

const OPERATION_SYMBOLS = { add: "+", sub: "-", mul: "*", div: "/" } as const;

/** Events that mean the player probably looked away, which inflates that problem's time. */
const INTERRUPTIONS: RunEventType[] = ["visibility-hidden", "window-blur", "answer-blur"];

const describeSettings = (s: GameSettings) => {
	const ops = (Object.keys(OPERATION_SYMBOLS) as (keyof typeof OPERATION_SYMBOLS)[])
		.filter((op) => s.operations[op])
		.join(",");
	const range = (r: { min: number; max: number }) => `${r.min}-${r.max}`;
	return (
		`ops=${ops} add=(${range(s.addLeft)})+(${range(s.addRight)}) ` +
		`mul=(${range(s.mulLeft)})*(${range(s.mulRight)}) duration=${s.durationSeconds}s`
	);
};

/** Values the answer box held right before each deletion, i.e. the wrong (partial) answers. */
export const wrongValues = (problem: ProblemRecord) =>
	problem.inputs.flatMap((input, i) =>
		input.inputType.startsWith("delete") && i > 0 && problem.inputs[i - 1].value !== ""
			? [problem.inputs[i - 1].value]
			: [],
	);

/**
 * Completed runs as compact CSV, one row per problem, for pasting into a chat or spreadsheet.
 * Unlike the full JSON export it drops raw keystrokes and keeps only what matters for
 * finding slow or error-prone problems. Comment lines (#) explain the columns and settings.
 */
export function runsToCsv(runs: RunRecord[]): { csv: string; problems: number } {
	const completed = runs.filter((run) => run.status === "completed").sort((a, b) => a.startedAt - b.startedAt);
	const settingsList: GameSettings[] = [];
	const settingsId = (settings: GameSettings) => {
		let index = settingsList.findIndex((s) => sameSettings(s, settings));
		if (index === -1) index = settingsList.push(settings) - 1;
		return `S${index + 1}`;
	};

	const rows: string[] = [];
	completed.forEach((run, gameIndex) => {
		const settings = settingsId(run.settings);
		const started = new Date(run.startedAt);
		// Local time, minute precision: enough to see sessions and time of day.
		const date = new Date(started.getTime() - started.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
		for (const p of run.problems) {
			const end = p.solvedAt ?? Infinity;
			const interrupted = run.events.some((e) => INTERRUPTIONS.includes(e.type) && e.t >= p.shownAt && e.t <= end);
			rows.push(
				[
					gameIndex + 1,
					date,
					settings,
					run.mode ?? "normal",
					p.index + 1,
					`${p.left}${OPERATION_SYMBOLS[p.operation]}${p.right}`,
					p.answer,
					p.solvedAt === null ? "" : Math.round(p.solvedAt - p.shownAt),
					p.inputs.length ? Math.round(p.inputs[0].t - p.shownAt) : "",
					p.inputs.length,
					wrongValues(p).join("|"),
					interrupted ? 1 : 0,
				].join(","),
			);
		}
	});

	const header = [
		"# Arithmetic game history: one row per problem, oldest first. Times in milliseconds.",
		"# mode: normal or targeted (more problems from weak spots).",
		"# solve_ms is empty for the problem left unsolved when time ran out.",
		"# first_key_ms: problem shown -> first input. inputs: changes to the answer box.",
		"# wrong: what was in the box before each deletion (| separated). interrupted: focus left the game during the problem.",
		...settingsList.map((s, i) => `# S${i + 1}: ${describeSettings(s)}`),
		"game,started,settings,mode,n,problem,answer,solve_ms,first_key_ms,inputs,wrong,interrupted",
	];
	return { csv: [...header, ...rows].join("\n") + "\n", problems: rows.length };
}
