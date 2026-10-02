export type NumberRange = { min: number; max: number };

export type Operation = "add" | "sub" | "mul" | "div";

export type GameSettings = {
	operations: Record<Operation, boolean>;
	addLeft: NumberRange;
	addRight: NumberRange;
	mulLeft: NumberRange;
	mulRight: NumberRange;
	durationSeconds: number;
};

export type Problem = {
	operation: Operation;
	/** Operands as displayed, i.e. `${left} <op> ${right}`. */
	left: number;
	right: number;
	text: string;
	answer: number;
};

export const DURATION_OPTIONS = [30, 60, 120, 300, 600];

export const DEFAULT_SETTINGS: GameSettings = {
	operations: { add: true, sub: true, mul: true, div: true },
	addLeft: { min: 2, max: 100 },
	addRight: { min: 2, max: 100 },
	mulLeft: { min: 2, max: 12 },
	mulRight: { min: 2, max: 100 },
	durationSeconds: 120,
};

const OPERATIONS: Operation[] = ["add", "sub", "mul", "div"];

const randomInt = (range: NumberRange, rng: () => number) =>
	range.min + Math.floor(rng() * (range.max - range.min + 1));

/** Returns a list of human-readable problems with the settings; empty if they are usable. */
export function validateSettings(settings: GameSettings): string[] {
	const errors: string[] = [];
	const { operations } = settings;

	if (!OPERATIONS.some((op) => operations[op])) {
		errors.push("Select at least one operation.");
	}

	const checkRange = (label: string, range: NumberRange) => {
		if (!Number.isInteger(range.min) || !Number.isInteger(range.max)) {
			errors.push(`${label}: both bounds must be whole numbers.`);
		} else if (range.min > range.max) {
			errors.push(`${label}: the lower bound must not exceed the upper bound.`);
		}
	};

	if (operations.add || operations.sub) {
		checkRange("Addition, left range", settings.addLeft);
		checkRange("Addition, right range", settings.addRight);
	}
	if (operations.mul || operations.div) {
		checkRange("Multiplication, left range", settings.mulLeft);
		checkRange("Multiplication, right range", settings.mulRight);
	}
	if (operations.div && settings.mulLeft.min === 0 && settings.mulLeft.max === 0) {
		errors.push("Division needs a left multiplication range that contains a non-zero number.");
	}

	return errors;
}

/** Returns null when the draw is unusable (a zero divisor); the caller then redraws from scratch. */
function generateOne(settings: GameSettings, rng: () => number): Problem | null {
	const enabled = OPERATIONS.filter((op) => settings.operations[op]);
	const operation = enabled[Math.floor(rng() * enabled.length)];

	switch (operation) {
		case "add": {
			const a = randomInt(settings.addLeft, rng);
			const b = randomInt(settings.addRight, rng);
			return { operation, left: a, right: b, text: `${a} + ${b}`, answer: a + b };
		}
		case "sub": {
			// Addition in reverse: (a + b) – a = b
			const a = randomInt(settings.addLeft, rng);
			const b = randomInt(settings.addRight, rng);
			return { operation, left: a + b, right: a, text: `${a + b} – ${a}`, answer: b };
		}
		case "mul": {
			const a = randomInt(settings.mulLeft, rng);
			const b = randomInt(settings.mulRight, rng);
			return { operation, left: a, right: b, text: `${a} × ${b}`, answer: a * b };
		}
		case "div": {
			// Multiplication in reverse: (a × b) ÷ a = b
			const a = randomInt(settings.mulLeft, rng);
			const b = randomInt(settings.mulRight, rng);
			return a === 0 ? null : { operation, left: a * b, right: a, text: `${a * b} ÷ ${a}`, answer: b };
		}
	}
}

/**
 * Generates a random problem: picks one of the enabled operations uniformly, then its operands.
 * Repeats of the previous problem are allowed. A zero divisor discards the whole draw, including
 * the choice of operation. validateSettings guarantees a usable draw exists, so this terminates.
 */
export function generateProblem(settings: GameSettings, rng: () => number = Math.random): Problem {
	let problem = generateOne(settings, rng);
	while (problem === null) problem = generateOne(settings, rng);
	return problem;
}

/** True if the typed input, ignoring surrounding whitespace, is exactly the answer as written (so "07" ≠ 7). */
export function isCorrectAnswer(input: string, problem: Problem): boolean {
	return input.trim() === String(problem.answer);
}
