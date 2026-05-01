import path from 'path';

export type UtilityType = 'electricity' | 'gas';
export type UtilityReading = {
  id: string;
  date: string;
  vt: number;
  nt: number | null;
  notes: string | null;
};

export const DEFAULT_GAS_TARIFF = {
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

export const DEFAULT_GAS_READINGS: UtilityReading[] = [
  { id: '2024-05-16', date: '2024-05-16', vt: 118, nt: null, notes: 'Počáteční odečet z plyn.xlsx' },
  { id: '2024-06-16', date: '2024-06-16', vt: 134, nt: null, notes: null },
  { id: '2024-07-14', date: '2024-07-14', vt: 151, nt: null, notes: null },
  { id: '2024-08-16', date: '2024-08-16', vt: 169, nt: null, notes: null },
  { id: '2024-09-15', date: '2024-09-15', vt: 194, nt: null, notes: null },
  { id: '2024-10-17', date: '2024-10-17', vt: 253, nt: null, notes: null },
  { id: '2024-11-17', date: '2024-11-17', vt: 395, nt: null, notes: null },
  { id: '2024-12-14', date: '2024-12-14', vt: 553, nt: null, notes: null },
  { id: '2025-01-21', date: '2025-01-21', vt: 801, nt: null, notes: null },
  { id: '2025-02-18', date: '2025-02-18', vt: 1013, nt: null, notes: null },
  { id: '2025-03-17', date: '2025-03-17', vt: 1205, nt: null, notes: null },
  { id: '2025-04-01', date: '2025-04-01', vt: 1279, nt: null, notes: 'Odhad v plyn.xlsx' },
  { id: '2025-05-01', date: '2025-05-01', vt: 1298, nt: null, notes: 'Odhad v plyn.xlsx' },
  { id: '2025-06-16', date: '2025-06-16', vt: 1315, nt: null, notes: null },
  { id: '2025-07-13', date: '2025-07-13', vt: 1325, nt: null, notes: null },
  { id: '2025-08-15', date: '2025-08-15', vt: 1338, nt: null, notes: null },
  { id: '2025-09-17', date: '2025-09-17', vt: 1352, nt: null, notes: null },
  { id: '2025-10-16', date: '2025-10-16', vt: 1373, nt: null, notes: null },
  { id: '2025-11-14', date: '2025-11-14', vt: 1407, nt: null, notes: null },
  { id: '2025-12-17', date: '2025-12-17', vt: 1446, nt: null, notes: null },
  { id: '2026-01-19', date: '2026-01-19', vt: 1471, nt: null, notes: null },
  { id: '2026-02-16', date: '2026-02-16', vt: 1486, nt: null, notes: null },
  { id: '2026-03-05', date: '2026-03-05', vt: 1497, nt: null, notes: null },
];

export function normalizeUtilityType(value: string): UtilityType | null {
  return value === 'electricity' || value === 'gas' ? value : null;
}

export function getUtilityFiles(dataDir: string, type: UtilityType) {
  if (type === 'electricity') {
    return {
      readings: path.join(dataDir, 'readings.json'),
      tariff: path.join(dataDir, 'tariff.json'),
    };
  }

  return {
    readings: path.join(dataDir, 'gas-readings.json'),
    tariff: path.join(dataDir, 'gas-tariff.json'),
  };
}
