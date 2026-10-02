import type { GameSettings, Operation } from "./problems";

/** One change of the answer box's value, as reported by the browser's input event. */
export type InputRecord = {
	/** Milliseconds since the run started. */
	t: number;
	/** Value of the answer box after the change. */
	value: string;
	/** InputEvent.inputType, e.g. "insertText", "deleteContentBackward", "insertFromPaste". */
	inputType: string;
};

/** A keydown in the answer box, including keys that do not change the value (Enter, arrows, ...). */
export type KeyRecord = {
	t: number;
	key: string;
	repeat: boolean;
};

export type ProblemRecord = {
	index: number;
	operation: Operation;
	left: number;
	right: number;
	text: string;
	answer: number;
	/** Milliseconds since the run started at which the problem appeared. */
	shownAt: number;
	/** Milliseconds since the run started at which the correct answer was typed; null if never solved. */
	solvedAt: number | null;
	inputs: InputRecord[];
	keys: KeyRecord[];
};

export type RunEventType =
	| "visibility-hidden"
	| "visibility-visible"
	| "window-blur"
	| "window-focus"
	| "answer-blur"
	| "answer-focus";

export type RunEvent = { t: number; type: RunEventType };

export type RunEnvironment = {
	userAgent: string;
	language: string;
	timeZone: string;
	screenWidth: number;
	screenHeight: number;
	viewportWidth: number;
	viewportHeight: number;
	devicePixelRatio: number;
	coarsePointer: boolean;
};

export type RunStatus = "in-progress" | "completed" | "abandoned";

export type RunRecord = {
	schemaVersion: 1;
	id: string;
	status: RunStatus;
	/** Wall-clock start and end (epoch milliseconds). */
	startedAt: number;
	endedAt: number | null;
	settings: GameSettings;
	score: number;
	problems: ProblemRecord[];
	events: RunEvent[];
	environment: RunEnvironment;
};

const DB_NAME = "arithmetic-game";
const DB_VERSION = 1;
const RUNS = "runs";

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
	if (!dbPromise) {
		dbPromise = new Promise((resolve, reject) => {
			const request = indexedDB.open(DB_NAME, DB_VERSION);
			request.onupgradeneeded = () => {
				const store = request.result.createObjectStore(RUNS, { keyPath: "id" });
				store.createIndex("startedAt", "startedAt");
			};
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
		// Allow a retry on the next call if opening failed (e.g. storage blocked).
		dbPromise.catch(() => {
			dbPromise = null;
		});
	}
	return dbPromise;
}

function promisify<T>(request: IDBRequest<T>): Promise<T> {
	return new Promise((resolve, reject) => {
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

let persistRequested = false;

/** Asks the browser not to evict our storage under pressure. Best effort, asked once per page load. */
function requestPersistentStorage() {
	if (persistRequested) return;
	persistRequested = true;
	navigator.storage?.persist?.().catch(() => {});
}

export async function saveRun(run: RunRecord): Promise<void> {
	requestPersistentStorage();
	const db = await openDb();
	// structuredClone so later mutations by the recorder can't race with the write.
	await promisify(db.transaction(RUNS, "readwrite").objectStore(RUNS).put(structuredClone(run)));
}

/**
 * All saved runs, oldest first. Runs still marked in-progress whose time is up were left
 * mid-game (tab closed, navigated away); they are marked abandoned here.
 */
export async function loadRuns(): Promise<RunRecord[]> {
	const db = await openDb();
	const runs = await promisify<RunRecord[]>(db.transaction(RUNS).objectStore(RUNS).index("startedAt").getAll());
	const now = Date.now();
	const stale = runs.filter(
		(run) => run.status === "in-progress" && now > run.startedAt + run.settings.durationSeconds * 1000 + 5000,
	);
	for (const run of stale) {
		run.status = "abandoned";
		await saveRun(run);
	}
	return runs;
}

export function newRunId(): string {
	return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
