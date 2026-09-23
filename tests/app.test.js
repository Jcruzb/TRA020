import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { PDFDocument } from 'pdf-lib';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { makeClientData, searchClients } from '../src/data/mockClients.js';
import { createJob, reviseJob, selectedData, validateClientData } from '../src/domain/jobs.js';
import { annexValues, missingAnnex } from '../src/domain/annexFields.js';
import { declarationPdf, generateExport } from '../src/domain/expediente.js';
import { LocalHistory, validateHistory } from '../src/domain/localHistory.js';

test('Busqueda por NIF, nombre y acentos; respuestas independientes',()=>{
 assert.equal(searchClients('b 12345678')[0].id,'CLI-001');
 assert.equal(searchClients('logistica')[0].id,'CLI-002');
 assert.equal(searchClients('inexistente').length,0);
 const a=makeClientData('CLI-003');assert.equal(a.vehicles.length,500);validateClientData(a);
 a.owner.razonSocial='editado';assert.notEqual(makeClientData('CLI-003').owner.razonSocial,'editado');
 assert.throws(()=>validateClientData({...a,vehicles:[a.vehicles[0],a.vehicles[0]]}),/duplicados/);
});
test('Seleccion y revisiones invalidan firmados sin mezclar clientes',()=>{
 const job=createJob(makeClientData('CLI-001'));job.signed={anexo:{name:'anexo.pdf'}};
 const revised=reviseJob(job,{selectedIds:[job.selectedIds[1]]});
 assert.equal(selectedData(revised).vehicles.length,1);assert.deepEqual(revised.signed,{});assert.ok(job.signed.anexo);
 assert.equal(selectedData(revised).vehicles[0].id,job.selectedIds[1]);
});
test('Pendientes condicionales no inventan ayudas ni representante',()=>{
 const data=makeClientData('CLI-001');const a=annexValues(data);
 assert.equal(a.aidRequested,'');assert.ok(missingAnnex(data).includes('Declaración de ayudas solicitadas'));
 assert.ok(!missingAnnex(data,{beneficiaryDifferent:'no'}).some(s=>s.startsWith('Beneficiario:')));
 assert.ok(missingAnnex(data,{beneficiaryDifferent:'yes'}).some(s=>s.startsWith('Beneficiario:')));
});
test('PDF oficial conserva paginas/campos/firma y añade equipos legibles para 500 vehiculos',async()=>{
 await mkdir('tmp/pdfs',{recursive:true});
 const data=makeClientData('CLI-003');
 const result=await declarationPdf(data,{beneficiaryDifferent:'no',aidRequested:'no',socialBenefits:['none'],place:'Madrid',day:'23',month:'septiembre',year:'2026'});
 await writeFile('tmp/pdfs/anexo-500.pdf',result);
 const doc=await PDFDocument.load(result);const f=doc.getForm();
 assert.equal(doc.getPageCount(),4+Math.ceil(500/32));
 assert.equal(f.getTextField('Prop inicial de ahorro').getText(),data.owner.razonSocial);
 assert.equal(f.getTextField('año').getText(),'26');
 assert.equal(f.getTextField('Referencia catastral de la localización de laactua').getText(),undefined);
 assert.equal(f.getCheckBox('No se ha solicitado ayuda o subvención').isChecked(),true);
 assert.equal(f.getCheckBox('Se ha solicitado ayuda o subvención').isChecked(),false);
 assert.equal(f.getTextField('equipos_500_dispositivo').getText(),data.vehicles[499].deviceId);
 assert.ok(!f.getTextField('equipos_500_dispositivo').isReadOnly());assert.ok(f.getSignature('Firma'));
 const original=await PDFDocument.load(await readFile('src/assets/anexo-i-miteco-original.pdf'));
 for(const field of original.getForm().getFields())assert.ok(f.getField(field.getName()));
 f.getTextField('Referencia catastral de la localización de laactua').setText('Cumplimentado por el cliente');
 const edited=await PDFDocument.load(await doc.save());assert.equal(edited.getForm().getTextField('Referencia catastral de la localización de laactua').getText(),'Cumplimentado por el cliente');
});
test('ZIP ordenado 500 vehiculos: binarios, nombres iguales, carpetas y rendimiento',async t=>{
 const data=makeClientData('CLI-003');
 await assert.rejects(generateExport({kind:'ordered',data}),/Adjunta/);
 const file=new Uint8Array([37,80,68,70]);
 const result=await generateExport({kind:'ordered',data,signed:{anexo:{name:'firmado.pdf',bytes:file},commitment:{name:'firmado.pdf',bytes:file}}});
 t.diagnostic(`${result.elapsedMs} ms; ${result.bytes.length} bytes`);
 assert.ok(result.elapsedMs<30000);
 const zip=await JSZip.loadAsync(result.bytes);const names=Object.keys(zip.files);
 assert.ok(names.some(n=>n.endsWith('/ActuacionE1.zip')));
 assert.equal(names.filter(n=>n.endsWith('.zip') && n.includes('Actuacion')).length, 1);
 const actuation=await JSZip.loadAsync(await zip.file(names.find(n=>n.endsWith('/ActuacionE1.zip'))).async('uint8array'));
 const actuationNames=Object.keys(actuation.files);
 assert.ok(actuationNames.includes('AnexoE1.pdf'));
 assert.ok(actuation.files['E1-1- Convenio CAE/']?.dir);
 assert.ok(actuation.files['E1-2- Dictamen favorable e informe del verificador/']?.dir);
 assert.ok(actuation.files['E1-3- Documentos justificativos/']?.dir);
 assert.ok(actuation.files['E1-4- Otros documentos justificativos/']?.dir);
 assert.ok(actuationNames.includes('E1-3- Documentos justificativos/calculo-ahorro.xlsx'));
 await writeFile('tmp/pdfs/expediente-500.zip',result.bytes);
});
test('Exportacion individual, vacios y paquete previo con anexo oficial',async()=>{
 const data=makeClientData('CLI-001');data.vehicles=data.vehicles.slice(0,1);
 data.vehicles[0].fuelEvents=[];
 const fuel=await generateExport({kind:'fuel',data});assert.ok(fuel.bytes.length>0);
 const pack=await generateExport({kind:'unsigned',data});
 const zip=await JSZip.loadAsync(pack.bytes);const name=Object.keys(zip.files).find(n=>n.endsWith('ANEXO_I_editable.pdf'));
 const pdf=await PDFDocument.load(await zip.file(name).async('uint8array'));assert.equal(pdf.getPageCount(),4);assert.ok(pdf.getForm().getFields().length>50);
 await writeFile('tmp/pdfs/anexo-1.pdf',await zip.file(name).async('uint8array'));
 await assert.rejects(generateExport({kind:'fuel',data:{...data,vehicles:[]}}),/Selecciona/);
});

class Directory {
 constructor(name='test'){this.name=name;this.files=new Map();this.dirs=new Map();}
 async getFileHandle(name,{create=false}={}){if(!this.files.has(name)){if(!create)throw new DOMException('Falta','NotFoundError');this.files.set(name,'');}const d=this;return {async getFile(){return new File([d.files.get(name)],name);},async createWritable(){let content;return {async write(c){content=c;},async close(){d.files.set(name,content);},async abort(){}};}};}
 async getDirectoryHandle(name,{create=false}={}){if(!this.dirs.has(name)){if(!create)throw new DOMException('Falta','NotFoundError');this.dirs.set(name,new Directory(name));}return this.dirs.get(name);}
}
test('Historial crea JSON y carpeta, restaura seleccion/formulario/firmados y detecta conflictos',async()=>{
 const dir=new Directory();const store=await LocalHistory.open(dir);assert.ok(dir.files.has('historial.json'));assert.ok(dir.dirs.has('TRA020_archivos'));
 const job=createJob(makeClientData('CLI-001'));job.selectedIds=job.selectedIds.slice(0,2);job.annex={place:'Madrid'};
 job.signed.anexo=await store.saveAttachment(job.id,'anexo',new File(['signed bytes'],'anexo.pdf'));
 await store.saveJob(job);assert.ok(dir.files.has('historial.anterior.json'));
 const restored=await LocalHistory.open(dir);const recovered=restored.history.jobs[0];assert.deepEqual(recovered.selectedIds,job.selectedIds);assert.equal(recovered.annex.place,'Madrid');assert.equal(new TextDecoder().decode((await restored.readAttachment(recovered.signed.anexo)).bytes),'signed bytes');
 await restored.saveJob({...recovered,status:'Otra ventana'});
 await assert.rejects(store.saveJob(job),/otra ventana/);
 const before=dir.files.get('historial.json');await assert.rejects(store.saveJob({...job,id:'../escape'}),/inválidos/);assert.equal(dir.files.get('historial.json'),before);
});
test('Historial dañado no se sobrescribe y rutas de adjuntos no salen de su trabajo',async()=>{
 const dir=new Directory();dir.files.set('historial.json','corrupto');await assert.rejects(LocalHistory.open(dir),/No se puede abrir/);assert.equal(dir.files.get('historial.json'),'corrupto');
 const job=createJob(makeClientData('CLI-001'));job.signed.anexo={path:'../../../private.pdf'};assert.throws(()=>validateHistory({schemaVersion:1,jobs:[job]}),/ruta/);
});
test('El worker devuelve un mensaje final independiente del tipo MIME',async()=>{
 const messages=[];globalThis.self={postMessage:message=>messages.push(message)};
 try{
  await import('../src/domain/export.worker.js');
  await self.onmessage({data:{kind:'fleet',data:makeClientData('CLI-001')}});
  const done=messages.find(m=>m.type==='done');assert.ok(done);assert.equal(done.result.type,'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');assert.ok(done.result.bytes.length);
 }finally{delete globalThis.self;}
});
