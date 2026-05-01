import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export type PublicUserProfile = {
  username: string;
  mainColumnId: string | null;
  updatedAt?: string;
  passwordUpdatedAt?: string;
};

export type UserProfile = PublicUserProfile & {
  passwordHash?: string;
  passwordSalt?: string;
  passwordAlgo?: 'scrypt-sha256';
};

export type ColumnOwner = {
  username: string;
  displayName: string;
  mainColumnId: string;
};

type ProfileMap = Record<string, UserProfile>;

const PROFILE_FILE = 'user-profiles.json';
const PASSWORD_KEY_BYTES = 32;

function profileFile(dataDir: string) {
  return path.join(dataDir, PROFILE_FILE);
}

function nowIso(now = new Date()) {
  return now.toISOString();
}

function normalizeProfile(username: string, profile: Partial<UserProfile> | undefined): UserProfile {
  return {
    username,
    mainColumnId: profile?.mainColumnId || null,
    updatedAt: profile?.updatedAt,
    passwordUpdatedAt: profile?.passwordUpdatedAt,
    passwordHash: profile?.passwordHash,
    passwordSalt: profile?.passwordSalt,
    passwordAlgo: profile?.passwordAlgo,
  };
}

export function readUserProfiles(dataDir: string): ProfileMap {
  try {
    const raw = JSON.parse(fs.readFileSync(profileFile(dataDir), 'utf8')) as Record<string, Partial<UserProfile>>;
    return Object.fromEntries(Object.entries(raw).map(([username, profile]) => [username, normalizeProfile(username, profile)]));
  } catch {
    return {};
  }
}

function writeUserProfiles(dataDir: string, profiles: ProfileMap) {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(profileFile(dataDir), JSON.stringify(profiles, null, 2));
}

export function getUserProfile(dataDir: string, username: string): UserProfile {
  const profiles = readUserProfiles(dataDir);
  return normalizeProfile(username, profiles[username]);
}

export function getPublicUserProfile(dataDir: string, username: string): PublicUserProfile {
  const profile = getUserProfile(dataDir, username);
  const publicProfile: PublicUserProfile = {
    username: profile.username,
    mainColumnId: profile.mainColumnId,
  };
  if (profile.updatedAt) publicProfile.updatedAt = profile.updatedAt;
  if (profile.passwordUpdatedAt) publicProfile.passwordUpdatedAt = profile.passwordUpdatedAt;
  return publicProfile;
}

function hashPassword(password: string, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, PASSWORD_KEY_BYTES).toString('hex');
  return { passwordHash: hash, passwordSalt: salt, passwordAlgo: 'scrypt-sha256' as const };
}

export function verifyUserProfilePassword(profile: UserProfile | null | undefined, password: string) {
  if (!profile?.passwordHash || !profile.passwordSalt) return false;
  const candidate = hashPassword(password, profile.passwordSalt).passwordHash;
  const expected = Buffer.from(profile.passwordHash, 'hex');
  const actual = Buffer.from(candidate, 'hex');
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

export function setUserPassword(dataDir: string, username: string, password: string, now = new Date()): UserProfile {
  const profiles = readUserProfiles(dataDir);
  const current = normalizeProfile(username, profiles[username]);
  const updated: UserProfile = {
    ...current,
    ...hashPassword(password),
    passwordUpdatedAt: nowIso(now),
    updatedAt: nowIso(now),
  };
  profiles[username] = updated;
  writeUserProfiles(dataDir, profiles);
  return updated;
}

export function setUserMainColumn(dataDir: string, username: string, mainColumnId: string | null, now = new Date()): UserProfile {
  const profiles = readUserProfiles(dataDir);
  const current = normalizeProfile(username, profiles[username]);
  const cleanedColumnId = mainColumnId ? String(mainColumnId).trim() : null;
  const updated: UserProfile = {
    ...current,
    mainColumnId: cleanedColumnId || null,
    updatedAt: nowIso(now),
  };
  profiles[username] = updated;
  writeUserProfiles(dataDir, profiles);
  return updated;
}

export function getColumnOwners(dataDir: string, users: Array<{ username: string; displayName: string }>): ColumnOwner[] {
  const profiles = readUserProfiles(dataDir);
  return users
    .map(user => {
      const mainColumnId = profiles[user.username]?.mainColumnId;
      return mainColumnId ? { username: user.username, displayName: user.displayName, mainColumnId } : null;
    })
    .filter((owner): owner is ColumnOwner => Boolean(owner))
    .sort((a, b) => a.username.localeCompare(b.username));
}
