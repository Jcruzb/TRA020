import { jsPDF } from "jspdf";
import * as XLSX from "xlsx";
import JSZip from "jszip";
import { declarationPdf } from "./annexPdf.js";
export { declarationPdf } from "./annexPdf.js";

import { evaluate } from "./evaluate.js";
export { evaluate } from "./evaluate.js";
const f = (n) =>
  new Intl.NumberFormat("es-ES", { maximumFractionDigits: 2 }).format(n || 0);
const date = (value) =>
  value ? new Date(value).toLocaleDateString("es-ES") : "—";
const safe = (value) => String(value || "").replace(/[\\/:*?"<>|]/g, "-");
export const folderTemplate = [
  [
    "00_Datos_API",
    "Respuesta original, exportaciones y trazabilidad de extracción",
  ],
  [
    "01_Formulario_oficial",
    "Formulario TRA020 emitido por la hoja del Coordinador Nacional",
  ],
  [
    "02_Declaracion_ayudas",
    "Anexo I firmado por el propietario inicial del ahorro",
  ],
  ["03_Facturas", "Facturas de inversión o de servicio activo"],
  [
    "04_Certificados_instalacion",
    "Certificados firmados por empresa instaladora",
  ],
  ["05_Informe_gestor_flota", "Informe y Excel de caracterización de la flota"],
  [
    "06_Registros_repostaje",
    "Registro automático de repostajes y cruce de kilómetros",
  ],
  ["07_Informe_tecnico", "Informe técnico y certificados del proveedor"],
  ["08_Compromiso_gerente", "Compromiso firmado y caracterización detallada"],
  ["09_Firmados", "Copias finales firmadas electrónicamente"],
];
function pdfHeader(doc, title, exp) {
  doc.setFontSize(16);
  doc.text(title, 15, 18);
  doc.setFontSize(10);
  doc.text(`Expediente ${exp.codigo} · TRA020 V2.0`, 15, 25);
  doc.line(15, 28, 195, 28);
}
function pdfLines(doc, lines, y = 37) {
  doc.setFontSize(10);
  lines.forEach((line) => {
    const wrapped = doc.splitTextToSize(line, 180);
    if (y + wrapped.length * 5 > 275) {
      doc.addPage();
      y = 20;
    }
    doc.text(wrapped, 15, y);
    y += wrapped.length * 5 + 3;
  });
  return y;
}
export function managerCommitmentPdf(data) {
  const { expediente: e, owner: o, provider, vehicles } = data;
  const doc = new jsPDF();
  pdfHeader(doc, "COMPROMISO DEL GERENTE · TRA020", e);
  let y = pdfLines(
    doc,
    [
      `D./Dña. ${o.representante}, en calidad de ${o.cargo} de ${o.razonSocial}, se compromete a mantener activo el sistema de ayuda a la conducción eficiente y la retroalimentación al conductor en toda la flota objeto de la actuación durante la vida útil comprometida.`,
      "",
      "Caracterización detallada de la flota",
      `Empresa gestora: ${o.razonSocial} · NIF: ${o.nif}`,
      `Proveedor tecnológico: ${provider.nombre}`,
      `Modalidad de retroalimentación: ${provider.feedbackMode}`,
      `Número de vehículos caracterizados: ${vehicles.length}`,
      "",
      "La caracterización individual se incorpora como anexo y recoge matrícula, bastidor, categoría/tipo, marca, modelo, año, combustible, servicio, identificador y denominación telemática, fecha de instalación y activación, y datos de desempeño.",
      "",
      "El firmante declara que los vehículos incluidos están operativos, se gestionan por la empresa indicada y se mantendrá la solución y su mecanismo de retroalimentación conforme a la actuación.",
    ],
    37,
  );
  if (y > 250) {
    doc.addPage();
    y = 20;
  }
  y += 5;
  doc.setFontSize(9);
  doc.text("Matrícula", 15, y);
  doc.text("Dispositivo", 55, y);
  doc.text("Servicio", 100, y);
  doc.text("Activación", 155, y);
  y += 5;
  vehicles.forEach((v) => {
    if (y > 270) {
      doc.addPage();
      y = 20;
    }
    doc.text(v.plate, 15, y);
    doc.text(v.deviceId, 55, y);
    doc.text(doc.splitTextToSize(v.service, 48)[0], 100, y);
    doc.text(date(v.activatedAt), 155, y);
    y += 6;
  });
  if (y > 255) {
    doc.addPage();
    y = 20;
  }
  doc.setFontSize(10);
  doc.text(
    "En ____________________, a ____ de __________________ de 20___.",
    15,
    280,
  );
  doc.text("Fdo.: _______________________________________________", 15, 287);
  return new Uint8Array(doc.output("arraybuffer"));
}
export function fleetWorkbook(data) {
  const rows = data.vehicles.map((v) => {
    const x = evaluate(v);
    return {
      "Tipo de vehículo": v.type,
      Categoría: v.category,
      Marca: v.brand,
      Modelo: v.model,
      Año: v.year,
      Matrícula: v.plate,
      "Número de bastidor": v.vin,
      Combustible: v.fuel,
      Servicio: v.service,
      "ID dispositivo": v.deviceId,
      "Denominación telemática": v.telematicName,
      "Fecha instalación": v.installedAt,
      "Fecha activación": v.activatedAt,
      "Días pre": v.pre.days,
      "Km pre": v.pre.km,
      "Consumo pre (l)": v.pre.liters,
      "CEF pre (kWh/100km)": Number(x.pre.toFixed(3)),
      "Días post": v.post.days,
      "Km post": v.post.km,
      "Consumo post (l)": v.post.liters,
      "CEF post (kWh/100km)": Number(x.post.toFixed(3)),
      "Km anuales": v.annualKm,
      "r repostaje España": Number(x.r.toFixed(4)),
      "Ahorro combustible": Number(x.saving.toFixed(4)),
      "Ahorro anual (kWh)": Number(x.annualSaving.toFixed(0)),
      Estado: x.eligible ? "APTO" : "EXCLUIR",
      Observaciones: x.problems.join("; "),
    };
  });
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!freeze"] = { xSplit: 0, ySplit: 1 };
  ws["!autofilter"] = { ref: ws["!ref"] || "A1" };
  ws["!cols"] = Object.keys(rows[0] || {}).map((k) => ({
    wch: Math.min(32, Math.max(13, k.length + 2)),
  }));
  XLSX.utils.book_append_sheet(wb, ws, "Informe gestor flota");
  return XLSX.write(wb, { bookType: "xlsx", type: "array" });
}
export function fuelWorkbook(data) {
  const rows = data.vehicles.flatMap((v) =>
    v.fuelEvents.map((event) => ({
      Matrícula: v.plate,
      "ID dispositivo": v.deviceId,
      "ID evento": event.id,
      "Fecha y hora": event.at,
      Latitud: event.lat,
      Longitud: event.lng,
      País: event.country,
      "En España": event.country === "ES" ? "Sí" : "No",
      "Cantidad cargada": event.quantity,
      Odómetro: event.odometer,
      "Detección automática": event.automatic ? "Sí" : "No",
    })),
  );
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!autofilter"] = { ref: ws["!ref"] || "A1" };
  ws["!cols"] = Object.keys(rows[0] || {}).map((k) => ({
    wch: Math.max(14, k.length + 2),
  }));
  XLSX.utils.book_append_sheet(wb, ws, "Repostajes automáticos");
  return XLSX.write(wb, { bookType: "xlsx", type: "array" });
}

export const safeName = (value) =>
  String(value || "sin-nombre")
    .normalize("NFC")
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, "-")
    .replace(/\.{2,}/g, "-")
    .replace(/[. ]+$/g, "")
    .slice(0, 100) || "sin-nombre";
// Convención CAE Studio / Expediente Builder: cada expediente se identifica por
// su código; `documentos/` conserva originales y firmados, `outputs/` resultados.
const rootPath = (data) => `expedientes/${safeName(data.expediente.codigo)}`;

function actuationData(data, vehicles, index) {
  const actuation = `E${index + 1}`;
  return {
    ...data,
    expediente: {
      ...data.expediente,
      codigo: actuation,
      nombre: `${data.expediente.nombre} - actuación ${actuation}`,
    },
    vehicles,
  };
}

export const MAX_FILE_BYTES = 10_000_000;
export const MAX_TOTAL_BYTES = 50_000_000;
export function checkSize(size, name, limit = MAX_FILE_BYTES) {
  if (size > limit)
    throw new Error(
      `${name} supera el límite de ${limit / 1_000_000} MB. Reduce su tamaño antes de generar el expediente.`,
    );
}
export function calculationPdf(data) {
  const doc = new jsPDF();
  pdfHeader(doc, "CÁLCULO DEL AHORRO", data.expediente);
  pdfLines(doc, [
    `Cliente: ${data.owner.razonSocial} · NIF: ${data.owner.nif}`,
    `Vehículos: ${data.vehicles.length}`,
    `Ahorro anual total calculado: ${f(data.vehicles.reduce((sum, v) => sum + evaluate(v).annualSaving, 0))} kWh`,
    "Cálculo preliminar de la aplicación. Pendiente del formulario oficial.",
    "Detalle: CEF previo y posterior en kWh/100 km; ahorro anual en kWh.",
  ]);
  let y = 90;
  const header = () => {
    doc.setFontSize(9);
    ["Matrícula", "CEF previo", "CEF posterior", "r", "Ahorro anual"].forEach(
      (t, i) => doc.text(t, [15, 55, 90, 130, 155][i], y),
    );
    y += 8;
  };
  header();
  for (const v of data.vehicles) {
    if (y > 260) {
      doc.addPage();
      y = 20;
      header();
    }
    const x = evaluate(v);
    [v.plate, f(x.pre), f(x.post), x.r.toFixed(4), f(x.annualSaving)].forEach(
      (t, i) => doc.text(t, [15, 55, 90, 130, 155][i], y),
    );
    y += 7;
  }
  if (y > 235) {
    doc.addPage();
    y = 25;
  }
  pdfLines(
    doc,
    [
      "Lugar y fecha: ____________________________________",
      "Firmante: ________________________________________",
      "Firma: ___________________________________________",
    ],
    y + 12,
  );
  return new Uint8Array(doc.output("arraybuffer"));
}
// Se sustituirán por los originales cuando los facilite el usuario.
export const fixedDocuments = { software: null, technical: null };
async function generateActuationArchive(data, signed) {
  const zip = new JSZip();
  const dirs = [
    "E1-1 Convenio CAE/E1-1 Convenio CAE/",
    "E1-1 Convenio CAE/E1-2 Convenio de cesión de ahorro energético/",
    "E1-2 Dictamen favorable/",
    "E1-3-1 Formulario de cálculo del ahorro/E1-3-1-1 Excel/",
    "E1-3-1 Formulario de cálculo del ahorro/E1-3-1-2 PDF/",
    "E1-3-2 Anexo subvenciones Genérico de Transporte/E1-3-2/",
    "E1-3-3 Facturas/",
    "E1-3-4 Certificado del software/",
    "E1-3-5 Informe/",
    "E1-3-6 Certificado de cálculo parámetro r/",
    "E1-3-7 Informe de cumplimiento de requerimientos técnicos/",
    "E1-3-8 Compromiso del gerente/",
    "E1-4 Otros documentos justificativos/",
  ];
  dirs.forEach((path) => zip.folder(path));
  let total = 0;
  const add = (path, bytes) => {
    if (!(bytes instanceof ArrayBuffer) && !ArrayBuffer.isView(bytes))
      throw new Error("El documento debe contener un binario válido.");
    checkSize(bytes.byteLength, path);
    total += bytes.byteLength;
    checkSize(total, "Los documentos del expediente", MAX_TOTAL_BYTES);
    zip.file(path, bytes);
  };
  const signedFile = (path, id) =>
    add(
      path +
        (signed[id].name?.toLowerCase().endsWith(".p7m") ? ".p7m" : ".pdf"),
      signed[id].bytes,
    );
  add(dirs[3] + "calculo-ahorro.xlsx", fleetWorkbook(data));
  signedFile(dirs[4] + "calculo-ahorro-firmado", "calculation");
  signedFile(dirs[5] + "anexo-i-firmado", "anexo");
  add(dirs[8] + "informe-completo.xlsx", fleetWorkbook(data));
  signedFile(dirs[11] + "compromiso-gerente-firmado", "commitment");
  for (const [i, file] of (data.documents?.invoices || []).entries()) {
    const folder = dirs[6] + `E1-3-3-${i + 1} factura ${i + 1}/`;
    zip.folder(folder);
    if (file.bytes) add(folder + `factura-${i + 1}.pdf`, file.bytes);
  }
  if (data.documents?.rCertificate?.bytes)
    add(
      dirs[9] + "certificado-parametro-r.pdf",
      data.documents.rCertificate.bytes,
    );
  if (fixedDocuments.software)
    add(dirs[7] + "certificado-software.pdf", fixedDocuments.software);
  if (fixedDocuments.technical)
    add(dirs[10] + "informe-requisitos-tecnicos.pdf", fixedDocuments.technical);
  const bytes = await zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 3 },
  });
  checkSize(bytes.byteLength, "ActuacionE1.zip");
  return bytes;
}

export async function generateExport(
  { kind, data, annex = {}, signed = {} },
  progress = () => {},
) {
  if (!data.vehicles.length)
    throw new Error("Selecciona al menos un vehículo.");
  const started = performance.now();
  const code = safeName(data.expediente.codigo);
  let bytes, name, type;
  progress(5, "Preparando documentos");
  if (kind === "calculation") {
    bytes = calculationPdf(data);
    name = "calculo-ahorro-para-firma.pdf";
    type = "application/pdf";
  } else if (kind === "anexo") {
    bytes = await declarationPdf(data, annex);
    name = `${code}-anexo-i.pdf`;
    type = "application/pdf";
  } else if (kind === "commitment") {
    bytes = managerCommitmentPdf(data);
    name = `${code}-compromiso-gerente-borrador.pdf`;
    type = "application/pdf";
  } else if (kind === "fleet" || kind === "fuel") {
    bytes = kind === "fleet" ? fleetWorkbook(data) : fuelWorkbook(data);
    name =
      kind === "fleet"
        ? "calculo-ahorro.xlsx"
        : "registro-repostajes-automaticos.xlsx";
    type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  } else if (kind === "unsigned" || kind === "ordered") {
    if (kind === "ordered") {
      if (
        !signed.anexo?.bytes ||
        !signed.commitment?.bytes ||
        !signed.calculation?.bytes
      )
        throw new Error(
          "Adjunta el Anexo I, el cálculo del ahorro y el Compromiso del Gerente firmados.",
        );
      if (data.actuations?.length > 1)
        throw new Error(
          "Prepara una actuación por trabajo para asociar correctamente los documentos firmados.",
        );
      progress(20, "Preparando ActuacionE1");
      bytes = await generateActuationArchive(data, signed);
      name = "ActuacionE1.zip";
      type = "application/zip";
      progress(100, "Archivo listo");
      return {
        bytes,
        name,
        type,
        elapsedMs: Math.round(performance.now() - started),
      };
    }
    const zip = new JSZip(),
      root = rootPath(data);
    zip.folder(`${root}/documentos`);
    zip.folder(`${root}/outputs`);
    folderTemplate.forEach(([folder]) =>
      zip.folder(`${root}/documentos/${folder}`),
    );
    zip.file(
      `${root}/documentos/00_Datos_API/datos-expediente.json`,
      JSON.stringify(data, null, 2),
    );
    zip.file(
      `${root}/outputs/revision-anexo.json`,
      JSON.stringify(annexValuesForManifest(annex), null, 2),
    );
    progress(15, "Generando informe de flota");
    zip.file(`${root}/outputs/calculo-ahorro.xlsx`, fleetWorkbook(data));
    zip.file(
      `${root}/outputs/calculo-ahorro-para-firma.pdf`,
      calculationPdf(data),
    );
    zip.file(`${root}/outputs/Informe_gestor_flota.xlsx`, fleetWorkbook(data));
    progress(35, "Generando registro de repostajes");
    zip.file(
      `${root}/outputs/Registro_automatico_repostajes.xlsx`,
      fuelWorkbook(data),
    );
    if (kind === "unsigned") {
      progress(50, "Cumplimentando el Anexo I oficial");
      zip.file(
        `${root}/documentos/02_Declaracion_ayudas/ANEXO_I_editable.pdf`,
        await declarationPdf(data, annex),
      );
      zip.file(
        `${root}/documentos/08_Compromiso_gerente/Compromiso_Gerente_borrador.pdf`,
        managerCommitmentPdf(data),
      );
    } else {
      for (const [id, file] of Object.entries(signed)) {
        if (!file?.bytes) continue;
        const basename = `${id}_${safeName(file.name)}`;
        zip.file(`${root}/documentos/09_Firmados/${basename}`, file.bytes);
        zip.file(
          `${root}/documentos/${id === "anexo" ? "02_Declaracion_ayudas" : "08_Compromiso_gerente"}/${basename}`,
          file.bytes,
        );
      }
    }
    zip.file(
      `${root}/documentos/EVIDENCIAS_PENDIENTES.txt`,
      "Los originales del proveedor no están incluidos en esta simulación.\n\n" +
        data.evidence.map((e) => `${e.folder}: ${e.name}`).join("\n"),
    );
    zip.file(
      `${root}/outputs/MANIFIESTO_EXPEDIENTE.json`,
      JSON.stringify(
        {
          expediente: data.expediente,
          vehicleCount: data.vehicles.length,
          folderConvention: "CAE Studio: documentos/ y outputs/",
          folders: folderTemplate,
          evidence: data.evidence.map((e) => ({ ...e, included: false })),
          signedFiles: Object.entries(signed).map(([id, f]) => ({
            id,
            name: f.name,
          })),
          generatedAt: new Date().toISOString(),
        },
        null,
        2,
      ),
    );
    progress(65, "Empaquetando archivos");
    // Los binarios ya vienen como ArrayBuffer: no hay FileReader/Blob pendiente dentro de JSZip.
    bytes = await zip.generateAsync(
      { type: "uint8array", compression: "STORE", streamFiles: true },
      (m) => progress(65 + m.percent * 0.34, "Empaquetando archivos"),
    );
    name = `${code}_${kind === "ordered" ? "expediente_ordenado" : "documentos_para_firma"}.zip`;
    type = "application/zip";
  } else throw new Error("Tipo de descarga desconocido.");
  checkSize(bytes.byteLength, "El archivo generado");
  progress(100, "Archivo listo");
  return {
    bytes: bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes),
    name,
    type,
    elapsedMs: Math.round(performance.now() - started),
  };
}
const annexValuesForManifest = (annex) => ({
  overrides: annex,
  note: "Revisión manual. La firma no ha sido verificada por la aplicación.",
});
