import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_GAS_READINGS, DEFAULT_GAS_TARIFF, getUtilityFiles, normalizeUtilityType } from '../dist/utility.js';

test('normalizes only supported utility types', () => {
  assert.equal(normalizeUtilityType('electricity'), 'electricity');
  assert.equal(normalizeUtilityType('gas'), 'gas');
  assert.equal(normalizeUtilityType('water'), null);
});

test('keeps legacy electricity filenames and gives gas its own files', () => {
  assert.deepEqual(getUtilityFiles('/data', 'electricity'), {
    readings: '/data/readings.json',
    tariff: '/data/tariff.json',
  });
  assert.deepEqual(getUtilityFiles('/data', 'gas'), {
    readings: '/data/gas-readings.json',
    tariff: '/data/gas-tariff.json',
  });
});

test('ships gas defaults from plyn.xlsx for a first run', () => {
  assert.equal(DEFAULT_GAS_READINGS.length, 23);
  assert.deepEqual(DEFAULT_GAS_READINGS[0], {
    id: '2024-05-16',
    date: '2024-05-16',
    vt: 118,
    nt: null,
    notes: 'Počáteční odečet z plyn.xlsx',
  });
  assert.deepEqual(DEFAULT_GAS_READINGS.at(-1), {
    id: '2026-03-05',
    date: '2026-03-05',
    vt: 1497,
    nt: null,
    notes: null,
  });
  assert.equal(DEFAULT_GAS_TARIFF.product, 'plyn Optimal 36');
  assert.equal(DEFAULT_GAS_TARIFF.conversionKwhPerM3, 10.69);
  assert.equal(DEFAULT_GAS_TARIFF.bands.find(band => band.label === 'topím nad 7 560 do 15 000').commodityKwhNoVat, 1.22);
});
