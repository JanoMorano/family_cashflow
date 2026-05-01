import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

test('build cleanup removes only generated build and commit noise', async () => {
  const { cleanupBuildArtifacts } = await import('../scripts/cleanup-build.mjs');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'family-cashflow-cleanup-'));

  const filesToRemove = [
    '.DS_Store',
    'src/.DS_Store',
    'family_cashflow.tar',
    'family_cashflow_v1.0.0.tar.gz',
    'npm-debug.log',
    'vite.config.tsbuildinfo',
    'nested/typescript.tsbuildinfo',
  ];
  const dirsToRemove = ['dist', 'coverage', 'test-results', '.nyc_output'];
  const filesToKeep = ['.env', 'package-lock.json', 'data/budget-2026-05.json', 'node_modules/keep.txt'];

  for (const file of [...filesToRemove, ...filesToKeep]) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), 'x');
  }
  for (const dir of dirsToRemove) {
    fs.mkdirSync(path.join(root, dir), { recursive: true });
    fs.writeFileSync(path.join(root, dir, 'artifact.txt'), 'x');
  }

  const removed = cleanupBuildArtifacts(root);

  for (const file of filesToRemove) {
    assert.equal(fs.existsSync(path.join(root, file)), false, `${file} should be removed`);
  }
  for (const dir of dirsToRemove) {
    assert.equal(fs.existsSync(path.join(root, dir)), false, `${dir} should be removed`);
  }
  for (const file of filesToKeep) {
    assert.equal(fs.existsSync(path.join(root, file)), true, `${file} should be kept`);
  }
  assert.ok(removed.some((entry) => entry.endsWith('.DS_Store')));
});

test('build.sh runs cleanup before creating the versioned archive', () => {
  const build = fs.readFileSync('build.sh', 'utf8');
  const exportBuild = fs.readFileSync('build-and-export.sh', 'utf8');

  assert.match(build, /node scripts\/cleanup-build\.mjs/);
  assert.ok(
    build.indexOf('node scripts/cleanup-build.mjs') < build.indexOf('docker build'),
    'cleanup should run before docker build',
  );
  assert.match(exportBuild, /cleanup-build\.mjs/);
  assert.ok(
    exportBuild.indexOf('cleanup-build.mjs') < exportBuild.indexOf('docker build'),
    'cleanup should run before docker build in build-and-export.sh',
  );
});
