export const regions = ['Andalucía','Aragón','Canarias','Cantabria','Castilla y León','Castilla-La Mancha','Cataluña','Ciudad de Ceuta','Ciudad de Melilla','Comunidad Foral de Navarra','Comunidad de Madrid','Comunitat Valenciana','Excede el ámbito territorial de una comunidad autónoma','Extremadura','Galicia','Illes Balears','La Rioja','País Vasco','Principado de Asturias','Región de Murcia'];
export const benefits = [
 ['vulnerable', 'Bono social eléctrico para consumidores vulnerables', 'Bono social eléctrico para consumidores vulnerable'],
 ['severe', 'Consumidores vulnerables severos', 'Bono social eléctrico para consumidores vulnerable-0'],
 ['exclusion', 'Riesgo de exclusión social', 'Bono social eléctrico en riesgo de exclusión socia'],
 ['justice', 'Bono social de justicia energética', 'Bono social de justicia energética'],
 ['thermal', 'Bono social térmico', 'Bono social térmico'],
 ['none', 'Ninguno de los anteriores', 'Ninguno de los anteriores'],
];
const field = (key, label, pdf, group, extra = {}) => ({ key, label, pdf, group, ...extra });
const person = (prefix, group, names, when) => [
 field(`${prefix}Name`, 'Nombre o razón social', names[0], group, { when }),
 field(`${prefix}Nif`, 'NIF / NIE', names[1], group, { when }),
 field(`${prefix}Address`, 'Domicilio', names[2], group, { when }),
 field(`${prefix}Phone`, 'Teléfono', names[3], group, { when }),
 field(`${prefix}Email`, 'Correo electrónico', names[4], group, { when }),
];
export const aidColumns = [
 ['Program','Programa de ayuda','Denominación del programa de ayuda'],['Agency','Entidad u órgano gestor','Entidad u órgano gestor'],['Year','Año','Año'],['Rule','Disposición reguladora','Disposición reguladora'],['Reference','Número de expediente','Número de expediente'],['Status','Estado de la concesión','Estado de la concesión'],['RequestedAt','Fecha de solicitud','Fecha de solicitud'],['ResolvedAt','Fecha de resolución','Fecha de la resolución deconcesión'],['Amount','Cuantía obtenida o esperada (€)','Cuantía de la ayuda esperada obtenida'],
];
export const annexFields = [
 field('actionName','Nombre de la actuación','Nombre de la actuación','Actuación'),
 field('sheet','Código y nombre de la ficha','Código y nombre de la ficha','Actuación'),
 field('region','Comunidad autónoma','CC AA','Actuación',{ options: regions }),
 field('address','Dirección de la actuación','Dirección postal de la instalación en que se ejecu','Actuación'),
 field('cadastre','Referencia catastral (o justificación de no aplicación)','Referencia catastral de la localización de laactua','Actuación'),
 ...person('owner','Propietario',['Prop inicial de ahorro','NIFNIE','Domicilio','Teléfono','Correo electrónico']),
 ...person('beneficiary','Beneficiario',['Beneficiario del ahorro','NIFNIE-0','Domicilio-0','Teléfono-0','Correo electrónico-0'],a=>a.beneficiaryDifferent === 'yes'),
 ...person('representative','Representante',['Representante','NIFNIE-1','Domicilio-1','Teléfono-1','Correo electrónico-1'],a=>a.represented === 'yes'),
 field('powerDate','Fecha del poder notarial','Poder Notarial de fecha-0','Representante',{when:a=>a.represented==='yes' && a.powerType==='notarial'}),
 field('powerNumber','Número de protocolo','Número de protocolo','Representante',{when:a=>a.represented==='yes' && a.powerType==='notarial'}),
 field('powerOther','Título y fecha del documento de representación','Otro documento','Representante',{when:a=>a.represented==='yes' && a.powerType==='other'}),
 ...[1,2].flatMap(n=>aidColumns.map(([key,label,pdf])=>field(`aid${n}${key}`,label,n===1?pdf:key==='Program'?'Denominación delprograma de ayuda-0':`${pdf}-0`,`Ayuda ${n}`,{when:a=>a.aidRequested==='yes' && (n===1 || a.secondAid==='yes'),optional:key==='ResolvedAt'}))),
 field('place','Localidad de firma','localidad','Firma'),field('day','Día','día','Firma'),field('month','Mes (en letras)','mes','Firma'),field('year','Año (cuatro cifras)','año','Firma'),
];
export function annexValues(data, overrides = {}) {
 const { expediente:e, owner:o } = data;
 return { actionName:e.nombre, sheet:'TRA020 - Sistema de ayuda a la conducción eficiente con retroalimentación al conductor en flota de transporte', region:e.comunidad==='Madrid'?'Comunidad de Madrid':e.comunidad, address:e.direccion, cadastre:e.referenciaCatastral || '', ownerName:o.razonSocial, ownerNif:o.nif, ownerAddress:o.domicilio, ownerPhone:o.telefono, ownerEmail:o.email, representativeName:o.representante || '', representativeNif:o.representanteNif || '', representativeAddress:o.representanteDomicilio || '', representativePhone:o.representanteTelefono || '', representativeEmail:o.representanteEmail || '', beneficiaryDifferent:'', represented:o.representante?'yes':'', socialBenefits:[], aidRequested:'', secondAid:'no', ...data.declaration, ...overrides };
}
export function missingAnnex(data, overrides = {}) {
 const a=annexValues(data,overrides);
 const missing=annexFields.filter(f=>(!f.when || f.when(a)) && !f.optional && !String(a[f.key] ?? '').trim()).map(f=>`${f.group}: ${f.label}`);
 if (!a.beneficiaryDifferent) missing.push('Confirmar si el beneficiario coincide con el propietario');
 if (!a.represented) missing.push('Confirmar si actúa mediante representante');
 if (a.represented==='yes' && !a.powerType) missing.push('Representante: tipo de poderes');
 if (!a.socialBenefits?.length) missing.push('Declaración de bono social');
 if (!a.aidRequested) missing.push('Declaración de ayudas solicitadas');
 if (a.aidRequested==='yes' && !a.aidOutcome) missing.push('Resultado de la solicitud de ayudas');
 if (data.vehicles.some(v=>!v.deviceId)) missing.push('Número de serie de todos los dispositivos');
 return missing;
}
