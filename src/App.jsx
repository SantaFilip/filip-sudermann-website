import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import Home from '@/pages/Home';
import Legal from '@/pages/Legal';
import InspirationHub from '@/pages/InspirationHub';
import PageNotFound from './lib/PageNotFound';
import { LanguageProvider } from '@/lib/i18n/LanguageContext';
import { ToastProvider } from '@/components/ui/use-toast';
import { Toaster } from '@/components/ui/toaster';

function App() {
  return (
    <LanguageProvider>
      <ToastProvider>
        <Router>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/inspiration-hub" element={<InspirationHub />} />
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
  )
}

export default App
