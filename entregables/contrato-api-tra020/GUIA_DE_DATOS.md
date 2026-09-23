# Qué información necesitamos y cómo responder

Esta guía explica la petición sin necesidad de conocer programación. Los nombres entre comillas invertidas sirven para localizar cada dato en el ejemplo. El equipo técnico se encargará de colocarlos en la respuesta de la API.

## 1. Empresa y personas

| Bloque | Qué necesitamos saber | Qué debe aportar quien conoce el negocio |
|---|---|---|
| `client` | ¿De qué cliente de Gestracking son los vehículos? | Nombre, NIF, ciudad y cantidad de vehículos. `id` es el código interno que ya usa su sistema. |
| `owner` | ¿Quién es el propietario inicial del ahorro? | En este intercambio, el cliente de Gestracking: razón social, NIF, domicilio y contacto. No se cambia por Gestracking cuando se compra el ahorro. |
| `gestrackingPurchasedSavings` | ¿Gestracking compró el ahorro de este cliente? | Sí (`true`), no (`false`) o todavía no se sabe (`null`). |
| `beneficiary` | ¿A quién identificamos como beneficiario en este intercambio? | Gestracking si compró el ahorro; en otro caso, el cliente. No es una declaración sobre ayudas públicas. |
| `expediente` | ¿Qué actuación y ubicación estamos describiendo? | Nombre, comunidad autónoma, año y dirección conocidos. Si todavía no hay código asignado, indicar que está pendiente. |
| `declaration` | ¿Qué información se conoce para el Anexo I? | Datos de las partes, representación y declaraciones de ayudas. No contestar «no» solo porque no aparezcan ayudas en el sistema. |
| `declarationSource` | ¿De dónde sale esa declaración? | Por ejemplo, «declaración remitida por el cliente el día…» y su referencia. Si nadie la ha confirmado, dejar pendiente. |

Los datos del representante son los de la persona autorizada a actuar por la empresa correspondiente. No basta con que sea el contacto comercial. La compra del ahorro no determina por sí sola quién firma cada documento.

## 2. Quién proporciona la información: `provider`

Este bloque describe el servicio de telemetría del que proceden los datos. No es el cliente propietario del ahorro ni un justificante de compra.

| Campo | Pregunta en lenguaje habitual | Respuesta esperada |
|---|---|---|
| `nombre` | ¿Qué empresa suministra estos datos? | Su nombre, por ejemplo Gestracking si es quien los suministra. |
| `feedbackMode` | ¿Cómo recibe el conductor las recomendaciones? | Descripción real: avisos en cabina, informes individuales enviados, etc. |
| `retentionYears` | ¿Durante cuántos años conservan estos registros? | Número de años confirmado, o null. No se solicita inventar un plazo ni cambiar su política. |
| `iso27001` | ¿El servicio cuenta con esa certificación vigente? | Sí, no o desconocido. Si responden sí, debe poder respaldarse con el certificado. |
| `extractedAt` | ¿Cuándo se extrajeron los datos? | Fecha y hora generadas por el sistema. |
| `apiVersion` | ¿Qué versión del servicio de consulta se usó? | Lo responde su equipo técnico. No es la versión de TRA020. |

## 3. Datos de cada vehículo: `vehicles`

Necesitamos identificar cada vehículo y relacionarlo con su dispositivo: matrícula, bastidor, categoría, marca, modelo, año, uso, código del dispositivo y fechas de instalación y activación. El alcance es diésel, con consumos en litros y recorridos en kilómetros.

**Instalación y activación no significan necesariamente lo mismo.** Instalación es cuándo se colocó el equipo; activación, cuándo empezó a funcionar el sistema objeto de la actuación. Si ocurrieron el mismo día se indica la misma fecha.

### Antes y después: `pre` y `post`

Para cada periodo necesitamos sus fechas reales, días con datos válidos, kilómetros recorridos y litros consumidos. `pre` es antes de la activación y `post`, después.

- `km`: kilómetros recorridos durante ese periodo, no la lectura acumulada del cuentakilómetros.
- `liters`: combustible consumido durante ese periodo. No tiene por qué coincidir con la suma de litros repostados: puede quedar combustible en el depósito.
- `source`: de dónde sale la medición, por ejemplo lecturas del vehículo.
- `coveragePercent`: cuánto del periodo tiene información válida. Si no pueden calcularlo, indicar null y explicar la limitación.
- `qualityIssues`: problemas concretos, por ejemplo «faltan registros del 10 al 12 de junio».

### Kilometraje anual: `annualKm` y `annualKmSource`

No basta con el total: necesitamos saber si corresponde a doce meses medidos o a una estimación. En `annualKmSource` se indican fechas, método y origen. Ejemplo explicativo: «lecturas del cuentakilómetros entre el 1 de enero y el 31 de diciembre». Si se multiplicó una cifra trimestral por cuatro, debe decirse expresamente; no se considera automáticamente un método aprobado.

### Repostajes: `fuelEvents`

Es la lista de eventos registrados: cuándo se repostó, cuántos litros, ubicación, país, lectura del cuentakilómetros y si la detección fue automática. **No son facturas.** `automatic: false` significa que el evento no se detectó automáticamente; `null`, que no se sabe.

### Informes al conductor: `feedback`

Queremos saber cuántos informes se prepararon (`reports`) y cuántos se comunicaron (`communicated`). La lista `items` permite comprobarlo mediante las fechas de creación y envío y el canal utilizado. No pedimos el nombre del conductor. Si solo tienen los totales y no las fechas, deben explicar esa carencia.

### Explicación del parámetro r: `rCalculation`

Solicitamos el valor que utiliza el proveedor, el periodo al que corresponde y la explicación de cómo lo obtuvo. `numerator` y `denominator` son las dos cantidades que se dividen; `unit` dice qué miden; `method` explica la regla utilizada. No deben rellenarlos siguiendo una fórmula supuesta. Si aún no tienen el cálculo, se deja pendiente junto con su certificado.

## 4. Archivos que necesitamos: `documents`

Aquí se indica **qué archivo concreto existe y cómo identificarlo para descargarlo**.

| Apartado | Archivo solicitado | Para qué se solicita |
|---|---|---|
| `invoices` | Facturas de la inversión, instalación o servicio asociado a la actuación. | Documentar lo facturado, quién lo emitió, a quién y a qué vehículos o servicio corresponde. No demuestra por sí sola que esté pagado. |
| `rCertificate` | Certificado del cálculo del parámetro r. | Documentar su valor, método, periodo y vehículos cubiertos. |

No se piden facturas de combustible en `invoices`. Los registros de repostajes se entregan en `fuelEvents`.

Cada archivo lleva un código (`id`), nombre (`fileName`), fecha (`issuedAt`) y vehículos cubiertos (`vehicleIds`). `status` dice si ya está disponible, pendiente o no se puede suministrar; `reason` explica por qué falta. El equipo técnico proporciona tipo, tamaño y huella digital (`mimeType`, `sizeBytes`, `sha256`). No son datos que deba rellenar manualmente el responsable de la empresa.

El JSON enumera los archivos; el PDF se obtiene por la consulta de descarga indicada en el contrato. Los ejemplos contienen documentos pendientes y por eso no contienen PDFs reales ni tamaños o huellas inventados.

## 5. Qué significa `evidence` y por qué aparecen facturas

Es un **índice de comprobaciones documentales**. En esta entrega solo hay dos:

1. Documentar la inversión o servicio mediante la factura. `EV-001` apunta a la factura `DOC-001` de `documents.invoices`.
2. Documentar el cálculo del parámetro r mediante su certificado. `EV-002` apunta al certificado `DOC-002` de `documents.rCertificate`.

No se solicita una «afirmación» libre ni otra factura adicional. La factura aparece referenciada en el índice y descrita en `documents`, pero se descarga una sola vez. El equipo técnico puede construir este índice a partir de los mismos documentos; no hace falta que el personal administrativo introduzca los datos dos veces.

| Campo del índice | Significado concreto |
|---|---|
| `id` | Código de la comprobación, por ejemplo EV-001. |
| `name` | Lo que se va a documentar: inversión/servicio o cálculo de r. |
| `source` | Emisor del documento; null mientras no se conozca. |
| `status` | Si el documento está disponible, pendiente o no disponible. Debe coincidir con el documento referenciado. |
| `documentId` | Código del archivo en `documents`, por ejemplo DOC-001. No es una dirección de descarga. |

Los certificados comunes de software e informe técnico se entregarán por separado; no se añaden como exigencias ocultas a este índice.

## 6. Qué significa `quality`

Es la lista de **cosas que faltan o presentan problemas en esta entrega**, no una valoración de la empresa ni una certificación de los datos.

Ejemplo: «Se proporciona el kilometraje anual, pero falta indicar de dónde se obtuvo». En ese caso `complete` es false y `issues` contiene la explicación. `path` señala el campo afectado y `code` permite clasificar el problema; esas dos etiquetas las genera el equipo técnico.

El ejemplo de cliente está deliberadamente incompleto: faltan documentos, justificación de kilometraje, detalle de informes y confirmación de compra. Sus cifras son ficticias y no deben utilizarse para justificar una actuación real.

## 7. Datos que prepara el equipo técnico

No hay que pedir al responsable de la empresa que invente estos valores:

- `schemaVersion`: versión de la estructura de la respuesta.
- `snapshotId`: código de una entrega para no mezclar datos y documentos de actualizaciones distintas.
- `generatedAt`: cuándo se preparó esa entrega.
- `cursor`: marca para pedir la siguiente página de resultados.
- `requestId`: código de consulta para localizar un error.
- `sha256`: huella calculada a partir de un archivo para comprobar que se descargó intacto; no es una firma electrónica.

Las rutas, permisos y detalles de conexión del contrato están dirigidos al equipo técnico. Si su servicio organiza las consultas de otra manera, puede proponer una equivalencia conservando la información solicitada.

## 8. Qué respuesta esperamos del proveedor

Para cada bloque basta empezar por: **lo tenemos / lo tenemos parcialmente / no lo tenemos**, quién conoce el dato y cuándo podría entregarse. Después su equipo técnico confirmará cómo suministrarlo por API. No completar datos desconocidos con valores de ejemplo.
