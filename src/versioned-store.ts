import crypto from 'crypto';
import fs from 'fs';

export class VersionConflictError extends Error {
  constructor(
    public readonly expectedVersion: string,
    public readonly currentVersion: string,
    public readonly currentData: unknown,
  ) {
    super('Version conflict');
    this.name = 'VersionConflictError';
  }
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;

  return `{${Object.keys(value as Record<string, unknown>)
    .sort()
    .map(key => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`)
    .join(',')}}`;
}

export function stableVersion(data: unknown): string {
  return crypto.createHash('sha256').update(stableStringify(data)).digest('hex');
}

export function readVersionedJSON(file: string): { data: unknown; version: string } | null {
  try {
    const data = JSON.parse(fs.readFileSync(file, 'utf8'));
    return { data, version: stableVersion(data) };
  } catch {
    return null;
  }
}

export function writeVersionedJSON(file: string, data: unknown, expectedVersion?: string | null) {
  const current = readVersionedJSON(file);
  const currentVersion = current?.version ?? '';

  if (expectedVersion != null && expectedVersion !== currentVersion) {
    throw new VersionConflictError(expectedVersion, currentVersion, current?.data ?? null);
  }

  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  return { version: stableVersion(data) };
}
