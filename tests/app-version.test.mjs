import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

test('build exposes the package version as the visible Family Cashflow label', () => {
  const source = fs.readFileSync('public/js/app-version.js', 'utf8');

  assert.equal(pkg.version, '1.1.0');
  assert.match(source, /version:\s*"1\.1\.0"/);
  assert.match(source, /displayVersion:\s*"1\.1"/);
  assert.match(source, /label:\s*"Family Cashflow 1\.1"/);
});

test('main pages include a visible app version target', () => {
  for (const file of ['public/index.html', 'public/login.html', 'public/history.html', 'public/energy.html', 'public/gas.html']) {
    const html = fs.readFileSync(file, 'utf8');
    assert.match(html, /\/js\/app-version\.js/, `${file} loads generated version data`);
    assert.match(html, /\/js\/app-version-label\.js/, `${file} loads version label helper`);
    assert.match(html, /data-app-version/, `${file} renders a version label target`);
  }
});

test('login can load public JavaScript assets before authentication', () => {
  const source = fs.readFileSync('src/index.ts', 'utf8');
  const publicJsRoute = source.indexOf("app.use('/js', express.static(path.join(pub, 'js')))");
  const authGate = source.indexOf('app.use(requireAuth)');

  assert.notEqual(publicJsRoute, -1);
  assert.ok(publicJsRoute < authGate, 'public /js assets must be registered before requireAuth');
});

test('export archive name includes the full package version', async () => {
  const versionModule = await import('../scripts/write-version.mjs');
  const info = versionModule.buildVersionInfo(pkg);
  const buildScript = fs.readFileSync('build.sh', 'utf8');
  const exportScript = fs.readFileSync('build-and-export.sh', 'utf8');

  assert.equal(info.archiveName, 'family_cashflow_v1.1.0.tar.gz');
  assert.match(buildScript, /archive-name/);
  assert.match(buildScript, /gzip/);
  assert.match(exportScript, /archive-name/);
  assert.match(exportScript, /gzip/);
});

test('Docker build copies version inputs before running npm build', () => {
  const dockerfile = fs.readFileSync('Dockerfile', 'utf8');
  const scriptsCopy = dockerfile.indexOf('COPY scripts ./scripts');
  const publicCopy = dockerfile.indexOf('COPY public ./public');
  const buildStep = dockerfile.indexOf('RUN npm run build');

  assert.notEqual(scriptsCopy, -1, 'Dockerfile must copy scripts for write-version.mjs');
  assert.notEqual(publicCopy, -1, 'Dockerfile must copy public so version assets are generated in place');
  assert.notEqual(buildStep, -1, 'Dockerfile must run npm build');
  assert.ok(scriptsCopy < buildStep, 'scripts must be copied before npm run build');
  assert.ok(publicCopy < buildStep, 'public must be copied before npm run build');
});
