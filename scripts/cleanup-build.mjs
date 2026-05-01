import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, '..');

const ROOT_DIRS = new Set(['dist', 'coverage', 'test-results', '.nyc_output']);
const ROOT_FILES = new Set(['family_cashflow.tar']);
const RECURSIVE_FILE_NAMES = new Set(['.DS_Store']);
const ROOT_FILE_PATTERNS = [/^family_cashflow_v.+\.tar\.gz$/, /^npm-debug\.log.*$/, /^yarn-error\.log.*$/, /^pnpm-debug\.log.*$/];
const RECURSIVE_FILE_PATTERNS = [/\.tsbuildinfo$/];
const SKIP_DIRS = new Set(['node_modules', '.git', 'data']);

function shouldRemoveRootFile(name) {
  return ROOT_FILES.has(name) || ROOT_FILE_PATTERNS.some((pattern) => pattern.test(name));
}

function shouldRemoveRecursiveFile(name) {
  return RECURSIVE_FILE_NAMES.has(name) || RECURSIVE_FILE_PATTERNS.some((pattern) => pattern.test(name));
}

function removePath(target, removed) {
  if (!fs.existsSync(target)) return;
  fs.rmSync(target, { recursive: true, force: true });
  removed.push(target);
}

function walkAndClean(dir, removed) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walkAndClean(target, removed);
      continue;
    }
    if (entry.isFile() && shouldRemoveRecursiveFile(entry.name)) {
      removePath(target, removed);
    }
  }
}

export function cleanupBuildArtifacts(root = ROOT) {
  const removed = [];

  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    const target = path.join(root, entry.name);
    if (entry.isDirectory() && ROOT_DIRS.has(entry.name)) {
      removePath(target, removed);
      continue;
    }
    if (entry.isFile() && shouldRemoveRootFile(entry.name)) {
      removePath(target, removed);
    }
  }

  walkAndClean(root, removed);
  return removed;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const removed = cleanupBuildArtifacts();
  if (removed.length) {
    console.log('Cleaned build/commit artifacts:');
    removed.forEach((target) => console.log(`- ${path.relative(ROOT, target)}`));
  } else {
    console.log('No build/commit cleanup needed.');
  }
}
