(function(root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
    module.exports.buildAppUrl = api.buildAppUrl;
    module.exports.goToApp = api.goToApp;
  }
  root.AppNav = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function(root) {
  function buildAppUrl(currentHref, path) {
    const url = new URL(currentHref);
    if (url.protocol === 'file:') {
      const base = url.href.substring(0, url.href.lastIndexOf('/') + 1);
      const file = path === '/' ? 'index.html' : path.replace(/^\//, '') + '.html';
      return base + file;
    }

    url.pathname = path;
    url.search = '';
    url.hash = '';
    return url.toString();
  }

  function goToApp(path, targetWindow) {
    const win = targetWindow || root;
    win.location.href = buildAppUrl(win.location.href, path);
  }

  return {
    buildAppUrl,
    goToApp,
  };
});
