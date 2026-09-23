import {
  PDFDocument,
  PDFTextField,
  PDFName,
  StandardFonts,
  rgb,
} from "pdf-lib";
import templateBase64 from "../assets/anexoTemplate.js";
import { annexValues, annexFields, benefits } from "./annexFields.js";

function fitText(field, value, font) {
  field.setText(value);
  const rect = field.acroField.getWidgets()[0].getRectangle();
  const width = rect.width - 5,
    height = rect.height - 4;
  let size = Math.min(10, height / 1.2);
  for (; size > 6; size -= 0.25) {
    if (!field.isMultiline()) {
      if (font.widthOfTextAtSize(value, size) <= width) break;
    } else {
      let lines = 1,
        line = "";
      for (const word of value.split(/\s+/)) {
        const trial = line ? `${line} ${word}` : word;
        if (font.widthOfTextAtSize(trial, size) > width) {
          lines++;
          line = word;
        } else line = trial;
      }
      if (
        lines * size * 1.2 <= height &&
        value
          .split(/\s+/)
          .every((w) => font.widthOfTextAtSize(w, size) <= width)
      )
        break;
    }
  }
  field.setFontSize(size);
  field.updateAppearances(font);
}

export async function declarationPdf(data, overrides = {}) {
  const pdf = await PDFDocument.load(templateBase64);
  const form = pdf.getForm();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const a = annexValues(data, overrides);
  // Se conserva el árbol AcroForm, los widgets y las cuatro páginas originales.
  for (const f of form.getFields())
    if (f instanceof PDFTextField) {
      f.disableReadOnly();
      // Los validadores de formato del original dependen de JavaScript de Acrobat.
      // Quitarlos evita reformateos incompatibles entre Chrome y otros lectores.
      f.acroField.dict.delete(PDFName.of("AA"));
      fitText(f, "", font);
    }
  for (const spec of annexFields) {
    if (spec.when && !spec.when(a)) continue;
    let value = String(a[spec.key] ?? "").trim();
    if (spec.key === "region") {
      const dropdown = form.getDropdown(spec.pdf);
      dropdown.enableEditing();
      if (value) dropdown.select(value);
      else dropdown.clear();
      dropdown.setFontSize(8);
      dropdown.updateAppearances(font);
    } else {
      if (spec.key === "year" && /^20\d{2}$/.test(value))
        value = value.slice(-2);
      fitText(form.getTextField(spec.pdf), value, font);
    }
  }
  const devices = data.vehicles.map((v) => v.deviceId || "Pendiente");
  const fullDevices = devices.join(", ");
  const continuation = fullDevices.length > 110;
  fitText(
    form.getTextField("n serie de equipos"),
    continuation
      ? `Ver relación adjunta: ${devices.length} equipos. Expediente ${data.expediente.codigo}.`
      : fullDevices,
    font,
  );
  const checks = {
    "Poder Notarial de fecha":
      a.represented === "yes" && a.powerType === "notarial",
    Otro: a.represented === "yes" && a.powerType === "other",
    "No se ha solicitado ayuda o subvención": a.aidRequested === "no",
    "Se ha solicitado ayuda o subvención": a.aidRequested === "yes",
    "Se ha obtenido dicha ayuda":
      a.aidRequested === "yes" && a.aidOutcome === "granted",
    "No se ha obtenido dicha ayuda":
      a.aidRequested === "yes" && a.aidOutcome === "denied",
    "Está pendiente de resolución dicha ayuda":
      a.aidRequested === "yes" && a.aidOutcome === "pending",
    ...Object.fromEntries(
      benefits.map(([key, , name]) => [name, a.socialBenefits?.includes(key)]),
    ),
  };
  for (const [name, checked] of Object.entries(checks)) {
    const box = form.getCheckBox(name);
    box.disableReadOnly();
    checked ? box.check() : box.uncheck();
    box.updateAppearances();
  }
  if (continuation) {
    for (let start = 0; start < data.vehicles.length; start += 32) {
      const page = pdf.addPage([595.22, 842]);
      page.drawText("Relación de equipos - continuación del apartado 1", {
        x: 42,
        y: 797,
        size: 13,
        font,
      });
      page.drawText(
        `Expediente ${data.expediente.codigo} | ${data.owner.nif}`,
        { x: 42, y: 773, size: 10, font },
      );
      page.drawText("Matrícula", { x: 42, y: 745, size: 10, font });
      page.drawText("Dispositivo / número de serie", {
        x: 180,
        y: 745,
        size: 10,
        font,
      });
      data.vehicles.slice(start, start + 32).forEach((v, i) => {
        const y = 721 - i * 20;
        for (const [key, value, x, width] of [
          ["matricula", v.plate, 42, 120],
          ["dispositivo", v.deviceId, 180, 365],
        ]) {
          const f = form.createTextField(`equipos_${start + i + 1}_${key}`);
          f.addToPage(page, {
            x,
            y,
            width,
            height: 18,
            borderWidth: 0,
            backgroundColor: rgb(1, 1, 1),
            font,
          });
          fitText(f, value || "", font);
        }
      });
      page.drawText(
        `Relación de ${devices.length} equipos. Hoja ${Math.floor(start / 32) + 1} de ${Math.ceil(devices.length / 32)}.`,
        { x: 42, y: 35, size: 9, font },
      );
    }
  }
  return pdf.save({ useObjectStreams: true });
}
