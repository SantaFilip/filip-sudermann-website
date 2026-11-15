import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
// Schriften selbst gehostet statt von Google: kein Umweg ueber zwei fremde
// Server, und index.html laedt sie per Preload sofort mit (siehe vite.config.js).
import '@fontsource-variable/inter'
import '@fontsource-variable/cormorant-garamond'
import '@fontsource-variable/cormorant-garamond/wght-italic.css'
import '@fontsource/dm-serif-display/400.css'
import '@fontsource/dm-serif-display/400-italic.css'
import '@/index.css'
import { erwarte, erledigt } from '@/lib/ladeSchranke'

// Worauf der Ladevorhang wartet, bevor die Seite auf einen Schlag erscheint.
// Muss zu den Bedingungen in RotaryStage passen (Buehne nur ab 768 px und
// ohne reduzierte Bewegung) - sonst wartete der Vorhang auf eine Buehne, die
// nie kommt, bis zum Zeitlimit.
const startseite = window.location.pathname === '/'
const mitBuehne = startseite
  && window.matchMedia('(min-width: 768px)').matches
  && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
erwarte([
  'schriften',
  ...(startseite ? ['bilder'] : []),
  ...(mitBuehne ? ['buehne', 'architektur-hinten', 'architektur-vorne', 'mond'] : []),
])

// Ausdruecklich laden statt auf document.fonts.ready zu warten: das ist schon
// erfuellt, bevor der erste Text ueberhaupt eine Schrift angefordert hat.
Promise.all([
  '16px "Inter Variable"',
  '600 16px "Inter Variable"',
  '700 32px "Cormorant Garamond Variable"',
  '32px "DM Serif Display"',
  'italic 32px "DM Serif Display"',
].map((f) => document.fonts.load(f)))
  .catch(() => {})
  .then(() => erledigt('schriften'))

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
