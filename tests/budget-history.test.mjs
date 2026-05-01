import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateBudgetSummary,
  summarizeBudgetMonths,
} from '../dist/budget-history.js';

test('calculates monthly income and expenses from saved budget data', () => {
  const summary = calculateBudgetSummary('2026-05', {
    income: {
      rows: {
        salary: { vals: { a: 1000, b: 500 }, freq: 'M' },
        bonus: { vals: { a: 1200 }, freq: 'Y' },
      },
      custom: [
        { name: 'side', vals: { a: 300 }, freq: 'Q' },
      ],
    },
    subs: {
      s0: {
        rows: {
          rent: { vals: { a: 700 }, freq: 'M' },
        },
        custom: [
          { name: 'insurance', vals: { a: 1200 }, freq: 'Y' },
        ],
      },
      s5: {
        rows: {},
        custom: [
          { name: 'saving', vals: { a: 200 }, freq: 'M' },
        ],
      },
    },
  });

  assert.deepEqual(summary, {
    month: '2026-05',
    income: 1700,
    expenses: 1000,
    balance: 700,
    incomeChange: 0,
    expensesChange: 0,
    balanceChange: 0,
  });
});

test('sorts month summaries chronologically', () => {
  const summaries = summarizeBudgetMonths([
    ['2026-06', { income: { rows: {}, custom: [] }, subs: {} }],
    ['2026-04', { income: { rows: { salary: { vals: { a: 100 }, freq: 'M' } }, custom: [] }, subs: {} }],
  ]);

  assert.deepEqual(summaries.map(item => item.month), ['2026-04', '2026-06']);
});

test('adds balance and month-over-month differences to summaries', () => {
  const summaries = summarizeBudgetMonths([
    ['2026-05', {
      income: { rows: { salary: { vals: { a: 1000 }, freq: 'M' } }, custom: [] },
      subs: { s0: { rows: { rent: { vals: { a: 700 }, freq: 'M' } }, custom: [] } },
    }],
    ['2026-06', {
      income: { rows: { salary: { vals: { a: 1200 }, freq: 'M' } }, custom: [] },
      subs: { s0: { rows: { rent: { vals: { a: 750 }, freq: 'M' } }, custom: [] } },
    }],
  ]);

  assert.deepEqual(summaries, [
    {
      month: '2026-05',
      income: 1000,
      expenses: 700,
      balance: 300,
      incomeChange: 0,
      expensesChange: 0,
      balanceChange: 0,
    },
    {
      month: '2026-06',
      income: 1200,
      expenses: 750,
      balance: 450,
      incomeChange: 200,
      expensesChange: 50,
      balanceChange: 150,
    },
  ]);
});
