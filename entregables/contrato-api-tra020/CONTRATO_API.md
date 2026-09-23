# Contrato funcional y técnico de API TRA020

Versión documental revisada 1.1 · 23/09/2026. Base ilustrativa: `https://api.proveedor.example/v1`. Los nombres se pueden adaptar mediante un adaptador si se conserva el contenido y las garantías acordadas.

## 1. Flujo

Buscar cliente → seleccionar resultado → recuperar un snapshot completo de datos → seleccionar los vehículos incluidos → obtener documentos correspondientes → preparar cálculo y documentos → revisión y firma → documentación para su revisión.

La API es de lectura. No se requieren endpoints de subida de firmados ni de creación del expediente.

## 2. Transporte y autenticación

HTTPS y JSON UTF-8. Cabeceras `Accept: application/json` y `Authorization: Bearer <token>`. Las respuestas deben restringirse a los clientes autorizados; conocer un ID no concede acceso.

El proveedor indicará cómo obtener, renovar y revocar el permiso de acceso. Las credenciales se entregarán por un canal privado separado de esta documentación. Se acordará el método con el equipo técnico antes de desarrollar.

## 3. Endpoints requeridos

| Método y ruta | Entrada | Respuesta 200 |
|---|---|---|
| `GET /clients` | `query` texto obligatorio; `limit` entero 1–100, defecto 20; `cursor` opaco opcional | `{items: ClientSummary[], nextCursor: string|null}` |
| `GET /clients/{clientId}/expediente-data` | ID estable; `from` y `to` fechas opcionales, deben enviarse juntos | `{schemaVersion, snapshotId, generatedAt, data}` |
| `GET /clients/{clientId}/documents/{documentId}/content` | IDs autorizados; `snapshotId` obligatorio en query | Binario original con Content-Type, Content-Length y Content-Disposition |

Búsqueda por coincidencia parcial de razón social o NIF, sin distinguir mayúsculas ni tildes; ignorar separadores habituales del NIF. Sin resultados: 200 y `items: []`. Orden determinista por nombre y luego ID. Cursor inválido: 400; cursor caducado: 410 y reiniciar búsqueda.

El detalle debe devolver todos los vehículos y eventos del ámbito solicitado, nunca truncarlos silenciosamente. Sin `from/to`, se entrega el periodo disponible asociado a la actuación propuesta y se indican sus fechas reales. Si se solicitan fechas, devolver datos de ese intervalo o señalar cobertura insuficiente; no inventar periodos completos.

Propuesta inicial: detalle completo en una respuesta. Si el volumen exige paginación, el proveedor propondrá extensión antes de implementación: todas las páginas deben compartir `snapshotId`, total de vehículos/eventos y cursor final; la entrega se considerará incompleta hasta recuperar el conjunto completo. No mezclar revisiones de distintas páginas.

## 4. Reglas comunes

- IDs: cadenas estables y únicas dentro del proveedor; no reciclarlos al cambiar matrícula o dispositivo.
- Fechas: `YYYY-MM-DD`; instantes: RFC 3339 con zona, preferentemente UTC `Z`. Indicar zona de agregación, por ejemplo `Europe/Madrid`.
- Decimales: números JSON con punto, sin separadores de miles ni unidades concatenadas. No usar cadenas para valores numéricos.
- Unidades explícitas: km, litros, kg o kWh según magnitud. El alcance acordado es exclusivamente diésel: combustible en litros y distancias en kilómetros.
- Desconocido: `null`, nunca cero, falso o cadena inventada. Cero y `false` son mediciones/declaraciones conocidas. Colección vacía significa que no hay elementos; si la consulta está incompleta, informar en `quality.issues`.
- Campos obligatorios estructurales deben existir. Si una medición necesaria no está disponible, entregar `null` y su causa; el vehículo quedará pendiente de revisión hasta resolverla.
- `schemaVersion`: `1.0`; cambios incompatibles requieren nueva versión mayor. Añadir propiedades opcionales no debe alterar la semántica existente.
- El snapshot debe ser inmutable durante la descarga de sus documentos. Si caduca devolver 410; nunca reemplazar un original por otro bajo el mismo snapshot.

## 5. Diccionario del detalle

### Envoltorio y cliente

| Ruta | Tipo | Obligación y significado |
|---|---|---|
| `schemaVersion` | string | Obligatorio; versión del contrato
| `snapshotId` | string | Obligatorio; revisión coherente de datos/documentos
| `generatedAt` | datetime | Obligatorio; fecha de extracción |
| `data.client` | objeto | Obligatorio; `id`, `name`, `nif`, `city`, `vehicles` (cantidad total) |
| `data.expediente` | objeto | `codigo`, `nombre`, `comunidad`, `ano`, `direccion`, `referenciaCatastral`; valores administrativos desconocidos pueden ser null |
| `data.owner` | objeto | Propietario inicial del ahorro: cliente de Gestracking |
| `data.gestrackingPurchasedSavings` | boolean/null | ¿Gestracking compró el ahorro? true = sí; false = no; null = pendiente |
| `data.beneficiary` | objeto/null | Datos de Gestracking si compró el ahorro; del cliente si no; null si se desconoce. Misma estructura de identificación y representante que owner |
| `data.provider` | objeto | Origen y trazabilidad de datos
| `data.vehicles` | array | Todos los vehículos del cliente en el ámbito solicitado |
| `data.declaration` | objeto | Datos confirmados del Anexo I; ver apartado 7 |
| `data.evidence` | array | Inventario de evidencias; puede estar vacío
| `data.documents` | objeto | Facturas de la inversión y certificado del cálculo de r; ver apartado 8 |
| `data.quality` | objeto | Añadir: `complete` boolean, `issues` array de `{code,path,message}`

`owner`: `razonSocial`, `nif`, `domicilio`, `telefono`, `email`, `representante`, `representanteNif`, `representanteDomicilio`, `representanteTelefono`, `representanteEmail`, `cargo`. Razón social y NIF necesarios para identificar al propietario; el resto puede ser null. Un contacto de la empresa no es automáticamente representante legal. El propietario inicial es el cliente de Gestracking, aunque posteriormente Gestracking compre el ahorro.

`provider`: `nombre`, `extractedAt`, `apiVersion`, `feedbackMode` y, cuando estén acreditados, `retentionYears`, `iso27001`. Indicar origen de los datos y versión del proceso. No usar `iso27001: true` sin evidencia. Retención debe reflejar la capacidad real del proveedor, no un plazo inventado.

### Vehículo: `data.vehicles[]`

| Campos | Tipo | Requisito |
|---|---|---|
| `id`, `plate`, `vin` | string | ID, matrícula y bastidor; identificar faltantes |
| `type`, `category`, `brand`, `model` | string | Tipo, categoría homologada, marca y modelo |
| `year` | integer | Año conocido; null si falta |
| `fuel` | enum | `diesel`, `gasoline`, `glp`, `natural_gas`; ampliar mediante acuerdo
| `service` | string | Uso real del vehículo |
| `deviceId`, `deviceModel`, `telematicName` | string | Identificación del sistema vinculado |
| `installedAt`, `activatedAt` | date | Fechas reales de instalación y activación |
| `pre`, `post` | objeto | Periodos de referencia/demostración medidos |
| `annualKm` | number | Kilometraje anual de referencia, no extrapolación oculta |
| `annualKmSource` | objeto | Añadir `from`, `to`, `method`, `source`; justificación del kilometraje anual |
| `fuelEvents` | array | Eventos originales del periodo con trazabilidad |
| `feedback` | objeto | Informes y comunicaciones al conductor |

`pre` y `post`: `from`, `to`, `days` (días reales cubiertos), `km`, `liters` para combustible líquido. Añadir `timezone`, `source`, `coveragePercent` (0–100), `unit` y `qualityIssues`. Las fechas deben ordenar correctamente los periodos y relacionarse con la activación. No imponer 90 días en los datos si solo hay 80: informar 80 y la incidencia. El agregador debe documentar tratamiento de datos ausentes, anomalías, reinicios de odómetro y exclusiones.

`fuelEvents[]`: `id` string, `at` datetime, `lat`/`lng` grados WGS84, `country` ISO 3166-1 alfa-2, `quantity` number, `unit` (`l`, litros en este alcance), `automatic` boolean, `odometer` km, `source` string. Indicar null en coordenadas/país desconocidos. IDs únicos por vehículo; no duplicar eventos. Aportar evidencia de clasificación territorial y cruce con kilómetros; un GPS aislado no sustituye la justificación del parámetro r.

`feedback`: `reports`, `communicated` como enteros conocidos. Añadir `items[]` con `id`, `generatedAt`, `communicatedAt` (nullable), `channel`, `documentId` (nullable), para comprobar los contadores sin necesitar datos personales del conductor. Si no existe detalle, señalarlo como carencia.

El ejemplo incluye también los campos de trazabilidad. Cuando no se conoce su valor, contiene `null` y una incidencia que explica qué falta.

## 6. Parámetro r y cálculos

Solicitamos registros fuente y certificado, no solo un número. Añadir por vehículo `rCalculation: {value, numerator, denominator, unit, method, methodVersion, from, to, evidenceDocumentIds}`. `value` entre 0 y 1 si se conoce. El proveedor debe explicar qué mide cada operando y cómo identifica el ámbito territorial.

La fórmula de cálculo deberá justificarse por separado; este contrato describe datos y no establece una metodología normativa. Acordaremos metodología, unidades y validación con la ficha aplicable antes de producción; una discrepancia debe quedar visible y no corregirse alterando los datos fuente.

## 7. Anexo I

Las claves están en `CAMPOS_ANEXO.md`. Strings para textos y fechas administrativas; opciones binarias `yes`, `no` o null. `socialBenefits` es una lista de códigos: `vulnerable`, `severe`, `exclusion`, `justice`, `thermal`, `none`; `none` excluye otros valores. Lista vacía significa pendiente de confirmar.

Representación, poderes, beneficiario y ayudas deben proceder de declaraciones confirmadas. No deducir «sin subvenciones» de la ausencia de registros en el sistema. Añadir `declarationSource: {confirmedAt, source, reference}` si existe constancia; no enviar una firma fabricada. Los datos faltantes se completarán durante la revisión documental. La API no firma el PDF.

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

Las facturas solicitadas son las de la inversión o servicio asociado a la actuación, no las de repostaje. El certificado r debe identificar los vehículos y el periodo cubiertos. El certificado del software y el informe técnico común se solicitarán por separado.

## 9. Tamaños y operación

Se toma como referencia de entrega 10 MB por fichero y 50 MB por conjunto documental. Solicitamos originales PDF de hasta 10.000.000 bytes. Si exceden el límite, informar tamaño real y ofrecer una versión válida sin invalidar su firma; no omitirlos ni comprimirlos con pérdida silenciosamente. El límite de la sede incluye también documentos añadidos por otras vías.

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

La entrega se considera integrable tras acordar los puntos abiertos del README, aportar la documentación técnica y superar estas pruebas conjuntamente. 

## 12. Cómo leer los campos que suelen generar dudas

| Campo o término | Explicación sencilla | Ejemplo y quién lo aporta |
|---|---|---|
| `schemaVersion` | Número que identifica cómo están organizados los datos, no la versión de la ficha TRA020. | `1.0`: lo asigna el equipo técnico. La revisión editorial de este documento no cambia ese número. |
| `snapshotId` | Código de una entrega concreta. Permite que los documentos descargados después correspondan a los mismos datos, aunque el sistema se actualice. | `SNAP-DEMO-001`: lo genera el proveedor; no lo tiene que inventar el cliente manualmente. |
| `generatedAt` | Momento en que se preparó la respuesta. | No es la fecha de instalación ni la de una factura. |
| `provider` | Empresa o servicio que suministra los datos y cómo los obtuvo. | No significa propietario del ahorro ni comprador. |
| `evidence` | Lista de justificantes que respaldan una afirmación. | Un certificado pendiente no equivale a un certificado entregado. Su estado y referencia permiten saberlo. |
| `quality` | Avisos de información incompleta. | `complete: false` con una explicación si falta la fuente del kilometraje anual. |
| `path` | Dirección de un dato dentro de la respuesta. | `vehicles[0].annualKmSource` señala el origen del kilometraje del primer vehículo. |
| `null` | No se conoce el dato o no se ha confirmado. | No confundir con `0`: cero kilómetros es un valor conocido. |
| `pre` / `post` | Mediciones anteriores y posteriores a la activación. | Indicar fechas reales, kilómetros y litros consumidos. |
| `days` / `coveragePercent` | Días con información válida y porcentaje del periodo cubierto. | Un periodo de 90 días con 80 válidos no tiene cobertura completa; explicar el criterio empleado. |
| `annualKmSource` | De dónde sale el kilometraje anual. | Medición de doce meses o estimación expresamente identificada; no presentar una extrapolación como medida. |
| `feedback` | Informes de conducción y constancia de su comunicación. | Preparar un informe y enviarlo son hechos distintos. |
| `rCalculation` | Explicación del valor r y los datos que lo sustentan. | `numerator` es la cantidad dividida; `denominator`, la cantidad por la que se divide. El significado y método deben documentarse, no suponerse. |
| `sha256` | Huella digital del archivo para comprobar que no cambió durante la descarga. | La calcula el sistema; no es una firma electrónica ni hay que rellenarla a mano. |
| `mimeType` / `sizeBytes` | Tipo y tamaño del archivo. | `application/pdf` significa PDF; 1.000.000 bytes son 1 MB en este contrato. |
| `vehicleIds` | Vehículos a los que corresponde un documento. | Una factura puede cubrir varios; se enumeran sus códigos. |
| `cursor` / `nextCursor` | Marca para pedir la siguiente parte de una lista. | `nextCursor: null` significa que no quedan páginas. |
| `token` | Permiso temporal para consultar datos. | Lo gestiona el equipo técnico mediante el acceso acordado. |
| `p95` | Tiempo máximo observado en el 95 % de las consultas medidas. | Es un objetivo a negociar, no un requisito normativo. |
| `requestId` | Código de una consulta que ha dado error. | Sirve para que soporte encuentre el problema. |

### Evidencias y campos auxiliares del ejemplo

`evidence[]` contiene `id` (código), `name` (qué acredita), `source` (quién lo emite), `status` (`available`, `pending` o `unavailable`) y `documentId` (referencia a un documento descargable, o null). Los documentos de esta fase están en `documents`; no se exige una segunda descarga de la misma factura.

`declarationSource`: `confirmedAt` es cuándo se confirmó la declaración, `source` indica su procedencia y `reference` el documento o referencia que la acredita. Todos pueden ser null si no se dispone de confirmación.

Los campos opcionales de una factura también están representados en el ejemplo: `invoiceNumber` es el número de factura; `issuerName` y `issuerNif`, quien la emite; `recipientNif`, quien la recibe; `currency`, moneda (`EUR`); `totalAmount`, importe total; `serviceFrom/to`, periodo facturado.

## 13. Compra del ahorro: pregunta sencilla

**¿Gestracking ha comprado el ahorro energético de este cliente?**

La respuesta se entrega en `data.gestrackingPurchasedSavings`. Es un booleano: `true` significa sí y `false` significa no. Si todavía no se sabe, enviar `null`; no confundirlo con no.

El propietario inicial (`owner`) siempre identifica al cliente de Gestracking. Si la respuesta es sí, `beneficiary` identifica a Gestracking; si es no, identifica al propio cliente. Se utiliza «beneficiario» con este significado operativo en el intercambio, sin atribuirle por ello la condición de beneficiario de subvenciones. Consultar `CAMPOS_ANEXO.md` para la correspondencia de campos.

El ejemplo representa una compra **no confirmada**, por eso ambos valores son null y existe una incidencia. Al confirmarse la respuesta se completarán los datos correspondientes. No se presuponen NIF, dirección ni representantes de Gestracking. El suministro de datos de representación no sustituye la revisión de quién debe firmar cada documento.
