# Arquitectura actual · 0.3.0

| Archivo | Responsabilidad |
| --- | --- |
| `src/main.jsx` | Cliente, selección paginada, revisiones, descargas, adjuntos e historial |
| `src/components.jsx` | Formulario del Anexo y confirmación de apartados pendientes |
| `src/data/mockClients.js` | Búsqueda y carga simulada de clientes de 24, 120 y 500 vehículos |
| `src/domain/jobs.js` | Modelo de trabajo, validación y selección; invalidación de firmados |
| `src/domain/annexFields.js` | Mapeo al formulario oficial y campos condicionales |
| `src/domain/annexPdf.js` | Cumplimentación del PDF original con pdf-lib; relación editable de equipos |
| `src/domain/evaluate.js` | Indicadores preliminares, sin cambios en las reglas numéricas |
| `src/domain/expediente.js` | Compromiso con jsPDF, Excel con SheetJS, carpetas y ZIP con JSZip |
| `src/domain/export.worker.js` | Generación fuera del hilo de pantalla |
| `src/domain/exportClient.js` | Mensajería, errores, progreso, cancelación y límite de dos minutos |
| `src/domain/localHistory.js` | File System Access API: JSON, respaldo y adjuntos |
| `src/assets/anexo-i-miteco-original.pdf` | Fuente oficial conservada |
| `scripts/embed-template.mjs` | Incrusta la plantilla para uso offline |

## Flujo

`clientService.search(nombreONif)` → `load(id)` → trabajo con respuesta completa del cliente → selección por IDs estables → revisión del Anexo → generación en worker → archivo descargable → adjuntos → ZIP ordenado. El adaptador actual no hace llamadas de red.

El estado del trabajo incluye `id`, fechas, `revision`, `status`, `data`, `selectedIds`, `annex`, `signed` y `exports`. El historial guarda la respuesta completa para retomar selecciones. Las exportaciones usan solamente los vehículos seleccionados. Cambiar selección o formulario incrementa revisión e invalida firmados activos.

## Historial sin DB

La carpeta elegida contiene `historial.json`, `historial.anterior.json` y `TRA020_archivos/<id-trabajo>/<tipo>_<uuid>.pdf|p7m`. El JSON contiene todos los trabajos; los binarios firmados se almacenan aparte y se referencian por ruta relativa.

Guardado automático tras 700 ms sin cambios y botón manual. Escrituras del historial serializadas dentro de la sesión; comparación del contenido anterior para detectar cambios externos, respaldo y escritura con `createWritable`. Esta comparación no es un bloqueo transaccional entre ventanas: usar una ventana por carpeta. Un historial inválido no se sobrescribe. Si falla el guardado, la interfaz avisa y conserva el trabajo en memoria.

No se persiste el permiso/handle mediante IndexedDB ni otra DB. Al reabrir se selecciona la carpeta y se concede acceso. La app no puede deducir una ruta escribible del HTML ni saltarse el selector del navegador. Sin carpeta, los datos solo permanecen durante la sesión.

## PDF y exportaciones

El Anexo I conserva contenido gráfico de las primeras cuatro páginas y sus campos de formulario. Se ajustan apariencias/tamaños, se eliminan validadores JavaScript de formato dependientes de Acrobat y se mantienen campos editables. No se aplana ni se firma. La relación de equipos ocupa páginas adicionales si supera la capacidad prevista del apartado. Los dos bloques de ayudas son los del original.

Worker incrustado en el HTML: no requiere un archivo JS externo. Los adjuntos se leen como ArrayBuffer antes de empaquetar. JSZip usa STORE para evitar compresión innecesaria de PDF/Excel y devuelve bytes transferibles. Cada operación ofrece progreso, cancelación, error/timeout y un enlace de descarga. El MIME se mantiene dentro de `result`, separado del discriminante `type: 'done'` del mensaje.

## Cálculo preliminar heredado

Factores: diesel 10, gasoline 9.19, glp 7.16, natural_gas 13.33; desconocido usa 1. `CEF = liters × factor × 100 / km`; ahorro relativo `1 - post/pre`; variación de km `abs(kmPost-kmPre)/kmPre`. `r` cuenta eventos automáticos ES entre todos los eventos, sin ponderar cantidades ni cruzar kilómetros. Ahorro anual `max(0,(CEFpre-CEFpost)×annualKm/100×r)`.

Alertas: falta de dispositivo/fechas, periodos distintos de 90 días, variación de km ≥40 %, ahorro >20 %, eventos ausentes/manuales, menos de seis informes emitidos o comunicados. Describen el código; no acreditan cumplimiento legal.

## ZIP

Se ha alineado con la documentación de CAE Studio / Expediente Builder: `expedientes/<ID>/documentos/` para originales, evidencias y firmados; `expedientes/<ID>/outputs/` para resultados e historial. El paquete de solicitud estandarizada contiene un `ActuacionE<n>.zip` independiente por vehículo/actuación. Cada archivo contiene `AnexoE<n>.pdf`, `E<n>-1- ...`, `E<n>-2- ...`, `E<n>-3-1- ...`, `E<n>-3-2- ...` y `E<n>-4- ...`; lo no recibido queda como `.pendiente.txt`. `folderTemplate` se conserva para el workspace interno y documentos de soporte. El Excel principal usa `outputs/calculo-ahorro.xlsx`, igual que Builder. No incluye originales del proveedor ficticios ni afirma que estén disponibles.

## Exportación corregida (23/09/2026)

La descarga final es directamente `ActuacionE1.zip`, sin envoltorio de expediente, outputs, manifiestos ni pendientes de texto. Una actuación por trabajo: los tres firmados corresponden a la selección completa y se invalidan al cambiarla.

Carpetas: E1-1 Convenio CAE (subcarpetas E1-1 Convenio CAE y E1-2 Convenio de cesión de ahorro energético), E1-2 Dictamen favorable, E1-3-1 Formulario de cálculo del ahorro (E1-3-1-1 Excel y E1-3-1-2 PDF), E1-3-2 Anexo subvenciones Genérico de Transporte (subcarpeta E1-3-2), E1-3-3 Facturas, E1-3-4 Certificado del software, E1-3-5 Informe, E1-3-6 Certificado de cálculo parámetro r, E1-3-7 Informe de cumplimiento de requerimientos técnicos, E1-3-8 Compromiso del gerente y E1-4 Otros documentos justificativos. Los documentos no recibidos dejan carpetas vacías.

Se exige cargar cálculo PDF, Anexo I y Compromiso firmados. Se preservan sus bytes. El PDF de cálculo es preliminar, no el formulario oficial pendiente. El informe Excel conserva todas las columnas.

Guía local «Instrucciones para realizar la solicitud», apartado 7: 10 MB por fichero y 50 MB por envío. Se controlan binarios, volumen interno y ZIP final usando MB decimales conservadores; se bloquea el exceso. Los documentos añadidos a la sede fuera de la app no pueden contabilizarse automáticamente.

## Organización React

- `src/main.jsx`: punto de entrada; monta `App` e importa estilos.
- `src/App.jsx`: composición del marco común y navegación entre pantallas.
- `src/pages/`: clientes, vehículos, documentos, expediente ordenado e historial. Reciben datos y acciones mediante props explícitas.
- `src/components/`: formulario, campos, confirmación, métricas, descarga de documentos y carga de firmados reutilizables. `components.jsx` conserva los exports públicos.
- `src/hooks/useExpediente.js`: coordina el ciclo del trabajo, historial, adjuntos y exportaciones. Mantiene las referencias necesarias para evitar guardar revisiones obsoletas.
- `src/hooks/useClientSearch.js`: búsqueda con descarte de respuestas cuando cambia la consulta.
- `src/hooks/useVehicleSelection.js`: selección, evaluación, filtros y paginación derivados.
- `src/domain/`: reglas y generación de archivos independientes de las vistas.

`npm run format` aplica formato a las fuentes y `npm run format:check` lo comprueba. La plantilla PDF generada se excluye.
