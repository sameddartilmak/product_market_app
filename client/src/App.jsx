// client/src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Sayfalarımızı çağırıyoruz
import Login from './pages/Login'
import Home from './pages/Home' 

function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        {/* Ana Sayfa Rotası */}
        <Route path="/" element={<Home />} />
        
        {/* Giriş Yap Rotası */}
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  )
}

export default App