import { mkdir, writeFile } from 'node:fs/promises';
import { clients, makeClientData } from '../src/data/mockClients.js';
await mkdir('examples',{recursive:true});
await writeFile('examples/clientes.json',JSON.stringify(clients,null,2));
await writeFile('examples/cliente-24-vehiculos.json',JSON.stringify(makeClientData('CLI-001'),null,2));
