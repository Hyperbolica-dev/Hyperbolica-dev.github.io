import test from 'node:test';
import assert from 'node:assert/strict';
import { finishHumanTiming, humanDurationMs, restoreHumanTiming } from '../src/lib/llmq/session.ts';

const start = 1_000_000;
const week = 7 * 24 * 60 * 60 * 1000;

test('human timing survives reload and includes breaks before freezing at Finish', () => {
  const timing = { startedAt: start };
  const resumed = restoreHumanTiming(JSON.parse(JSON.stringify(timing)), false, start + 60_000);
  assert.deepEqual(resumed, timing);
  assert.equal(humanDurationMs(resumed), undefined);
  const finished = finishHumanTiming(resumed, start + 120_000);
  assert.equal(humanDurationMs(finished), 120_000);
  const reloaded = restoreHumanTiming(JSON.parse(JSON.stringify(finished)), true, start + week * 2);
  assert.deepEqual(reloaded, finished);
  assert.deepEqual(finishHumanTiming(reloaded, start + week * 2), finished);
  assert.equal(humanDurationMs(reloaded), 120_000);
});

test('zero and seven-day durations are valid, negative and overlong elapsed time are omitted', () => {
  for (const durationMs of [0, 1, week - 1, week]) {
    const finished = finishHumanTiming({ startedAt: start }, start + durationMs);
    assert.equal(humanDurationMs(finished), durationMs);
  }
  for (const completedAt of [start - 1, start + week + 1]) {
    assert.equal(finishHumanTiming({ startedAt: start }, completedAt), undefined);
    assert.equal(restoreHumanTiming({ startedAt: start, completedAt }, true, start + week + 1), undefined);
  }
});

test('old, unavailable and debug-autofilled timing never invents a duration', () => {
  for (const timing of [undefined, null, {}, { startedAt: start }]) {
    assert.equal(restoreHumanTiming(timing, true, start + 100), undefined);
    assert.equal(humanDurationMs(timing), undefined);
  }
  assert.equal(finishHumanTiming(undefined, start + 100), undefined);
  assert.equal(restoreHumanTiming({ startedAt: start, completedAt: start + 50 }, false, start + 100), undefined);
  const retake = { startedAt: start + 1000 };
  assert.equal(humanDurationMs(retake), undefined);
  assert.equal(humanDurationMs(finishHumanTiming(retake, start + 1010)), 10);
});

test('invalid timestamps, future clocks and expired unfinished sessions are omitted without coercion', () => {
  const now = start + week;
  for (const value of [-1, 1.5, NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER + 1, '1000000', null, true, now + 1]) {
    assert.equal(restoreHumanTiming({ startedAt: value }, false, now), undefined);
    assert.equal(restoreHumanTiming({ startedAt: start, completedAt: value }, true, now), undefined);
  }
  assert.equal(restoreHumanTiming({ startedAt: start }, false, now + 1), undefined);
  assert.equal(restoreHumanTiming({ startedAt: start }, false, NaN), undefined);
  assert.equal(finishHumanTiming({ startedAt: start }, start - 1), undefined);
});
