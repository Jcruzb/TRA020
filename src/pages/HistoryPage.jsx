import React from "react";
import { number, dateTime } from "../components.jsx";

export function HistoryPage({ store, jobs, locked, resume }) {
  return (
    <section className="card">
      <div className="section-head">
        <div>
          <h2>Historial de trabajos</h2>
          <p>
            Retoma cada expediente con sus datos, selección, formulario y
            adjuntos.
          </p>
        </div>
      </div>
      {!store ? (
        <p className="empty">
          Selecciona la carpeta del HTML para cargar o crear tu historial.
        </p>
      ) : jobs.length === 0 ? (
        <p className="empty">
          Todavía no hay trabajos guardados. Empieza buscando un cliente.
        </p>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Cliente / expediente</th>
                <th>Último cambio</th>
                <th>Vehículos</th>
                <th>Estado</th>
                <th>Descargas</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id}>
                  <td>
                    <b>{j.data.owner.razonSocial}</b>
                    <small>
                      {j.data.owner.nif} · {j.data.expediente.codigo}
                    </small>
                  </td>
                  <td>{dateTime(j.updatedAt)}</td>
                  <td>{number(j.selectedIds.length)}</td>
                  <td>{j.status}</td>
                  <td>{j.exports.length}</td>
                  <td>
                    <button
                      className="secondary"
                      disabled={locked}
                      onClick={() => resume(j)}
                    >
                      Retomar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="muted">
        Copia el HTML, historial.json y TRA020_archivos juntos para trasladar
        los trabajos. La última versión anterior del historial se conserva en
        historial.anterior.json.
      </p>
    </section>
  );
}
