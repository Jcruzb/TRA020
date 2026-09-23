import React, { useEffect, useRef } from 'react';
import { annexFields, annexValues, benefits, missingAnnex } from './domain/annexFields.js';

export const number = n => new Intl.NumberFormat('es-ES',{maximumFractionDigits:0}).format(n);
export const dateTime = d => new Date(d).toLocaleString('es-ES');
export function Metric({label,value}){return <div className="metric"><span>{label}</span><strong>{value}</strong></div>;}
export function Choice({label,value,onChange,options}){return <label className="field"><span>{label}</span><select value={value || ''} onChange={e=>onChange(e.target.value)}><option value="">Pendiente de confirmar</option>{options.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>;}
export function AnnexForm({data,overrides,onChange,disabled}){
 const a=annexValues(data,overrides),missing=missingAnnex(data,overrides);
 const update=(key,value)=>onChange({...overrides,[key]:value});
 return <fieldset disabled={disabled} className="annex-form"><div className="section-head"><div><h2>Revisar Anexo I</h2><p>El formulario original del Ministerio, cumplimentado con los datos disponibles.</p></div><span className={`badge ${missing.length?'pending':'ok'}`}>{missing.length?`${missing.length} datos pendientes`:'Datos completos'}</span></div>
 <p className="help">Los apartados vacíos seguirán editables en el PDF. Antes de descargarlo incompleto te pediremos confirmación. La firma se realiza después, en el propio PDF.</p>
 <div className="form-grid"><Choice label="¿El beneficiario es distinto del propietario?" value={a.beneficiaryDifferent} onChange={v=>update('beneficiaryDifferent',v)} options={[["no","No, es el mismo"],["yes","Sí, es distinto"]]}/><Choice label="¿Actúa mediante representante?" value={a.represented} onChange={v=>update('represented',v)} options={[["yes","Sí"],["no","No"]]}/></div>
 {['Actuación','Propietario','Beneficiario','Representante'].map(group=>{
 const fields=annexFields.filter(f=>f.group===group && (!f.when || f.when(a)));
 if(!fields.length)return null;
 return <details key={group} open={group==='Actuación' || group==='Propietario'}><summary>{group}<span>{fields.filter(f=>!a[f.key]).length} vacíos</span></summary>
 {group==='Representante'&&<Choice label="Acreditación de poderes" value={a.powerType} onChange={v=>update('powerType',v)} options={[["notarial","Poder notarial"],["other","Otro documento"]]}/>}
 <div className="form-grid">{fields.map(f=><FormField key={f.key} spec={f} value={a[f.key]} onChange={v=>update(f.key,v)}/>)}</div>
 {group==='Actuación'&&<p className="muted">{data.vehicles.length} dispositivos vinculados a la selección. Se incluirá una relación adicional cuando no quepan en el apartado original.</p>}
 </details>;})}
 <details open><summary>Declaraciones de bono social y ayudas</summary><fieldset className="benefits"><legend>Bono social (confirmación del declarante)</legend>{benefits.map(([key,label])=><label className="check-line" key={key}><input type="checkbox" checked={a.socialBenefits?.includes(key) || false} onChange={e=>update('socialBenefits',e.target.checked?key==='none'?['none']:[...(a.socialBenefits || []).filter(v=>v!=='none'),key]:(a.socialBenefits || []).filter(v=>v!==key))}/>{label}</label>)}</fieldset>
 <Choice label="¿Se ha solicitado ayuda para la misma actuación?" value={a.aidRequested} onChange={v=>update('aidRequested',v)} options={[["no","No se ha solicitado"],["yes","Sí se ha solicitado"]]}/>
 {a.aidRequested==='yes'&&<><Choice label="Resultado de la solicitud" value={a.aidOutcome} onChange={v=>update('aidOutcome',v)} options={[["granted","Obtenida"],["denied","No obtenida"],["pending","Pendiente de resolución"]]}/><Choice label="¿Hay una segunda ayuda?" value={a.secondAid} onChange={v=>update('secondAid',v)} options={[["no","No"],["yes","Sí"]]}/><p className="muted">El modelo oficial contiene dos tablas de ayudas. Si hay más, será necesario aportar su relación adicional.</p>{['Ayuda 1','Ayuda 2'].map(group=>{const fields=annexFields.filter(f=>f.group===group&&f.when(a));return fields.length>0&&<div key={group}><h3>{group}</h3><div className="form-grid">{fields.map(f=><FormField key={f.key} spec={f} value={a[f.key]} onChange={v=>update(f.key,v)}/>)}</div></div>;})}</>}
 </details><details open><summary>Lugar y fecha de firma</summary><div className="form-grid">{annexFields.filter(f=>f.group==='Firma').map(f=><FormField key={f.key} spec={f} value={a[f.key]} onChange={v=>update(f.key,v)}/>)}</div></details>
 </fieldset>;
}
function FormField({spec,value,onChange}){
 return <label className={`field ${!value&&!spec.optional?'missing':''}`}><span>{spec.label}{!value&&!spec.optional&&<small> Pendiente</small>}</span>{spec.options?<select value={value || ''} onChange={e=>onChange(e.target.value)}><option value="">Sin cumplimentar</option>{spec.options.map(v=><option key={v}>{v}</option>)}</select>:<input value={value || ''} onChange={e=>onChange(e.target.value)} placeholder="Sin cumplimentar"/>}</label>;
}
export function ConfirmIncomplete({missing,onCancel,onConfirm}){
 const dialog=useRef(null);
 useEffect(()=>{const el=dialog.current;const handle=e=>{if(e.key==='Escape'){e.preventDefault();onCancel();}if(e.key==='Tab'){const buttons=el.querySelectorAll('button');const first=buttons[0],last=buttons[buttons.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}};el.addEventListener('keydown',handle);return()=>el.removeEventListener('keydown',handle);},[onCancel]);
 return <div className="modal-backdrop"><section ref={dialog} role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="modal"><h2 id="confirm-title">¿Descargar el Anexo I con apartados en blanco?</h2><p>Quedan {missing.length} datos por completar. El cliente podrá escribirlos en el PDF editable antes de firmarlo.</p><ul className="missing-list">{missing.map(m=><li key={m}>{m}</li>)}</ul><div className="actions"><button className="secondary" autoFocus onClick={onCancel}>Volver a completar</button><button onClick={onConfirm}>Sí, descargar con campos en blanco</button></div></section></div>;
}
