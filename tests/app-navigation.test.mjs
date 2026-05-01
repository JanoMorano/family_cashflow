import assert from 'node:assert/strict';
import test from 'node:test';
import { buildAppUrl, goToApp } from '../public/js/app-nav.js';

test('builds same-tab app URLs for server mode without keeping month query', () => {
  assert.equal(
    buildAppUrl('http://127.0.0.1:39902/?month=2098-11', '/gas'),
    'http://127.0.0.1:39902/gas'
  );
  assert.equal(
    buildAppUrl('http://127.0.0.1:39902/energy?month=2098-11', '/'),
    'http://127.0.0.1:39902/'
  );
});

test('builds sibling HTML URLs for standalone file mode', () => {
  assert.equal(
    buildAppUrl('file:///tmp/family/index.html', '/energy'),
    'file:///tmp/family/energy.html'
  );
  assert.equal(
    buildAppUrl('file:///tmp/family/gas.html', '/'),
    'file:///tmp/family/index.html'
  );
});

test('goToApp navigates the current browser window by default', () => {
  const originalLocation = globalThis.location;
  globalThis.location = { href: 'http://127.0.0.1:39902/?month=2026-05' };

  try {
    goToApp('/history');

    assert.equal(globalThis.location.href, 'http://127.0.0.1:39902/history');
  } finally {
    if (originalLocation === undefined) {
      delete globalThis.location;
    } else {
      globalThis.location = originalLocation;
    }
  }
});
