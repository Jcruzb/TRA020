# Modelo de datos provisional para la futura API

El usuario ha confirmado que todavía no hay documentación del proveedor. No es un contrato definitivo: se redactará cuando se cierre el frontend. La interfaz usa `clientService.search(query)` y `clientService.load(clientId)` en `src/data/mockClients.js`, sin configuración visible. Ejemplos completos en `examples/clientes.json` y `examples/cliente-24-vehiculos.json`.

La carga de cliente devuelve `client` (id, nombre mostrado como `name`, NIF como `nif`, ciudad como `city` y cantidad de vehículos), los objetos descritos debajo, IDs estables `vehicles[].id` y un objeto `declaration` con valores conocidos del Anexo. Los ajustes manuales del trabajo se guardan como `annex` y prevalecen sobre los datos recibidos. `annexFields.js` define campos y condiciones: propietario, beneficiario distinto, representante/poderes, bono social, ayudas y firma. Lo desconocido permanece vacío.

Las muestras contienen 24, 120 y 500 vehículos con 24 repostajes por vehículo. Son exclusivamente ficticias.

## Modelo interno actual

Referencia ejecutable: `src/data/mockClients.js`, construida sobre la base ficticia `src/data/mockExpediente.js`. Se valida la estructura mínima y los números del cálculo mediante `validateClientData`; no es aún un esquema de integración acordado. Mantener los nombres exactos siguientes.

| Objeto | Campos consumidos o presentes en el ejemplo |
| --- | --- |
| `expediente` | `codigo`, `nombre`, `comunidad`, `ano`, `direccion`, `referenciaCatastral` |
| `owner` | `razonSocial`, `nif`, `domicilio`, `telefono`, `email`, `representante`, `representanteNif`, `cargo` |
| `provider` | `nombre`, `extractedAt`, `retentionYears`, `iso27001`, `feedbackMode`, `apiVersion` |
| `vehicles[]` | `plate`, `vin`, `type`, `category`, `brand`, `model`, `year`, `fuel`, `service`, `telematicName`, `deviceId`, `deviceModel`, `installedAt`, `activatedAt`, `pre`, `post`, `annualKm`, `fuelEvents`, `feedback` |
| `pre`, `post` | `days`, `km`, `liters` numéricos |
| `fuelEvents[]` | `id`, `at`, `lat`, `lng`, `country`, `quantity`, `automatic`, `odometer` |
| `feedback` | `reports`, `communicated` numéricos |
| `evidence[]` | `id`, `name`, `folder`, `source`, `status`, `downloadUrl` |

El ejemplo usa fechas `YYYY-MM-DD`, instantes ISO 8601 UTC, país `ES`/`PT`, coordenadas decimales y `automatic` booleano. `fuel` reconoce `diesel`, `gasoline`, `glp`, `natural_gas`; el modelo actual no representa adecuadamente unidades distintas de litros. Las respuestas activas marcan evidencias `pending` y no ofrecen enlaces de descarga. Los enlaces `.example` del ejemplo base antiguo son ficticios y no se utilizan en la interfaz.

La app ya no ofrece un importador JSON. El adaptador valida estructuras, IDs únicos y valores numéricos. Los eventos vacíos no rompen el Excel; se bloquea la generación si no hay vehículos seleccionados.

## Información a negociar con el proveedor

Estas son propuestas, no campos ya soportados:

- Identificadores estables de cliente, flota, vehículo y dispositivo; historial de vinculación, cambios de equipo y fechas de instalación/activación.
- Periodos pre/post con inicio, fin, zona horaria, unidades, origen de señales, cobertura y calidad; kilometraje anual y método de obtención.
- Eventos nativos de repostaje/recarga con identificador, instante, GNSS, país, cantidad y unidad, odómetro y señal del vehículo que fundamenta la detección. Evidencia de clasificación territorial y cruce con kilómetros para justificar `r`.
- Informes y pruebas de comunicación de retroalimentación con fechas, modalidad y vehículo asociado; los contadores solos no aportan trazabilidad suficiente.
- Certificado original firmado de implantación, vinculación dispositivo-vehículo y descripción de conexión ECU/OBD/CanBus e integridad de datos; facturas y certificados técnicos correspondientes.
- Documentos con ID estable, tipo, versión, entidad/vehículo asociado, fecha, nombre de archivo, MIME, tamaño, hash y mecanismo de descarga con caducidad conocida.
- Autenticación de servidor, permisos mínimos, paginación, límites, reintentos, errores, versionado, correcciones históricas y conservación pactada. `retentionYears: 5` es un dato simulado, no un plazo legal validado.

Separar datos telemáticos de declaraciones que debe confirmar el propietario: representación, ayudas y subvenciones, datos administrativos y firma. No deducirlos de la API.

## Integración futura

Proveedor → backend autenticado → conservación de respuesta original y documentos → adaptador/validación → modelo interno → revisión y exportación. Registrar origen, versión y fecha de extracción, y evitar incluir secretos en respuestas exportadas. La app actual no admite binarios originales mediante el contrato JSON.
