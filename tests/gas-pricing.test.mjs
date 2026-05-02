import assert from 'node:assert/strict';
import fs from 'node:fs';
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

test('computes gas prices from manually entered tariff line items', () => {
  const tariff = normalizeGasTariff({
    supplier: 'INNOGY',
    product: 'manual gas tariff',
    conversionKwhPerM3: 10,
    vatRate: 0.21,
    commodityKwhNoVat: 2,
    distributionKwhNoVat: 0.5,
    oteKwhNoVat: 0.01,
    supplierMonthlyNoVat: 50,
    capacityMonthlyNoVat: 70,
    capacityAnnualNoVat: 120,
  });
  const prices = computeGasPrices(tariff, 5000);
  const cost = calculateGasCost(10, 30.44, tariff, 5000);

  assert.equal(prices.unitKwhNoVat, 2.51);
  assert.equal(prices.unitKwhWithVat, 3.0371);
  assert.equal(prices.monthlyFeeNoVat, 130);
  assert.equal(prices.monthlyFeeWithVat, 157.3);
  assert.equal(Number(prices.priceM3WithVat.toFixed(2)), 30.37);
  assert.equal(Number(cost.toFixed(2)), 461.01);
});

test('gas tariff page exposes editable price-list line items', () => {
  const html = fs.readFileSync('public/gas.html', 'utf8');
  for (const id of [
    't-gas-com',
    't-gas-sup-fee',
    't-gas-dist',
    't-gas-cap-month',
    't-gas-cap-year',
    't-gas-ote',
    't-annual',
  ]) {
    assert.match(html, new RegExp(`id="${id}"`), `${id} input is present`);
  }
});
