# TRA020 Expedientes Masivos

Aplicación React portátil para buscar clientes, seleccionar su flota, preparar documentos y retomar trabajos desde archivos locales. Versión 0.3.0; datos de proveedor simulados.

## Uso del HTML

Abre `dist/index.html` en Chrome o Edge de escritorio.

1. Pulsa **Seleccionar carpeta** y elige la carpeta que contiene ese HTML. El navegador necesita tu permiso: la app no puede obtener acceso silenciosamente por abrirse con doble clic.
2. Si no existen, se crean `historial.json` y `TRA020_archivos/` en la carpeta elegida. Al volver a abrir la app, selecciona esa misma carpeta para cargar el historial.
3. Busca por nombre o NIF, abre un cliente y selecciona todos o algunos vehículos.
4. Revisa el Anexo I. Los datos de la simulación se precargan; los pendientes se señalan. Cada descarga que incluya el Anexo incompleto requiere confirmación.
5. Descarga los documentos, obtén las firmas y adjunta los archivos para generar el ZIP ordenado.
6. Usa **Historial → Retomar** para recuperar datos, selección, revisión y adjuntos de un trabajo.

La generación muestra progreso y puede cancelarse. Al terminar se intenta descargar automáticamente; el enlace **Guardar archivo** permanece disponible si el navegador no inicia la descarga.

## Anexo I

Se incluye el **PDF original del Ministerio**, con sus cuatro páginas, campos AcroForm, casillas y campo de firma. Se cumplimenta sin aplanar: el cliente puede completar los vacíos en su lector PDF. Para una flota que no quepa de forma legible en la casilla de equipos, se añaden hojas editables con matrícula y dispositivo, referenciadas desde esa casilla. El Compromiso del Gerente sigue siendo un borrador propio.

## Desarrollo

```bash
npm ci
npm run dev
npm test
npm run build
```

El build integra estilos, generador de documentos y PDF oficial en un único `dist/index.html`, sin servidor para su uso final. `npm run preview` permite revisar el build por HTTP. `npm run prepare:pdf` regenera la plantilla embebida desde el PDF original.

## Simulación

- Transportes Sierra Norte: `B12345678`, 24 vehículos.
- Logística Mediterránea: `B87654321`, 120 vehículos.
- Flota Nacional Demo: `A11223344`, 500 vehículos y 12.000 repostajes.

El adaptador está en `src/data/mockClients.js`. Hay ejemplos JSON en `examples/`; se regeneran con `node scripts/write-samples.mjs`. No hay pestaña «API y datos». El contrato final del proveedor se elaborará cuando se cierre el modelo de información.

## Convención de expedientes y descargas

La salida sigue la documentación local de CAE Studio / Expediente Builder: `expedientes/<ID>/documentos/` contiene originales, evidencias y firmados; `expedientes/<ID>/outputs/` contiene resultados. La solicitud estandarizada genera un ZIP independiente por actuación: `ActuacionE1.zip`, `ActuacionE2.zip`, etc. Dentro se usan `AnexoE1.pdf`, `E1-1`, `E1-2`, `E1-3-1`, `E1-3-2` y `E1-4`. El Excel principal se descarga como `calculo-ahorro.xlsx`. Los documentos individuales usan nombres descriptivos y los firmados se renombran con `anexo_` o `commitment_` para evitar colisiones.

## Almacenamiento y límites

`historial.json` conserva los trabajos completos y las referencias de los adjuntos, que se guardan bajo `TRA020_archivos/<id-trabajo>/`. `historial.anterior.json` conserva la versión anterior. No se usa una base de datos. Conserva HTML, JSON y carpeta de adjuntos juntos al trasladar el trabajo. Los documentos generados pueden volver a generarse; el historial registra sus metadatos, no sus binarios.

Sin carpeta conectada se puede explorar y descargar, pero el trabajo está solo en memoria. La app avisa antes de salir con cambios sin guardar y pide guardar antes de abrir otro cliente. Cambiar los datos o la selección invalida los adjuntos activos; sus archivos anteriores permanecen en disco. La app no verifica firmas. Evita editar el mismo historial simultáneamente en varias ventanas.

Los originales de facturas y certificados no están disponibles en la simulación y se identifican como pendientes en el ZIP. Los cálculos son preliminares. La plantilla de carpetas aún debe contrastarse con Builder y el cálculo con la ficha oficial aplicable.

## Documentación

- [AGENTS.md](AGENTS.md): reglas de trabajo.
- [Requisitos](docs/REQUISITOS.md).
- [Arquitectura](docs/ARQUITECTURA.md).
- [Modelo de datos y futura API](docs/CONTRATO_API.md).
- [Pendientes](docs/PENDIENTES.md).
- [Validación](docs/VALIDACION.md).
- [Origen del PDF](src/assets/README.md).
# TRA020
