import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MemorySessionStore,
  buildSessionCookie,
  parseCookieHeader,
  parseUsersConfig,
  verifyUserPassword,
} from '../dist/auth.js';

test('parses configured users for local login', () => {
  const users = parseUsersConfig('jan:tajne:Jan Moravec,jana:heslo:Jana');

  assert.deepEqual(users.map(user => ({
    username: user.username,
    displayName: user.displayName,
  })), [
    { username: 'jan', displayName: 'Jan Moravec' },
    { username: 'jana', displayName: 'Jana' },
  ]);
});

test('ships admin and demo users as defaults for a clean install', () => {
  const users = parseUsersConfig();

  assert.deepEqual(users.map(user => ({
    username: user.username,
    password: user.password,
    displayName: user.displayName,
  })), [
    { username: 'admin', password: 'admin', displayName: 'Admin' },
    { username: 'demo', password: 'demo', displayName: 'Demo' },
  ]);
});

test('verifies configured user passwords without exposing password in result', () => {
  const users = parseUsersConfig('jan:tajne:Jan Moravec');

  assert.deepEqual(verifyUserPassword(users, 'jan', 'tajne'), {
    username: 'jan',
    displayName: 'Jan Moravec',
  });
  assert.equal(verifyUserPassword(users, 'jan', 'spatne'), null);
  assert.equal(verifyUserPassword(users, 'nobody', 'tajne'), null);
});

test('stores and clears login sessions', () => {
  const store = new MemorySessionStore();
  const sessionId = store.create({ username: 'jan', displayName: 'Jan' });

  assert.match(sessionId, /^[a-f0-9]{64}$/);
  assert.equal(store.get(sessionId)?.username, 'jan');
  assert.equal(store.activeUsers().length, 1);

  store.destroy(sessionId);
  assert.equal(store.get(sessionId), null);
  assert.deepEqual(store.activeUsers(), []);
});

test('parses and builds session cookies', () => {
  assert.deepEqual(parseCookieHeader('a=1; fc_session=abc%20123'), {
    a: '1',
    fc_session: 'abc 123',
  });

  assert.match(buildSessionCookie('abc123'), /fc_session=abc123/);
  assert.match(buildSessionCookie('abc123'), /HttpOnly/);
  assert.match(buildSessionCookie('abc123'), /SameSite=Lax/);
});
