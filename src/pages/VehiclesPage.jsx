import React from "react";
import { Metric, number } from "../components.jsx";
import { evaluate } from "../domain/evaluate.js";
export function VehiclesPage({
  job,
  selected,
  valid,
  total,
  locked,
  setPage,
  vehicleQuery,
  setVehicleQuery,
  setVehiclePage,
  change,
  rows,
  currentStats,
  toggleVehicle,
  filtered,
  vehiclePage,
  pagination,
}) {
  return (
    <>
      <div className="metrics">
        <Metric
          label="Flota del cliente"
          value={number(job.data.vehicles.length)}
        />
        <Metric label="Seleccionados" value={number(selected.size)} />
        <Metric label="Sin alertas preliminares" value={number(valid.length)} />
        <Metric label="Ahorro estimado" value={`${number(total)} kWh/año`} />
      </div>
      <section className="card">
        <div className="section-head">
          <div>
            <div className="step-label">PASO 2</div>
            <h2>Selecciona los vehículos del expediente</h2>
          </div>
          <button
            disabled={!selected.size || locked}
            onClick={() => setPage("documents")}
          >
            Continuar a documentos →
          </button>
        </div>
        <div className="toolbar">
          <label className="search">
            <span>Filtrar vehículos</span>
            <input
              value={vehicleQuery}
              onChange={(e) => {
                setVehicleQuery(e.target.value);
                setVehiclePage(0);
              }}
              placeholder="Matrícula, marca, dispositivo o bastidor"
            />
          </label>
          <button
            className="secondary"
            disabled={locked}
            onClick={() =>
              change({ selectedIds: job.data.vehicles.map((v) => v.id) })
            }
          >
            Seleccionar todos ({job.data.vehicles.length})
          </button>
          <button
            className="secondary"
            disabled={locked}
            onClick={() => change({ selectedIds: [] })}
          >
            Quitar selección
          </button>
        </div>
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Incluir</th>
                <th>Vehículo</th>
                <th>Dispositivo</th>
                <th>Km pre / post</th>
                <th>Consumo pre / post</th>
                <th>Revisión</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((v) => {
                const x = currentStats.get(v.id) || evaluate(v);
                return (
                  <tr
                    key={v.id}
                    className={selected.has(v.id) ? "selected-row" : ""}
                  >
                    <td>
                      <input
                        type="checkbox"
                        aria-label={`Incluir ${v.plate}`}
                        disabled={locked}
                        checked={selected.has(v.id)}
                        onChange={() => toggleVehicle(v.id)}
                      />
                    </td>
                    <td>
                      <b>{v.plate}</b>
                      <small>
                        {v.brand} {v.model}
                      </small>
                    </td>
                    <td>
                      {v.deviceId}
                      <small>Activado: {v.activatedAt}</small>
                    </td>
                    <td>
                      {number(v.pre.km)} / {number(v.post.km)}
                    </td>
                    <td>
                      {number(v.pre.liters)} / {number(v.post.liters)} l
                    </td>
                    <td>
                      <span
                        className={`badge ${x.eligible ? "ok" : "pending"}`}
                      >
                        {x.eligible ? "Sin alertas" : "Revisar"}
                      </span>
                      {x.problems[0] && <small>{x.problems[0]}</small>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {!rows.length && (
          <p className="empty">No hay vehículos que coincidan.</p>
        )}
        <div className="pagination">
          <span>
            {filtered.length} vehículos · Página{" "}
            {Math.min(vehiclePage + 1, pagination) || 1} de {pagination || 1}
          </span>
          <button
            className="secondary"
            disabled={!vehiclePage}
            onClick={() => setVehiclePage((v) => v - 1)}
          >
            Anterior
          </button>
          <button
            className="secondary"
            disabled={vehiclePage + 1 >= pagination}
            onClick={() => setVehiclePage((v) => v + 1)}
          >
            Siguiente
          </button>
        </div>
        <p className="muted">
          Cálculos preliminares del prototipo. «Sin alertas» no acredita
          elegibilidad ni sustituye la revisión del expediente.
        </p>
      </section>
    </>
  );
}
