import React from "react";
import { ConfirmIncomplete, number } from "./components.jsx";
import { useExpediente } from "./hooks/useExpediente.js";
import { ClientsPage } from "./pages/ClientsPage.jsx";
import { VehiclesPage } from "./pages/VehiclesPage.jsx";
import { DocumentsPage } from "./pages/DocumentsPage.jsx";
import { OrderedPage } from "./pages/OrderedPage.jsx";
import { HistoryPage } from "./pages/HistoryPage.jsx";

export default function App() {
  const {
    page,
    setPage,
    query,
    setQuery,
    clients,
    store,
    jobs,
    job,
    saveState,
    notice,
    setNotice,
    vehicleQuery,
    setVehicleQuery,
    vehiclePage,
    setVehiclePage,
    busy,
    ready,
    confirm,
    setConfirm,
    data,
    selected,
    valid,
    total,
    filtered,
    pagination,
    rows,
    currentStats,
    locked,
    connectFolder,
    persist,
    loadClient,
    resume,
    change,
    toggleVehicle,
    attach,
    requestExport,
    generate,
    taskRef,
  } = useExpediente();
  return (
    <>
      <header>
        <div className="header-inner">
          <div>
            <div className="eyebrow">CAE STUDIO · TRA020</div>
            <h1>Expedientes de telemetría</h1>
            <p>Del cliente al expediente, con cada trabajo guardado.</p>
          </div>
          <span className="demo-label">Datos simulados</span>
        </div>
      </header>
      <main>
        <div className="storage-bar">
          <div>
            <strong>
              {store
                ? `Carpeta: ${store.directory.name}`
                : "Conecta la carpeta donde guardas el HTML"}
            </strong>
            <small>
              {store
                ? "historial.json · TRA020_archivos/ · Sin base de datos"
                : "La primera vez se crearán historial.json y la carpeta TRA020_archivos. Al volver, selecciona la misma carpeta."}
            </small>
          </div>
          <button
            className="secondary"
            disabled={locked}
            onClick={connectFolder}
          >
            {store ? "Cambiar / volver a abrir carpeta" : "Seleccionar carpeta"}
          </button>
        </div>
        {!store && (
          <p className="help">
            Puedes explorar la simulación. Para conservar y retomar trabajos,
            selecciona la carpeta del HTML y permite guardar archivos.
          </p>
        )}
        <nav aria-label="Secciones">
          <button
            disabled={locked}
            className={page === "clients" ? "active" : ""}
            onClick={() => setPage("clients")}
          >
            1. Cliente
          </button>
          <button
            disabled={!job || locked}
            className={page === "vehicles" ? "active" : ""}
            onClick={() => setPage("vehicles")}
          >
            2. Vehículos
          </button>
          <button
            disabled={!job || locked}
            className={page === "documents" ? "active" : ""}
            onClick={() => setPage("documents")}
          >
            3. Documentos para firma
          </button>
          <button
            disabled={!job || locked}
            className={page === "ordered" ? "active" : ""}
            onClick={() => setPage("ordered")}
          >
            4. Expediente ordenado
          </button>
          <button
            disabled={locked}
            className={page === "history" ? "active" : ""}
            onClick={() => setPage("history")}
          >
            Historial <span>{jobs.length}</span>
          </button>
        </nav>
        {notice && (
          <div
            role={notice.type === "error" ? "alert" : "status"}
            className={`notice ${notice.type}`}
          >
            <span>{notice.text}</span>
            <button
              className="dismiss"
              aria-label="Cerrar mensaje"
              onClick={() => setNotice(null)}
            >
              ×
            </button>
          </div>
        )}
        {job && (
          <div className="job-bar">
            <div>
              <b>{job.data.owner.razonSocial}</b>
              <small>
                {job.data.owner.nif} · {job.data.expediente.codigo} ·{" "}
                {number(job.selectedIds.length)} vehículos seleccionados
              </small>
            </div>
            <div className="save-status">
              <span>{saveState}</span>
              <button
                className="secondary"
                disabled={!store || locked}
                onClick={() => persist()}
              >
                Guardar ahora
              </button>
            </div>
          </div>
        )}
        {busy && (
          <div className="progress-panel" role="status">
            <div>
              <strong>{busy.label}</strong>
              <span>{busy.percent}%</span>
            </div>
            <progress max="100" value={busy.percent} />
            <button
              className="secondary"
              onClick={() => taskRef.current?.cancel()}
              disabled={!taskRef.current}
            >
              Cancelar generación
            </button>
          </div>
        )}
        {ready && (
          <div className="ready-panel" role="status">
            <div>
              <strong>
                Archivo listo en {(ready.elapsedMs / 1000).toFixed(1)} s
              </strong>
              <small>
                {ready.name} · {(ready.size / 1024 / 1024).toFixed(2)} MB
              </small>
              <p>Si Chrome no inició la descarga, guárdalo con este enlace.</p>
            </div>
            <a className="button-link" href={ready.url} download={ready.name}>
              Guardar archivo
            </a>
          </div>
        )}
        {page === "clients" && (
          <ClientsPage
            query={query}
            setQuery={setQuery}
            clients={clients}
            locked={locked}
            loadClient={loadClient}
          />
        )}
        {page === "vehicles" && job && (
          <VehiclesPage
            job={job}
            selected={selected}
            valid={valid}
            total={total}
            locked={locked}
            setPage={setPage}
            vehicleQuery={vehicleQuery}
            setVehicleQuery={setVehicleQuery}
            setVehiclePage={setVehiclePage}
            change={change}
            rows={rows}
            currentStats={currentStats}
            toggleVehicle={toggleVehicle}
            filtered={filtered}
            vehiclePage={vehiclePage}
            pagination={pagination}
          />
        )}
        {page === "documents" && data && (
          <DocumentsPage
            data={data}
            job={job}
            locked={locked}
            change={change}
            selected={selected}
            requestExport={requestExport}
            setPage={setPage}
          />
        )}
        {page === "ordered" && data && (
          <OrderedPage
            job={job}
            locked={locked}
            attach={attach}
            selected={selected}
            requestExport={requestExport}
          />
        )}
        {page === "history" && (
          <HistoryPage
            store={store}
            jobs={jobs}
            locked={locked}
            resume={resume}
          />
        )}
        <footer>
          TRA020 · Trabajo local · Simulación de proveedor ·{" "}
          {store ? "Guardado en archivos JSON" : "Sin carpeta conectada"}
        </footer>
      </main>
      {confirm && (
        <ConfirmIncomplete
          missing={confirm.missing}
          onCancel={() => setConfirm(null)}
          onConfirm={() => generate(confirm.kind)}
        />
      )}
    </>
  );
}
