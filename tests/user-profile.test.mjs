import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {
  getColumnOwners,
  getPublicUserProfile,
  getUserProfile,
  setUserMainColumn,
  setUserPassword,
  verifyUserProfilePassword,
} from '../dist/user-profile.js';

function withTempDir(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'family-profile-'));
  try {
    return fn(dir);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

test('stores changed user password as a verifiable hash', () => withTempDir(dir => {
  const profile = setUserPassword(dir, 'jan', 'nove-heslo', new Date('2026-05-01T10:00:00Z'));
  const saved = getUserProfile(dir, 'jan');

  assert.equal(profile.username, 'jan');
  assert.equal(saved.passwordUpdatedAt, '2026-05-01T10:00:00.000Z');
  assert.notEqual(saved.passwordHash, 'nove-heslo');
  assert.equal(saved.passwordHash.length, 64);
  assert.equal(verifyUserProfilePassword(saved, 'nove-heslo'), true);
  assert.equal(verifyUserProfilePassword(saved, 'spatne'), false);
}));

test('keeps the selected main budget column private to each user', () => withTempDir(dir => {
  setUserMainColumn(dir, 'jan', 'k', new Date('2026-05-01T10:00:00Z'));
  setUserMainColumn(dir, 'jana', 'h', new Date('2026-05-01T11:00:00Z'));

  assert.deepEqual(getPublicUserProfile(dir, 'jan'), {
    username: 'jan',
    mainColumnId: 'k',
    updatedAt: '2026-05-01T10:00:00.000Z',
  });
  assert.deepEqual(getColumnOwners(dir, [
    { username: 'jana', displayName: 'Jana' },
    { username: 'jan', displayName: 'Jan Moravec' },
  ]), [
    { username: 'jan', displayName: 'Jan Moravec', mainColumnId: 'k' },
    { username: 'jana', displayName: 'Jana', mainColumnId: 'h' },
  ]);
}));
