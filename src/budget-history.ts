type SavedRow = {
  vals?: Record<string, number>;
  freq?: string;
  [key: string]: unknown;
};

type SavedBudget = {
  income?: {
    rows?: Record<string, SavedRow>;
    custom?: SavedRow[];
  };
  subs?: Record<string, {
    rows?: Record<string, SavedRow>;
    custom?: SavedRow[];
  }>;
};

export type BudgetMonthSummary = {
  month: string;
  income: number;
  expenses: number;
  balance: number;
  incomeChange: number;
  expensesChange: number;
  balanceChange: number;
};

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function rowMonthlyTotal(row: SavedRow | undefined) {
  if (!row) return 0;
  const vals = row.vals ?? row;
  const total = Object.entries(vals)
    .filter(([key, value]) => key !== 'freq' && typeof value === 'number')
    .reduce((sum, [, value]) => sum + Number(value || 0), 0);
  const freq = row.freq || 'M';
  const factor = freq === 'Y' ? 1 / 12 : freq === 'Q' ? 1 / 3 : 1;
  return total * factor;
}

function rowsMonthlyTotal(rows: Record<string, SavedRow> | undefined, custom: SavedRow[] | undefined) {
  const regular = Object.values(rows || {}).reduce((sum, row) => sum + rowMonthlyTotal(row), 0);
  const customTotal = (custom || []).reduce((sum, row) => sum + rowMonthlyTotal(row), 0);
  return regular + customTotal;
}

export function calculateBudgetSummary(month: string, budget: SavedBudget): BudgetMonthSummary {
  const income = rowsMonthlyTotal(budget.income?.rows, budget.income?.custom);
  const expenses = Object.values(budget.subs || {})
    .reduce((sum, section) => sum + rowsMonthlyTotal(section.rows, section.custom), 0);
  const balance = income - expenses;

  return {
    month,
    income: roundMoney(income),
    expenses: roundMoney(expenses),
    balance: roundMoney(balance),
    incomeChange: 0,
    expensesChange: 0,
    balanceChange: 0,
  };
}

export function summarizeBudgetMonths(entries: Array<[string, SavedBudget]>) {
  const summaries = entries
    .map(([month, budget]) => calculateBudgetSummary(month, budget))
    .sort((a, b) => a.month.localeCompare(b.month));

  return summaries.map((summary, index) => {
    const previous = summaries[index - 1];
    if (!previous) return summary;
    return {
      ...summary,
      incomeChange: roundMoney(summary.income - previous.income),
      expensesChange: roundMoney(summary.expenses - previous.expenses),
      balanceChange: roundMoney(summary.balance - previous.balance),
    };
  });
}
