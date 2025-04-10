import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import FormPage from './pages/FormPage'
import SuccessPage from './pages/SuccessPage'
import RedirectPage from './pages/RedirectPage'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<FormPage />} />
        <Route path="/success" element={<SuccessPage />} />
        <Route path="/redirect" element={<RedirectPage />} />
      </Routes>
    </Router>
  )
}

export default App
