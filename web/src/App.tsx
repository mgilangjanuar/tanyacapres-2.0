import { ThemeProvider } from '@/components/theme-provider'
import { TooltipProvider } from '@/components/ui/tooltip'
import Disclaimer from '@/pages/disclaimer'
import Main from '@/pages/main'
import Privacy from '@/pages/privacy'
import Terms from '@/pages/terms'
import { Route, Routes } from 'react-router-dom'
import './App.css'

function App() {
  return <ThemeProvider storageKey="theme" defaultTheme="light">
    <TooltipProvider>
      <Routes>
        <Route index element={<Main />} />
        <Route path="/disclaimer" element={<Disclaimer />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
      </Routes>
    </TooltipProvider>
  </ThemeProvider>
}

export default App
