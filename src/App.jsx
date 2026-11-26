import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import SmoothScroll from './components/SmoothScroll';
import Home from '@/pages/Home';
import Legal from '@/pages/Legal';
import InspirationHub from '@/pages/InspirationHub';
import PageNotFound from './lib/PageNotFound';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import { ToastProvider } from '@/components/ui/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { MusikProvider } from '@/lib/MusikContext';

// Creator-Pitches nur bei Bedarf laden, damit die Startseite nicht waechst
const Pitch = lazy(() => import('@/pages/Pitch'));

function App() {
  return (
    <SmoothScroll>
      <LanguageProvider>
        <ToastProvider>
          <MusikProvider>
          <Router>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/inspiration-hub" element={<InspirationHub />} />
              <Route path="/pitch/:slug" element={<Suspense fallback={null}><Pitch /></Suspense>} />
              <Route path="/impressum" element={<Legal doc="impressum" />} />
              <Route path="/datenschutz" element={<Legal doc="datenschutz" />} />
              <Route path="/agb" element={<Legal doc="agb" />} />
              <Route path="/widerrufsrecht" element={<Legal doc="widerrufsrecht" />} />
              <Route path="*" element={<PageNotFound />} />
            </Routes>
          </Router>
          </MusikProvider>
          <Toaster />
        </ToastProvider>
      </LanguageProvider>
    </SmoothScroll>
  )
}

export default App
