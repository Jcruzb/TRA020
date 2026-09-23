import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// El resultado se abre directamente con doble clic: no deja módulos, CSS ni assets externos.
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  build: { cssCodeSplit: false, assetsInlineLimit: 100000000 }
});
