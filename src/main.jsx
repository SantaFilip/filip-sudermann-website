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

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
