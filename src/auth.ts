import crypto from 'crypto';

export type LoginUser = {
  username: string;
  displayName: string;
};

export type ConfiguredUser = LoginUser & {
  password: string;
};

type SessionRecord = LoginUser & {
  createdAt: number;
  lastSeenAt: number;
};

export const SESSION_COOKIE = 'fc_session';
const DEFAULT_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const DEFAULT_USERS_CONFIG = 'admin:admin:Admin,demo:demo:Demo';

export function parseUsersConfig(input: string | undefined): ConfiguredUser[] {
  const raw = (input || DEFAULT_USERS_CONFIG).trim();
  return raw
    .split(',')
    .map(part => part.trim())
    .filter(Boolean)
    .map(part => {
      const [username, password, ...displayParts] = part.split(':').map(value => value.trim());
      if (!username || !password) {
        throw new Error('Invalid APP_USERS format. Use username:password:Display Name[,user2:password2:Display Name]');
      }
      return {
        username,
        password,
        displayName: displayParts.join(':') || username,
      };
    });
}

export function verifyUserPassword(users: ConfiguredUser[], username: string, password: string): LoginUser | null {
  const user = users.find(candidate => candidate.username === username);
  if (!user) return null;

  const expected = Buffer.from(user.password);
  const actual = Buffer.from(password || '');
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) return null;

  return { username: user.username, displayName: user.displayName };
}

export function getConfiguredUser(users: ConfiguredUser[], username: string): LoginUser | null {
  const user = users.find(candidate => candidate.username === username);
  return user ? { username: user.username, displayName: user.displayName } : null;
}

export class MemorySessionStore {
  private sessions = new Map<string, SessionRecord>();

  constructor(private readonly ttlMs = DEFAULT_SESSION_TTL_MS) {}

  create(user: LoginUser): string {
    this.prune();
    const sessionId = crypto.randomBytes(32).toString('hex');
    const now = Date.now();
    this.sessions.set(sessionId, { ...user, createdAt: now, lastSeenAt: now });
    return sessionId;
  }

  get(sessionId: string | null | undefined): LoginUser | null {
    if (!sessionId) return null;
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    if (Date.now() - session.lastSeenAt > this.ttlMs) {
      this.sessions.delete(sessionId);
      return null;
    }

    session.lastSeenAt = Date.now();
    return { username: session.username, displayName: session.displayName };
  }

  destroy(sessionId: string | null | undefined) {
    if (sessionId) this.sessions.delete(sessionId);
  }

  activeUsers() {
    this.prune();
    const byUsername = new Map<string, LoginUser & { lastSeenAt: number }>();
    for (const session of this.sessions.values()) {
      const current = byUsername.get(session.username);
      if (!current || current.lastSeenAt < session.lastSeenAt) {
        byUsername.set(session.username, {
          username: session.username,
          displayName: session.displayName,
          lastSeenAt: session.lastSeenAt,
        });
      }
    }
    return [...byUsername.values()]
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
      .map(user => ({
        username: user.username,
        displayName: user.displayName,
        lastSeenAt: new Date(user.lastSeenAt).toISOString(),
      }));
  }

  prune() {
    const now = Date.now();
    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastSeenAt > this.ttlMs) this.sessions.delete(sessionId);
    }
  }
}

export function parseCookieHeader(header: string | undefined) {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;

  header.split(';').forEach(part => {
    const idx = part.indexOf('=');
    if (idx < 0) return;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
  });

  return cookies;
}

export function buildSessionCookie(sessionId: string, secure = false) {
  return [
    `${SESSION_COOKIE}=${encodeURIComponent(sessionId)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=604800',
    secure ? 'Secure' : '',
  ].filter(Boolean).join('; ');
}

export function buildClearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
