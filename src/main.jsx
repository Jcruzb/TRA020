import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { clientService } from './data/mockClients.js';
import { createJob, reviseJob, selectedData, validateClientData } from './domain/jobs.js';
import { evaluate } from './domain/evaluate.js';
import { LocalHistory } from './domain/localHistory.js';
import { missingAnnex } from './domain/annexFields.js';
import { startExport } from './domain/exportClient.js';
import { AnnexForm, ConfirmIncomplete, Metric, number, dateTime } from './components.jsx';
import './styles.css';

function App(){
 const [page,setPage]=useState('clients'),[query,setQuery]=useState(''),[clients,setClients]=useState([]),[loading,setLoading]=useState(false);
 const [store,setStore]=useState(null),[jobs,setJobs]=useState([]),[job,setJob]=useState(null),[saveState,setSaveState]=useState('Sin carpeta'),[notice,setNotice]=useState(null);
 const [vehicleQuery,setVehicleQuery]=useState(''),[vehiclePage,setVehiclePage]=useState(0),[busy,setBusy]=useState(null),[ready,setReady]=useState(null),[confirm,setConfirm]=useState(null);
 const jobRef=useRef(null),storeRef=useRef(null),taskRef=useRef(null),urlRef=useRef(null),dirtyRef=useRef(false),memoryFiles=useRef({});
 const data=useMemo(()=>job?selectedData(job):null,[job]);
 const selected=useMemo(()=>new Set(job?.selectedIds || []),[job?.selectedIds]);
 const evaluated=useMemo(()=>data?.vehicles.map(v=>({v,x:evaluate(v)})) || [],[data]);
 const valid=evaluated.filter(({x})=>x.eligible),total=valid.reduce((sum,{x})=>sum+x.annualSaving,0);
 const filtered=useMemo(()=>job?.data.vehicles.filter(v=>`${v.plate} ${v.brand} ${v.deviceId} ${v.vin}`.toLowerCase().includes(vehicleQuery.toLowerCase())) || [],[job?.data,vehicleQuery]);
 const pagination=Math.ceil(filtered.length/30),rows=filtered.slice(vehiclePage*30,vehiclePage*30+30);
 const currentStats=useMemo(()=>new Map(evaluated.map(({v,x})=>[v.id,x])),[evaluated]);

 useEffect(()=>{let active=true;clientService.search(query).then(result=>{if(active)setClients(result);}).catch(e=>setNotice({type:'error',text:e.message}));return()=>{active=false;};},[query]);
 useEffect(()=>{const before=e=>{if(dirtyRef.current){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',before);return()=>window.removeEventListener('beforeunload',before);},[]);
 useEffect(()=>{if(!job || !store || !dirtyRef.current)return;const timer=setTimeout(()=>persist(job),700);return()=>clearTimeout(timer);},[job,store]);
 useEffect(()=>()=>{taskRef.current?.cancel();if(urlRef.current)URL.revokeObjectURL(urlRef.current);},[]);

 function clearReady(){if(urlRef.current)URL.revokeObjectURL(urlRef.current);urlRef.current=null;setReady(null);}
 function putJob(next,{dirty=true}={}){jobRef.current=next;setJob(next);dirtyRef.current=dirty;setSaveState(dirty?(storeRef.current?'Cambios pendientes':'Sin guardar en carpeta'):'Guardado');}
 function change(patch){const old=jobRef.current;const next=reviseJob(old,patch);if(Object.keys(old.signed).length)setNotice({type:'info',text:'Los datos han cambiado. Adjunta de nuevo los documentos firmados para esta revisión; las copias anteriores permanecen en la carpeta.'});memoryFiles.current={};clearReady();putJob(next);}
 async function persist(snapshot=jobRef.current){
   if(!snapshot || !storeRef.current)return false;
   setSaveState('Guardando…');
   try{const result=await storeRef.current.saveJob(snapshot);setJobs(result.jobs);if(jobRef.current===snapshot){dirtyRef.current=false;setSaveState('Guardado');}return true;}
   catch(e){setSaveState('Error al guardar');setNotice({type:'error',text:e.message});return false;}
 }
 async function connectFolder(){
   if(!window.showDirectoryPicker){setNotice({type:'error',text:'Este navegador no permite guardar directamente en carpetas. Abre el HTML en Chrome o Edge de escritorio.'});return;}
   try{
     // El selector debe abrirse dentro del gesto del usuario, antes de cualquier await de guardado.
     const handle=await window.showDirectoryPicker({id:'tra020-workspace',mode:'readwrite'});
     setLoading(true);
     const previousStore=storeRef.current;
     if(previousStore)await previousStore.queue;
     const pending=dirtyRef.current?jobRef.current:null;
     const nextStore=await LocalHistory.open(handle);
     let recovered=false;
     let next=pending;
     if(pending){
       // No reemplazar un trabajo existente de otra sesión: conservar ambos como trabajos distintos.
       if(nextStore.history.jobs.some(j=>j.id===pending.id)){
         const fresh=createJob(pending.data);
         next={...pending,id:fresh.id,data:fresh.data,createdAt:fresh.createdAt,updatedAt:fresh.updatedAt};
         recovered=true;
       }
       const signed={};
       for(const [id,meta] of Object.entries(pending.signed)){
         let file=memoryFiles.current[id];
         if(!file){const original=await previousStore.readAttachment(meta);file=new File([original.bytes],meta.name,{type:meta.type});}
         signed[id]=await nextStore.saveAttachment(next.id,id,file);
       }
       next={...next,signed};
       await nextStore.saveJob(next);
     }
     storeRef.current=nextStore;setStore(nextStore);setJobs(nextStore.history.jobs);
     if(next){putJob(next,{dirty:false});}
     else{jobRef.current=null;setJob(null);dirtyRef.current=false;setPage('clients');setSaveState('Guardado');}
     setNotice({type:'success',text:recovered?'Carpeta conectada. Se guardó una copia del trabajo en curso para conservar también la versión que ya existía.':`Carpeta «${handle.name}» conectada. Historial y adjuntos se guardan aquí automáticamente.`});
   }catch(e){if(e.name!=='AbortError')setNotice({type:'error',text:e.message});}finally{setLoading(false);}
 }
 async function leaveCurrent(){
   if(dirtyRef.current){if(storeRef.current)return await persist();setNotice({type:'error',text:'Conecta una carpeta y guarda el trabajo antes de abrir otro. Así podrás retomarlo más adelante.'});return false;}return true;
 }
 async function loadClient(id){
   if(!await leaveCurrent())return;
   setLoading(true);
   try{const response=validateClientData(await clientService.load(id));const next=createJob(response);clearReady();memoryFiles.current={};putJob(next);setVehicleQuery('');setVehiclePage(0);setPage('vehicles');setNotice({type:'info',text:`Datos simulados cargados: ${response.vehicles.length} vehículos. Selecciona la flota del trabajo.`});}
   catch(e){setNotice({type:'error',text:e.message});}finally{setLoading(false);}
 }
 async function resume(saved){if(!await leaveCurrent())return;clearReady();memoryFiles.current={};putJob(structuredClone(storeRef.current?.history.jobs.find(j=>j.id===saved.id) || saved),{dirty:false});setVehiclePage(0);setVehicleQuery('');setPage('vehicles');setNotice({type:'success',text:'Trabajo recuperado: selección, formulario y referencias a sus firmados.'});}
 function toggleVehicle(id){const ids=new Set(jobRef.current.selectedIds);ids.has(id)?ids.delete(id):ids.add(id);change({selectedIds:[...ids]});}
 async function attach(id,file){
   if(!file)return;
   if(!/\.(pdf|p7m)$/i.test(file.name)||!file.size){setNotice({type:'error',text:'Selecciona un PDF o P7M que no esté vacío.'});return;}
   setLoading(true);setNotice(null);
   try{
     const current=jobRef.current;
     const meta=storeRef.current?await storeRef.current.saveAttachment(current.id,id,file):{name:file.name,size:file.size,type:file.type};
     memoryFiles.current[id]=file;
     const next={...current,signed:{...current.signed,[id]:meta},updatedAt:new Date().toISOString(),status:'Documentos adjuntos'};
     clearReady();putJob(next);
     if(storeRef.current)await persist(next);
   }catch(e){setNotice({type:'error',text:`No se pudo guardar el adjunto: ${e.message}`});}finally{setLoading(false);}
 }
 function requestExport(kind){
   if(!data?.vehicles.length){setNotice({type:'error',text:'Selecciona al menos un vehículo antes de generar documentos.'});return;}
   if(kind==='ordered' && (!job.signed.anexo || !job.signed.commitment)){setNotice({type:'error',text:'Adjunta el Anexo I y el Compromiso del Gerente antes de generar el expediente.'});return;}
   const missing=(kind==='anexo'||kind==='unsigned')?missingAnnex(data,job.annex):[];
   if(missing.length){setConfirm({kind,missing});return;}generate(kind);
 }
 async function generate(kind){
   setConfirm(null);clearReady();setNotice(null);setBusy({percent:0,label:'Preparando datos'});
   const snapshot=jobRef.current;
   try{
     const signed={};
     if(kind==='ordered')for(const [id,meta] of Object.entries(snapshot.signed)){
       const file=memoryFiles.current[id];signed[id]=file?{name:file.name,bytes:await file.arrayBuffer()}:await storeRef.current.readAttachment(meta);
     }
     const task=startExport({kind,data:selectedData(snapshot),annex:snapshot.annex,signed},setBusy);taskRef.current=task;
     const result=await task.promise;
     const blob=new Blob([result.bytes],{type:result.type}),url=URL.createObjectURL(blob);urlRef.current=url;
     setReady({...result,bytes:undefined,url,size:blob.size});
     const next={...snapshot,status:kind==='ordered'?'Expediente generado':'Documentos preparados',updatedAt:new Date().toISOString(),exports:[{kind,name:result.name,at:new Date().toISOString(),elapsedMs:result.elapsedMs,size:blob.size},...snapshot.exports]};
     putJob(next);
     if(storeRef.current)await persist(next);
     const a=document.createElement('a');a.href=url;a.download=result.name;document.body.appendChild(a);a.click();a.remove();
   }catch(e){setNotice({type:'error',text:e.message});}finally{taskRef.current=null;setBusy(null);}
 }
 const locked=!!busy || loading || !!confirm;
 return <><header><div className="header-inner"><div><div className="eyebrow">CAE STUDIO · TRA020</div><h1>Expedientes de telemetría</h1><p>Del cliente al expediente, con cada trabajo guardado.</p></div><span className="demo-label">Datos simulados</span></div></header>
 <main><div className="storage-bar"><div><strong>{store?`Carpeta: ${store.directory.name}`:'Conecta la carpeta donde guardas el HTML'}</strong><small>{store?'historial.json · TRA020_archivos/ · Sin base de datos':'La primera vez se crearán historial.json y la carpeta TRA020_archivos. Al volver, selecciona la misma carpeta.'}</small></div><button className="secondary" disabled={locked} onClick={connectFolder}>{store?'Cambiar / volver a abrir carpeta':'Seleccionar carpeta'}</button></div>
 {!store&&<p className="help">Puedes explorar la simulación. Para conservar y retomar trabajos, selecciona la carpeta del HTML y permite guardar archivos.</p>}
 <nav aria-label="Secciones"><button disabled={locked} className={page==='clients'?'active':''} onClick={()=>setPage('clients')}>1. Cliente</button><button disabled={!job||locked} className={page==='vehicles'?'active':''} onClick={()=>setPage('vehicles')}>2. Vehículos</button><button disabled={!job||locked} className={page==='documents'?'active':''} onClick={()=>setPage('documents')}>3. Documentos para firma</button><button disabled={!job||locked} className={page==='ordered'?'active':''} onClick={()=>setPage('ordered')}>4. Expediente ordenado</button><button disabled={locked} className={page==='history'?'active':''} onClick={()=>setPage('history')}>Historial <span>{jobs.length}</span></button></nav>
 {notice&&<div role={notice.type==='error'?'alert':'status'} className={`notice ${notice.type}`}><span>{notice.text}</span><button className="dismiss" aria-label="Cerrar mensaje" onClick={()=>setNotice(null)}>×</button></div>}
 {job&&<div className="job-bar"><div><b>{job.data.owner.razonSocial}</b><small>{job.data.owner.nif} · {job.data.expediente.codigo} · {number(job.selectedIds.length)} vehículos seleccionados</small></div><div className="save-status"><span>{saveState}</span><button className="secondary" disabled={!store||locked} onClick={()=>persist()}>Guardar ahora</button></div></div>}
 {busy&&<div className="progress-panel" role="status"><div><strong>{busy.label}</strong><span>{busy.percent}%</span></div><progress max="100" value={busy.percent}/><button className="secondary" onClick={()=>taskRef.current?.cancel()} disabled={!taskRef.current}>Cancelar generación</button></div>}
 {ready&&<div className="ready-panel" role="status"><div><strong>Archivo listo en {(ready.elapsedMs/1000).toFixed(1)} s</strong><small>{ready.name} · {(ready.size/1024/1024).toFixed(2)} MB</small><p>Si Chrome no inició la descarga, guárdalo con este enlace.</p></div><a className="button-link" href={ready.url} download={ready.name}>Guardar archivo</a></div>}
 {page==='clients'&&<section className="card"><div className="section-head"><div><div className="step-label">PASO 1</div><h2>¿Con qué cliente vamos a trabajar?</h2><p>Busca por nombre o NIF. Al abrirlo se cargarán sus vehículos, consumos, kilómetros y datos disponibles.</p></div></div><label className="search"><span>Buscar cliente por nombre o NIF</span><input type="search" placeholder="Ej. Sierra Norte o B12345678" value={query} onChange={e=>setQuery(e.target.value)}/></label><div className="client-grid">{clients.map(c=><article className="client-card" key={c.id}><div className="client-monogram">{c.name.split(' ').slice(0,2).map(w=>w[0]).join('')}</div><h3>{c.name}</h3><p>{c.nif} · {c.city}</p><strong>{number(c.vehicles)} vehículos</strong><button disabled={locked} onClick={()=>loadClient(c.id)}>Abrir cliente</button></article>)}</div>{!clients.length&&<p className="empty">No hay clientes con ese nombre o NIF.</p>}<p className="muted">Tres clientes ficticios para trabajar el flujo. La conexión final estará integrada en la app, sin una pestaña de configuración.</p></section>}
 {page==='vehicles'&&job&&<><div className="metrics"><Metric label="Flota del cliente" value={number(job.data.vehicles.length)}/><Metric label="Seleccionados" value={number(selected.size)}/><Metric label="Sin alertas preliminares" value={number(valid.length)}/><Metric label="Ahorro estimado" value={`${number(total)} kWh/año`}/></div><section className="card"><div className="section-head"><div><div className="step-label">PASO 2</div><h2>Selecciona los vehículos del expediente</h2></div><button disabled={!selected.size||locked} onClick={()=>setPage('documents')}>Continuar a documentos →</button></div><div className="toolbar"><label className="search"><span>Filtrar vehículos</span><input value={vehicleQuery} onChange={e=>{setVehicleQuery(e.target.value);setVehiclePage(0);}} placeholder="Matrícula, marca, dispositivo o bastidor"/></label><button className="secondary" disabled={locked} onClick={()=>change({selectedIds:job.data.vehicles.map(v=>v.id)})}>Seleccionar todos ({job.data.vehicles.length})</button><button className="secondary" disabled={locked} onClick={()=>change({selectedIds:[]})}>Quitar selección</button></div><div className="table-scroll"><table><thead><tr><th>Incluir</th><th>Vehículo</th><th>Dispositivo</th><th>Km pre / post</th><th>Consumo pre / post</th><th>Revisión</th></tr></thead><tbody>{rows.map(v=>{const x=currentStats.get(v.id)||evaluate(v);return <tr key={v.id} className={selected.has(v.id)?'selected-row':''}><td><input type="checkbox" aria-label={`Incluir ${v.plate}`} disabled={locked} checked={selected.has(v.id)} onChange={()=>toggleVehicle(v.id)}/></td><td><b>{v.plate}</b><small>{v.brand} {v.model}</small></td><td>{v.deviceId}<small>Activado: {v.activatedAt}</small></td><td>{number(v.pre.km)} / {number(v.post.km)}</td><td>{number(v.pre.liters)} / {number(v.post.liters)} l</td><td><span className={`badge ${x.eligible?'ok':'pending'}`}>{x.eligible?'Sin alertas':'Revisar'}</span>{x.problems[0]&&<small>{x.problems[0]}</small>}</td></tr>;})}</tbody></table></div>{!rows.length&&<p className="empty">No hay vehículos que coincidan.</p>}<div className="pagination"><span>{filtered.length} vehículos · Página {Math.min(vehiclePage+1,pagination)||1} de {pagination||1}</span><button className="secondary" disabled={!vehiclePage} onClick={()=>setVehiclePage(v=>v-1)}>Anterior</button><button className="secondary" disabled={vehiclePage+1>=pagination} onClick={()=>setVehiclePage(v=>v+1)}>Siguiente</button></div><p className="muted">Cálculos preliminares del prototipo. «Sin alertas» no acredita elegibilidad ni sustituye la revisión del expediente.</p></section></>}
 {page==='documents'&&data&&<div className="documents-layout"><section className="card"><AnnexForm data={data} overrides={job.annex} disabled={locked} onChange={annex=>change({annex})}/></section><aside className="card download-card"><div className="step-label">PASO 3</div><h2>Documentos para firma</h2><p>Se generan con los {number(data.vehicles.length)} vehículos seleccionados.</p>{[['anexo','Anexo I oficial editable','Documento original del Ministerio. Los campos quedan editables, incluida la relación adicional de equipos.'],['fleet','Informe del gestor de flota','Excel con identificación, instalación, activación y desempeño.'],['fuel','Registro de repostajes','Excel con eventos automáticos, localización, odómetro y país.'],['commitment','Compromiso del Gerente','Borrador PDF con relación de flota. Pendiente del modelo oficial.']].map(([kind,title,desc])=><div className="doc" key={kind}><h3>{title}</h3><p>{desc}</p><button className="secondary" disabled={locked||!selected.size} onClick={()=>requestExport(kind)}>Descargar {kind==='fleet'||kind==='fuel'?'Excel':'PDF'}</button></div>)}<button disabled={locked||!selected.size} onClick={()=>requestExport('unsigned')}>Descargar todos en ZIP</button><button className="secondary full" disabled={locked} onClick={()=>setPage('ordered')}>Continuar al expediente →</button></aside></div>}
 {page==='ordered'&&data&&<div className="two"><section className="card"><div className="step-label">PASO 4</div><h2>Reúne los documentos firmados</h2><p>Adjunta los documentos correspondientes a esta selección y revisión del expediente.</p>{[['anexo','Anexo I firmado'],['commitment','Compromiso del Gerente firmado']].map(([id,label])=><label className="upload" key={`${id}-${job.revision}`}><b>{label}</b><input aria-label={label} disabled={locked} type="file" accept=".pdf,.p7m" onChange={e=>attach(id,e.target.files[0])}/>{job.signed[id]&&<small className="attached">✓ {job.signed[id].name} · {(job.signed[id].size/1024).toFixed(0)} KB</small>}</label>)}<p className="muted">Adjuntar un archivo no verifica su firma. Los documentos se conservan en la carpeta del trabajo al conectar el historial.</p><button disabled={locked||!selected.size} onClick={()=>requestExport('ordered')}>Generar expediente ordenado (.zip)</button></section><section className="card"><h2>Qué incluye el ZIP</h2><ul className="checklist"><li>Un ActuacionE1.zip, ActuacionE2.zip, etc. por cada actuación estandarizada.</li><li>Mientras la simulación no aporta actuaciones[], la flota seleccionada se agrupa en ActuacionE1.zip.</li><li>Cada actuación contiene AnexoE&lt;n&gt;.pdf y los documentos numerados E&lt;n&gt;-1 a E&lt;n&gt;-4.</li><li>Los documentos aún no recibidos quedan como pendientes identificados, sin inventar contenido.</li></ul><p className="path-preview">expedientes / {data.expediente.codigo} / ActuacionE1.zip</p><div className="help"><b>Originales pendientes del proveedor</b><p>La simulación no incluye convenios, dictámenes ni certificados originales. Cada actuación lo indica expresamente.</p></div></section></div>}
 {page==='history'&&<section className="card"><div className="section-head"><div><h2>Historial de trabajos</h2><p>Retoma cada expediente con sus datos, selección, formulario y adjuntos.</p></div></div>{!store?<p className="empty">Selecciona la carpeta del HTML para cargar o crear tu historial.</p>:jobs.length===0?<p className="empty">Todavía no hay trabajos guardados. Empieza buscando un cliente.</p>:<div className="table-scroll"><table><thead><tr><th>Cliente / expediente</th><th>Último cambio</th><th>Vehículos</th><th>Estado</th><th>Descargas</th><th>Acción</th></tr></thead><tbody>{jobs.map(j=><tr key={j.id}><td><b>{j.data.owner.razonSocial}</b><small>{j.data.owner.nif} · {j.data.expediente.codigo}</small></td><td>{dateTime(j.updatedAt)}</td><td>{number(j.selectedIds.length)}</td><td>{j.status}</td><td>{j.exports.length}</td><td><button className="secondary" disabled={locked} onClick={()=>resume(j)}>Retomar</button></td></tr>)}</tbody></table></div>}<p className="muted">Copia el HTML, historial.json y TRA020_archivos juntos para trasladar los trabajos. La última versión anterior del historial se conserva en historial.anterior.json.</p></section>}
 <footer>TRA020 · Trabajo local · Simulación de proveedor · {store?'Guardado en archivos JSON':'Sin carpeta conectada'}</footer></main>
 {confirm&&<ConfirmIncomplete missing={confirm.missing} onCancel={()=>setConfirm(null)} onConfirm={()=>generate(confirm.kind)}/>}
 </>;
}
createRoot(document.getElementById('root')).render(<App/>);
