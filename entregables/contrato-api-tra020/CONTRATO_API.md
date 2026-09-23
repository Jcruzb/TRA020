# Contrato funcional y técnico de API TRA020

Versión propuesta 1.0 · 23/09/2026. Base ilustrativa: `https://api.proveedor.example/v1`. Los nombres se pueden adaptar mediante un adaptador si se conserva el contenido y las garantías acordadas.

## 1. Flujo

Buscar cliente → seleccionar resultado → recuperar un snapshot completo de datos → seleccionar vehículos en la app → obtener documentos correspondientes → preparar cálculo y documentos → revisión y firma → ZIP local.

La API es de lectura. No se requieren endpoints de subida de firmados ni de creación del expediente.

## 2. Transporte y autenticación

HTTPS y JSON UTF-8. Cabeceras `Accept: application/json` y `Authorization: Bearer <token>`. Las respuestas deben restringirse a los clientes autorizados; conocer un ID no concede acceso.

No incluir una clave permanente ni un secreto de servicio en el HTML. La integración deberá usar un intermediario seguro o un flujo de usuario con tokens de corta duración. El endpoint puede quedar integrado en código. El HTML actual funciona localmente; no suponer que CORS desde `file://` resuelve la autenticación. La modalidad de conexión es un punto de acuerdo previo.

## 3. Endpoints requeridos

| Método y ruta | Entrada | Respuesta 200 |
|---|---|---|
| `GET /clients` | `query` texto obligatorio; `limit` entero 1–100, defecto 20; `cursor` opaco opcional | `{items: ClientSummary[], nextCursor: string|null}` |
| `GET /clients/{clientId}/expediente-data` | ID estable; `from` y `to` fechas opcionales, deben enviarse juntos | `{schemaVersion, snapshotId, generatedAt, data}` |
| `GET /clients/{clientId}/documents/{documentId}/content` | IDs autorizados; `snapshotId` obligatorio en query | Binario original con Content-Type, Content-Length y Content-Disposition |

Búsqueda por coincidencia parcial de razón social o NIF, sin distinguir mayúsculas ni tildes; ignorar separadores habituales del NIF. Sin resultados: 200 y `items: []`. Orden determinista por nombre y luego ID. Cursor inválido: 400; cursor caducado: 410 y reiniciar búsqueda.

El detalle debe devolver todos los vehículos y eventos del ámbito solicitado, nunca truncarlos silenciosamente. Sin `from/to`, se entrega el periodo disponible asociado a la actuación propuesta y se indican sus fechas reales. Si se solicitan fechas, devolver datos de ese intervalo o señalar cobertura insuficiente; no inventar periodos completos.

Propuesta inicial: detalle completo en una respuesta. Si el volumen exige paginación, el proveedor propondrá extensión antes de implementación: todas las páginas deben compartir `snapshotId`, total de vehículos/eventos y cursor final; la app no permitirá generar hasta recuperar el conjunto completo. No mezclar revisiones de distintas páginas.

## 4. Reglas comunes

- IDs: cadenas estables y únicas dentro del proveedor; no reciclarlos al cambiar matrícula o dispositivo.
- Fechas: `YYYY-MM-DD`; instantes: RFC 3339 con zona, preferentemente UTC `Z`. Indicar zona de agregación, por ejemplo `Europe/Madrid`.
- Decimales: números JSON con punto, sin separadores de miles ni unidades concatenadas. No usar cadenas para valores numéricos.
- Unidades explícitas: km, litros, kg o kWh según magnitud. El prototipo calcula con litros; otros combustibles/unidades requieren adaptación y validación, no convertir silenciosamente.
- Desconocido: `null`, nunca cero, falso o cadena inventada. Cero y `false` son mediciones/declaraciones conocidas. Colección vacía significa que no hay elementos; si la consulta está incompleta, informar en `quality.issues`.
- Campos obligatorios estructurales deben existir. Si una medición necesaria no está disponible, entregar `null` y su causa; la app deberá bloquear el cálculo de ese vehículo hasta resolverla.
- `schemaVersion`: `1.0`; cambios incompatibles requieren nueva versión mayor. Añadir propiedades opcionales no debe alterar la semántica existente.
- El snapshot debe ser inmutable durante la descarga de sus documentos. Si caduca devolver 410; nunca reemplazar un original por otro bajo el mismo snapshot.

## 5. Diccionario del detalle

### Envoltorio y cliente

| Ruta | Tipo | Obligación y significado |
|---|---|---|
| `schemaVersion` | string | Obligatorio; versión del contrato | NO ENTIENDO QUE ES
| `snapshotId` | string | Obligatorio; revisión coherente de datos/documentos | NO ENTIENDO QUE ES
| `generatedAt` | datetime | Obligatorio; fecha de extracción |
| `data.client` | objeto | Obligatorio; `id`, `name`, `nif`, `city`, `vehicles` (cantidad total) |
| `data.expediente` | objeto | `codigo`, `nombre`, `comunidad`, `ano`, `direccion`, `referenciaCatastral`; valores administrativos desconocidos pueden ser null |
| `data.owner` | objeto | Propietario inicial del ahorro |
| `data.provider` | objeto | Origen y trazabilidad de datos | NO ENTIENDO QUE ES
| `data.vehicles` | array | Todos los vehículos del cliente en el ámbito solicitado |
| `data.declaration` | objeto | Datos confirmados del Anexo I; ver apartado 7 |
| `data.evidence` | array | Inventario de evidencias; puede estar vacío | NO ENTIENDO QUE ES
| `data.documents` | objeto | Facturas de la inversión y certificado del cálculo de r; ver apartado 8 |
| `data.quality` | objeto | Añadir: `complete` boolean, `issues` array de `{code,path,message}`; no disponible en la simulación actual | NO ENTIENDO QUE ES

`owner`: `razonSocial`, `nif`, `domicilio`, `telefono`, `email`, `representante`, `representanteNif`, `representanteDomicilio`, `representanteTelefono`, `representanteEmail`, `cargo`. Razón social y NIF necesarios para identificar al propietario; el resto puede ser null. Un contacto de la empresa no es automáticamente representante legal. Del propietario inicial del ahorro o de Gestrackin que puede ser el que compró el ahorro?

`provider`: `nombre`, `extractedAt`, `apiVersion`, `feedbackMode` y, cuando estén acreditados, `retentionYears`, `iso27001`. Indicar origen de los datos y versión del proceso. No usar `iso27001: true` sin evidencia. Retención debe reflejar la capacidad real del proveedor, no un plazo inventado.

### Vehículo: `data.vehicles[]`

| Campos | Tipo | Requisito |
|---|---|---|
| `id`, `plate`, `vin` | string | ID, matrícula y bastidor; identificar faltantes |
| `type`, `category`, `brand`, `model` | string | Tipo, categoría homologada, marca y modelo |
| `year` | integer | Año conocido; null si falta |
| `fuel` | enum | `diesel`, `gasoline`, `glp`, `natural_gas`; ampliar mediante acuerdo | SIEMPRE ES DIESEL
| `service` | string | Uso real del vehículo |
| `deviceId`, `deviceModel`, `telematicName` | string | Identificación del sistema vinculado |
| `installedAt`, `activatedAt` | date | Fechas reales de instalación y activación |
| `pre`, `post` | objeto | Periodos de referencia/demostración medidos |
| `annualKm` | number | Kilometraje anual de referencia, no extrapolación oculta |
| `annualKmSource` | objeto | Añadir `from`, `to`, `method`, `source`; justificación del kilometraje anual |
| `fuelEvents` | array | Eventos originales del periodo con trazabilidad |
| `feedback` | objeto | Informes y comunicaciones al conductor |

`pre` y `post`: `from`, `to`, `days` (días reales cubiertos), `km`, `liters` para combustible líquido. Añadir `timezone`, `source`, `coveragePercent` (0–100), `unit` y `qualityIssues`. Las fechas deben ordenar correctamente los periodos y relacionarse con la activación. No imponer 90 días en los datos si solo hay 80: informar 80 y la incidencia. El agregador debe documentar tratamiento de datos ausentes, anomalías, reinicios de odómetro y exclusiones.

`fuelEvents[]`: `id` string, `at` datetime, `lat`/`lng` grados WGS84, `country` ISO 3166-1 alfa-2, `quantity` number, `unit` (`l`, `kg`, `kWh`), `automatic` boolean, `odometer` km, `source` string. Indicar null en coordenadas/país desconocidos. IDs únicos por vehículo; no duplicar eventos. Aportar evidencia de clasificación territorial y cruce con kilómetros; un GPS aislado no sustituye la justificación del parámetro r.

`feedback`: `reports`, `communicated` como enteros conocidos. Añadir `items[]` con `id`, `generatedAt`, `communicatedAt` (nullable), `channel`, `documentId` (nullable), para comprobar los contadores sin necesitar datos personales del conductor. Si no existe detalle, señalarlo como carencia.

Los campos adicionales de trazabilidad son requisitos de la integración propuesta y requieren ampliar el adaptador actual. El ejemplo refleja el núcleo ya consumido por la app.

## 6. Parámetro r y cálculos

Solicitamos registros fuente y certificado, no solo un número. Añadir por vehículo `rCalculation: {value, numerator, denominator, unit, method, methodVersion, from, to, evidenceDocumentIds}`. `value` entre 0 y 1 si se conoce. El proveedor debe explicar qué mide cada operando y cómo identifica el ámbito territorial.

Los cálculos actuales del frontend son preliminares. No reproducir su fórmula como criterio normativo aprobado. Acordaremos metodología, unidades y validación con la ficha aplicable antes de producción; una discrepancia debe quedar visible y no corregirse alterando los datos fuente.

## 7. Anexo I

Las claves están en `CAMPOS_ANEXO.md`. Strings para textos y fechas administrativas; opciones binarias `yes`, `no` o null. `socialBenefits` es una lista de códigos: `vulnerable`, `severe`, `exclusion`, `justice`, `thermal`, `none`; `none` excluye otros valores. Lista vacía significa pendiente de confirmar.

Representación, poderes, beneficiario y ayudas deben proceder de declaraciones confirmadas. No deducir «sin subvenciones» de la ausencia de registros en el sistema. Añadir `declarationSource: {confirmedAt, source, reference}` si existe constancia; no enviar una firma fabricada. La aplicación permite completar los datos faltantes antes de descargar. La API no firma el PDF.

## 8. Documentos

`documents.invoices` es una lista; `documents.rCertificate` es un descriptor o null. Cada descriptor:

| Campo | Tipo | Regla |
|---|---|---|
| `id` | string | Estable; obligatorio |
| `type` | enum | `invoice` o `r_certificate` |
| `status` | enum | `available`, `pending`, `unavailable` |
| `fileName` | string/null | Nombre original; obligatorio si available |
| `mimeType` | string/null | `application/pdf` en esta fase |
| `sizeBytes` | integer/null | Tamaño exacto, positivo si available |
| `sha256` | string/null | 64 caracteres hexadecimales; obligatorio si available |
| `vehicleIds` | string[] | Vehículos cubiertos; no ambiguo |
| `issuedAt` | date/null | Fecha real del documento |
| `reason` | string/null | Motivo si no disponible |

No enviar base64 ni binarios dentro del JSON. Descargar mediante el endpoint de contenido, que debe devolver exactamente los bytes originales. `pending`: contenido devuelve 409; `unavailable`: 404 con código específico. Respuesta de descarga no puede ser HTML con estado 200. Verificar hash y tamaño antes de incorporar al expediente.

Para facturas, añadir `invoiceNumber`, `issuerName`, `issuerNif`, `recipientNif`, `currency`, `totalAmount`, `serviceFrom`, `serviceTo` si están disponibles. No crear una factura de ejemplo como original de producción. Si una factura/certificado cubre más vehículos que la selección, indicar su alcance; no recortar ni modificar documentos firmados automáticamente.

Destino local: cada factura en `E1-3-3/E1-3-3-N factura N`; certificado r en `E1-3-6`. Los archivos fijos de software y requisitos técnicos se suministran por separado. El Anexo I y compromiso son generados/cargados por nuestra app.

## 9. Tamaños y operación

El flujo actual controla 10 MB decimales por archivo/ZIP y 50 MB de documentación generada. Solicitamos originales PDF de hasta 10.000.000 bytes. Si exceden el límite, informar tamaño real y ofrecer una versión válida sin invalidar su firma; no omitirlos ni comprimirlos con pérdida silenciosamente. El límite de la sede incluye también documentos añadidos fuera de la app.

Cabeceras de descarga deben exponer nombre y tamaño cuando la modalidad CORS lo requiera. Acordar límites y tiempos reales del proveedor. Objetivo de aceptación propuesto: búsqueda ≤2 s y snapshot de 500 vehículos ≤15 s en entorno acordado, medidos en p95; si no es viable, acordar paginación o preparación asíncrona antes de cerrar el contrato. No es una capacidad verificada del servicio actual.

## 10. Errores

Formato: `{error:{code,message,requestId,details:[{path,message}]}}`. Nunca devolver secretos o trazas internas.

| Estado | Uso |
|---|---|
| 400 | Parámetros inválidos |
| 401 | Token ausente/caducado |
| 403 | Cliente/documento no autorizado |
| 404 | Cliente o documento inexistente/no disponible |
| 409 | Documento pendiente de generación |
| 410 | Snapshot/cursor caducado |
| 422 | Solicitud entendida pero ámbito/fechas no procesables |
| 429 | Límite de solicitudes; incluir Retry-After |
| 500/503 | Fallo temporal; incluir requestId |

Reintentar GET solo ante fallos transitorios, 429 o 503, respetando Retry-After y con espera progresiva limitada. No reintentar indefinidamente ni convertir un fallo en colección vacía.

## 11. Pruebas de aceptación

- Búsqueda por nombre con/sin tildes y NIF con separadores; sin resultados y paginación.
- Un cliente completo, otro con datos desconocidos y otro de 500 vehículos; IDs únicos y ningún registro truncado.
- Periodos incompletos, repostajes vacíos, odómetro anómalo y unidad no soportada informados explícitamente.
- Acceso cruzado entre clientes rechazado, incluidos los documentos.
- Dos facturas con nombres iguales pero IDs distintos; certificado r pendiente; original disponible con hash correcto.
- Descarga interrumpida, token caducado, documento mayor de 10 MB y snapshot caducado.
- Consistencia de contadores, unidades, relaciones de documentos y snapshot.
- Demostración de trazabilidad de r y cobertura de periodos; aprobación separada de metodología.

La entrega se considera integrable tras acordar los puntos abiertos del README, aportar la documentación técnica y superar estas pruebas conjuntamente. No se requiere implementar la estructura interna de React.
