import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { declarationPdf } from './annexPdf.js';
export { declarationPdf } from './annexPdf.js';

import { evaluate } from './evaluate.js';
export { evaluate } from './evaluate.js';
const f = n => new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 }).format(n || 0);
const date = value => value ? new Date(value).toLocaleDateString('es-ES') : '—';
const safe = value => String(value || '').replace(/[\\/:*?"<>|]/g, '-');
export const folderTemplate = [
  ['00_Datos_API', 'Respuesta original, exportaciones y trazabilidad de extracción'],
  ['01_Formulario_oficial', 'Formulario TRA020 emitido por la hoja del Coordinador Nacional'],
  ['02_Declaracion_ayudas', 'Anexo I firmado por el propietario inicial del ahorro'],
  ['03_Facturas', 'Facturas de inversión o de servicio activo'],
  ['04_Certificados_instalacion', 'Certificados firmados por empresa instaladora'],
  ['05_Informe_gestor_flota', 'Informe y Excel de caracterización de la flota'],
  ['06_Registros_repostaje', 'Registro automático de repostajes y cruce de kilómetros'],
  ['07_Informe_tecnico', 'Informe técnico y certificados del proveedor'],
  ['08_Compromiso_gerente', 'Compromiso firmado y caracterización detallada'],
  ['09_Firmados', 'Copias finales firmadas electrónicamente']
];
function pdfHeader(doc, title, exp) { doc.setFontSize(16); doc.text(title, 15, 18); doc.setFontSize(10); doc.text(`Expediente ${exp.codigo} · TRA020 V2.0`, 15, 25); doc.line(15, 28, 195, 28); }
function pdfLines(doc, lines, y=37) { doc.setFontSize(10); lines.forEach(line => { const wrapped=doc.splitTextToSize(line, 180); if (y + wrapped.length*5 > 275) { doc.addPage(); y=20; } doc.text(wrapped,15,y); y += wrapped.length*5 + 3; }); return y; }
export function managerCommitmentPdf(data) {
 const { expediente:e, owner:o, provider, vehicles }=data; const doc=new jsPDF(); pdfHeader(doc,'COMPROMISO DEL GERENTE · TRA020',e);
 let y=pdfLines(doc,[`D./Dña. ${o.representante}, en calidad de ${o.cargo} de ${o.razonSocial}, se compromete a mantener activo el sistema de ayuda a la conducción eficiente y la retroalimentación al conductor en toda la flota objeto de la actuación durante la vida útil comprometida.`, '', 'Caracterización detallada de la flota', `Empresa gestora: ${o.razonSocial} · NIF: ${o.nif}`, `Proveedor tecnológico: ${provider.nombre}`, `Modalidad de retroalimentación: ${provider.feedbackMode}`, `Número de vehículos caracterizados: ${vehicles.length}`, '', 'La caracterización individual se incorpora como anexo y recoge matrícula, bastidor, categoría/tipo, marca, modelo, año, combustible, servicio, identificador y denominación telemática, fecha de instalación y activación, y datos de desempeño.', '', 'El firmante declara que los vehículos incluidos están operativos, se gestionan por la empresa indicada y se mantendrá la solución y su mecanismo de retroalimentación conforme a la actuación.' ],37);
 if(y>250){doc.addPage();y=20;} y+=5; doc.setFontSize(9); doc.text('Matrícula',15,y);doc.text('Dispositivo',55,y);doc.text('Servicio',100,y);doc.text('Activación',155,y);y+=5;
 vehicles.forEach(v=>{ if(y>270){doc.addPage();y=20;} doc.text(v.plate,15,y);doc.text(v.deviceId,55,y);doc.text(doc.splitTextToSize(v.service,48)[0],100,y);doc.text(date(v.activatedAt),155,y);y+=6; });
 if(y>255){doc.addPage();y=20;} doc.setFontSize(10); doc.text('En ____________________, a ____ de __________________ de 20___.',15,280); doc.text('Fdo.: _______________________________________________',15,287); return new Uint8Array(doc.output('arraybuffer'));
}
export function fleetWorkbook(data) {
  const rows=data.vehicles.map(v=>{const x=evaluate(v);return {'Tipo de vehículo':v.type,'Categoría':v.category,'Marca':v.brand,'Modelo':v.model,'Año':v.year,'Matrícula':v.plate,'Número de bastidor':v.vin,'Combustible':v.fuel,'Servicio':v.service,'ID dispositivo':v.deviceId,'Denominación telemática':v.telematicName,'Fecha instalación':v.installedAt,'Fecha activación':v.activatedAt,'Días pre':v.pre.days,'Km pre':v.pre.km,'Consumo pre (l)':v.pre.liters,'CEF pre (kWh/100km)':Number(x.pre.toFixed(3)),'Días post':v.post.days,'Km post':v.post.km,'Consumo post (l)':v.post.liters,'CEF post (kWh/100km)':Number(x.post.toFixed(3)),'Km anuales':v.annualKm,'r repostaje España':Number(x.r.toFixed(4)),'Ahorro combustible':Number(x.saving.toFixed(4)),'Ahorro anual (kWh)':Number(x.annualSaving.toFixed(0)),'Estado':x.eligible?'APTO':'EXCLUIR','Observaciones':x.problems.join('; ')};});
 const wb=XLSX.utils.book_new(); const ws=XLSX.utils.json_to_sheet(rows); ws['!freeze']={xSplit:0,ySplit:1}; ws['!autofilter']={ref:ws['!ref'] || 'A1'}; ws['!cols']=Object.keys(rows[0] || {}).map(k=>({wch:Math.min(32,Math.max(13,k.length+2))})); XLSX.utils.book_append_sheet(wb,ws,'Informe gestor flota'); return XLSX.write(wb,{bookType:'xlsx',type:'array'});
}
export function fuelWorkbook(data) { const rows=data.vehicles.flatMap(v=>v.fuelEvents.map(event=>({Matrícula:v.plate,'ID dispositivo':v.deviceId,'ID evento':event.id,'Fecha y hora':event.at,Latitud:event.lat,Longitud:event.lng,País:event.country,'En España':event.country==='ES'?'Sí':'No','Cantidad cargada':event.quantity,'Odómetro':event.odometer,'Detección automática':event.automatic?'Sí':'No'}))); const wb=XLSX.utils.book_new(); const ws=XLSX.utils.json_to_sheet(rows); ws['!autofilter']={ref:ws['!ref'] || 'A1'}; ws['!cols']=Object.keys(rows[0] || {}).map(k=>({wch:Math.max(14,k.length+2)})); XLSX.utils.book_append_sheet(wb,ws,'Repostajes automáticos'); return XLSX.write(wb,{bookType:'xlsx',type:'array'}); }

export const safeName = value => String(value || 'sin-nombre').normalize('NFC').replace(/[\\/:*?"<>|\u0000-\u001f]/g,'-').replace(/\.{2,}/g,'-').replace(/[. ]+$/g,'').slice(0,100) || 'sin-nombre';
// Convención CAE Studio / Expediente Builder: cada expediente se identifica por
// su código; `documentos/` conserva originales y firmados, `outputs/` resultados.
const rootPath = data => `expedientes/${safeName(data.expediente.codigo)}`;

function actuationData(data, vehicles, index) {
  const actuation = `E${index + 1}`;
  return { ...data, expediente: { ...data.expediente, codigo: actuation, nombre: `${data.expediente.nombre} - actuación ${actuation}` }, vehicles };
}

async function generateActuationArchive(data, vehicles, index, annex, anexoBytes) {
  const actuation = `E${index + 1}`;
  const single = actuationData(data, vehicles, index);
  const zip = new JSZip();
  // La plantilla se genera una sola vez y se reutiliza como binario para que
  // cientos de actuaciones no re-rendericen cuatro páginas PDF por vehículo.
  // La relación concreta de vehículo queda en el manifiesto de cada actuación.
  zip.file(`Anexo${actuation}.pdf`, anexoBytes);
  // La sede exige carpetas numeradas y en el mismo orden de la ficha. Las
  // carpetas sin documentos se conservan como entradas de directorio vacías.
  const folders = {
    convenio: `${actuation}-1- Convenio CAE/`,
    dictamen: `${actuation}-2- Dictamen favorable e informe del verificador/`,
    justificativos: `${actuation}-3- Documentos justificativos/`,
    otros: `${actuation}-4- Otros documentos justificativos/`
  };
  Object.values(folders).forEach(path => zip.folder(path));
  // La ficha oficial TRA020 se incorpora cuando el asset ministerial está
  // disponible; el cálculo de ahorro de la actuación queda dentro de E<n>-3.
  if (data.fichaTra020Bytes) zip.file(`${folders.justificativos}Ficha TRA020 v2.0.pdf`, data.fichaTra020Bytes);
  zip.file(`${folders.justificativos}calculo-ahorro.xlsx`, fleetWorkbook({ ...single, vehicles }));
  zip.file('MANIFIESTO_ACTUACION.json', JSON.stringify({ actuation, ficha: 'TRA020 V2.0', vehicleCount: vehicles.length, vehicleIds: vehicles.map(vehicle => vehicle.id), folders, generatedAt: new Date().toISOString() }, null, 2));
  return zip.generateAsync({ type: 'uint8array', compression: 'STORE', streamFiles: true });
}

export async function generateExport({ kind, data, annex = {}, signed = {} }, progress = () => {}) {
  if (!data.vehicles.length) throw new Error('Selecciona al menos un vehículo.');
  const started = performance.now();
  const code = safeName(data.expediente.codigo);
  let bytes, name, type;
  progress(5,'Preparando documentos');
  if (kind === 'anexo') {
    bytes=await declarationPdf(data,annex); name=`${code}-anexo-i.pdf`; type='application/pdf';
  } else if (kind === 'commitment') {
    bytes=managerCommitmentPdf(data); name=`${code}-compromiso-gerente-borrador.pdf`; type='application/pdf';
  } else if (kind === 'fleet' || kind === 'fuel') {
    bytes=kind==='fleet'?fleetWorkbook(data):fuelWorkbook(data); name=kind==='fleet'?'calculo-ahorro.xlsx':'registro-repostajes-automaticos.xlsx'; type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  } else if (kind === 'unsigned' || kind === 'ordered') {
    if (kind==='ordered' && (!signed.anexo?.bytes || !signed.commitment?.bytes)) throw new Error('Adjunta el Anexo I y el Compromiso del Gerente antes de generar el ZIP.');
    const zip=new JSZip(), root=rootPath(data);
    if (kind === 'ordered') {
      progress(12, 'Preparando actuaciones estandarizadas');
      // Las actuaciones son independientes: se generan en paralelo para que una
      // flota grande no deje bloqueada la interfaz durante minutos.
      const anexoBytes = await declarationPdf(data, annex);
      const actuationGroups = Array.isArray(data.actuations) && data.actuations.length
        ? data.actuations.map(actuation => data.vehicles.filter(vehicle => actuation.vehicleIds?.includes(vehicle.id))).filter(group => group.length)
        : [data.vehicles];
      const actuationArchives = await Promise.all(actuationGroups.map((vehicles, index) => generateActuationArchive(data, vehicles, index, annex, anexoBytes)));
      actuationArchives.forEach((actuationBytes, index) => {
        zip.file(`${root}/ActuacionE${index + 1}.zip`, actuationBytes);
      });
      progress(60, `${actuationArchives.length} actuaciones preparadas`);
      zip.file(`${root}/Solicitud de emisión de CAE - Estandarizadas.pendiente.txt`, 'El formulario de solicitud de sede debe cumplimentarse y firmarse en el trámite electrónico.');
      zip.file(`${root}/outputs/MANIFIESTO_SOLICITUD.json`, JSON.stringify({ convention: 'MITERD: ActuacionE<n>.zip', actuationCount: actuationGroups.length, vehicleCount: data.vehicles.length, naming: 'AnexoE<n>, E<n>-1, E<n>-2, E<n>-3-1, E<n>-3-2, E<n>-4' }, null, 2));
      progress(100, 'Actuaciones listas');
      bytes=await zip.generateAsync({type:'uint8array',compression:'STORE',streamFiles:true},m=>progress(50+m.percent*.5,'Empaquetando solicitud'));
      name=`Solicitud de emisión de CAE - Estandarizadas.zip`;type='application/zip';
      progress(100,'Archivo listo');
      return { bytes:bytes instanceof Uint8Array?bytes:new Uint8Array(bytes), name, type, elapsedMs:Math.round(performance.now()-started) };
    }
    zip.folder(`${root}/documentos`);
    zip.folder(`${root}/outputs`);
    folderTemplate.forEach(([folder])=>zip.folder(`${root}/documentos/${folder}`));
    zip.file(`${root}/documentos/00_Datos_API/datos-expediente.json`,JSON.stringify(data,null,2));
    zip.file(`${root}/outputs/revision-anexo.json`,JSON.stringify(annexValuesForManifest(annex),null,2));
    progress(15,'Generando informe de flota');
    zip.file(`${root}/outputs/calculo-ahorro.xlsx`,fleetWorkbook(data));
    zip.file(`${root}/outputs/Informe_gestor_flota.xlsx`,fleetWorkbook(data));
    progress(35,'Generando registro de repostajes');
    zip.file(`${root}/outputs/Registro_automatico_repostajes.xlsx`,fuelWorkbook(data));
    if (kind==='unsigned') {
      progress(50,'Cumplimentando el Anexo I oficial');
      zip.file(`${root}/documentos/02_Declaracion_ayudas/ANEXO_I_editable.pdf`,await declarationPdf(data,annex));
      zip.file(`${root}/documentos/08_Compromiso_gerente/Compromiso_Gerente_borrador.pdf`,managerCommitmentPdf(data));
    } else {
      for (const [id,file] of Object.entries(signed)) {
        if (!file?.bytes) continue;
        const basename=`${id}_${safeName(file.name)}`;
        zip.file(`${root}/documentos/09_Firmados/${basename}`,file.bytes);
        zip.file(`${root}/documentos/${id==='anexo'?'02_Declaracion_ayudas':'08_Compromiso_gerente'}/${basename}`,file.bytes);
      }
    }
    zip.file(`${root}/documentos/EVIDENCIAS_PENDIENTES.txt`, 'Los originales del proveedor no están incluidos en esta simulación.\n\n'+data.evidence.map(e=>`${e.folder}: ${e.name}`).join('\n'));
    zip.file(`${root}/outputs/MANIFIESTO_EXPEDIENTE.json`,JSON.stringify({expediente:data.expediente,vehicleCount:data.vehicles.length,folderConvention:'CAE Studio: documentos/ y outputs/',folders:folderTemplate,evidence:data.evidence.map(e=>({...e,included:false})),signedFiles:Object.entries(signed).map(([id,f])=>({id,name:f.name})),generatedAt:new Date().toISOString()},null,2));
    progress(65,'Empaquetando archivos');
    // Los binarios ya vienen como ArrayBuffer: no hay FileReader/Blob pendiente dentro de JSZip.
    bytes=await zip.generateAsync({type:'uint8array',compression:'STORE',streamFiles:true},m=>progress(65+m.percent*.34,'Empaquetando archivos'));
    name=`${code}_${kind==='ordered'?'expediente_ordenado':'documentos_para_firma'}.zip`;type='application/zip';
  } else throw new Error('Tipo de descarga desconocido.');
  progress(100,'Archivo listo');
  return { bytes:bytes instanceof Uint8Array?bytes:new Uint8Array(bytes), name, type, elapsedMs:Math.round(performance.now()-started) };
}
const annexValuesForManifest = annex => ({ overrides:annex, note:'Revisión manual. La firma no ha sido verificada por la aplicación.' });
