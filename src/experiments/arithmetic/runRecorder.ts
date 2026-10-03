import { GameSettings, Problem, generateProblem } from "./problems";
import { ProblemRecord, RunEnvironment, RunEventType, RunRecord, newRunId, saveRun } from "./runStore";

/** How long saves during a game are held back and merged, so solving a problem never waits on storage. */
const SAVE_DELAY_MS = 1000;

function captureEnvironment(): RunEnvironment {
	return {
		userAgent: navigator.userAgent,
		language: navigator.language,
		timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "unknown",
		screenWidth: window.screen.width,
		screenHeight: window.screen.height,
		viewportWidth: window.innerWidth,
		viewportHeight: window.innerHeight,
		devicePixelRatio: window.devicePixelRatio,
		coarsePointer: window.matchMedia?.("(pointer: coarse)").matches ?? false,
	};
}

/**
 * Records everything that happens during one game and persists it to IndexedDB.
 * Created when a game starts; the game screen reports problems, input and events to it.
 * Plain class (not React state) so StrictMode's double-invoked renders/effects can't record twice.
 */
export class RunRecorder {
	readonly run: RunRecord;
	/** performance.now() at the start, the origin for all `t`/`shownAt`/`solvedAt` offsets. */
	private readonly startPerf: number;
	private saveTimer: number | null = null;

	constructor(settings: GameSettings) {
		this.startPerf = performance.now();
		this.run = {
			schemaVersion: 1,
			id: newRunId(),
			status: "in-progress",
			startedAt: Date.now(),
			endedAt: null,
			settings,
			score: 0,
			problems: [],
			events: [],
			environment: captureEnvironment(),
		};
		this.nextProblem();
		this.persist();
	}

	/** Milliseconds since the run started, rounded to 0.1 ms. */
	now(): number {
		return Math.round((performance.now() - this.startPerf) * 10) / 10;
	}

	/** Wall-clock time at which the run ends (epoch ms). */
	get endsAt(): number {
		return this.run.startedAt + this.run.settings.durationSeconds * 1000;
	}

	get isActive(): boolean {
		return this.run.status === "in-progress";
	}

	get currentProblem(): Problem {
		return this.current;
	}

	private get current(): ProblemRecord {
		return this.run.problems[this.run.problems.length - 1];
	}

	private nextProblem(): Problem {
		const problem = generateProblem(this.run.settings);
		this.run.problems.push({
			index: this.run.problems.length,
			...problem,
			shownAt: this.now(),
			solvedAt: null,
			inputs: [],
			keys: [],
		});
		return problem;
	}

	recordInput(value: string, inputType: string) {
		if (!this.isActive) return;
		this.current.inputs.push({ t: this.now(), value, inputType });
	}

	recordKey(key: string, repeat: boolean) {
		if (!this.isActive) return;
		this.current.keys.push({ t: this.now(), key, repeat });
	}

	recordEvent(type: RunEventType) {
		if (!this.isActive) return;
		this.run.events.push({ t: this.now(), type });
		// The page may be closed while hidden; don't lose the batched-up progress.
		if (type === "visibility-hidden") this.persist();
	}

	/** Marks the current problem solved and returns the next one. */
	solveCurrent(): Problem {
		this.current.solvedAt = this.now();
		this.run.score += 1;
		const next = this.nextProblem();
		this.schedulePersist();
		return next;
	}

	/** Ends the run when the time is up. Safe to call more than once. */
	finish(): Promise<void> {
		if (!this.isActive) return Promise.resolve();
		this.run.status = "completed";
		this.run.endedAt = Date.now();
		return this.persist();
	}

	/**
	 * Saving clones the whole run, which grows with every keystroke; doing that inside the
	 * input handler delayed the next problem on slower phones. Batch it off the hot path instead.
	 */
	private schedulePersist() {
		if (this.saveTimer !== null) return;
		this.saveTimer = window.setTimeout(() => {
			this.saveTimer = null;
			this.persist();
		}, SAVE_DELAY_MS);
	}

	private persist(): Promise<void> {
		if (this.saveTimer !== null) {
			window.clearTimeout(this.saveTimer);
			this.saveTimer = null;
		}
		return saveRun(this.run).catch((error) => {
			// Recording is best effort; never interrupt the game because storage failed.
			console.error("Failed to save arithmetic run:", error);
		});
	}
}
