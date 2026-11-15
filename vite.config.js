import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

// Schriftdateien, die oben auf der Seite sofort gebraucht werden (lateinisch,
// aufrecht). Ohne Preload entdeckt der Browser sie erst, wenn das JavaScript
// gelaufen ist - der Text steht dann erst in einer Ersatzschrift da und
// springt um.
const SOFORT_SCHRIFTEN = [/inter-latin-wght-normal/, /cormorant-garamond-latin-wght-normal/]

// Muss zu MOBILE_QUERY in src/pages/Home.jsx passen.
const DESKTOP_ABFRAGE = '(min-width: 768px)'

/**
 * Traegt nach dem Build Preloads mit den gehashten Dateinamen in index.html
 * ein: die Sofort-Schriften fuer alle, und - nur auf dem Desktop - die 3D-
 * Buehne samt Gebaeude und three.js. Die wuerden sonst erst nacheinander
 * angefordert, wenn das Hauptpaket bzw. die Buehne ausgefuehrt ist; der
 * Ladevorhang (src/lib/ladeSchranke.js) wartet aber auf alles.
 */
function fruehesLaden() {
  return {
    name: 'fruehes-laden',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, { bundle }) {
        const tags = []
        for (const datei of Object.values(bundle)) {
          if (datei.type === 'asset' && SOFORT_SCHRIFTEN.some((m) => m.test(datei.fileName))) {
            tags.push({
              tag: 'link',
              attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: `/${datei.fileName}`, crossorigin: '' },
              injectTo: 'head-prepend',
            })
          }
        }

        const buehne = Object.values(bundle).find(
          (d) => d.type === 'chunk' && d.facadeModuleId?.endsWith('/components/lab/RotaryStage.jsx'),
        )
        if (buehne) {
          const dateien = new Set()
          const sammle = (name) => {
            if (dateien.has(name)) return
            const chunk = bundle[name]
            if (!chunk || chunk.type !== 'chunk' || chunk.isEntry) return
            dateien.add(name)
            chunk.imports.forEach(sammle)
          }
          sammle(buehne.fileName)
          // Das Gebaeude (ArchitectureGL) ist ein dynamischer Import der
          // Buehne - gleich mit vorladen, samt three.js.
          buehne.dynamicImports.forEach(sammle)
          const liste = JSON.stringify([...dateien].map((n) => `/${n}`))
          tags.push({
            tag: 'script',
            children: `if(matchMedia(${JSON.stringify(DESKTOP_ABFRAGE)}).matches){for(const h of ${liste}){const l=document.createElement('link');l.rel='modulepreload';l.href=h;document.head.appendChild(l)}}`,
            injectTo: 'head',
          })
        }
        return tags
      },
    },
  }
}

export default defineConfig({
  plugins: [react(), fruehesLaden()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
