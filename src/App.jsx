import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import SmoothScroll from './components/SmoothScroll';
import Home from '@/pages/Home';
import Legal from '@/pages/Legal';
import InspirationHub from '@/pages/InspirationHub';
import RotateLab from '@/pages/RotateLab';
import PageNotFound from './lib/PageNotFound';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import { ToastProvider } from '@/components/ui/use-toast';
import { Toaster } from '@/components/ui/toaster';

function App() {
  return (
    <SmoothScroll>
      <LanguageProvider>
        <ToastProvider>
          <Router>
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/inspiration-hub" element={<InspirationHub />} />
              {/* Testroute, bewusst nicht verlinkt und nicht in der Sitemap. */}
              <Route path="/lab/rotate" element={<RotateLab />} />
              <Route path="/impressum" element={<Legal doc="impressum" />} />
              <Route path="/datenschutz" element={<Legal doc="datenschutz" />} />
              <Route path="/agb" element={<Legal doc="agb" />} />
              <Route path="/widerrufsrecht" element={<Legal doc="widerrufsrecht" />} />
              <Route path="*" element={<PageNotFound />} />
            </Routes>
          </Router>
          <Toaster />
        </ToastProvider>
      </LanguageProvider>
    </SmoothScroll>
  )
}

export default App
