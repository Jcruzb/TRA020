import { readFileSync, writeFileSync } from 'node:fs';
const bytes = readFileSync(new URL('../src/assets/anexo-i-miteco-original.pdf', import.meta.url));
writeFileSync(new URL('../src/assets/anexoTemplate.js', import.meta.url), `// Generado desde el PDF original del Ministerio; ejecutar npm run prepare:pdf.\nexport default '${bytes.toString('base64')}';\n`);
