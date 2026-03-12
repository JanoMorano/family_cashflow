# 🏠 Family Budget App

Interactive family budget calculator with live charts, savings tracker, and persistent backend.
Supports **5 languages**: 🇨🇿 Czech · 🇬🇧 English · 🇸🇰 Slovak · 🇩🇪 German · 🇵🇱 Polish

![screenshot](https://github.com/JanoMorano/family_cashflow/blob/main/demo/family_budget_1.00-preview.png)

---

## Features

- **Income & Expense tables** — editable rows, add/delete, per-person columns
- **Savings pots** — goal sliders, progress bars, 24-month projection charts
- **Tags** — custom groupings with multiselect from budget items + doughnut chart
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

### Option B — Portainer / Container Station

1. Build the image on your machine:
   ```bash
   sh build-and-export.sh
   ```
2. Import `rozpocet-app.tar` into your NAS/server container manager
3. Deploy using `docker-compose.portainer.yml`

### Option C — Standalone HTML (no backend)

Open `backend/public/index.html` directly in a browser.
Data will not persist between page reloads.

---

## Data Persistence

Data is stored as a JSON file inside a Docker volume (`budget_data`).
It survives container restarts and updates.

| Path inside container | Description |
|---|---|
| `/data/budget.json` | All budget data |

To back up: `docker cp <container_id>:/data/budget.json ./backup.json`

---

## API

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/budget` | Load saved state |
| `PUT` | `/api/budget` | Save state (full JSON body) |
| `DELETE` | `/api/budget` | Reset to defaults |

---

## Stack

- **Frontend** — Vanilla JS, Chart.js, single HTML file
- **Backend** — Node.js + Express
- **Storage** — JSON file on Docker volume
- **Container** — Docker + docker-compose

---

## Customisation

Edit the `INCOME_DATA`, `SUBS`, and `POTS` constants in `index.html`
to set your own default categories and starting values.

To add a language, extend the `LANG` object in `index.html`.
