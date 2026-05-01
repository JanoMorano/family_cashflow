import express, { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import {
  LoginUser,
  MemorySessionStore,
  SESSION_COOKIE,
  buildClearSessionCookie,
  buildSessionCookie,
  getConfiguredUser,
  parseCookieHeader,
  parseUsersConfig,
  verifyUserPassword,
} from './auth';
import { summarizeBudgetMonths } from './budget-history';
import { autoCopyBudgetForFirstDay } from './month-copy';
import { DEFAULT_GAS_READINGS, DEFAULT_GAS_TARIFF, getUtilityFiles, normalizeUtilityType, UtilityType } from './utility';
import {
  getColumnOwners,
  getPublicUserProfile,
  getUserProfile,
  setUserMainColumn,
  setUserPassword,
  verifyUserProfilePassword,
} from './user-profile';
import { VersionConflictError, readVersionedJSON, writeVersionedJSON } from './versioned-store';

const app  = express();
const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? '127.0.0.1';
const DATA = process.env.DATA_DIR ?? '/data';
const pub = path.join(__dirname, '..', 'public');
const USERS = parseUsersConfig(process.env.APP_USERS);
const SESSION_SECURE = process.env.COOKIE_SECURE === '1';
const sessions = new MemorySessionStore();

app.use(express.json());

if (!fs.existsSync(DATA)) fs.mkdirSync(DATA, { recursive: true });

function runAutomaticBudgetCopy() {
  const result = autoCopyBudgetForFirstDay(DATA);
  if (result.copied) {
    console.log(`Auto-copied budget ${result.from} -> ${result.to}`);
    broadcast('budget');
  }
  return result;
}

type AuthenticatedRequest = Request & { user?: LoginUser };

function getSessionId(req: Request) {
  return parseCookieHeader(req.headers.cookie)[SESSION_COOKIE] ?? null;
}

function getRequestUser(req: Request) {
  return sessions.get(getSessionId(req));
}

function verifyLoginUser(username: string, password: string) {
  const configured = getConfiguredUser(USERS, username);
  if (!configured) return null;

  const profile = getUserProfile(DATA, username);
  if (profile.passwordHash) {
    return verifyUserProfilePassword(profile, password) ? configured : null;
  }

  return verifyUserPassword(USERS, username, password);
}

function verifyCurrentUserPassword(username: string, password: string) {
  return Boolean(verifyLoginUser(username, password));
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const user = getRequestUser(req);
  if (!user) {
    if (req.path.startsWith('/api/')) return res.status(401).json({ error: 'Authentication required' });
    const nextPath = encodeURIComponent(req.originalUrl || '/');
    return res.redirect(`/login?next=${nextPath}`);
  }

  req.user = user;
  next();
}

// ── Auth API ─────────────────────────────────────────────────
app.get('/login', (_req, res) => res.sendFile(path.join(pub, 'login.html')));
app.use('/js', express.static(path.join(pub, 'js')));

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
  const user = verifyLoginUser(String(username || ''), String(password || ''));
  if (!user) return res.status(401).json({ error: 'Invalid username or password' });

  const sessionId = sessions.create(user);
  res.setHeader('Set-Cookie', buildSessionCookie(sessionId, SESSION_SECURE));
  res.json({ ok: true, user });
});

app.post('/api/auth/logout', (req, res) => {
  sessions.destroy(getSessionId(req));
  res.setHeader('Set-Cookie', buildClearSessionCookie());
  res.json({ ok: true });
});

app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
  res.json({ user: req.user, activeUsers: sessions.activeUsers() });
});

app.use(requireAuth);

// ── Profile API ──────────────────────────────────────────────
app.get('/api/profile', (req: AuthenticatedRequest, res) => {
  const username = req.user!.username;
  res.json({
    user: req.user,
    profile: getPublicUserProfile(DATA, username),
    columnOwners: getColumnOwners(DATA, USERS),
  });
});

app.put('/api/profile/main-column', (req: AuthenticatedRequest, res) => {
  const { mainColumnId } = req.body as { mainColumnId?: unknown };
  if (mainColumnId !== null && mainColumnId !== undefined && typeof mainColumnId !== 'string') {
    return res.status(400).json({ error: 'mainColumnId must be a string or null' });
  }
  const cleaned = typeof mainColumnId === 'string' ? mainColumnId.trim() : null;
  if (cleaned && !/^[A-Za-z0-9_-]{1,40}$/.test(cleaned)) {
    return res.status(400).json({ error: 'Invalid main column id' });
  }

  const profile = setUserMainColumn(DATA, req.user!.username, cleaned || null);
  res.json({
    ok: true,
    profile: getPublicUserProfile(DATA, profile.username),
    columnOwners: getColumnOwners(DATA, USERS),
  });
});

app.put('/api/profile/password', (req: AuthenticatedRequest, res) => {
  const { currentPassword, newPassword } = req.body as { currentPassword?: unknown; newPassword?: unknown };
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
    return res.status(400).json({ error: 'Current and new password are required' });
  }
  if (newPassword.trim().length < 4) {
    return res.status(400).json({ error: 'New password must have at least 4 characters' });
  }
  if (!verifyCurrentUserPassword(req.user!.username, currentPassword)) {
    return res.status(403).json({ error: 'Current password is incorrect' });
  }

  const profile = setUserPassword(DATA, req.user!.username, newPassword);
  res.json({ ok: true, profile: getPublicUserProfile(DATA, profile.username) });
});

// ── SSE — real-time broadcast ────────────────────────────────
const clients = new Set<Response>();

app.get('/api/events', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  res.write('data: connected\n\n');
  clients.add(res);
  req.on('close', () => clients.delete(res));
});

function broadcast(channel: string) {
  const msg = `data: ${channel}\n\n`;
  clients.forEach(c => c.write(msg));
}

runAutomaticBudgetCopy();
setInterval(runAutomaticBudgetCopy, 60 * 60 * 1000);

// ── helpers ──────────────────────────────────────────────────
function readJSON(file: string) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return null; }
}
function writeJSON(file: string, data: unknown) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// ── Budget API ───────────────────────────────────────────────
function budgetFile(month: string) {
  return path.join(DATA, `budget-${month}.json`);
}

app.get('/api/budget/months', (_req, res) => {
  runAutomaticBudgetCopy();
  const months = fs.readdirSync(DATA)
    .filter(f => /^budget-\d{4}-\d{2}\.json$/.test(f))
    .map(f => f.replace('budget-', '').replace('.json', ''))
    .sort();
  res.json(months);
});

app.get('/api/budget/history-summary', (_req, res) => {
  runAutomaticBudgetCopy();
  const entries = fs.readdirSync(DATA)
    .filter(file => /^budget-\d{4}-\d{2}\.json$/.test(file))
    .map(file => {
      const month = file.replace('budget-', '').replace('.json', '');
      return [month, readJSON(path.join(DATA, file))] as [string, any];
    })
    .filter(([, data]) => data);
  res.json(summarizeBudgetMonths(entries));
});

app.get('/api/budget/:month', (req, res) => {
  runAutomaticBudgetCopy();
  const result = readVersionedJSON(budgetFile(req.params.month));
  if (!result) return res.status(404).json({ error: 'Month not found' });
  res.setHeader('X-Data-Version', result.version);
  res.json(result.data);
});

app.put('/api/budget/:month', (req: AuthenticatedRequest, res) => {
  try {
    const result = writeVersionedJSON(budgetFile(req.params.month), req.body, req.get('if-match'));
    broadcast('budget');
    res.setHeader('X-Data-Version', result.version);
    res.json({ ok: true, version: result.version, updatedBy: req.user });
  } catch (error) {
    if (error instanceof VersionConflictError) {
      return res.status(409).json({
        error: 'Version conflict',
        version: error.currentVersion,
        latest: error.currentData,
      });
    }
    throw error;
  }
});

app.delete('/api/budget/:month', (req, res) => {
  const file = budgetFile(req.params.month);
  if (!fs.existsSync(file)) return res.status(404).json({ error: 'Month not found' });
  fs.unlinkSync(file);
  broadcast('budget');
  res.json({ ok: true });
});

app.post('/api/budget/copy', (req, res) => {
  const { from, to } = req.body as { from: string; to: string };
  const src = budgetFile(from);
  if (!fs.existsSync(src)) return res.status(404).json({ error: `Month ${from} not found` });
  fs.copyFileSync(src, budgetFile(to));
  broadcast('budget');
  res.json({ ok: true });
});

// ── Utility APIs: electricity + gas ──────────────────────────
function getReadings(type: UtilityType): any[] {
  const file = getUtilityFiles(DATA, type).readings;
  const saved = readJSON(file);
  if (saved) return saved;
  if (type === 'gas' && !fs.existsSync(file)) return DEFAULT_GAS_READINGS.map(reading => ({ ...reading }));
  return [];
}

function sortedReadings(type: UtilityType) {
  return getReadings(type).sort((a, b) => a.date.localeCompare(b.date));
}

function getTariff(type: UtilityType) {
  const file = getUtilityFiles(DATA, type).tariff;
  const saved = readJSON(file);
  if (saved) return saved;
  if (type === 'gas' && !fs.existsSync(file)) return { ...DEFAULT_GAS_TARIFF };
  return null;
}

function saveTariff(type: UtilityType, data: unknown) {
  writeJSON(getUtilityFiles(DATA, type).tariff, data);
  broadcast(type);
}

function saveReadings(type: UtilityType, readings: any[]) {
  writeJSON(getUtilityFiles(DATA, type).readings, readings);
  broadcast(type);
}

function getUtilityFromParam(req: Request, res: Response): UtilityType | null {
  const type = normalizeUtilityType(req.params.utility);
  if (!type) {
    res.status(404).json({ error: 'Unsupported utility type' });
    return null;
  }
  return type;
}

function listReadings(type: UtilityType, _req: Request, res: Response) {
  res.json(sortedReadings(type));
}

function createReading(type: UtilityType, req: Request, res: Response) {
  const { id, date, vt, nt, notes } = req.body;
  if (!date || vt === undefined) return res.status(400).json({ error: 'date and vt are required' });
  const readings = getReadings(type);
  const idx = id ? readings.findIndex(r => r.id === id) : readings.findIndex(r => r.date === date);
  const entry = { id: id ?? date, date: String(date), vt: Number(vt), nt: nt != null ? Number(nt) : null, notes: notes ?? null };
  if (idx >= 0) readings[idx] = entry; else readings.push(entry);
  saveReadings(type, readings);
  res.json(entry);
}

function updateReading(type: UtilityType, req: Request, res: Response) {
  const readings = getReadings(type);
  const idx = readings.findIndex(r => r.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Reading not found' });
  const { date, vt, nt, notes } = req.body;
  readings[idx] = { ...readings[idx], ...(date !== undefined && { date }), ...(vt !== undefined && { vt: Number(vt) }), nt: nt != null ? Number(nt) : null, notes: notes ?? null };
  saveReadings(type, readings);
  res.json(readings[idx]);
}

function clearReadings(type: UtilityType, _req: Request, res: Response) {
  saveReadings(type, []);
  res.json({ ok: true });
}

function deleteReading(type: UtilityType, req: Request, res: Response) {
  const readings = getReadings(type);
  const filtered = readings.filter(r => r.id !== req.params.id);
  if (filtered.length === readings.length) return res.status(404).json({ error: 'Reading not found' });
  saveReadings(type, filtered);
  res.json({ ok: true });
}

// Legacy electricity endpoints, kept for the existing page.
app.get('/api/readings', (req, res) => listReadings('electricity', req, res));
app.post('/api/readings', (req, res) => createReading('electricity', req, res));
app.put('/api/readings/:id', (req, res) => updateReading('electricity', req, res));
app.delete('/api/readings', (req, res) => clearReadings('electricity', req, res));
app.delete('/api/readings/:id', (req, res) => deleteReading('electricity', req, res));
app.get('/api/tariff', (_req, res) => res.json(getTariff('electricity')));
app.put('/api/tariff', (req, res) => {
  saveTariff('electricity', req.body);
  res.json({ ok: true });
});

// Generic utility endpoints: /api/electricity/* and /api/gas/*.
app.get('/api/:utility/readings', (req, res) => {
  const type = getUtilityFromParam(req, res);
  if (type) listReadings(type, req, res);
});
app.post('/api/:utility/readings', (req, res) => {
  const type = getUtilityFromParam(req, res);
  if (type) createReading(type, req, res);
});
app.put('/api/:utility/readings/:id', (req, res) => {
  const type = getUtilityFromParam(req, res);
  if (type) updateReading(type, req, res);
});
app.delete('/api/:utility/readings', (req, res) => {
  const type = getUtilityFromParam(req, res);
  if (type) clearReadings(type, req, res);
});
app.delete('/api/:utility/readings/:id', (req, res) => {
  const type = getUtilityFromParam(req, res);
  if (type) deleteReading(type, req, res);
});
app.get('/api/:utility/tariff', (req, res) => {
  const type = getUtilityFromParam(req, res);
  if (type) res.json(getTariff(type));
});
app.put('/api/:utility/tariff', (req, res) => {
  const type = getUtilityFromParam(req, res);
  if (!type) return;
  saveTariff(type, req.body);
  res.json({ ok: true });
});

// ── Static frontend ──────────────────────────────────────────
app.get('/energy', (_req, res) => res.sendFile(path.join(pub, 'energy.html')));
app.get('/gas', (_req, res) => res.sendFile(path.join(pub, 'gas.html')));
app.get('/history', (_req, res) => res.sendFile(path.join(pub, 'history.html')));
app.use(express.static(pub));
app.get('*', (_req, res) => res.sendFile(path.join(pub, 'index.html')));

app.listen(PORT, HOST, () => console.log(`Family Cashflow running on http://${HOST}:${PORT}`));
