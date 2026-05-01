(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
    module.exports.MONTH_SESSION_KEY = api.MONTH_SESSION_KEY;
    module.exports.resolveStartupMonth = api.resolveStartupMonth;
  }
  root.MonthStart = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  const MONTH_SESSION_KEY = 'family_cashflow_selected_month';

  function resolveStartupMonth({ requestedMonth, currentMonth, sessionMonth }) {
    const shouldRedirect = Boolean(
      requestedMonth &&
      requestedMonth !== currentMonth &&
      sessionMonth !== requestedMonth
    );

    return {
      month: shouldRedirect ? currentMonth : (requestedMonth || currentMonth),
      shouldRedirect,
    };
  }

  return {
    MONTH_SESSION_KEY,
    resolveStartupMonth,
  };
});
