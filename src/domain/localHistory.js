import { validateClientData } from "./jobs.js";

const emptyHistory = () => ({ schemaVersion: 1, updatedAt: null, jobs: [] });
const segment = /^[a-zA-Z0-9_-]+$/;
export function validateHistory(history) {
  if (history?.schemaVersion !== 1 || !Array.isArray(history.jobs))
    throw new Error(
      "El historial no tiene un formato compatible. No se ha sobrescrito.",
    );
  const ids = new Set();
  for (const job of history.jobs) {
    if (
      !segment.test(job.id) ||
      ids.has(job.id) ||
      !Array.isArray(job.selectedIds) ||
      !job.annex ||
      !job.signed ||
      !Array.isArray(job.exports)
    )
      throw new Error(
        "El historial contiene trabajos inválidos. No se ha sobrescrito.",
      );
    ids.add(job.id);
    validateClientData(job.data);
    if (
      job.selectedIds.some((id) => !job.data.vehicles.some((v) => v.id === id))
    )
      throw new Error(
        "Hay vehículos seleccionados que no pertenecen al cliente.",
      );
    for (const [id, file] of Object.entries(job.signed)) {
      if (
        !["anexo", "commitment", "calculation"].includes(id) ||
        !file?.path ||
        !/^TRA020_archivos\/[a-zA-Z0-9_-]+\/[a-zA-Z0-9_.-]+$/.test(file.path) ||
        !file.path.startsWith(`TRA020_archivos/${job.id}/`)
      )
        throw new Error("El historial contiene una ruta de adjunto inválida.");
    }
  }
  return history;
}
async function readText(directory, name) {
  try {
    return await (
      await directory.getFileHandle(name)
    )
      .getFile()
      .then((f) => f.text());
  } catch (e) {
    if (e.name === "NotFoundError") return null;
    throw e;
  }
}
async function writeFile(directory, name, contents) {
  const handle = await directory.getFileHandle(name, { create: true });
  const writable = await handle.createWritable();
  try {
    await writable.write(contents);
    await writable.close();
  } catch (e) {
    try {
      await writable.abort();
    } catch {}
    throw e;
  }
}

export class LocalHistory {
  constructor(directory, history, text) {
    this.directory = directory;
    this.history = history;
    this.lastText = text;
    this.queue = Promise.resolve();
  }
  static async open(directory) {
    const text = await readText(directory, "historial.json");
    let history;
    try {
      history =
        text === null ? emptyHistory() : validateHistory(JSON.parse(text));
    } catch (error) {
      throw new Error(
        `No se puede abrir historial.json: ${error.message} Revisa el archivo o recupera historial.anterior.json.`,
      );
    }
    const store = new LocalHistory(directory, history, text);
    if (text === null) await store.persist(history);
    await directory.getDirectoryHandle("TRA020_archivos", { create: true });
    return store;
  }
  async persist(history) {
    const current = await readText(this.directory, "historial.json");
    if (current !== this.lastText)
      throw new Error(
        "El historial cambió en otra ventana. Vuelve a abrir la carpeta antes de guardar para evitar sobrescribir trabajos.",
      );
    const next = { ...history, updatedAt: new Date().toISOString() };
    const text = JSON.stringify(next, null, 2);
    if (current !== null)
      await writeFile(this.directory, "historial.anterior.json", current);
    await writeFile(this.directory, "historial.json", text);
    this.lastText = text;
    this.history = next;
    return next;
  }
  enqueue(action) {
    const next = this.queue.then(action);
    this.queue = next.catch(() => {});
    return next;
  }
  saveJob(job) {
    const snapshot = structuredClone(job);
    return this.enqueue(async () => {
      validateHistory({ schemaVersion: 1, jobs: [snapshot] });
      const jobs = [
        snapshot,
        ...this.history.jobs.filter((j) => j.id !== snapshot.id),
      ].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      return this.persist({ ...this.history, jobs });
    });
  }
  async saveAttachment(jobId, id, file) {
    if (
      !segment.test(jobId) ||
      !["anexo", "commitment", "calculation"].includes(id)
    )
      throw new Error("Adjunto inválido.");
    if (!file.size) throw new Error("El archivo está vacío.");
    const extension = file.name.toLowerCase().endsWith(".p7m")
      ? "p7m"
      : file.name.toLowerCase().endsWith(".pdf")
        ? "pdf"
        : null;
    if (!extension) throw new Error("Adjunta un PDF o un archivo P7M.");
    const root = await this.directory.getDirectoryHandle("TRA020_archivos", {
      create: true,
    });
    const dir = await root.getDirectoryHandle(jobId, { create: true });
    const name = `${id}_${crypto.randomUUID()}.${extension}`;
    await writeFile(dir, name, file);
    return {
      name: file.name,
      path: `TRA020_archivos/${jobId}/${name}`,
      size: file.size,
      type: file.type,
      attachedAt: new Date().toISOString(),
    };
  }
  async readAttachment(meta) {
    const parts = meta.path.split("/");
    if (
      parts.length !== 3 ||
      parts[0] !== "TRA020_archivos" ||
      !segment.test(parts[1]) ||
      !/^[a-zA-Z0-9_.-]+$/.test(parts[2])
    )
      throw new Error("Ruta de adjunto inválida.");
    try {
      const root = await this.directory.getDirectoryHandle(parts[0]);
      const dir = await root.getDirectoryHandle(parts[1]);
      const file = await (await dir.getFileHandle(parts[2])).getFile();
      if (file.size !== meta.size)
        throw new Error(
          "El tamaño del adjunto cambió. Vuelve a adjuntar el archivo.",
        );
      return { name: meta.name, bytes: await file.arrayBuffer() };
    } catch (error) {
      throw new Error(`No se puede recuperar ${meta.name}: ${error.message}`);
    }
  }
}
