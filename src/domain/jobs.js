export function createJob(data) {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  return {
    id,
    createdAt: now,
    updatedAt: now,
    revision: 1,
    status: "En preparación",
    data: {
      ...data,
      expediente: {
        ...data.expediente,
        codigo: `E${now.slice(0, 10).replaceAll("-", "")}-${id.slice(0, 6)}`,
      },
    },
    selectedIds: data.vehicles.map((v) => v.id),
    annex: {},
    signed: {},
    exports: [],
  };
}
export function selectedData(job) {
  const selected = new Set(job.selectedIds);
  return {
    ...job.data,
    vehicles: job.data.vehicles.filter((v) => selected.has(v.id)),
  };
}
export function reviseJob(job, patch) {
  // Los adjuntos corresponden a una revisión concreta de datos y selección.
  return {
    ...job,
    ...patch,
    signed: {},
    status: "En preparación",
    revision: job.revision + 1,
    updatedAt: new Date().toISOString(),
  };
}
export function validateClientData(data) {
  if (
    !data?.client?.id ||
    !data.expediente?.codigo ||
    !data.owner?.razonSocial ||
    !data.provider ||
    !Array.isArray(data.vehicles) ||
    !Array.isArray(data.evidence)
  )
    throw new Error("La respuesta del cliente está incompleta.");
  const ids = new Set();
  for (const v of data.vehicles) {
    if (
      !v.id ||
      ids.has(v.id) ||
      !v.plate ||
      !v.pre ||
      !v.post ||
      !v.feedback ||
      !Array.isArray(v.fuelEvents)
    )
      throw new Error(
        "La respuesta contiene vehículos incompletos o duplicados.",
      );
    ids.add(v.id);
    for (const n of [
      v.pre.days,
      v.pre.km,
      v.pre.liters,
      v.post.days,
      v.post.km,
      v.post.liters,
      v.annualKm,
      v.feedback.reports,
      v.feedback.communicated,
    ])
      if (!Number.isFinite(n) || n < 0)
        throw new Error(`Datos numéricos inválidos en ${v.plate}.`);
  }
  return data;
}
