import { generateExport } from './expediente.js';
self.onmessage = async ({data}) => {
  try {
    const result=await generateExport(data,(percent,label)=>self.postMessage({type:'progress',percent,label}));
    self.postMessage({type:'done',result},[result.bytes.buffer]);
  } catch (error) { self.postMessage({type:'error',message:error.message || 'No se pudo generar el archivo.'}); }
};
