import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  VersionConflictError,
  readVersionedJSON,
  stableVersion,
  writeVersionedJSON,
} from '../dist/versioned-store.js';

test('creates stable versions for the same JSON payload', () => {
  assert.equal(
    stableVersion({ b: 2, a: { y: 1, x: 0 } }),
    stableVersion({ a: { x: 0, y: 1 }, b: 2 }),
  );
});

test('writes JSON only when expected version matches', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'family-cashflow-versioned-'));
  const file = path.join(dir, 'budget-2026-05.json');

  const first = writeVersionedJSON(file, { value: 1 }, '');
  assert.equal(readVersionedJSON(file)?.version, first.version);

  assert.throws(
    () => writeVersionedJSON(file, { value: 2 }, 'stale-version'),
    VersionConflictError,
  );
  assert.deepEqual(readVersionedJSON(file)?.data, { value: 1 });

  const second = writeVersionedJSON(file, { value: 2 }, first.version);
  assert.notEqual(second.version, first.version);
  assert.deepEqual(readVersionedJSON(file)?.data, { value: 2 });
});
