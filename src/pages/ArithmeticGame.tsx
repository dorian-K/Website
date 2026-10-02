import React, { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import {
	DEFAULT_SETTINGS,
	DURATION_OPTIONS,
	GameSettings,
	NumberRange,
	Operation,
	Problem,
	generateProblem,
	isCorrectAnswer,
	validateSettings,
} from "../experiments/arithmetic/problems";
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

function GameScreen(props: {
	settings: GameSettings;
	finished: boolean;
	onFinish: () => void;
	onRestart: () => void;
	onChangeSettings: () => void;
}) {
	const { settings, finished, onFinish, onRestart, onChangeSettings } = props;
	const [problem, setProblem] = useState<Problem>(() => generateProblem(settings));
	const [input, setInput] = useState("");
	const [score, setScore] = useState(0);
	const [secondsLeft, setSecondsLeft] = useState(settings.durationSeconds);
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (finished) return;
		const endTime = Date.now() + settings.durationSeconds * 1000;
		const tick = () => {
			const remainingMs = endTime - Date.now();
			setSecondsLeft(Math.max(0, Math.ceil(remainingMs / 1000)));
			if (remainingMs <= 0) {
				window.clearInterval(interval);
				onFinish();
			}
		};
		const interval = window.setInterval(tick, 100);
		return () => window.clearInterval(interval);
	}, [finished, settings.durationSeconds, onFinish]);

	useEffect(() => {
		if (!finished) inputRef.current?.focus();
	}, [finished]);

	const handleInput = (value: string) => {
		if (finished) return;
		if (isCorrectAnswer(value, problem)) {
			setScore((s) => s + 1);
			setProblem(generateProblem(settings));
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
						onChange={(e) => handleInput(e.target.value)}
					/>
				</div>
			)}
		</div>
	);
}

function ArithmeticGame() {
	const [phase, setPhase] = useState<Phase>("settings");
	const [settings, setSettings] = useState<GameSettings>(loadSettings);
	// Bumped on every new game so the game screen remounts with fresh state.
	const [gameId, setGameId] = useState(0);

	useEffect(() => {
		document.title = "Arithmetic Game";
	}, []);

	const startGame = (newSettings: GameSettings) => {
		setSettings(newSettings);
		saveSettings(newSettings);
		setGameId((id) => id + 1);
		setPhase("playing");
	};

	const handleFinish = useCallback(() => setPhase("finished"), []);

	return (
		<div className="arith-page">
			<div className="arith-container">
				{phase === "settings" ? (
					<SettingsScreen initial={settings} onStart={startGame} />
				) : (
					<GameScreen
						key={gameId}
						settings={settings}
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
