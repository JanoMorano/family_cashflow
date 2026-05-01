import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  autoCopyBudgetForFirstDay,
  formatBudgetMonth,
  previousBudgetMonth,
} from '../dist/month-copy.js';

test('formats current and previous budget months', () => {
  assert.equal(formatBudgetMonth(new Date('2026-05-01T08:00:00Z')), '2026-05');
  assert.equal(previousBudgetMonth('2026-05'), '2026-04');
  assert.equal(previousBudgetMonth('2026-01'), '2025-12');
});

test('copies previous month to current month only on the first day', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'family-cashflow-autocopy-'));
  fs.writeFileSync(path.join(dir, 'budget-2026-04.json'), JSON.stringify({ copied: true }));

  const skipped = autoCopyBudgetForFirstDay(dir, new Date('2026-05-02T08:00:00Z'));
  assert.deepEqual(skipped, { copied: false, reason: 'not-first-day', from: '2026-04', to: '2026-05' });
  assert.equal(fs.existsSync(path.join(dir, 'budget-2026-05.json')), false);

  const copied = autoCopyBudgetForFirstDay(dir, new Date('2026-05-01T08:00:00Z'));
  assert.deepEqual(copied, { copied: true, from: '2026-04', to: '2026-05' });
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dir, 'budget-2026-05.json'), 'utf8')), { copied: true });
});

test('does not overwrite an existing current month', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'family-cashflow-autocopy-'));
  fs.writeFileSync(path.join(dir, 'budget-2026-04.json'), JSON.stringify({ source: true }));
  fs.writeFileSync(path.join(dir, 'budget-2026-05.json'), JSON.stringify({ existing: true }));

  const result = autoCopyBudgetForFirstDay(dir, new Date('2026-05-01T08:00:00Z'));

  assert.deepEqual(result, { copied: false, reason: 'target-exists', from: '2026-04', to: '2026-05' });
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(dir, 'budget-2026-05.json'), 'utf8')), { existing: true });
});
