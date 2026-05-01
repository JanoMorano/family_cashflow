# Topic

Family Cashflow 1.1

# Changes

- Multi-user login with default accounts `admin/admin` and `demo/demo`.
- User profile window for password changes and selecting the primary budget column.
- Simultaneous editing support with versioned saves, conflict detection, and live notifications.
- Gas module added next to electricity, including readings, tariff, import/export, and Innogy PDF pricing.
- New standalone History page with monthly income/expense charts and month-over-month differences.
- Interactive month picker and automatic copy to the next month on the first day.
- Savings/funds linking and delete lock for safer editing.

# Verification

- Run `npm test` from the repository root.
- Start with `APP_USERS=admin:admin:Admin,demo:demo:Demo npm start`.
