(function(root) {
  function versionLabel() {
    const info = root.FAMILY_CASHFLOW_VERSION || {};
    return info.label || 'Family Cashflow';
  }

  function applyVersionLabels() {
    document.querySelectorAll('[data-app-version]').forEach((el) => {
      el.textContent = versionLabel();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyVersionLabels, { once: true });
  } else {
    applyVersionLabels();
  }
})(typeof window !== 'undefined' ? window : globalThis);
