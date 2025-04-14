import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import FormPage from './pages/FormPage'
import SuccessPage from './pages/SuccessPage'
import RedirectPage from './pages/RedirectPage'
import LogoPage from './pages/LogoPage'
import ErrorBoundary from './components/ErrorBoundary'
import './App.css'

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route path="/" element={<FormPage />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/redirect" element={<RedirectPage />} />
          <Route path="/logo" element={<LogoPage />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  )
}

export default App
