# API TRA020 — Paquete para el proveedor

Versión documental revisada 1.1 · 23/09/2026 · Pendiente de acuerdo con el proveedor.

## Qué necesitamos

Una API de lectura para buscar empresas por nombre o NIF y consultar sus vehículos diésel, consumos, kilómetros, dispositivos, repostajes y documentos asociados. El objetivo es disponer de información verificable para la documentación TRA020.

Se solicitan datos y documentos originales, no servicios de firma ni elaboración del expediente final. En este documento, «proveedor» significa la entidad que suministra la API.

## Qué leer y en qué orden

1. `CONTRATO_API.md`: endpoints, datos, reglas y criterios de aceptación.
2. `ejemplos/busqueda.json`: respuesta de búsqueda.
3. `ejemplos/cliente.json`: respuesta ficticia de detalle con dos vehículos; no representa personas, facturas ni certificados reales.
4. `CAMPOS_ANEXO.md`: claves administrativas para precargar el Anexo I cuando dispongan de información confirmada.
5. `ejemplos/error.json`: formato de error.

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

Para entender los términos menos habituales, consultar el apartado 12 de `CONTRATO_API.md`. El propietario inicial es el cliente de Gestracking. La pregunta «¿Gestracking compró el ahorro?» se responde con `gestrackingPurchasedSavings`; su efecto se explica en el apartado 13 del contrato y en `CAMPOS_ANEXO.md`.
