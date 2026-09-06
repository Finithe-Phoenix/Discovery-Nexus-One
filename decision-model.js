/* Pure, transparent scenario arithmetic. No forecast, tax advice or default ROI. */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NexusDecisionModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const fields = Object.freeze({
    operations: { label: 'Operaciones mensuales', max: 1000000, integer: true },
    before: { label: 'Minutos actuales por operación', max: 1440 },
    after: { label: 'Minutos estimados con la solución', max: 1440 },
    hourly: { label: 'Costo por hora de trabajo', max: 100000 },
    realization: { label: 'Porcentaje convertible en ahorro de caja', max: 100 },
    monthly: { label: 'Costo mensual incremental', max: 100000000 },
    investment: { label: 'Inversión inicial', max: 1000000000 }
  });
  function calculate(raw) {
    const missing = [], errors = [], v = {};
    for (const [key, f] of Object.entries(fields)) {
      const input = raw?.[key];
      if (input === '' || input === null || input === undefined || (typeof input === 'string' && !input.trim())) { missing.push(key); continue; }
      if (!['number','string'].includes(typeof input)) { errors.push(f.label + ': captura un número válido.'); continue; }
      const n = Number(input);
      if (!Number.isFinite(n) || n < 0 || n > f.max || (f.integer && !Number.isInteger(n))) {
        errors.push(f.label + ': valor fuera de rango' + (f.integer ? ' o no entero.' : '.')); continue;
      }
      v[key] = n;
    }
    if (errors.length || missing.length) return Object.freeze({ ready: false, errors, missing });
    // Higher post-change time is an explicit negative scenario, not clamped away.
    const hours = v.operations * (v.before - v.after) / 60;
    const capacityValue = hours * v.hourly;
    const cashGross = Math.round(capacityValue * v.realization) / 100;
    const cashNet = Math.round((cashGross - v.monthly) * 100) / 100;
    const payback = cashNet > 0 && v.investment > 0 ? v.investment / cashNet : null;
    const annualNet = cashNet * 12 - v.investment;
    return Object.freeze({ ready: true, inputs: Object.freeze(v), hours, capacityValue, cashGross, cashNet, payback,
      annualNet, negativeTime: hours < 0, hasInvestment: v.investment > 0,
      // Month zero includes upfront investment. No discounting, tax or inflation.
      series: Object.freeze(Array.from({ length: 13 }, (_, month) => Object.freeze({ month, value: cashNet * month - v.investment }))) });
  }
  return Object.freeze({ fields, calculate });
});
