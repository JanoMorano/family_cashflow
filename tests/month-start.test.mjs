import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveStartupMonth } from '../public/js/month-start.js';

test('opens a stale month URL in the current month on a fresh browser session', () => {
  const result = resolveStartupMonth({
    requestedMonth: '2098-11',
    currentMonth: '2026-05',
    sessionMonth: null,
  });

  assert.deepEqual(result, {
    month: '2026-05',
    shouldRedirect: true,
  });
});

test('keeps a manually selected month in the same browser session', () => {
  const result = resolveStartupMonth({
    requestedMonth: '2098-11',
    currentMonth: '2026-05',
    sessionMonth: '2098-11',
  });

  assert.deepEqual(result, {
    month: '2098-11',
    shouldRedirect: false,
  });
});

test('uses the current month when no month is requested', () => {
  const result = resolveStartupMonth({
    requestedMonth: null,
    currentMonth: '2026-05',
    sessionMonth: null,
  });

  assert.deepEqual(result, {
    month: '2026-05',
    shouldRedirect: false,
  });
});
