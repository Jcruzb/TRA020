import { DocumentDownload } from "../components/DocumentDownload.jsx";
import React from "react";
import { AnnexForm, number } from "../components.jsx";

export function DocumentsPage({
  data,
  job,
  locked,
  change,
  selected,
  requestExport,
  setPage,
}) {
  return (
    <div className="documents-layout">
      <section className="card">
        <AnnexForm
          data={data}
          overrides={job.annex}
          disabled={locked}
          onChange={(annex) => change({ annex })}
        />
      </section>
      <aside className="card download-card">
        <div className="step-label">PASO 3</div>
        <h2>Documentos para firma</h2>
        <p>
          Se generan con los {number(data.vehicles.length)} vehículos
          seleccionados.
        </p>
        {[
          [
            "calculation",
            "Cálculo del ahorro para firma",
            "PDF preliminar con resumen y detalle por vehículo. Descárgalo, fírmalo y adjúntalo en el siguiente paso.",
          ],
          [
            "anexo",
            "Anexo I oficial editable",
            "Documento original del Ministerio. Los campos quedan editables, incluida la relación adicional de equipos.",
          ],
          [
            "fleet",
            "Informe del gestor de flota",
            "Excel con identificación, instalación, activación y desempeño.",
          ],
          [
            "fuel",
            "Registro de repostajes",
            "Excel con eventos automáticos, localización, odómetro y país.",
          ],
          [
            "commitment",
            "Compromiso del Gerente",
            "Borrador PDF con relación de flota. Pendiente del modelo oficial.",
          ],
        ].map(([kind, title, desc]) => (
          <DocumentDownload
            key={kind}
            title={title}
            description={desc}
            format={kind === "fleet" || kind === "fuel" ? "Excel" : "PDF"}
            disabled={locked || !selected.size}
            onDownload={() => requestExport(kind)}
          />
        ))}
        <button
          disabled={locked || !selected.size}
          onClick={() => requestExport("unsigned")}
        >
          Descargar todos en ZIP
        </button>
        <button
          className="secondary full"
          disabled={locked}
          onClick={() => setPage("ordered")}
        >
          Continuar al expediente →
        </button>
      </aside>
    </div>
  );
}
