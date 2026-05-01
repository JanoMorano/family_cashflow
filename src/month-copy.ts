import fs from 'fs';
import path from 'path';

export type AutoCopyResult =
  | { copied: true; from: string; to: string }
  | { copied: false; reason: 'not-first-day' | 'source-missing' | 'target-exists'; from: string; to: string };

export function formatBudgetMonth(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function previousBudgetMonth(month: string) {
  const [year, monthIndex] = month.split('-').map(Number);
  const date = new Date(year, monthIndex - 2, 1);
  return formatBudgetMonth(date);
}

function budgetFile(dataDir: string, month: string) {
  return path.join(dataDir, `budget-${month}.json`);
}

export function autoCopyBudgetForFirstDay(dataDir: string, now = new Date()): AutoCopyResult {
  const to = formatBudgetMonth(now);
  const from = previousBudgetMonth(to);

  if (now.getDate() !== 1) return { copied: false, reason: 'not-first-day', from, to };

  const source = budgetFile(dataDir, from);
  const target = budgetFile(dataDir, to);

  if (!fs.existsSync(source)) return { copied: false, reason: 'source-missing', from, to };
  if (fs.existsSync(target)) return { copied: false, reason: 'target-exists', from, to };

  fs.copyFileSync(source, target);
  return { copied: true, from, to };
}
