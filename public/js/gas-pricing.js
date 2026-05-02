(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.GasPricing = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  const INNOGY_GAS_TARIFF_2026 = {
    supplier: 'INNOGY',
    product: 'plyn Optimal 36',
    priceYear: 2026,
    distributionArea: 'GasNet',
    source: 'innogy.pdf',
    conversionKwhPerM3: 10.69,
    vatRate: 0.21,
    defaultAnnualKwh: 10000,
    bands: [
      { label: 'vařím do 1 890', minKwh: 0, maxKwh: 1890, commodityKwhNoVat: 1.26000, supplierMonthlyNoVat: 105.00, distributionKwhNoVat: 0.75181, capacityMonthlyNoVat: 110.94, oteKwhNoVat: 0.00406 },
      { label: 'ohřívám vodu nad 1 890 do 7 560', minKwh: 1890, maxKwh: 7560, commodityKwhNoVat: 1.24000, supplierMonthlyNoVat: 115.00, distributionKwhNoVat: 0.40727, capacityMonthlyNoVat: 165.09, oteKwhNoVat: 0.00406 },
      { label: 'topím nad 7 560 do 15 000', minKwh: 7560, maxKwh: 15000, commodityKwhNoVat: 1.22000, supplierMonthlyNoVat: 130.00, distributionKwhNoVat: 0.36911, capacityMonthlyNoVat: 188.65, oteKwhNoVat: 0.00406 },
      { label: 'topím nad 15 000 do 25 000', minKwh: 15000, maxKwh: 25000, commodityKwhNoVat: 1.22000, supplierMonthlyNoVat: 130.00, distributionKwhNoVat: 0.34152, capacityMonthlyNoVat: 222.19, oteKwhNoVat: 0.00406 },
      { label: 'topím nad 25 000 do 45 000', minKwh: 25000, maxKwh: 45000, commodityKwhNoVat: 1.22000, supplierMonthlyNoVat: 130.00, distributionKwhNoVat: 0.28449, capacityMonthlyNoVat: 339.41, oteKwhNoVat: 0.00406 },
      { label: 'topím nad 45 000 do 63 000', minKwh: 45000, maxKwh: 63000, commodityKwhNoVat: 1.22000, supplierMonthlyNoVat: 130.00, distributionKwhNoVat: 0.23017, capacityMonthlyNoVat: 540.26, oteKwhNoVat: 0.00406 },
      { label: 'topím nad 63 000 do 630 000', minKwh: 63000, maxKwh: 630000, commodityKwhNoVat: 1.21000, supplierMonthlyNoVat: 130.00, distributionKwhNoVat: 0.16837, capacityMonthlyNoVat: 0, capacityAnnualPerM3NoVat: 201.55880, oteKwhNoVat: 0.00406 },
    ],
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function round(value, places) {
    const factor = 10 ** places;
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }

  function normalizeGasTariff(value) {
    const base = clone(INNOGY_GAS_TARIFF_2026);
    if (!value || typeof value !== 'object') return base;

    const hasPdfBands = Array.isArray(value.bands) && value.bands.length;
    const hasOldShortcutTariff = !hasPdfBands && (value.priceKWh != null || value.monthlyFee != null || value.kwhPerM3 != null);
    const merged = { ...base, ...value };
    merged.bands = hasPdfBands ? value.bands : base.bands;
    merged.conversionKwhPerM3 = Number(value.conversionKwhPerM3 ?? (hasOldShortcutTariff ? base.conversionKwhPerM3 : value.kwhPerM3) ?? base.conversionKwhPerM3);
    merged.vatRate = Number(value.vatRate ?? base.vatRate);
    merged.defaultAnnualKwh = Number(value.defaultAnnualKwh ?? base.defaultAnnualKwh);

    if (value.priceKWh != null || value.monthlyFee != null) {
      merged.legacyPriceKWh = Number(value.priceKWh ?? 0);
      merged.legacyMonthlyFee = Number(value.monthlyFee ?? 0);
      merged.legacyPriceIncludesVat = value.priceIncludesVat !== false;
    }

    return merged;
  }

  function selectGasBand(annualKwh, bands) {
    const safeAnnualKwh = Number.isFinite(annualKwh) && annualKwh > 0 ? annualKwh : INNOGY_GAS_TARIFF_2026.defaultAnnualKwh;
    const sortedBands = [...(bands || INNOGY_GAS_TARIFF_2026.bands)].sort((a, b) => a.minKwh - b.minKwh);
    return sortedBands.find((band, index) => {
      const aboveMin = index === 0 ? safeAnnualKwh >= band.minKwh : safeAnnualKwh > band.minKwh;
      return aboveMin && safeAnnualKwh <= band.maxKwh;
    }) || sortedBands[sortedBands.length - 1];
  }

  function annualKwhFromReadings(readings, conversionKwhPerM3) {
    const sorted = [...(readings || [])]
      .filter(reading => reading && reading.date && Number.isFinite(Number(reading.vt)))
      .sort((a, b) => String(a.date).localeCompare(String(b.date)));
    if (sorted.length < 2) return 0;

    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const days = Math.max(1, Math.round((new Date(last.date) - new Date(first.date)) / 86400000));
    const consumedM3 = Number(last.vt) - Number(first.vt);
    if (consumedM3 <= 0) return 0;

    return (consumedM3 * Number(conversionKwhPerM3 || INNOGY_GAS_TARIFF_2026.conversionKwhPerM3) / days) * 365;
  }

  function computeGasPrices(tariffInput, annualKwh) {
    const tariff = normalizeGasTariff(tariffInput);

    if (tariff.legacyPriceKWh && tariff.legacyMonthlyFee && !tariffInput?.bands) {
      const legacyKwhWithVat = tariff.legacyPriceIncludesVat
        ? tariff.legacyPriceKWh
        : round(tariff.legacyPriceKWh * (1 + tariff.vatRate), 5);
      const legacyMonthlyWithVat = tariff.legacyPriceIncludesVat
        ? tariff.legacyMonthlyFee
        : round(tariff.legacyMonthlyFee * (1 + tariff.vatRate), 2);
      return {
        tariff,
        band: { label: 'vlastní jednoduchý tarif' },
        conversionKwhPerM3: tariff.conversionKwhPerM3,
        unitKwhNoVat: tariff.legacyPriceIncludesVat ? round(tariff.legacyPriceKWh / (1 + tariff.vatRate), 5) : tariff.legacyPriceKWh,
        unitKwhWithVat: legacyKwhWithVat,
        monthlyFeeNoVat: tariff.legacyPriceIncludesVat ? round(tariff.legacyMonthlyFee / (1 + tariff.vatRate), 2) : tariff.legacyMonthlyFee,
        monthlyFeeWithVat: legacyMonthlyWithVat,
        priceM3NoVat: round((tariff.legacyPriceIncludesVat ? tariff.legacyPriceKWh / (1 + tariff.vatRate) : tariff.legacyPriceKWh) * tariff.conversionKwhPerM3, 5),
        priceM3WithVat: legacyKwhWithVat * tariff.conversionKwhPerM3,
      };
    }

    const band = selectGasBand(annualKwh || tariff.defaultAnnualKwh, tariff.bands);
    const component = (name, fallback = 0) => {
      const value = Number(tariff[name]);
      return Number.isFinite(value) ? value : Number(fallback || 0);
    };
    const commodityKwhNoVat = component('commodityKwhNoVat', band.commodityKwhNoVat);
    const distributionKwhNoVat = component('distributionKwhNoVat', band.distributionKwhNoVat);
    const oteKwhNoVat = component('oteKwhNoVat', band.oteKwhNoVat);
    const supplierMonthlyNoVat = component('supplierMonthlyNoVat', band.supplierMonthlyNoVat);
    const capacityMonthlyNoVat = component('capacityMonthlyNoVat', band.capacityMonthlyNoVat);
    const capacityAnnualNoVat = component('capacityAnnualNoVat', 0);
    const unitKwhNoVat = round(commodityKwhNoVat + distributionKwhNoVat + oteKwhNoVat, 5);
    const monthlyFeeNoVat = round(supplierMonthlyNoVat + capacityMonthlyNoVat + (capacityAnnualNoVat / 12), 2);
    const unitKwhWithVat = round(unitKwhNoVat * (1 + tariff.vatRate), 5);
    const monthlyFeeWithVat = round(monthlyFeeNoVat * (1 + tariff.vatRate), 2);

    return {
      tariff,
      band: {
        ...band,
        commodityKwhNoVat,
        distributionKwhNoVat,
        oteKwhNoVat,
        supplierMonthlyNoVat,
        capacityMonthlyNoVat,
        capacityAnnualNoVat,
      },
      conversionKwhPerM3: tariff.conversionKwhPerM3,
      unitKwhNoVat,
      unitKwhWithVat,
      monthlyFeeNoVat,
      monthlyFeeWithVat,
      priceM3NoVat: unitKwhNoVat * tariff.conversionKwhPerM3,
      priceM3WithVat: unitKwhWithVat * tariff.conversionKwhPerM3,
    };
  }

  function calculateGasCost(m3, days, tariffInput, annualKwh) {
    const prices = computeGasPrices(tariffInput, annualKwh);
    const proratedFee = prices.monthlyFeeWithVat * (Math.max(1, Number(days) || 1) / 30.44);
    return (Number(m3) || 0) * prices.priceM3WithVat + proratedFee;
  }

  return {
    INNOGY_GAS_TARIFF_2026,
    annualKwhFromReadings,
    calculateGasCost,
    cloneTariff: clone,
    computeGasPrices,
    normalizeGasTariff,
    selectGasBand,
  };
});
