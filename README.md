# 🏠 Family Cashflow 1.1.1

Interactive family budget calculator with login, simultaneous editing support, live charts, savings tracker, electricity and gas tracking, and persistent backend.
Supports **5 languages**: 🇨🇿 Czech · 🇬🇧 English · 🇸🇰 Slovak · 🇩🇪 German · 🇵🇱 Polish

![screenshot](https://img.shields.io/badge/stack-Node.js%20%2B%20Docker-informational)

---

## Features

- **Login & profiles** — default users `admin/admin` and `demo/demo`, password changes, primary column selection
- **Income & Expense tables** — editable rows, add/delete, per-person columns
- **Savings pots** — goal sliders, progress bars, 24-month projection charts
- **Concurrent editing** — versioned saves, conflict detection, and live update notifications
- **Tags** — custom groupings with multiselect from budget items + doughnut chart
- **Electricity page** — overview, readings, tariff, import/export
- **Gas page** — Jeneč gas consumption, tariff KPIs, charts, and reading table from `plyn.xlsx`
- **History page** — monthly income/expense graphs and month-over-month differences
- **Live charts** — expenses by category, income vs. expenses, fund growth
- **Auto-save** — every change is saved to the backend within 1 second
- **Multi-language** — switch language in the header, persists in localStorage

---

## Quick Start

### Option A — Docker Compose (recommended)

```bash
git clone https://github.com/JanoMorano/family-budget.git
cd family-budget
docker compose up --build
```

Open **http://localhost:3000**

Default accounts:

- `admin` / `admin`
- `demo` / `demo`

### Option B — Portainer / Container Station

1. Build the image on your machine:
   ```bash
   sh build-and-export.sh
   ```
2. Import `family_cashflow_v1.1.1.tar.gz` into your NAS/server container manager.
   The version in the filename comes from `package.json`.
3. Deploy using `docker-compose.portainer.yml`

### Option C — Standalone HTML (no backend)

Open `public/index.html` directly in a browser.
Data will not persist between page reloads.

---

## Versioning

The source of truth for the app version is `package.json`.
For the visible app label, use npm semver with a patch zero:

```json
"version": "1.1.1"
```

The build displays this as **Family Cashflow 1.1.1** and regenerates
`public/js/app-version.js` automatically:

```bash
npm run build
```

For the next release, update `package.json` first, for example to `1.2.0`,
then run `npm test` or `npm run build`.

---

## Data Persistence

Data is stored as JSON files inside the Docker volume (`family_cashflow_data`).
It survives container restarts and updates.

| Path inside container | Description |
|---|---|
| `/data/budget-YYYY-MM.json` | Monthly budget data |
| `/data/readings.json` | Electricity readings |
| `/data/gas-readings.json` | Gas readings |
| `/data/user-profiles.json` | Local user profile settings and password hashes |

When running locally with `npm start`, data is stored in `DATA_DIR` or `/data`.

To back up: copy the `/data` volume content.

---

## API

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/budget/:month` | Load monthly budget |
| `PUT` | `/api/budget/:month` | Save monthly budget |
| `GET` | `/api/budget/history-summary` | Monthly income/expense summary |
| `GET` | `/api/profile` | Current user profile |
| `PUT` | `/api/profile/password` | Change current user's password |

---

## Stack

- **Frontend** — Vanilla JS + Chart.js pages
- **Backend** — Node.js + Express
- **Storage** — JSON files on Docker volume
- **Container** — Docker + docker-compose

Chart.js is loaded from CDN in the HTML pages.

---

## Source Layout

`public/` is the primary frontend source and `src/`
contains the TypeScript backend.

After changes, run:

```bash
npm test
```

---

## Customisation

Edit the `INCOME_DATA`, `SUBS`, and `POTS` constants in `public/index.html`
to set your own default categories and starting values.

To add a language, extend the `LANG` object in `public/index.html`.

The gas defaults come from `plyn.xlsx` and the price calculation uses `innogy.pdf`.
