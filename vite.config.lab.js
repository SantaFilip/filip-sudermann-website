import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

// Eigener Build nur fuer die Vorschau-Seite. base './' ist Pflicht: die
// Vorschau wird nicht unter / ausgeliefert, absolute Asset-Pfade wuerden
// dort ins Leere zeigen.
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  build: {
    outDir: 'dist-lab',
    rollupOptions: { input: path.resolve(__dirname, 'lab-preview.html') },
  },
})
