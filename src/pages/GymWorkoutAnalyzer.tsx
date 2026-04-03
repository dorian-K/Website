import React, { ChangeEvent, DragEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./GymWorkoutAnalyzer.scss";

type WorkoutSet = {
	setNumber: number;
	weightKg: number | null;
	reps: number | null;
	rawWeight: string | null;
};

type Exercise = {
	index: number;
	name: string;
	equipment: string | null;
	targetReps: number | null;
	notes: string[];
	sets: WorkoutSet[];
};

type Workout = {
	title: string;
	date: Date | null;
	dateLabel: string;
	durationMinutes: number | null;
	exercises: Exercise[];
};

type ParserWarning = {
	type: "info" | "warning";
	message: string;
	line: string;
	workoutTitle?: string;
	exerciseName?: string;
	header?: string[];
	reason?: string;
};

type ParsedData = {
	workouts: Workout[];
	warnings: ParserWarning[];
	skippedPlaceholderSets: number;
};

type ExerciseAggregate = {
	name: string;
	sets: number;
	reps: number;
	volume: number;
	maxWeight: number;
	bestEstimatedOneRm: number;
	appearances: number;
	latest?: {
		dateLabel: string;
		volume: number;
		bestEstimatedOneRm: number;
	};
};

type ExerciseProgressPoint = {
	label: string;
	value: number;
	dateMs: number;
	dateLabel: string;
	workoutTitle: string;
};

const formatNumber = (value: number, digits = 0) =>
	new Intl.NumberFormat("en-US", {
		maximumFractionDigits: digits,
		minimumFractionDigits: digits,
	}).format(value);

const formatMinutes = (value: number | null) => {
	if (value === null || Number.isNaN(value)) {
		return "–";
	}
	const hours = Math.floor(value / 60);
	const minutes = value % 60;
	return hours > 0 ? `${hours}h ${minutes}m` : `${minutes} min`;
};

const formatDate = (value: Date | null, fallback: string) => {
	if (!value) {
		return fallback;
	}
	return new Intl.DateTimeFormat("en-GB", {
		year: "numeric",
		month: "short",
		day: "2-digit",
	}).format(value);
};

const parseDate = (input: string): Date | null => {
	const match = input.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2}):(\d{2})\s*(am|pm)$/i);
	if (!match) {
		return null;
	}
	const [, year, month, day, hourValue, minute, meridiem] = match;
	let hour = Number(hourValue);
	if (meridiem.toLowerCase() === "pm" && hour < 12) hour += 12;
	if (meridiem.toLowerCase() === "am" && hour === 12) hour = 0;
	return new Date(Number(year), Number(month) - 1, Number(day), hour, Number(minute));
};

const parseDurationMinutes = (input: string): number | null => {
	const match = input.match(/(\d+)\s*min/i);
	return match ? Number(match[1]) : null;
};

const stripWrappingQuotes = (value: string) => {
	const trimmed = value.trim();
	if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
		return trimmed.slice(1, -1);
	}
	return trimmed;
};

const parseHeaderLine = (line: string): { title: string; dateLabel: string; durationLabel: string } | null => {
	const matches = [...line.matchAll(/"([^"]*)"/g)].map((match) => match[1]);
	if (matches.length >= 3) {
		return { title: matches[0], dateLabel: matches[1], durationLabel: matches[2] };
	}
	return null;
};

const parseExerciseLine = (line: string): Omit<Exercise, "sets"> | null => {
	const content = stripWrappingQuotes(line);
	const match = content.match(/^(\d+)\.\s*(.+)$/);
	if (!match) return null;
	const [, indexValue, remainder] = match;
	const parts = remainder.split("·").map((part) => part.trim()).filter(Boolean);
	const name = parts[0] ?? remainder.trim();
	const equipment = parts.length > 1 ? parts[1] : null;
	const targetRepsPart = parts.find((part) => /(\d+)\s*reps/i.test(part)) ?? null;
	const targetRepsMatch = targetRepsPart?.match(/(\d+)\s*reps/i) ?? null;
	const notes = parts.slice(2).filter((part) => !/(\d+)\s*reps/i.test(part));
	return {
		index: Number(indexValue),
		name,
		equipment,
		targetReps: targetRepsMatch ? Number(targetRepsMatch[1]) : null,
		notes,
	};
};

const isPlaceholderValue = (value: string | undefined) => {
	if (value === undefined) return true;
	const normalized = stripWrappingQuotes(value).trim();
	return normalized === "" || normalized === "-" || normalized === "–";
};

const parseSetLine = (
	line: string,
	header: string[],
): { kind: "parsed"; set: WorkoutSet } | { kind: "placeholder"; reason: string } | { kind: "invalid"; reason: string } => {
	const parts = line.split(";").map((part) => stripWrappingQuotes(part));
	if (parts.length < 2) return { kind: "invalid", reason: "Too few columns" };
	const setNumber = Number(parts[0]);
	if (!Number.isFinite(setNumber)) return { kind: "invalid", reason: "Invalid set number" };

	const repsIndex = header.indexOf("REPS");
	const kgIndex = header.indexOf("KG");
	const repsRaw = repsIndex >= 0 ? parts[repsIndex] : parts[parts.length - 1];

	const rawWeight = kgIndex >= 0 ? parts[kgIndex] ?? null : null;
	if (isPlaceholderValue(repsRaw) && (kgIndex < 0 || isPlaceholderValue(rawWeight ?? undefined))) {
		return { kind: "placeholder", reason: "Placeholder row with no reps/weight" };
	}

	const repsSanitized = (repsRaw ?? "").replace(/[^\d.-]/g, "");
	const reps = repsSanitized === "" ? null : Number(repsSanitized);
	if (reps === null || !Number.isFinite(reps)) return { kind: "invalid", reason: "Invalid reps value" };

	const sanitizedWeight = rawWeight ? rawWeight.replace(",", ".").replace(/[^\d+\-.]/g, "") : "";
	const weightKg = kgIndex >= 0 && sanitizedWeight !== "" ? Number(sanitizedWeight) : null;

	return {
		kind: "parsed",
		set: {
			setNumber,
			weightKg: Number.isFinite(weightKg as number) ? (weightKg as number) : null,
			reps,
			rawWeight,
		},
	};
};

const estimateOneRm = (weightKg: number | null, reps: number | null) => {
	if (weightKg === null || reps === null || weightKg <= 0 || reps <= 0) return 0;
	return weightKg * (1 + reps / 30);
};

const parseWorkoutCsv = (text: string): ParsedData => {
	const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/);
	const workouts: Workout[] = [];
	const warnings: ParserWarning[] = [];
	let skippedPlaceholderSets = 0;
	let currentWorkout: Workout | null = null;
	let currentExercise: Exercise | null = null;
	let activeHeader: string[] | null = null;

	const finalizeExercise = () => {
		if (currentWorkout && currentExercise) {
			currentWorkout.exercises.push(currentExercise);
		}
		currentExercise = null;
		activeHeader = null;
	};

	const finalizeWorkout = () => {
		finalizeExercise();
		if (currentWorkout) {
			workouts.push(currentWorkout);
		}
		currentWorkout = null;
	};

	for (const rawLine of lines) {
		const line = rawLine.trim();
		if (!line) continue;

		const header = parseHeaderLine(line);
		if (header) {
			finalizeWorkout();
			currentWorkout = {
				title: header.title,
				date: parseDate(header.dateLabel),
				dateLabel: header.dateLabel,
				durationMinutes: parseDurationMinutes(header.durationLabel),
				exercises: [],
			};
			continue;
		}

		const exercise = parseExerciseLine(line);
		if (exercise) {
			if (!currentWorkout) {
				warnings.push({
					type: "warning",
					message: `Ignored exercise outside a workout block: ${exercise.name}`,
					line,
					reason: "No active workout",
				});
				continue;
			}
			finalizeExercise();
			currentExercise = { ...exercise, sets: [] };
			continue;
		}

		if (line.startsWith("#;")) {
			activeHeader = line.split(";").map((part) => stripWrappingQuotes(part).toUpperCase());
			continue;
		}

		if (currentExercise && activeHeader) {
			const parsedSet = parseSetLine(line, activeHeader);
			if (parsedSet.kind === "parsed") {
				currentExercise.sets.push(parsedSet.set);
			} else if (parsedSet.kind === "placeholder") {
				skippedPlaceholderSets += 1;
				warnings.push({
					type: "info",
					message: "Skipped placeholder set row",
					line,
					workoutTitle: currentWorkout?.title,
					exerciseName: currentExercise.name,
					header: activeHeader,
					reason: parsedSet.reason,
				});
			} else {
				warnings.push({
					type: "warning",
					message: "Could not parse set line",
					line,
					workoutTitle: currentWorkout?.title,
					exerciseName: currentExercise.name,
					header: activeHeader,
					reason: parsedSet.reason,
				});
			}
		}
	}

	finalizeWorkout();

	workouts.sort((a, b) => {
		const aTime = a.date?.getTime() ?? 0;
		const bTime = b.date?.getTime() ?? 0;
		return aTime - bTime;
	});

	return { workouts, warnings, skippedPlaceholderSets };
};

function LineChart(props: { data: ExerciseProgressPoint[]; title: string; unit: string }) {
	const { data, title, unit } = props;
	if (data.length === 0) {
		return <div className="gym-empty-state">No chart data available yet.</div>;
	}

	const width = 760;
	const height = 260;
	const paddingX = 42;
	const paddingY = 24;
	const maxValue = Math.max(...data.map((item) => item.value), 1);
	const stepX = data.length === 1 ? 0 : (width - paddingX * 2) / (data.length - 1);
	const points = data.map((item, index) => {
		const x = paddingX + index * stepX;
		const y = height - paddingY - (item.value / maxValue) * (height - paddingY * 2);
		return { ...item, x, y };
	});
	const path = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");

	return (
		<div>
			<h3 className="gym-panel-title">{title}</h3>
			<div className="gym-chart gym-chart-minimal">
				<svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
					<line className="gym-chart-axis" x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} />
					<line className="gym-chart-axis" x1={paddingX} y1={paddingY} x2={paddingX} y2={height - paddingY} />
					<path className="gym-chart-line" d={path} />
					{points.map((point, index) => (
						<g key={`${point.workoutTitle}-${point.dateMs}-${index}`}>
							<circle className="gym-chart-point" cx={point.x} cy={point.y} r="4" />
							{index % Math.max(1, Math.ceil(points.length / 6)) === 0 || index === points.length - 1 ? (
								<text className="gym-chart-label" x={point.x} y={height - 8} textAnchor="middle">
									{point.label}
								</text>
							) : null}
							<title>{`${point.dateLabel} · ${formatNumber(point.value, 1)} ${unit} · ${point.workoutTitle}`}</title>
						</g>
					))}
					<text className="gym-chart-label" x={paddingX} y={14}>{`${formatNumber(maxValue, 1)} ${unit}`}</text>
				</svg>
			</div>
		</div>
	);
}

function GymWorkoutAnalyzer() {
	const fileInputRef = useRef<HTMLInputElement | null>(null);
	const [isDragging, setIsDragging] = useState(false);
	const [fileName, setFileName] = useState<string>("");
	const [rawCsv, setRawCsv] = useState<string>("");
	const [parseError, setParseError] = useState<string>("");
	const [selectedExercise, setSelectedExercise] = useState<string>("");
	const [progressMetric, setProgressMetric] = useState<"maxWeight" | "estimatedOneRm">("maxWeight");

	const parsed = useMemo(() => {
		if (!rawCsv) {
			return null;
		}
		try {
			return parseWorkoutCsv(rawCsv);
		} catch (error) {
			setParseError(error instanceof Error ? error.message : "Could not parse CSV file.");
			return null;
		}
	}, [rawCsv]);

	useEffect(() => {
		if (!parsed) return;
		const significantWarnings = parsed.warnings.filter((warning) => warning.type === "warning");
		if (parsed.skippedPlaceholderSets > 0 || significantWarnings.length > 0) {
			console.groupCollapsed("[GymWorkoutAnalyzer] CSV parse diagnostics");
			if (parsed.skippedPlaceholderSets > 0) {
				console.info("Skipped placeholder set rows:", parsed.skippedPlaceholderSets);
			}
			if (parsed.warnings.length > 0) {
				console.table(parsed.warnings.map((warning) => ({
					type: warning.type,
					message: warning.message,
					reason: warning.reason ?? "",
					workout: warning.workoutTitle ?? "",
					exercise: warning.exerciseName ?? "",
					line: warning.line,
					header: warning.header?.join(";") ?? "",
				})));
			}
			console.groupEnd();
		}
	}, [parsed]);

	const metrics = useMemo(() => {
		if (!parsed) return null;

		const workouts = parsed.workouts;
		const totalExercises = workouts.reduce((sum, workout) => sum + workout.exercises.length, 0);
		const allSets = workouts.flatMap((workout) => workout.exercises.flatMap((exercise) => exercise.sets));
		const validSets = allSets.filter((set) => set.reps !== null);
		const totalSets = validSets.length;
		const totalReps = validSets.reduce((sum, set) => sum + (set.reps ?? 0), 0);
		const totalVolume = validSets.reduce((sum, set) => sum + (set.weightKg ?? 0) * (set.reps ?? 0), 0);
		const averageDuration = workouts.length > 0
			? workouts.reduce((sum, workout) => sum + (workout.durationMinutes ?? 0), 0) / workouts.length
			: 0;

		const aggregates = new Map<string, ExerciseAggregate>();
		for (const workout of workouts) {
			for (const exercise of workout.exercises) {
				const volume = exercise.sets.reduce((sum, set) => sum + (set.weightKg ?? 0) * (set.reps ?? 0), 0);
				const reps = exercise.sets.reduce((sum, set) => sum + (set.reps ?? 0), 0);
				const maxWeight = Math.max(0, ...exercise.sets.map((set) => set.weightKg ?? 0));
				const bestEstimatedOneRm = Math.max(0, ...exercise.sets.map((set) => estimateOneRm(set.weightKg, set.reps)));

				const existing = aggregates.get(exercise.name) ?? {
					name: exercise.name,
					sets: 0,
					reps: 0,
					volume: 0,
					maxWeight: 0,
					bestEstimatedOneRm: 0,
					appearances: 0,
				};

				existing.sets += exercise.sets.filter((set) => set.reps !== null).length;
				existing.reps += reps;
				existing.volume += volume;
				existing.maxWeight = Math.max(existing.maxWeight, maxWeight);
				existing.bestEstimatedOneRm = Math.max(existing.bestEstimatedOneRm, bestEstimatedOneRm);
				existing.appearances += 1;
				existing.latest = {
					dateLabel: formatDate(workout.date, workout.dateLabel),
					volume,
					bestEstimatedOneRm,
				};
				aggregates.set(exercise.name, existing);
			}
		}

		const exerciseRows = [...aggregates.values()].sort((a, b) => b.volume - a.volume);
		const exerciseNames = [...aggregates.keys()].sort((a, b) => a.localeCompare(b));

		return {
			totalExercises,
			totalSets,
			totalReps,
			totalVolume,
			averageDuration,
			exerciseRows,
			exerciseNames,
			latestWorkout: workouts[workouts.length - 1] ?? null,
			significantWarningCount: parsed.warnings.filter((warning) => warning.type === "warning").length,
			placeholderCount: parsed.skippedPlaceholderSets,
		};
	}, [parsed]);

	useEffect(() => {
		if (!metrics) return;
		if (!selectedExercise || !metrics.exerciseNames.includes(selectedExercise)) {
			setSelectedExercise(metrics.exerciseNames[0] ?? "");
		}
	}, [metrics, selectedExercise]);

	const exerciseProgressSeries = useMemo(() => {
		if (!parsed || !selectedExercise) return [] as ExerciseProgressPoint[];

		return parsed.workouts.flatMap((workout) => {
			const matches = workout.exercises.filter((exercise) => exercise.name === selectedExercise);
			if (matches.length === 0) return [];

			const maxWeight = Math.max(0, ...matches.flatMap((exercise) => exercise.sets.map((set) => set.weightKg ?? 0)));
			const maxEstimatedOneRm = Math.max(0, ...matches.flatMap((exercise) => exercise.sets.map((set) => estimateOneRm(set.weightKg, set.reps))));
			const value = progressMetric === "maxWeight" ? maxWeight : maxEstimatedOneRm;
			if (value <= 0) return [];

			return [{
				label: workout.date ? `${workout.date.getMonth() + 1}/${String(workout.date.getFullYear()).slice(-2)}` : workout.title.slice(0, 8),
				value,
				dateMs: workout.date?.getTime() ?? 0,
				dateLabel: formatDate(workout.date, workout.dateLabel),
				workoutTitle: workout.title,
			}];
		}).sort((a, b) => a.dateMs - b.dateMs);
	}, [parsed, progressMetric, selectedExercise]);

	const handleFile = (file: File | null) => {
		if (!file) return;
		setParseError("");
		setFileName(file.name);
		const reader = new FileReader();
		reader.onload = () => {
			const content = typeof reader.result === "string" ? reader.result : "";
			setRawCsv(content);
		};
		reader.onerror = () => {
			setParseError("Could not read the selected file.");
		};
		reader.readAsText(file);
	};

	const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
		handleFile(event.target.files?.[0] ?? null);
	};

	const onDrop = (event: DragEvent<HTMLLabelElement>) => {
		event.preventDefault();
		setIsDragging(false);
		handleFile(event.dataTransfer.files?.[0] ?? null);
	};

	return (
		<div className="gym-analyzer-page text-white">
			<div className="container">
				<header className="gym-toolbar">
					<div>
						<h1 className="gym-page-title">Gym workout analysis</h1>
						<p className="gym-analyzer-muted mb-0">Local CSV parsing, progression tracking, and workout summaries.</p>
					</div>
					<Link className="gym-back-link" to="/">Back</Link>
				</header>

				<section className="gym-panel gym-upload-panel">
						<label
							className={`gym-dropzone ${isDragging ? "drag-active" : ""}`}
							onDragOver={(event) => {
								event.preventDefault();
								setIsDragging(true);
							}}
							onDragLeave={() => setIsDragging(false)}
							onDrop={onDrop}
						>
							<input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={onFileChange} />
							<div className="gym-upload-copy">
								<div>
									<div className="gym-upload-title">Drop CSV or choose file</div>
									<div className="gym-analyzer-muted">Everything stays in the browser. Nothing is uploaded.</div>
								</div>
								<button type="button" className="btn btn-outline-light" onClick={() => fileInputRef.current?.click()}>
									Select file
								</button>
							</div>
							{fileName ? <div className="gym-file-meta">Loaded: {fileName}</div> : null}
						</label>

						{parseError ? <div className="gym-inline-note gym-inline-note-error">{parseError}</div> : null}
						{metrics && parsed ? (
							<div className="gym-inline-note">
								Parsed {formatNumber(metrics.totalSets)} sets across {formatNumber(parsed.workouts.length)} workouts.
								{metrics.placeholderCount > 0 ? ` Ignored ${metrics.placeholderCount} placeholder rows.` : ""}
								{metrics.significantWarningCount > 0 ? ` ${metrics.significantWarningCount} parse issues logged to the console.` : ""}
							</div>
						) : null}
				</section>

				{parsed && metrics ? (
					<div className="gym-layout">
						<section className="gym-panel">
							<div className="gym-stats-grid">
							{[
								{ label: "Workouts", value: parsed.workouts.length },
								{ label: "Exercises", value: metrics.totalExercises },
								{ label: "Sets", value: metrics.totalSets },
								{ label: "Reps", value: metrics.totalReps },
								{ label: "Volume", value: `${formatNumber(metrics.totalVolume)} kg` },
								{ label: "Avg duration", value: formatMinutes(Math.round(metrics.averageDuration)) },
							].map((item) => (
								<div className="gym-stat" key={item.label}>
									<div className="gym-stat-value">{item.value}</div>
									<div className="gym-stat-label">{item.label}</div>
								</div>
							))}
							</div>
						</section>

						<section className="gym-panel">
							<div className="gym-panel-header">
								<div>
									<h2 className="gym-panel-title">Exercise progression</h2>
									<p className="gym-analyzer-muted mb-0">Track your strongest set over time for a selected exercise.</p>
								</div>
								<div className="gym-controls">
									<select className="form-select" value={selectedExercise} onChange={(e) => setSelectedExercise(e.target.value)}>
										{metrics.exerciseNames.map((name) => <option key={name} value={name}>{name}</option>)}
									</select>
									<select className="form-select" value={progressMetric} onChange={(e) => setProgressMetric(e.target.value as "maxWeight" | "estimatedOneRm")}>
										<option value="maxWeight">Max weight</option>
										<option value="estimatedOneRm">Estimated 1RM</option>
									</select>
								</div>
							</div>
							<LineChart
								data={exerciseProgressSeries}
								title={selectedExercise || "Exercise progression"}
								unit={progressMetric === "maxWeight" ? "kg" : "kg est. 1RM"}
							/>
						</section>

						<div className="gym-two-column">
							<section className="gym-panel">
								<h2 className="gym-panel-title">Top exercises by volume</h2>
										<div className="gym-table-wrap">
											<table className="gym-table">
												<thead>
													<tr>
														<th>Exercise</th>
														<th>Volume</th>
														<th>Max weight</th>
														<th>Est. 1RM</th>
													</tr>
												</thead>
												<tbody>
													{metrics.exerciseRows.slice(0, 12).map((row) => (
														<tr key={row.name}>
															<td>{row.name}</td>
															<td>{formatNumber(row.volume)} kg</td>
															<td>{formatNumber(row.maxWeight, 1)} kg</td>
															<td>{formatNumber(row.bestEstimatedOneRm, 1)} kg</td>
														</tr>
													))}
												</tbody>
											</table>
										</div>
							</section>

							<section className="gym-panel">
								<h2 className="gym-panel-title">Latest workout</h2>
										{metrics.latestWorkout ? (
											<div>
												<div className="gym-workout-headline">{metrics.latestWorkout.title}</div>
												<div className="gym-analyzer-muted mb-3">
													{formatDate(metrics.latestWorkout.date, metrics.latestWorkout.dateLabel)} · {formatMinutes(metrics.latestWorkout.durationMinutes)}
												</div>
												<div className="gym-latest-list">
													{metrics.latestWorkout.exercises.map((exercise) => (
														<div key={`${metrics.latestWorkout?.title}-${exercise.index}`} className="gym-latest-item">
															<div className="gym-latest-item-title">{exercise.name}</div>
															<div className="gym-table-muted">
																{exercise.sets.filter((set) => set.reps !== null).map((set) => `${set.weightKg ?? "BW"}×${set.reps}`).join(" · ")}
															</div>
														</div>
													))}
													</div>
											</div>
										) : (
											<div className="gym-empty-state">No workout snapshot available.</div>
										)}
							</section>
						</div>
					</div>
				) : (
					<section className="gym-panel gym-empty-state">
						<h2 className="gym-panel-title">Upload a workout export</h2>
						<p className="mb-2">Use a local CSV export to inspect exercise progression, max loads, estimated 1RM, and overall workload history.</p>
						<p className="gym-analyzer-muted mb-0">Placeholder rows are ignored automatically, and parse diagnostics are written to the browser console for debugging.</p>
					</section>
				)}
			</div>
		</div>
	);
}

export default GymWorkoutAnalyzer;