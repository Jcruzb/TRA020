import React from "react";
import { number } from "../components.jsx";

export function ClientsPage({ query, setQuery, clients, locked, loadClient }) {
  return (
    <section className="card">
      <div className="section-head">
        <div>
          <div className="step-label">PASO 1</div>
          <h2>¿Con qué cliente vamos a trabajar?</h2>
          <p>
            Busca por nombre o NIF. Al abrirlo se cargarán sus vehículos,
            consumos, kilómetros y datos disponibles.
          </p>
        </div>
      </div>
      <label className="search">
        <span>Buscar cliente por nombre o NIF</span>
        <input
          type="search"
          placeholder="Ej. Sierra Norte o B12345678"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </label>
      <div className="client-grid">
        {clients.map((c) => (
          <article className="client-card" key={c.id}>
            <div className="client-monogram">
              {c.name
                .split(" ")
                .slice(0, 2)
                .map((w) => w[0])
                .join("")}
            </div>
            <h3>{c.name}</h3>
            <p>
              {c.nif} · {c.city}
            </p>
            <strong>{number(c.vehicles)} vehículos</strong>
            <button disabled={locked} onClick={() => loadClient(c.id)}>
              Abrir cliente
            </button>
          </article>
        ))}
      </div>
      {!clients.length && (
        <p className="empty">No hay clientes con ese nombre o NIF.</p>
      )}
      <p className="muted">
        Tres clientes ficticios para trabajar el flujo. La conexión final estará
        integrada en la app, sin una pestaña de configuración.
      </p>
    </section>
  );
}
