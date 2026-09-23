# Requisitos y decisiones

Origen inicial: [conversación compartida](https://chatgpt.com/share/6ab395b8-cb74-83eb-ac56-904a08550fb5). Actualizado con las aclaraciones del usuario en esta tarea, 23/09/2026.

## Flujo confirmado

1. Comenzar por búsqueda de cliente por nombre o NIF.
2. Cargar todos sus vehículos, consumo, kilómetros y datos asociados. Trabajar con simulaciones hasta acordar el contrato del proveedor.
3. Seleccionar todos o algunos vehículos para cada trabajo.
4. Retirar la pestaña «API y datos». La futura conexión estará integrada en código.
5. Utilizar literalmente el Anexo I del Ministerio, cumplimentando sus campos y manteniendo el PDF editable. Señalar datos pendientes y pedir confirmación siempre que se descargue con apartados sin cumplimentar.
6. Mantener descargas previas para firma y expediente ordenado después de adjuntar los documentos.
7. Conservar trabajos en JSON junto al HTML, sin DB, incluyendo datos, selección, revisión y referencias a firmados. Crear archivos y subcarpetas al comenzar; permitir retomar.
8. Mantener la app utilizable con cientos de vehículos y evitar descargas indefinidamente pendientes.

## Alcance implementado

Tres clientes ficticios con 24/120/500 vehículos; búsqueda, selección paginada, Anexo original editable, revisión condicional, exportación en worker, progreso/cancelación, historial en carpeta elegida y recuperación de adjuntos. El navegador exige seleccionar la carpeta y autorizar su escritura; ese permiso no puede quedar implícito por abrir un HTML local.

El contrato definitivo de la API se redactará más adelante, con el modelo que se cierre durante esta etapa de frontend. Los ejemplos no son una integración real.

## Fuentes y límites

El procedimiento adjunto de MITERD exige, para actuaciones estandarizadas, un archivo comprimido independiente por actuación: `ActuacionE1`, `ActuacionE2`, etc. Cada uno debe contener `AnexoE1`, `AnexoE2`, etc., y documentos numerados `E1-1`, `E1-2`, `E1-3-1`, `E1-3-2` y `E1-4` según el anexo. El generador ordenado aplica ahora esta convención. En la simulación, al no existir todavía `actuaciones[]` en la respuesta del proveedor, todos los vehículos seleccionados se agrupan en `ActuacionE1.zip`; cuando el contrato API aporte actuaciones explícitas, cada grupo generará su propio ZIP.

Los convenios, dictámenes, fichas y justificantes que no llegan de la API se crean como archivos `.pendiente.txt` dentro del `ActuacionE<n>.zip`. No se generan documentos falsos para satisfacer la nomenclatura.

El [Anexo I de MITECO](https://www.miteco.gob.es/content/dam/miteco/es/energia/files-1/Eficiencia/CAE/cat%C3%A1logo-vigente/Anexo%20I%20de%20las%20fichas_DR%20subvenciones.pdf) fue descargado e inspeccionado: cuatro páginas con campos AcroForm. Se conserva en `src/assets/`.

La conversación inicial citó [BOE-A-2026-16993](https://www.boe.es/diario_boe/txt.php?id=BOE-A-2026-16993). Las reglas numéricas heredadas no se revalidaron normativamente en este cambio. Tampoco se dispone del repositorio Builder ni del modelo oficial del Compromiso del Gerente. No presentar esas partes como verificadas.
