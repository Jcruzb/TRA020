# Validación · 0.3.0

## Automatizada

```bash
npm ci
npm test
npm run build
```

Las pruebas cubren búsqueda, datos simulados, selección, invalidación de firmados, campos pendientes condicionales, PDF original y relación de 500 equipos, edición posterior de campos, contenido de ZIP/Excel para 500 vehículos y 12.000 eventos, eventos vacíos, bloqueo sin adjuntos, mensajes del worker, creación/recuperación del historial, adjuntos, respaldo, conflicto externo y protección frente a archivos/rutas inválidos.

Las pruebas de historial usan un adaptador de la interfaz de archivos; no sustituyen el selector/permiso real de Chrome. No existe script de lint.

## Revisión realizada

- Build de un único HTML con worker y PDF integrados.
- En navegador integrado, servidor local: búsqueda por NIF, carga de 500 vehículos, selección individual, formulario y confirmación de incompletos, generación de paquete previo, bloqueo del ordenado sin adjuntos y generación con dos PDF de prueba (no firmas reales).
- Tiempo observado en navegador: paquete previo de 500 vehículos aproximadamente 2 s; ordenado aproximadamente 0,4 s. Son mediciones locales de simulación, no garantía para cualquier equipo/tamaño de adjunto.
- PDF: renderizadas e inspeccionadas las cuatro páginas oficiales y relación adicional; verificados campos canónicos, valores, widgets y apariencias. Para 500 equipos: 1.060 campos/widgets, conservando campo de firma y valores editables.
- La apertura directa `file://` quedó fuera de la comprobación visual por la política del navegador de pruebas. Chrome no estaba conectado. El selector real de carpeta tampoco se pudo automatizar en ese entorno.

## Comprobación en Chrome o Edge de escritorio

1. Abrir `dist/index.html` con doble clic y seleccionar su carpeta. En una carpeta nueva deben aparecer `historial.json` y `TRA020_archivos/`.
2. Abrir cliente, seleccionar vehículos, editar el Anexo y esperar «Guardado».
3. Descargar Anexo incompleto: confirmar y comprobar que puede rellenarse posteriormente en un lector PDF. Repetir desde «todos en ZIP».
4. Adjuntar dos archivos de prueba, cerrar y reabrir; seleccionar la misma carpeta y retomar el trabajo. Comprobar selección, formulario y recuperación de ambos adjuntos.
5. Exportar ordenado y verificar carpetas, vehículos seleccionados y ambos firmados. Cambiar un campo o selección y comprobar que hay que adjuntarlos de nuevo.
6. Probar rechazo de permiso/cancelación del selector y un historial de prueba malformado; no debe sobrescribirse. No hacer esta comprobación sobre datos reales.
7. Probar flota de 500, descargar los dos Excel y paquetes; comprobar progreso, ausencia de congelación y enlace de descarga. Cancelar una generación para verificar recuperación de la interfaz.
