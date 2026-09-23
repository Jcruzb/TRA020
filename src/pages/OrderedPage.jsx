import { SignedFileInput } from "../components/SignedFileInput.jsx";
import React from "react";

export function OrderedPage({ job, locked, attach, selected, requestExport }) {
  return (
    <div className="two">
      <section className="card">
        <div className="step-label">PASO 4</div>
        <h2>Reúne los documentos firmados</h2>
        <p>
          Adjunta los documentos correspondientes a esta selección y revisión
          del expediente.
        </p>
        {[
          ["calculation", "Cálculo del ahorro firmado"],
          ["anexo", "Anexo I firmado"],
          ["commitment", "Compromiso del Gerente firmado"],
        ].map(([id, label]) => (
          <SignedFileInput
            key={`${id}-${job.revision}`}
            label={label}
            disabled={locked}
            file={job.signed[id]}
            onAttach={(file) => attach(id, file)}
          />
        ))}
        <p className="muted">
          Adjuntar un archivo no verifica su firma. Los documentos se conservan
          en la carpeta del trabajo al conectar el historial.
        </p>
        <button
          disabled={locked || !selected.size}
          onClick={() => requestExport("ordered")}
        >
          Generar expediente ordenado (.zip)
        </button>
      </section>
      <section className="card">
        <h2>Qué incluye el ZIP</h2>
        <ul className="checklist">
          <li>
            ActuacionE1.zip con las carpetas E1-1, E1-2, E1-3-1 a E1-3-8 y E1-4.
          </li>
          <li>
            Cálculo Excel y PDF firmado, Anexo I firmado, informe completo y
            Compromiso del Gerente firmado.
          </li>
          <li>
            Convenios, dictamen y documentos aún no recibidos: carpetas vacías.
          </li>
          <li>Máximo 10 MB por archivo y ZIP; 50 MB en total por envío.</li>
        </ul>
        <p className="path-preview">ActuacionE1.zip</p>
        <div className="help">
          <b>Documentos pendientes</b>
          <p>
            Facturas y certificado r llegarán por API. Certificado del software
            e informe técnico se integrarán cuando los facilites. El límite
            total de la sede incluye también los archivos que añadas fuera de la
            app.
          </p>
        </div>
      </section>
    </div>
  );
}
