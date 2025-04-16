import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import FormPage from './pages/FormPage'
import SuccessPage from './pages/SuccessPage'
import RedirectPage from './pages/RedirectPage'
import LogoPage from './pages/LogoPage'
import ErrorBoundary from './components/ErrorBoundary'
import DebugPanel from './components/DebugPanel'
import './App.css'
import './styles/DebugPanel.css'

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<FormPage />} />
          <Route path="/:logo" element={<FormPage />} />
          <Route path="/:logo/success" element={<SuccessPage />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/redirect" element={<RedirectPage />} />
          <Route path="/logo" element={<LogoPage />} />
        </Routes>
        <DebugPanel />
      </Router>
    </ErrorBoundary>
  )
}

export default App
