# API TRA020 — Paquete para el proveedor

Versión documental revisada 1.2 · 23/09/2026 · Pendiente de acuerdo con el proveedor.

## Qué necesitamos

Una API de lectura para buscar empresas por nombre o NIF y consultar sus vehículos diésel, consumos, kilómetros, dispositivos, repostajes y documentos asociados. El objetivo es disponer de información verificable para la documentación TRA020.

Se solicitan datos y documentos originales, no servicios de firma ni elaboración del expediente final. En este documento, «proveedor» significa la entidad que suministra la API.

## Qué leer y en qué orden

1. [GUIA_DE_DATOS.md](GUIA_DE_DATOS.md): qué pedimos, para qué sirve y quién debe responder, con explicaciones sin conocimientos de programación.
2. `ejemplos/cliente.json` y `ejemplos/busqueda.json`: ejemplos ficticios para localizar los nombres de los campos.
3. `CAMPOS_ANEXO.md`: datos administrativos y de las partes.
4. `CONTRATO_API.md`: detalles para el equipo técnico encargado de la conexión.
5. `ejemplos/error.json`: ejemplo de respuesta cuando una consulta falla.

Los ejemplos ilustran la estructura; los requisitos escritos prevalecen. Los ejemplos incluyen valores desconocidos e incidencias expresas: muestran también cómo comunicar información pendiente. No copiar valores ficticios como valores por defecto.

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
| Certificado del software e informe de requisitos técnicos comunes | Entrega documental por separado |
| Anexo I y Compromiso del Gerente | Preparación y firma por las partes correspondientes |
| Excel y PDF del cálculo | Preparación documental; metodología a validar |
| Convenios, dictamen y otros justificantes | Fuera de esta primera integración; carpetas vacías mientras falten |


## Puntos a confirmar antes de desarrollar

1. ¿Pueden suministrar todos los campos y originales? Indicar expresamente los que no.
2. ¿Qué identificadores estables y relaciones cliente–vehículo–dispositivo usan?
3. ¿Cómo obtienen y justifican consumos, kilómetros, periodos y parámetro r?
4. ¿La autenticación se hará mediante un servicio intermediario o sesiones de usuario de corta duración?
5. ¿Necesitan paginar el detalle? Si es así, acordar el mecanismo de snapshot antes de implementar.

Este paquete es una propuesta de intercambio de información, pendiente de acuerdo. No presupone que el servicio ya exista. Los datos de ejemplo son ficticios y no acreditan una actuación real.

Para entender los términos menos habituales, consultar `GUIA_DE_DATOS.md`. El propietario inicial es el cliente de Gestracking. La pregunta «¿Gestracking compró el ahorro?» se responde con `gestrackingPurchasedSavings`; su efecto se explica en el apartado 13 del contrato y en `CAMPOS_ANEXO.md`.
