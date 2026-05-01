import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

function loadIndexLang() {
  const html = fs.readFileSync('public/index.html', 'utf8');
  const start = html.indexOf('const LANG = ');
  const end = html.indexOf('let currentLang=', start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  return new Function(`${html.slice(start, end)}; return LANG;`)();
}

function loadHistoryLang() {
  const html = fs.readFileSync('public/history.html', 'utf8');
  const start = html.indexOf('const HIST_LANG = ');
  const end = html.indexOf('let historyData=', start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  return new Function(`${html.slice(start, end)}; return HIST_LANG;`)();
}

function loadLoginLang() {
  const html = fs.readFileSync('public/login.html', 'utf8');
  const start = html.indexOf('const LOGIN_LANG = ');
  const end = html.indexOf('let currentLang=', start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  return new Function(`${html.slice(start, end)}; return LOGIN_LANG;`)();
}

function loadUtilityLang() {
  const source = fs.readFileSync('public/js/utility-i18n.js', 'utf8');
  const start = source.indexOf('const UTILITY_LANG = ');
  const end = source.indexOf('const LANG_CODES =', start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  return new Function(`${source.slice(start, end)}; return UTILITY_LANG;`)();
}

test('main app i18n contains the same keys for all five languages', () => {
  const lang = loadIndexLang();
  const expectedCodes = ['cs', 'en', 'sk', 'de', 'pl'];

  assert.deepEqual(Object.keys(lang), expectedCodes);
  const keys = Object.keys(lang.cs).sort();
  for (const code of expectedCodes) {
    assert.deepEqual(Object.keys(lang[code]).sort(), keys, `missing i18n keys for ${code}`);
  }
});

test('history page i18n contains the same keys for all five languages', () => {
  const lang = loadHistoryLang();
  const expectedCodes = ['cs', 'en', 'sk', 'de', 'pl'];
  const keys = Object.keys(lang.cs).sort();

  assert.deepEqual(Object.keys(lang), expectedCodes);
  for (const code of expectedCodes) {
    assert.deepEqual(Object.keys(lang[code]).sort(), keys, `missing history i18n keys for ${code}`);
  }
});

test('login page i18n contains the same keys for all five languages', () => {
  const lang = loadLoginLang();
  const expectedCodes = ['cs', 'en', 'sk', 'de', 'pl'];
  const keys = Object.keys(lang.cs).sort();

  assert.deepEqual(Object.keys(lang), expectedCodes);
  for (const code of expectedCodes) {
    assert.deepEqual(Object.keys(lang[code]).sort(), keys, `missing login i18n keys for ${code}`);
  }
});

test('utility pages i18n contains the same keys for all five languages', () => {
  const lang = loadUtilityLang();
  const expectedCodes = ['cs', 'en', 'sk', 'de', 'pl'];
  const keys = Object.keys(lang.cs).sort();

  assert.deepEqual(Object.keys(lang), expectedCodes);
  for (const code of expectedCodes) {
    assert.deepEqual(Object.keys(lang[code]).sort(), keys, `missing utility i18n keys for ${code}`);
  }
});

test('main app translates profile, history, month and safety controls', () => {
  const lang = loadIndexLang();
  const required = [
    'nav_energy',
    'nav_gas',
    'nav_history',
    'month_copy',
    'month_prev_title',
    'month_next_title',
    'delete_lock_label_locked',
    'delete_lock_label_unlocked',
    'profile_title',
    'profile_main_column',
    'profile_password_section',
    'profile_save_column',
    'profile_change_password',
    'profile_none',
    'freq_monthly',
    'freq_quarterly',
    'freq_yearly',
    'pot_name_ph',
    'tag_name_ph',
    'history_chart_title',
    'empty_saved_months',
  ];

  for (const [code, dictionary] of Object.entries(lang)) {
    for (const key of required) {
      assert.equal(typeof dictionary[key], 'string', `${code}.${key}`);
      assert.notEqual(dictionary[key].trim(), '', `${code}.${key}`);
    }
  }
});
