import type { Problem } from "./problems";

/**
 * A short worked shortcut for a problem, e.g. "12 × 83 = 830 + 166 = 996". Each operation picks the
 * strategy that suits its numbers (×12 as ×10 + ×2, ÷4 as halving twice, rounding up when the
 * units digit is 7–9, ...). Returns null when there is no shortcut worth showing (e.g. adding a
 * single digit) and for negative operands, which the strategies don't cover.
 */
export function shortcutHint(problem: Pick<Problem, "operation" | "left" | "right" | "answer">): string | null {
	const { operation, left, right, answer } = problem;
	if (left < 0 || right < 0 || answer < 0) return null;
	switch (operation) {
		case "mul":
			return multiplyHint(left, right);
		case "div":
			return divideHint(left, right, answer);
		case "add":
			return addHint(left, right);
		case "sub":
			return subtractHint(left, right);
	}
}

function multiplyHint(f: number, p: number): string | null {
	const answer = f * p;
	const head = `${f} × ${p}`;
	if (p < 13 || f === 0 || f === 1) return `${head} = ${answer} is a times-table fact: worth memorising.`;
	if (p === 100 || f === 10) return `Times 10 just appends a zero: ${head} = ${answer}.`;
	switch (f) {
		case 2:
			return `Double ${p}: ${head} = ${answer}.`;
		case 4:
			return `Double twice: ${p} → ${2 * p} → ${answer}.`;
		case 8:
			return `Double three times: ${p} → ${2 * p} → ${4 * p} → ${answer}.`;
		case 5:
			return `Times 10, then halve: ${p * 10} ÷ 2 = ${answer}.`;
		case 9:
			return `Times 10, minus once: ${p * 10} − ${p} = ${answer}.`;
		case 11: {
			const tens = Math.floor(p / 10);
			const units = p % 10;
			return `Times 10 plus once: ${p * 10} + ${p} = ${answer}. For two digits, put their sum (${tens} + ${units} = ${tens + units}) between them, carrying if it reaches 10.`;
		}
		case 12:
			return `Times 10 plus times 2: ${p * 10} + ${p * 2} = ${answer}.`;
	}
	return splitMultiplyHint(f, p);
}

/** Tens and units separately, or round the partner up when its units digit is 8 or 9. */
function splitMultiplyHint(f: number, p: number): string {
	const answer = f * p;
	const units = p % 10;
	if (units >= 8 && p < 100) {
		const up = p + (10 - units);
		return `Round up: ${f} × ${up} = ${f * up}, minus ${f} × ${10 - units} = ${f * (10 - units)}, gives ${answer}.`;
	}
	const tensPart = p - units;
	if (units === 0) return `${f} × ${tensPart / 10} = ${(f * tensPart) / 10}, then append the zero: ${answer}.`;
	const carryNote = f * units >= 10 ? ` Settle the carry from ${f * units} before typing the first digit.` : "";
	return `Split it: ${f} × ${tensPart} = ${f * tensPart}, plus ${f} × ${units} = ${f * units}, gives ${answer}.${carryNote}`;
}

/** `dividend ÷ divisor = quotient`, as shown in the game (multiplication in reverse). */
function divideHint(dividend: number, divisor: number, quotient: number): string | null {
	const head = `${dividend} ÷ ${divisor}`;
	if (divisor === 0) return null;
	if (quotient < 13) return `${head} = ${quotient}: the times-table fact ${divisor} × ${quotient} = ${dividend}.`;
	switch (divisor) {
		case 1:
			return null;
		case 2:
			return `Halve it: ${head} = ${quotient}.`;
		case 4:
			return `Halve twice: ${dividend} → ${dividend / 2} → ${quotient}.`;
		case 8:
			return `Halve three times: ${dividend} → ${dividend / 2} → ${dividend / 4} → ${quotient}.`;
		case 5:
			return `Double, then drop the zero: ${dividend * 2} ÷ 10 = ${quotient}.`;
		case 10:
			return `Drop the zero: ${head} = ${quotient}.`;
	}
	// Peel off the largest round multiple of the divisor, then the rest is a table fact.
	const units = quotient % 10;
	const tensPart = quotient - units;
	if (units === 0) return `${divisor} × ${tensPart / 10} = ${dividend / 10}, so ${head} = ${quotient}.`;
	return `Peel off a round chunk: ${divisor} × ${tensPart} = ${divisor * tensPart}, leaving ${dividend - divisor * tensPart} = ${divisor} × ${units}. So ${quotient}.`;
}

function addHint(a: number, b: number): string | null {
	const sum = a + b;
	if (a < 10 && b < 10) return null;
	// Add the smaller number to the bigger one; round it up first when it ends in 7–9.
	const [big, small] = a >= b ? [a, b] : [b, a];
	const units = small % 10;
	if (units >= 7 && small >= 10) {
		const up = small + (10 - units);
		return `Round up: ${big} + ${up} = ${big + up}, minus ${10 - units} = ${sum}.`;
	}
	const tensPart = small - units;
	if (units === 0 || tensPart === 0) return null;
	return `Tens first: ${big} + ${tensPart} = ${big + tensPart}, then + ${units} = ${sum}.`;
}

function subtractHint(m: number, s: number): string | null {
	const diff = m - s;
	if (m < 10) return null;
	const units = s % 10;
	if (units >= 7 && s >= 10) {
		const up = s + (10 - units);
		return `Round up: ${m} − ${up} = ${m - up}, plus ${10 - units} back = ${diff}.`;
	}
	if (diff < s && diff <= 30) {
		// Close numbers: counting up from the smaller one is quicker than borrowing.
		return `Count up from ${s}: to ${m} is ${diff}.`;
	}
	const tensPart = s - units;
	if (units === 0 || tensPart === 0) return null;
	return `Tens first: ${m} − ${tensPart} = ${m - tensPart}, then − ${units} = ${diff}.`;
}
