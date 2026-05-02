(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = api;
    module.exports.averageMonthlyCost = api.averageMonthlyCost;
  }
  root.UtilityCosts = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  const DAYS_PER_MONTH = 30.44;

  function averageMonthlyCost(intervals) {
    const valid = (intervals || []).filter(interval => {
      const days = Number(interval?.days);
      const cost = Number(interval?.cost);
      return !interval?.warn && Number.isFinite(days) && days > 0 && Number.isFinite(cost);
    });
    const totalDays = valid.reduce((sum, interval) => sum + Number(interval.days), 0);
    if (!totalDays) return null;

    const totalCost = valid.reduce((sum, interval) => sum + Number(interval.cost), 0);
    return (totalCost / totalDays) * DAYS_PER_MONTH;
  }

  return {
    DAYS_PER_MONTH,
    averageMonthlyCost,
  };
});
