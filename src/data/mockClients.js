import { mockExpediente } from "./mockExpediente.js";

export const clients = [
  {
    id: "CLI-001",
    name: "Transportes Sierra Norte S.L.",
    nif: "B12345678",
    city: "Madrid",
    vehicles: 24,
  },
  {
    id: "CLI-002",
    name: "Logística Mediterránea S.L.",
    nif: "B87654321",
    city: "Valencia",
    vehicles: 120,
  },
  {
    id: "CLI-003",
    name: "Flota Nacional Demo S.A.",
    nif: "A11223344",
    city: "Madrid",
    vehicles: 500,
  },
];
const normalize = (s) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[\s.-]/g, "");
export const searchClients = (query) =>
  clients.filter((c) =>
    normalize(`${c.name} ${c.nif}`).includes(normalize(query)),
  );

export function makeClientData(id) {
  const c = clients.find((c) => c.id === id);
  if (!c) throw new Error("Cliente no encontrado.");
  const data = structuredClone(mockExpediente);
  data.client = c;
  data.expediente = {
    ...data.expediente,
    nombre: `Telemetría - ${c.name}`,
    comunidad:
      c.city === "Valencia" ? "Comunitat Valenciana" : "Comunidad de Madrid",
    direccion: `Calle de Ejemplo 12, ${c.city}`,
  };
  data.owner = {
    ...data.owner,
    razonSocial: c.name,
    nif: c.nif,
    domicilio: data.expediente.direccion,
    email: `administracion@cliente${id.slice(-3)}.example`,
    representanteDomicilio: "",
    representanteTelefono: "",
    representanteEmail: "",
  };
  data.provider.extractedAt = "2026-09-23T09:30:00Z";
  data.vehicles = Array.from({ length: c.vehicles }, (_, i) => {
    const v = structuredClone(mockExpediente.vehicles[i % 2]);
    const serial = String(i + 1).padStart(4, "0");
    v.id = `${id}-V${serial}`;
    v.plate = `${String(1000 + i)} ${c.id === "CLI-001" ? "MBC" : c.id === "CLI-002" ? "MDF" : "MFG"}`;
    v.vin = `DEMO${id.slice(-3)}${String(i + 1).padStart(10, "0")}`;
    v.deviceId = `TM-${id.slice(-3)}-${serial}`;
    v.telematicName = `Vehículo ${serial}`;
    v.pre = {
      ...v.pre,
      from: "2026-03-03",
      to: "2026-05-31",
      km: 11000 + i * 7,
      liters: 1050 + i * 0.7,
    };
    v.post = {
      ...v.post,
      from: "2026-06-01",
      to: "2026-08-29",
      km: 11100 + i * 7,
      liters: 930 + i * 0.6,
    };
    v.annualKm = v.pre.km * 4;
    v.fuelEvents = Array.from({ length: 24 }, (_, j) => ({
      id: `${v.id}-F${j + 1}`,
      at: `2026-0${6 + Math.floor(j / 8)}-${String(2 + (j % 8) * 3).padStart(2, "0")}T08:30:00Z`,
      lat: 40.4168 + j * 0.001,
      lng: -3.7038 + j * 0.001,
      country: j % 9 === 8 ? "PT" : "ES",
      quantity: 50 + (j % 10),
      unit: "l",
      automatic: true,
      odometer: 30000 + j * 500,
      source: "ECU + GNSS (simulado)",
    }));
    return v;
  });
  data.evidence = data.evidence.map((e) => ({
    ...e,
    status: "pending",
    downloadUrl: "",
    source: "Pendiente del proveedor (simulación)",
  }));
  data.declaration = {
    beneficiaryDifferent: "",
    represented: "yes",
    aidRequested: "",
    socialBenefits: [],
  };
  return data;
}

// Sustituir solo este adaptador cuando se acuerde el contrato; sin configuración en la interfaz.
export const clientService = {
  async search(query) {
    return searchClients(query);
  },
  async load(id) {
    return makeClientData(id);
  },
};
