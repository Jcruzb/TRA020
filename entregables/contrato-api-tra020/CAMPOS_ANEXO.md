# Campos del Anexo I

Estos campos son opcionales en origen: si se desconocen se devuelven como `null` y quedan pendientes de revisión. Nunca inferir una declaración negativa. Las claves corresponden a `data.declaration`. Un valor desconocido se deja sin cumplimentar hasta confirmarlo.

| Clave | Significado |
|---|---|
| `region` | Comunidad autónoma (Actuación) |
| `address` | Dirección de la actuación (Actuación) |
| `cadastre` | Referencia catastral (o justificación de no aplicación) (Actuación) |
| `ownerName` | Nombre o razón social (Propietario inicial del ahorro: cliente de Gestracking) |
| `ownerNif` | NIF / NIE (Propietario inicial del ahorro: cliente de Gestracking) |
| `ownerAddress` | Domicilio (Propietario inicial del ahorro: cliente de Gestracking) |
| `ownerPhone` | Teléfono (Propietario inicial del ahorro: cliente de Gestracking) |
| `ownerEmail` | Correo electrónico (Propietario inicial del ahorro: cliente de Gestracking) |
| `beneficiaryName` | Nombre o razón social (Beneficiario: Gestracking si compró el ahorro; en otro caso, el propio cliente) |
| `beneficiaryNif` | NIF / NIE (Beneficiario: Gestracking si compró el ahorro; en otro caso, el propio cliente) |
| `beneficiaryAddress` | Domicilio (Beneficiario: Gestracking si compró el ahorro; en otro caso, el propio cliente) |
| `beneficiaryPhone` | Teléfono (Beneficiario: Gestracking si compró el ahorro; en otro caso, el propio cliente) |
| `beneficiaryEmail` | Correo electrónico (Beneficiario: Gestracking si compró el ahorro; en otro caso, el propio cliente) |
| `representativeName` | Nombre o razón social (Representante de la parte que deba firmar el documento) |
| `representativeNif` | NIF / NIE (Representante de la parte que deba firmar el documento) |
| `representativeAddress` | Domicilio (Representante de la parte que deba firmar el documento) |
| `representativePhone` | Teléfono (Representante de la parte que deba firmar el documento) |
| `representativeEmail` | Correo electrónico (Representante de la parte que deba firmar el documento) |
| `powerDate` | Fecha del poder notarial (Representante de la parte que deba firmar el documento) |
| `powerNumber` | Número de protocolo (Representante de la parte que deba firmar el documento) |
| `powerOther` | Título y fecha del documento de representación (Representante de la parte que deba firmar el documento) |

## Identificación de las partes

El propietario inicial del ahorro es el cliente de Gestracking. Sus datos van en `data.owner` y en los campos `owner*`. El indicador `data.gestrackingPurchasedSavings` indica si Gestracking compró ese ahorro:

- `true`: Gestracking figura como beneficiario según el criterio de este intercambio; `data.beneficiary` contiene sus datos. `beneficiaryDifferent` será `yes`.
- `false`: el beneficiario es el propio cliente; `data.beneficiary` contiene sus datos. `beneficiaryDifferent` será `no`; los campos `beneficiary*` del apartado de beneficiario distinto se dejan null.
- `null`: no se ha confirmado la compra; `data.beneficiary` y `beneficiaryDifferent` se dejan null y se solicita confirmación.

Este indicador describe la compra del ahorro. No indica si hay subvenciones ni convierte a Gestracking en beneficiario de una ayuda pública. Las preguntas sobre ayudas se contestan por separado.

Cuando no hay compra, se prevé la firma del cliente por su representante. Cuando hay compra, identificar los representantes de ambas partes; no sustituir automáticamente al firmante en todos los documentos, pues cada documento puede requerir una parte diferente. El indicador no constituye una firma ni prueba de representación.

## Claves adicionales presentes en el ejemplo

| Clave | Qué significa |
|---|---|
| `actionName` | Nombre descriptivo de la actuación. |
| `sheet` | Código y título de la ficha de referencia, TRA020. |
| `beneficiaryDifferent` | Indica si debe identificarse un beneficiario distinto; `yes`, `no` o null si no se ha confirmado. |
| `represented` | Indica si actúa mediante representante; `yes`, `no` o null. |
| `socialBenefits` | Códigos de bonos sociales declarados; lista vacía si no se ha confirmado. No se deduce del tipo de empresa. |
| `aidRequested` | Se ha solicitado una ayuda vinculada a la actuación; `yes`, `no` o null. |
| `secondAid` | Existe una segunda ayuda a declarar; `yes`, `no` o null. |

Las fechas de poderes se expresan como `YYYY-MM-DD` cuando se conocen. Los números de protocolo son textos para conservar letras o ceros. Los datos del representante deben corresponder a la parte representada en ese documento, no a un contacto cualquiera.

Si se declaran ayudas, se acordará el detalle documental del programa, entidad concedente, solicitud e importe; no dar por completado ese apartado solo con un `yes`. El ejemplo deja las declaraciones de ayudas sin confirmar.
