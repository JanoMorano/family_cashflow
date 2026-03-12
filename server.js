const express = require('express');
const fs      = require('fs');
const path    = require('path');

const app       = express();
const PORT      = 3000;
const DATA_FILE = '/data/budget.json';

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ── GET  /api/budget  →  return saved data (or null) ─────────
app.get('/api/budget', (req, res) => {
  try {
    if (fs.existsSync(DATA_FILE)) {
      res.json(JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')));
    } else {
      res.json(null);
    }
  } catch (err) {
    console.error('Read error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── PUT  /api/budget  →  save full state ─────────────────────
app.put('/api/budget', (req, res) => {
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 2), 'utf8');
    res.json({ ok: true, savedAt: new Date().toISOString() });
  } catch (err) {
    console.error('Write error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── DELETE /api/budget → delete saved data (reset) ───────────
app.delete('/api/budget', (req, res) => {
  try {
    if (fs.existsSync(DATA_FILE)) fs.unlinkSync(DATA_FILE);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅  Family Cashflow running at  http://localhost:${PORT}`);
});
