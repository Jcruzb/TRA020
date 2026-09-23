import ExportWorker from './export.worker.js?worker&inline';

export function startExport(payload,onProgress) {
  const worker=new ExportWorker();
  let timer, rejectJob, settled=false;
  const dispose=()=>{clearTimeout(timer);worker.terminate();settled=true;};
  const promise=new Promise((resolve,reject)=>{
    rejectJob=reject;
    timer=setTimeout(()=>{dispose();reject(new Error('La generación ha superado dos minutos. Inténtalo de nuevo o reduce el lote.'));},120000);
    worker.onmessage=({data})=>{
      if(data.type==='progress')onProgress({percent:Math.round(data.percent),label:data.label});
      else if(data.type==='error'){dispose();reject(new Error(data.message));}
      else if(data.type==='done'){dispose();resolve(data.result);}
    };
    worker.onerror=e=>{dispose();reject(new Error(e.message || 'No se pudo iniciar el generador de documentos.'));};
    worker.postMessage(payload);
  });
  return {promise,cancel:()=>{if(!settled){dispose();rejectJob(new Error('Generación cancelada.'));}}};
}
