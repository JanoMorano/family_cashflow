import assert from 'node:assert/strict';
import test from 'node:test';
import pricing from '../public/js/gas-pricing.js';

const {
  INNOGY_GAS_TARIFF_2026,
  annualKwhFromReadings,
  calculateGasCost,
  computeGasPrices,
  normalizeGasTariff,
  selectGasBand,
} = pricing;

test('selects the Innogy 2026 band from annualized plyn.xlsx consumption', () => {
  const annualKwh = annualKwhFromReadings([
    { date: '2024-05-16', vt: 118 },
    { date: '2026-03-05', vt: 1497 },
  ], INNOGY_GAS_TARIFF_2026.conversionKwhPerM3);
  const band = selectGasBand(annualKwh, INNOGY_GAS_TARIFF_2026.bands);

  assert.equal(Math.round(annualKwh), 8177);
  assert.equal(band.label, 'topím nad 7 560 do 15 000');
});

test('computes gas price from Innogy PDF rates instead of spreadsheet shortcut', () => {
  const prices = computeGasPrices(INNOGY_GAS_TARIFF_2026, 8177);

  assert.equal(prices.conversionKwhPerM3, 10.69);
  assert.equal(prices.unitKwhWithVat, 1.92774);
  assert.equal(prices.monthlyFeeWithVat, 385.57);
  assert.equal(Number(prices.priceM3WithVat.toFixed(2)), 20.61);
});

test('prorates Innogy fixed monthly fees when estimating period cost', () => {
  const cost = calculateGasCost(42, 31, INNOGY_GAS_TARIFF_2026, 8177);

  assert.equal(Number(cost.toFixed(2)), 1258.18);
});

test('migrates the older spreadsheet shortcut tariff to Innogy PDF defaults', () => {
  const tariff = normalizeGasTariff({
    supplier: 'INNOGY',
    priceKWh: 1.89,
    kwhPerM3: 10.92,
    monthlyFee: 303,
    vatRate: 0.21,
  });
  const prices = computeGasPrices(tariff, 8177);

  assert.equal(tariff.conversionKwhPerM3, 10.69);
  assert.equal(prices.unitKwhWithVat, 1.92774);
});
