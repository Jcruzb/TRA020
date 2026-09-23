# Estado de revisión

## Resuelto en 0.3.0

- Inicio por cliente y búsqueda por nombre/NIF, con tres respuestas simuladas.
- Selección de toda la flota o vehículos individuales y tabla paginada.
- Retirada del editor/pestaña API; adaptador separado para la futura conexión.
- Anexo I sobre el PDF oficial, conservando campos y firma; revisión de faltantes y confirmación por descarga.
- Historial JSON, carpeta de adjuntos, guardado automático, respaldo y recuperación de trabajos.
- Invalidación de adjuntos al cambiar los datos; nombres distintos por tipo en ZIP, incluso si los archivos de origen se llaman igual.
- Exportaciones fuera del hilo de pantalla, buffers explícitos, progreso, cancelación, límite de espera y enlace de descarga final.
- Jerarquía CCAA/año en ZIP; evidencias de simulación marcadas como pendientes.
- Exportación de repostajes vacíos sin fallo; bloqueo de exportación cuando no se seleccionan vehículos.

## Antes de producción

1. Cerrar modelo de información y redactar contrato API con el proveedor; implementar autenticación y descarga de originales. No incluir secretos en el HTML.
2. Contrastar reglas numéricas, `r`, unidades, periodos, cronología y evidencia de retroalimentación con la ficha oficial vigente. Los datos sintéticos no prueban trazabilidad normativa.
3. Obtener el modelo del Coordinador Nacional para el Compromiso del Gerente. Añadir los documentos y pasos de firma adicionales que correspondan, incluido el informe del gestor.
4. Contrastar carpetas/nomenclatura con Builder. La jerarquía actual sigue lo solicitado, pero no su implementación verificada.
5. Gestionar más de dos ayudas y datos extraordinariamente largos con las relaciones adicionales acordadas. El Anexo actual expone las dos tablas del original; su relación adicional de equipos sí soporta cientos de vehículos.
6. Revalidar el guardado real mediante el selector de carpetas y la apertura `file://` en Chrome/Windows. La lógica de archivos se prueba automáticamente; el entorno de revisión no ofreció Chrome conectado ni acceso automatizable al selector local.
7. Establecer política de copias de seguridad, actualización de dependencias y retención al pasar de simulaciones a información real. El respaldo automático mantiene una sola versión anterior; no sustituye copias externas.

## Límites explícitos

No se verifican firmas electrónicas ni originalidad documental. No hay bloqueo transaccional entre ventanas: trabajar con una ventana por carpeta. La app conserva los adjuntos de revisiones anteriores en disco, pero solo vincula la revisión activa en el historial. Los documentos generados se registran por metadatos y pueden regenerarse; no se conservan automáticamente como binarios dentro del historial.

## Exportación corregida (23/09/2026)

La descarga final es directamente `ActuacionE1.zip`, sin envoltorio de expediente, outputs, manifiestos ni pendientes de texto. Una actuación por trabajo: los tres firmados corresponden a la selección completa y se invalidan al cambiarla.

Carpetas: E1-1 Convenio CAE (subcarpetas E1-1 Convenio CAE y E1-2 Convenio de cesión de ahorro energético), E1-2 Dictamen favorable, E1-3-1 Formulario de cálculo del ahorro (E1-3-1-1 Excel y E1-3-1-2 PDF), E1-3-2 Anexo subvenciones Genérico de Transporte (subcarpeta E1-3-2), E1-3-3 Facturas, E1-3-4 Certificado del software, E1-3-5 Informe, E1-3-6 Certificado de cálculo parámetro r, E1-3-7 Informe de cumplimiento de requerimientos técnicos, E1-3-8 Compromiso del gerente y E1-4 Otros documentos justificativos. Los documentos no recibidos dejan carpetas vacías.

Se exige cargar cálculo PDF, Anexo I y Compromiso firmados. Se preservan sus bytes. El PDF de cálculo es preliminar, no el formulario oficial pendiente. El informe Excel conserva todas las columnas.

Guía local «Instrucciones para realizar la solicitud», apartado 7: 10 MB por fichero y 50 MB por envío. Se controlan binarios, volumen interno y ZIP final usando MB decimales conservadores; se bloquea el exceso. Los documentos añadidos a la sede fuera de la app no pueden contabilizarse automáticamente.
