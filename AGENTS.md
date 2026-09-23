# Guía de trabajo de TRA020

## Contexto

React portátil para preparar expedientes TRA020 con datos de clientes simulados. Leer [README](README.md), [requisitos](docs/REQUISITOS.md), [arquitectura](docs/ARQUITECTURA.md), [modelo de datos](docs/CONTRATO_API.md) y [pendientes](docs/PENDIENTES.md) antes de modificar el flujo.

## Reglas

- Mantener `dist/index.html` autónomo y abrible con doble clic. Conservar `viteSingleFile()`, recursos integrados y worker inline. No introducir peticiones necesarias para generar documentos sin conexión.
- La app empieza buscando cliente por nombre o NIF y permite seleccionar vehículos. No reintroducir configuración de API ni editor de JSON en la interfaz. La integración futura sustituirá el adaptador `clientService`.
- El Anexo I debe partir de `src/assets/anexo-i-miteco-original.pdf`, no de una recreación. Preservar las cuatro páginas y el formulario editable, sin aplanar. Los vacíos requieren confirmación en cada descarga individual o de paquete. Conservar una relación adicional para flotas extensas.
- No marcar declaraciones desconocidas como negativas, ni inventar representación, ayudas, facturas o certificados. Los valores no disponibles permanecen vacíos.
- Generar PDF/Excel/ZIP en `export.worker.js`; mantener progreso, cancelación, errores, tiempo máximo y enlace final. Convertir adjuntos a ArrayBuffer antes de pasarlos al worker/ZIP. Separar el tipo de mensaje del tipo MIME del resultado.
- No usar una DB para el historial: `historial.json` y adjuntos bajo `TRA020_archivos`. El usuario selecciona la carpeta del HTML y concede acceso. No prometer acceso automático sin permiso del navegador.
- Preservar datos del usuario: validar historial antes de escribir, conservar versión anterior y no sobrescribir archivos corruptos. Al cambiar selección/formulario, invalidar firmados activos sin borrar sus copias antiguas.
- Mantener `folderTemplate` en `src/domain/expediente.js`. La coincidencia con Builder no está verificada.
- Los cálculos y el Compromiso del Gerente siguen siendo preliminares. Para cambios normativos, consultar la fuente oficial vigente y documentar versión y apartado.
- No incorporar credenciales al frontend, ejemplos o exportaciones. El endpoint puede quedar integrado en código; la custodia de secretos se resolverá con la integración real.
- Editar las fuentes, no parchear manualmente el HTML compilado. No versionar historiales, adjuntos reales ni cachés. Preservar cambios del usuario.

## Validación

Ejecutar `npm test` y `npm run build` para cambios funcionales. Seguir [VALIDACION.md](docs/VALIDACION.md), incluyendo contenido del ZIP y estructura AcroForm, no solo apariencia. Probar flotas de cientos de vehículos. Informar límites del entorno; no atribuir pruebas del navegador integrado a Chrome/Windows. Actualizar documentos cuando cambien contratos, cálculos o flujos.
