import React, { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import {
	DEFAULT_SETTINGS,
	DURATION_OPTIONS,
	GameSettings,
	NumberRange,
	Operation,
	Problem,
	isCorrectAnswer,
	validateSettings,
} from "../experiments/arithmetic/problems";
import { RunRecorder } from "../experiments/arithmetic/runRecorder";
import { OPERATION_LABELS, OperationStats, comparableRuns, operationStats } from "../experiments/arithmetic/runStats";
import { RunRecord, loadRuns } from "../experiments/arithmetic/runStore";
import "./ArithmeticGame.scss";

const SETTINGS_STORAGE_KEY = "arithmetic-game-settings";

type RangeKey = "addLeft" | "addRight" | "mulLeft" | "mulRight";
type RangeDraft = { min: string; max: string };
type SettingsDraft = {
	operations: Record<Operation, boolean>;
	ranges: Record<RangeKey, RangeDraft>;
	durationSeconds: number;
};

type Phase = "settings" | "playing" | "finished";

const toDraft = (settings: GameSettings): SettingsDraft => {
	const range = (r: NumberRange): RangeDraft => ({ min: String(r.min), max: String(r.max) });
	return {
		operations: { ...settings.operations },
		ranges: {
			addLeft: range(settings.addLeft),
			addRight: range(settings.addRight),
			mulLeft: range(settings.mulLeft),
			mulRight: range(settings.mulRight),
		},
		durationSeconds: settings.durationSeconds,
	};
};

const fromDraft = (draft: SettingsDraft): GameSettings => {
	const parse = (value: string) => (value.trim() === "" ? NaN : Number(value));
	const range = (r: RangeDraft): NumberRange => ({ min: parse(r.min), max: parse(r.max) });
	return {
		operations: { ...draft.operations },
		addLeft: range(draft.ranges.addLeft),
		addRight: range(draft.ranges.addRight),
		mulLeft: range(draft.ranges.mulLeft),
		mulRight: range(draft.ranges.mulRight),
		durationSeconds: draft.durationSeconds,
	};
};

const loadSettings = (): GameSettings => {
	try {
		const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
		if (stored) {
			const parsed = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } as GameSettings;
			if (validateSettings(parsed).length === 0) return parsed;
		}
	} catch {
		// Storage unavailable or corrupt; fall back to defaults.
	}
	return DEFAULT_SETTINGS;
};

const saveSettings = (settings: GameSettings) => {
	try {
		localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
	} catch {
		// Ignore: remembering settings is only a convenience.
	}
};

function RangeInputs(props: {
	draft: SettingsDraft;
	rangeKey: RangeKey;
	disabled: boolean;
	onChange: (rangeKey: RangeKey, bound: keyof RangeDraft, value: string) => void;
}) {
	const { draft, rangeKey, disabled, onChange } = props;
	const input = (bound: keyof RangeDraft) => (
		<input
			type="text"
			inputMode="numeric"
			className="form-control form-control-sm arith-range-input"
			aria-label={`${rangeKey} ${bound}`}
			value={draft.ranges[rangeKey][bound]}
			disabled={disabled}
			onChange={(e) => onChange(rangeKey, bound, e.target.value)}
		/>
	);
	return (
		<span className="arith-range">
			({input("min")} to {input("max")})
		</span>
	);
}

function SettingsScreen(props: { initial: GameSettings; onStart: (settings: GameSettings) => void }) {
	const [draft, setDraft] = useState<SettingsDraft>(() => toDraft(props.initial));
	const [errors, setErrors] = useState<string[]>([]);

	const setOperation = (op: Operation, enabled: boolean) =>
		setDraft((d) => ({ ...d, operations: { ...d.operations, [op]: enabled } }));

	const setRange = (rangeKey: RangeKey, bound: keyof RangeDraft, value: string) =>
		setDraft((d) => ({
			...d,
			ranges: { ...d.ranges, [rangeKey]: { ...d.ranges[rangeKey], [bound]: value } },
		}));

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		const settings = fromDraft(draft);
		const validationErrors = validateSettings(settings);
		setErrors(validationErrors);
		if (validationErrors.length === 0) props.onStart(settings);
	};

	const operationCheckbox = (op: Operation, label: string) => (
		<label className="form-check-label arith-op-label">
			<input
				type="checkbox"
				className="form-check-input me-2"
				checked={draft.operations[op]}
				onChange={(e) => setOperation(op, e.target.checked)}
			/>
			{label}
		</label>
	);

	const addRangesUsed = draft.operations.add || draft.operations.sub;
	const mulRangesUsed = draft.operations.mul || draft.operations.div;

	return (
		<div className="arith-settings">
			<h1 className="arith-title">Arithmetic Game</h1>
			<p className="arith-intro">
				A fast-paced speed drill: solve as many arithmetic problems as you can before the time runs out.
				Answers are accepted as soon as you type them, no need to press Enter.
			</p>

			<form onSubmit={handleSubmit}>
				<div className="arith-op">
					{operationCheckbox("add", "Addition")}
					<div className="arith-op-detail">
						Range: <RangeInputs draft={draft} rangeKey="addLeft" disabled={!addRangesUsed} onChange={setRange} />
						{" + "}
						<RangeInputs draft={draft} rangeKey="addRight" disabled={!addRangesUsed} onChange={setRange} />
					</div>
				</div>

				<div className="arith-op">
					{operationCheckbox("sub", "Subtraction")}
					<div className="arith-op-detail">Addition problems in reverse.</div>
				</div>

				<div className="arith-op">
					{operationCheckbox("mul", "Multiplication")}
					<div className="arith-op-detail">
						Range: <RangeInputs draft={draft} rangeKey="mulLeft" disabled={!mulRangesUsed} onChange={setRange} />
						{" × "}
						<RangeInputs draft={draft} rangeKey="mulRight" disabled={!mulRangesUsed} onChange={setRange} />
					</div>
				</div>

				<div className="arith-op">
					{operationCheckbox("div", "Division")}
					<div className="arith-op-detail">Multiplication problems in reverse.</div>
				</div>

				<div className="arith-duration">
					<label htmlFor="arith-duration">Duration:</label>
					<select
						id="arith-duration"
						className="form-select form-select-sm"
						value={draft.durationSeconds}
						onChange={(e) => setDraft((d) => ({ ...d, durationSeconds: Number(e.target.value) }))}
					>
						{DURATION_OPTIONS.map((seconds) => (
							<option key={seconds} value={seconds}>
								{seconds} seconds
							</option>
						))}
					</select>
				</div>

				{errors.length > 0 && (
					<ul className="arith-errors">
						{errors.map((error) => (
							<li key={error}>{error}</li>
						))}
					</ul>
				)}

				<button type="submit" className="btn btn-primary">
					Start
				</button>
			</form>
		</div>
	);
}

function formatSeconds(ms: number | null): string {
	return ms === null ? "–" : `${(ms / 1000).toFixed(2)} s`;
}

function StatsTable(props: { stats: OperationStats[] }) {
	return (
		<div className="table-responsive">
			<table className="table table-dark table-sm arith-stats-table">
				<thead>
					<tr>
						<th>Operation</th>
						<th>Solved</th>
						<th>Average</th>
						<th>Median</th>
						<th>Fastest</th>
						<th>Slowest</th>
						<th title="Average time from the problem appearing to the first keystroke">First key</th>
						<th title="Solved problems where something was deleted before the correct answer">Corrected</th>
						<th>Total time</th>
					</tr>
				</thead>
				<tbody>
					{props.stats.map((row) => (
						<tr key={row.operation} className={row.operation === "all" ? "arith-stats-total" : undefined}>
							<td>{row.operation === "all" ? "All" : OPERATION_LABELS[row.operation]}</td>
							<td>{row.solved}</td>
							<td>{formatSeconds(row.meanMs)}</td>
							<td>{formatSeconds(row.medianMs)}</td>
							<td>{formatSeconds(row.fastestMs)}</td>
							<td>{formatSeconds(row.slowestMs)}</td>
							<td>{formatSeconds(row.meanFirstInputMs)}</td>
							<td>{row.corrected}</td>
							<td>{row.solved > 0 ? formatSeconds(row.totalMs) : "–"}</td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

function ScoreChart(props: { runs: RunRecord[]; currentRunId: string }) {
	const { runs, currentRunId } = props;
	// Plotted by game number rather than wall-clock time: games come in bursts minutes apart
	// with days in between, which a time axis would squash together.
	const data = runs.map((run, i) => ({
		x: i + 1,
		y: run.score,
		fillColor: run.id === currentRunId ? "#f59e0b" : "#60a5fa",
	}));
	const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" });
	const options: ApexOptions = {
		chart: { type: "line", background: "transparent", toolbar: { show: false }, zoom: { enabled: false } },
		theme: { mode: "dark" },
		colors: ["#60a5fa"],
		stroke: { width: 2, curve: "straight" },
		markers: { size: 5, strokeWidth: 0 },
		grid: { borderColor: "rgba(255, 255, 255, 0.1)" },
		xaxis: {
			type: "numeric",
			min: 1,
			max: Math.max(2, runs.length),
			tickAmount: Math.min(Math.max(1, runs.length - 1), 10),
			title: { text: "Game" },
			labels: { formatter: (value) => String(Math.round(Number(value))) },
		},
		yaxis: { min: 0, forceNiceScale: true, labels: { formatter: (value) => String(Math.round(value)) } },
		tooltip: {
			theme: "dark",
			x: {
				formatter: (value) => {
					const game = Math.round(Number(value));
					const run = runs[game - 1];
					return run ? `Game ${game} · ${dateFormat.format(run.startedAt)}` : "";
				},
			},
		},
		legend: { show: false },
		dataLabels: { enabled: false },
	};
	return <Chart options={options} series={[{ name: "Score", data }]} type="line" height={280} />;
}

function RunResults(props: { run: RunRecord }) {
	const { run } = props;
	const [history, setHistory] = useState<RunRecord[] | null>(null);
	const [loadError, setLoadError] = useState(false);

	useEffect(() => {
		let cancelled = false;
		loadRuns()
			.then((runs) => {
				// Use the in-memory copy of this run; the stored one may not be written yet.
				if (!cancelled) setHistory([...runs.filter((r) => r.id !== run.id), run]);
			})
			.catch((error) => {
				console.error("Failed to load arithmetic runs:", error);
				if (!cancelled) setLoadError(true);
			});
		return () => {
			cancelled = true;
		};
	}, [run]);

	const comparable = history ? comparableRuns(history, run.settings) : [run];
	const lastTen = comparable.slice(-10);
	const lastTenScores = lastTen.map((r) => r.score);

	return (
		<div className="arith-stats">
			<section>
				<h2>This game</h2>
				<StatsTable stats={operationStats([run])} />
			</section>

			<section>
				<h2>Last {lastTen.length} {lastTen.length === 1 ? "game" : "games"}</h2>
				<p className="arith-stats-note">
					Average score {(lastTenScores.reduce((a, b) => a + b, 0) / lastTenScores.length).toFixed(1)}, best{" "}
					{Math.max(...lastTenScores)}. Only games with the same settings as this one are included.
				</p>
				<StatsTable stats={operationStats(lastTen)} />
			</section>

			<section>
				<h2>Scores over time</h2>
				{loadError ? (
					<p className="arith-stats-note">Could not load saved games from this browser.</p>
				) : (
					<>
						<p className="arith-stats-note">
							All {comparable.length} {comparable.length === 1 ? "game" : "games"} with these settings; this game is highlighted.
						</p>
						<ScoreChart runs={comparable} currentRunId={run.id} />
					</>
				)}
			</section>
		</div>
	);
}

function GameScreen(props: {
	recorder: RunRecorder;
	finished: boolean;
	onFinish: () => void;
	onRestart: () => void;
	onChangeSettings: () => void;
}) {
	const { recorder, finished, onFinish, onRestart, onChangeSettings } = props;
	const [problem, setProblem] = useState<Problem>(() => recorder.currentProblem);
	const [input, setInput] = useState("");
	const [score, setScore] = useState(0);
	const [secondsLeft, setSecondsLeft] = useState(recorder.run.settings.durationSeconds);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (finished) return;
		const tick = () => {
			const remainingMs = recorder.endsAt - Date.now();
			setSecondsLeft(Math.max(0, Math.ceil(remainingMs / 1000)));
			if (remainingMs <= 0) {
				window.clearInterval(interval);
				recorder.finish();
				onFinish();
			}
		};
		const interval = window.setInterval(tick, 100);
		return () => window.clearInterval(interval);
	}, [finished, recorder, onFinish]);

	useEffect(() => {
		if (!finished) inputRef.current?.focus();
	}, [finished]);

	useEffect(() => {
		const onVisibility = () =>
			recorder.recordEvent(document.visibilityState === "hidden" ? "visibility-hidden" : "visibility-visible");
		const onBlur = () => recorder.recordEvent("window-blur");
		const onFocus = () => recorder.recordEvent("window-focus");
		document.addEventListener("visibilitychange", onVisibility);
		window.addEventListener("blur", onBlur);
		window.addEventListener("focus", onFocus);
		return () => {
			document.removeEventListener("visibilitychange", onVisibility);
			window.removeEventListener("blur", onBlur);
			window.removeEventListener("focus", onFocus);
		};
	}, [recorder]);

	const handleInput = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (finished) return;
		const value = event.target.value;
		recorder.recordInput(value, (event.nativeEvent as InputEvent).inputType ?? "unknown");
		if (isCorrectAnswer(value, problem)) {
			setProblem(recorder.solveCurrent());
			setScore(recorder.run.score);
			setInput("");
		} else {
			setInput(value);
		}
	};

	return (
		<div className="arith-game">
			<div className="arith-banner">
				<span>Seconds left: {secondsLeft}</span>
				<span>Score: {score}</span>
			</div>

			{finished ? (
				<div className="arith-results">
					<p className="arith-final-score">Score: {score}</p>
					<div className="arith-results-actions">
						<button type="button" className="btn btn-primary" onClick={onRestart} autoFocus>
							Try again
						</button>
						<button type="button" className="btn btn-outline-light" onClick={onChangeSettings}>
							Change settings
						</button>
					</div>
					<RunResults run={recorder.run} />
				</div>
			) : (
				<div className="arith-problem">
					<span className="arith-problem-text">{problem.text} =</span>
					<input
						ref={inputRef}
						type="text"
						inputMode="numeric"
						autoComplete="off"
						autoCorrect="off"
						spellCheck={false}
						className="arith-answer"
						aria-label="Answer"
						value={input}
						onChange={handleInput}
						onKeyDown={(e) => recorder.recordKey(e.key, e.repeat)}
						onFocus={() => recorder.recordEvent("answer-focus")}
						onBlur={() => recorder.recordEvent("answer-blur")}
					/>
				</div>
			)}
		</div>
	);
}

function SavedRunsInfo() {
	const [runs, setRuns] = useState<RunRecord[] | null>(null);

	useEffect(() => {
		let cancelled = false;
		loadRuns()
			.then((loaded) => !cancelled && setRuns(loaded))
			.catch((error) => console.error("Failed to load arithmetic runs:", error));
		return () => {
			cancelled = true;
		};
	}, []);

	if (runs === null) return null;

	const exportRuns = () => {
		const blob = new Blob([JSON.stringify(runs, null, 2)], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `arithmetic-runs-${new Date().toISOString().slice(0, 10)}.json`;
		link.click();
		URL.revokeObjectURL(url);
	};

	return (
		<p className="arith-saved-runs">
			{runs.length} {runs.length === 1 ? "game" : "games"} saved in this browser
			{runs.length > 0 && (
				<>
					{" · "}
					<button type="button" className="btn btn-link btn-sm p-0 align-baseline" onClick={exportRuns}>
						Export as JSON
					</button>
				</>
			)}
		</p>
	);
}

function ArithmeticGame() {
	const [phase, setPhase] = useState<Phase>("settings");
	const [settings, setSettings] = useState<GameSettings>(loadSettings);
	const [recorder, setRecorder] = useState<RunRecorder | null>(null);

	useEffect(() => {
		document.title = "Arithmetic Game";
	}, []);

	const startGame = (newSettings: GameSettings) => {
		setSettings(newSettings);
		saveSettings(newSettings);
		setRecorder(new RunRecorder(newSettings));
		setPhase("playing");
	};

	const handleFinish = useCallback(() => setPhase("finished"), []);

	return (
		<div className="arith-page">
			<div className="arith-container">
				{phase === "settings" || recorder === null ? (
					<>
						<SettingsScreen initial={settings} onStart={startGame} />
						<SavedRunsInfo />
					</>
				) : (
					<GameScreen
						key={recorder.run.id}
						recorder={recorder}
						finished={phase === "finished"}
						onFinish={handleFinish}
						onRestart={() => startGame(settings)}
						onChangeSettings={() => setPhase("settings")}
					/>
				)}
			</div>
		</div>
	);
}

export default ArithmeticGame;
