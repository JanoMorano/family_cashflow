import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

test('utility dashboards load the shared monthly cost helper', () => {
  for (const file of ['public/energy.html', 'public/gas.html']) {
    const html = fs.readFileSync(file, 'utf8');

    assert.match(html, /\/js\/utility-costs\.js/, `${file} loads the monthly cost helper`);
    assert.match(html, /data-i18n="kpi_avg_month">Průměrné měsíční náklady/, `${file} labels the KPI as monthly costs`);
  }
});

test('averageMonthlyCost annualizes short reading windows to a monthly cost', async () => {
  assert.ok(fs.existsSync('public/js/utility-costs.js'), 'public/js/utility-costs.js should exist');
  const { averageMonthlyCost } = await import('../public/js/utility-costs.js');

  assert.equal(averageMonthlyCost([{ days: 10, cost: 1000 }]), 3044);
  assert.equal(averageMonthlyCost([{ days: 15, cost: 900 }, { days: 16, cost: 1100 }]).toFixed(2), '1963.87');
  assert.equal(averageMonthlyCost([{ days: 0, cost: 1000 }, { days: 5, cost: 500, warn: true }]), null);
});
