const factor = { diesel: 10, gasoline: 9.19, glp: 7.16, natural_gas: 13.33 };
export function evaluate(v) {
  const kwh = factor[v.fuel] || 1;
  const pre = v.pre.km ? v.pre.liters * kwh * 100 / v.pre.km : 0;
  const post = v.post.km ? v.post.liters * kwh * 100 / v.post.km : 0;
  const saving = pre ? 1 - post / pre : 0;
  const kmDelta = v.pre.km ? Math.abs(v.post.km-v.pre.km) / v.pre.km : 1;
  const spain = v.fuelEvents.filter(e => e.country === 'ES' && e.automatic).length;
  const r = v.fuelEvents.length ? spain / v.fuelEvents.length : 0;
  const problems = [];
  if (!v.deviceId || !v.installedAt || !v.activatedAt) problems.push('Falta dispositivo, instalación o activación');
  if (v.pre.days !== 90 || v.post.days !== 90) problems.push('Los periodos deben ser de 90 días');
  if (kmDelta >= .4) problems.push('Variación de kilómetros igual o superior al 40 %');
  if (saving > .2) problems.push('Ahorro superior al 20 %');
  if (!v.fuelEvents.length || v.fuelEvents.some(e => !e.automatic)) problems.push('Faltan repostajes automáticos');
  if (v.feedback.reports < 6 || v.feedback.communicated < 6) problems.push('Retroalimentación insuficiente');
  return { pre, post, saving, kmDelta, r, problems, eligible: !problems.length, annualSaving: Math.max(0, (pre-post) * v.annualKm / 100 * r) };
}
