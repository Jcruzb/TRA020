# API TRA020 — Paquete para el proveedor

Versión propuesta 1.0 · 23/09/2026 · Pendiente de acuerdo con el proveedor.

## Qué necesitamos

Una API de lectura que permita buscar una empresa por nombre o NIF y obtener todos sus vehículos, consumos, kilómetros, dispositivos, registros de repostaje y documentos asociados. La aplicación seleccionará todos o algunos vehículos para preparar un expediente y sus documentos.

No solicitamos que el proveedor genere expedientes ZIP, firme documentos, implemente nuestra interfaz o almacene nuestro historial. Necesitamos datos trazables y los originales documentales que ya gestiona.

## Qué leer y en qué orden

1. `CONTRATO_API.md`: endpoints, datos, reglas y criterios de aceptación.
2. `ejemplos/busqueda.json`: respuesta de búsqueda.
3. `ejemplos/cliente.json`: respuesta ficticia de detalle con dos vehículos; no representa personas, facturas ni certificados reales.
4. `CAMPOS_ANEXO.md`: claves administrativas para precargar el Anexo I cuando dispongan de información confirmada.
5. `ejemplos/error.json`: formato de error.

Los ejemplos ilustran la estructura; los requisitos escritos prevalecen. Las propiedades adicionales descritas como necesarias en el contrato deben incorporarse aunque el prototipo todavía no las consuma. No copiar valores ficticios como valores por defecto.

## Entrega que esperamos del proveedor

- URL de pruebas y producción, documentación OpenAPI y versión del servicio.
- Método de autenticación acordado, acceso de pruebas y procedimiento de renovación. Entregar credenciales por un canal privado separado.
- Búsqueda, detalle del cliente, datos de la flota y descarga de originales.
- Dataset ficticio o anonimizado con casos completos, incompletos y una flota de al menos 500 vehículos.
- Matriz de disponibilidad: campo/documento, disponible sí/no, origen, actualización y fecha estimada si falta.
- Confirmación de unidades, periodos, cálculo de agregados y trazabilidad del parámetro r.
- Límites de consulta, tamaño de respuesta, paginación, caducidad de documentos y contacto técnico.

## Responsabilidades

| Entrega | Responsable |
|---|---|
| Clientes, vehículos, consumos, km, repostajes, dispositivos y evidencias de retroalimentación | Proveedor API |
| Facturas originales y certificado del parámetro r | Proveedor API; confirmar disponibilidad y alcance |
| Certificado del software e informe de requisitos técnicos comunes | Los facilitaremos para integrarlos como archivos fijos |
| Anexo I y Compromiso del Gerente | Aplicación; revisión y firma del cliente |
| Excel y PDF del cálculo | Aplicación; metodología pendiente de validación definitiva |
| Convenios, dictamen y otros justificantes | Fuera de esta primera integración; carpetas vacías mientras falten |
| Historial y documentos firmados | Aplicación local, sin base de datos |

## Puntos a confirmar antes de desarrollar

1. ¿Pueden suministrar todos los campos y originales? Indicar expresamente los que no.
2. ¿Qué identificadores estables y relaciones cliente–vehículo–dispositivo usan?
3. ¿Cómo obtienen y justifican consumos, kilómetros, periodos y parámetro r?
4. ¿La autenticación se hará mediante un servicio intermediario o sesiones de usuario de corta duración?
5. ¿Necesitan paginar el detalle? Si es así, acordar el mecanismo de snapshot antes de implementar.

El frontend actual trabaja con simulaciones. Este paquete define la integración a construir; no afirma que estos endpoints estén implementados ni certifica cumplimiento normativo.
