const MAX_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export type HumanTiming = { startedAt: number; completedAt?: number };

function validTimestamp(value: unknown, now: number): value is number {
	return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= now;
}

// Wall elapsed time includes breaks and background tabs; it is not active answering time.
export function restoreHumanTiming(
	value: unknown,
	completed: boolean,
	now = Date.now(),
): HumanTiming | undefined {
	if (!value || typeof value !== 'object' || !('startedAt' in value)) return;
	if (!validTimestamp(now, now) || !validTimestamp(value.startedAt, now)) return;
	if (completed) {
		if (!('completedAt' in value) || !validTimestamp(value.completedAt, now)) return;
		const durationMs = value.completedAt - value.startedAt;
		if (durationMs < 0 || durationMs > MAX_DURATION_MS) return;
		return { startedAt: value.startedAt, completedAt: value.completedAt };
	}
	if ('completedAt' in value || now - value.startedAt > MAX_DURATION_MS) return;
	return { startedAt: value.startedAt };
}

export function finishHumanTiming(
	timing: HumanTiming | undefined,
	now = Date.now(),
): HumanTiming | undefined {
	if (!timing) return;
	if (timing.completedAt !== undefined) return restoreHumanTiming(timing, true, now);
	const started = restoreHumanTiming(timing, false, now);
	return started ? { ...started, completedAt: now } : undefined;
}

export function humanDurationMs(timing: HumanTiming | undefined): number | undefined {
	const completed = restoreHumanTiming(timing, true);
	return completed?.completedAt === undefined
		? undefined
		: completed.completedAt - completed.startedAt;
}
