import { useMemo } from "react";
import { evaluate } from "../domain/evaluate.js";
export function useVehicleSelection(job, data, vehicleQuery, vehiclePage) {
  const selected = useMemo(
    () => new Set(job?.selectedIds || []),
    [job?.selectedIds],
  );
  const evaluated = useMemo(
    () => data?.vehicles.map((v) => ({ v, x: evaluate(v) })) || [],
    [data],
  );
  const valid = evaluated.filter(({ x }) => x.eligible),
    total = valid.reduce((sum, { x }) => sum + x.annualSaving, 0);
  const filtered = useMemo(
    () =>
      job?.data.vehicles.filter((v) =>
        `${v.plate} ${v.brand} ${v.deviceId} ${v.vin}`
          .toLowerCase()
          .includes(vehicleQuery.toLowerCase()),
      ) || [],
    [job?.data, vehicleQuery],
  );
  const pagination = Math.ceil(filtered.length / 30),
    rows = filtered.slice(vehiclePage * 30, vehiclePage * 30 + 30);
  const currentStats = useMemo(
    () => new Map(evaluated.map(({ v, x }) => [v.id, x])),
    [evaluated],
  );
  return { selected, valid, total, filtered, pagination, rows, currentStats };
}
