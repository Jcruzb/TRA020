import { useEffect, useMemo, useRef, useState } from "react";
import { clientService } from "../data/mockClients.js";
import {
  createJob,
  reviseJob,
  selectedData,
  validateClientData,
} from "../domain/jobs.js";
import { LocalHistory } from "../domain/localHistory.js";
import { missingAnnex } from "../domain/annexFields.js";
import { startExport } from "../domain/exportClient.js";
import { useClientSearch } from "./useClientSearch.js";
import { useVehicleSelection } from "./useVehicleSelection.js";

// Owns the current job lifecycle: persistence, attachments and worker exports.
export function useExpediente() {
  const [page, setPage] = useState("clients"),
    [query, setQuery] = useState(""),
    [loading, setLoading] = useState(false);
  const [store, setStore] = useState(null),
    [jobs, setJobs] = useState([]),
    [job, setJob] = useState(null),
    [saveState, setSaveState] = useState("Sin carpeta"),
    [notice, setNotice] = useState(null);
  const [vehicleQuery, setVehicleQuery] = useState(""),
    [vehiclePage, setVehiclePage] = useState(0),
    [busy, setBusy] = useState(null),
    [ready, setReady] = useState(null),
    [confirm, setConfirm] = useState(null);
  const jobRef = useRef(null),
    storeRef = useRef(null),
    taskRef = useRef(null),
    urlRef = useRef(null),
    dirtyRef = useRef(false),
    memoryFiles = useRef({});
  const clients = useClientSearch(query, setNotice);
  const data = useMemo(() => (job ? selectedData(job) : null), [job]);
  const { selected, valid, total, filtered, pagination, rows, currentStats } =
    useVehicleSelection(job, data, vehicleQuery, vehiclePage);

  useEffect(() => {
    const before = (e) => {
      if (dirtyRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", before);
    return () => window.removeEventListener("beforeunload", before);
  }, []);
  useEffect(() => {
    if (!job || !store || !dirtyRef.current) return;
    const timer = setTimeout(() => persist(job), 700);
    return () => clearTimeout(timer);
  }, [job, store]);
  useEffect(
    () => () => {
      taskRef.current?.cancel();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    },
    [],
  );

  function clearReady() {
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = null;
    setReady(null);
  }
  function putJob(next, { dirty = true } = {}) {
    jobRef.current = next;
    setJob(next);
    dirtyRef.current = dirty;
    setSaveState(
      dirty
        ? storeRef.current
          ? "Cambios pendientes"
          : "Sin guardar en carpeta"
        : "Guardado",
    );
  }
  function change(patch) {
    const old = jobRef.current;
    const next = reviseJob(old, patch);
    if (Object.keys(old.signed).length)
      setNotice({
        type: "info",
        text: "Los datos han cambiado. Adjunta de nuevo los documentos firmados para esta revisión; las copias anteriores permanecen en la carpeta.",
      });
    memoryFiles.current = {};
    clearReady();
    putJob(next);
  }
  async function persist(snapshot = jobRef.current) {
    if (!snapshot || !storeRef.current) return false;
    setSaveState("Guardando…");
    try {
      const result = await storeRef.current.saveJob(snapshot);
      setJobs(result.jobs);
      if (jobRef.current === snapshot) {
        dirtyRef.current = false;
        setSaveState("Guardado");
      }
      return true;
    } catch (e) {
      setSaveState("Error al guardar");
      setNotice({ type: "error", text: e.message });
      return false;
    }
  }
  async function connectFolder() {
    if (!window.showDirectoryPicker) {
      setNotice({
        type: "error",
        text: "Este navegador no permite guardar directamente en carpetas. Abre el HTML en Chrome o Edge de escritorio.",
      });
      return;
    }
    try {
      // El selector debe abrirse dentro del gesto del usuario, antes de cualquier await de guardado.
      const handle = await window.showDirectoryPicker({
        id: "tra020-workspace",
        mode: "readwrite",
      });
      setLoading(true);
      const previousStore = storeRef.current;
      if (previousStore) await previousStore.queue;
      const pending = dirtyRef.current ? jobRef.current : null;
      const nextStore = await LocalHistory.open(handle);
      let recovered = false;
      let next = pending;
      if (pending) {
        // No reemplazar un trabajo existente de otra sesión: conservar ambos como trabajos distintos.
        if (nextStore.history.jobs.some((j) => j.id === pending.id)) {
          const fresh = createJob(pending.data);
          next = {
            ...pending,
            id: fresh.id,
            data: fresh.data,
            createdAt: fresh.createdAt,
            updatedAt: fresh.updatedAt,
          };
          recovered = true;
        }
        const signed = {};
        for (const [id, meta] of Object.entries(pending.signed)) {
          let file = memoryFiles.current[id];
          if (!file) {
            const original = await previousStore.readAttachment(meta);
            file = new File([original.bytes], meta.name, { type: meta.type });
          }
          signed[id] = await nextStore.saveAttachment(next.id, id, file);
        }
        next = { ...next, signed };
        await nextStore.saveJob(next);
      }
      storeRef.current = nextStore;
      setStore(nextStore);
      setJobs(nextStore.history.jobs);
      if (next) {
        putJob(next, { dirty: false });
      } else {
        jobRef.current = null;
        setJob(null);
        dirtyRef.current = false;
        setPage("clients");
        setSaveState("Guardado");
      }
      setNotice({
        type: "success",
        text: recovered
          ? "Carpeta conectada. Se guardó una copia del trabajo en curso para conservar también la versión que ya existía."
          : `Carpeta «${handle.name}» conectada. Historial y adjuntos se guardan aquí automáticamente.`,
      });
    } catch (e) {
      if (e.name !== "AbortError")
        setNotice({ type: "error", text: e.message });
    } finally {
      setLoading(false);
    }
  }
  async function leaveCurrent() {
    if (dirtyRef.current) {
      if (storeRef.current) return await persist();
      setNotice({
        type: "error",
        text: "Conecta una carpeta y guarda el trabajo antes de abrir otro. Así podrás retomarlo más adelante.",
      });
      return false;
    }
    return true;
  }
  async function loadClient(id) {
    if (!(await leaveCurrent())) return;
    setLoading(true);
    try {
      const response = validateClientData(await clientService.load(id));
      const next = createJob(response);
      clearReady();
      memoryFiles.current = {};
      putJob(next);
      setVehicleQuery("");
      setVehiclePage(0);
      setPage("vehicles");
      setNotice({
        type: "info",
        text: `Datos simulados cargados: ${response.vehicles.length} vehículos. Selecciona la flota del trabajo.`,
      });
    } catch (e) {
      setNotice({ type: "error", text: e.message });
    } finally {
      setLoading(false);
    }
  }
  async function resume(saved) {
    if (!(await leaveCurrent())) return;
    clearReady();
    memoryFiles.current = {};
    putJob(
      structuredClone(
        storeRef.current?.history.jobs.find((j) => j.id === saved.id) || saved,
      ),
      { dirty: false },
    );
    setVehiclePage(0);
    setVehicleQuery("");
    setPage("vehicles");
    setNotice({
      type: "success",
      text: "Trabajo recuperado: selección, formulario y referencias a sus firmados.",
    });
  }
  function toggleVehicle(id) {
    const ids = new Set(jobRef.current.selectedIds);
    ids.has(id) ? ids.delete(id) : ids.add(id);
    change({ selectedIds: [...ids] });
  }
  async function attach(id, file) {
    if (!file) return;
    if (!/\.(pdf|p7m)$/i.test(file.name) || !file.size) {
      setNotice({
        type: "error",
        text: "Selecciona un PDF o P7M que no esté vacío.",
      });
      return;
    }
    if (file.size > 10_000_000) {
      setNotice({
        type: "error",
        text: "El adjunto supera el límite de 10 MB.",
      });
      return;
    }
    setLoading(true);
    setNotice(null);
    try {
      const current = jobRef.current;
      const meta = storeRef.current
        ? await storeRef.current.saveAttachment(current.id, id, file)
        : { name: file.name, size: file.size, type: file.type };
      memoryFiles.current[id] = file;
      const next = {
        ...current,
        signed: { ...current.signed, [id]: meta },
        updatedAt: new Date().toISOString(),
        status: "Documentos adjuntos",
      };
      clearReady();
      putJob(next);
      if (storeRef.current) await persist(next);
    } catch (e) {
      setNotice({
        type: "error",
        text: `No se pudo guardar el adjunto: ${e.message}`,
      });
    } finally {
      setLoading(false);
    }
  }
  function requestExport(kind) {
    if (!data?.vehicles.length) {
      setNotice({
        type: "error",
        text: "Selecciona al menos un vehículo antes de generar documentos.",
      });
      return;
    }
    if (
      kind === "ordered" &&
      (!job.signed.anexo || !job.signed.commitment || !job.signed.calculation)
    ) {
      setNotice({
        type: "error",
        text: "Adjunta el Anexo I, el cálculo del ahorro y el Compromiso del Gerente firmados antes de generar el expediente.",
      });
      return;
    }
    const missing =
      kind === "anexo" || kind === "unsigned"
        ? missingAnnex(data, job.annex)
        : [];
    if (missing.length) {
      setConfirm({ kind, missing });
      return;
    }
    generate(kind);
  }
  async function generate(kind) {
    setConfirm(null);
    clearReady();
    setNotice(null);
    setBusy({ percent: 0, label: "Preparando datos" });
    const snapshot = jobRef.current;
    try {
      const signed = {};
      if (kind === "ordered")
        for (const [id, meta] of Object.entries(snapshot.signed)) {
          const file = memoryFiles.current[id];
          signed[id] = file
            ? { name: file.name, bytes: await file.arrayBuffer() }
            : await storeRef.current.readAttachment(meta);
        }
      const task = startExport(
        { kind, data: selectedData(snapshot), annex: snapshot.annex, signed },
        setBusy,
      );
      taskRef.current = task;
      const result = await task.promise;
      const blob = new Blob([result.bytes], { type: result.type }),
        url = URL.createObjectURL(blob);
      urlRef.current = url;
      setReady({ ...result, bytes: undefined, url, size: blob.size });
      const next = {
        ...snapshot,
        status:
          kind === "ordered" ? "Expediente generado" : "Documentos preparados",
        updatedAt: new Date().toISOString(),
        exports: [
          {
            kind,
            name: result.name,
            at: new Date().toISOString(),
            elapsedMs: result.elapsedMs,
            size: blob.size,
          },
          ...snapshot.exports,
        ],
      };
      putJob(next);
      if (storeRef.current) await persist(next);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      setNotice({ type: "error", text: e.message });
    } finally {
      taskRef.current = null;
      setBusy(null);
    }
  }
  const locked = !!busy || loading || !!confirm;

  return {
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
  };
}
