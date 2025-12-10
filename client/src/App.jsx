// client/src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'


import Login from './pages/Login'
import Home from './pages/Home'
import AddProduct from './pages/AddProduct' // <-- 1. YENİ
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'

function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
      <Navbar /> {/* Navbar'ı buraya eklemeyi unutma, kodunda varsa kalsın */}
      
      <Routes>
        <Route path="/" element={
            <ProtectedRoute><Home /></ProtectedRoute>
        } />

        {/* 2. YENİ ROTA: İlan Ekleme Sayfası */}
        <Route path="/add-product" element={
            <ProtectedRoute>
              <AddProduct />
            </ProtectedRoute>
        } />
        
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  )
}
// Not: Navbar importunu ve bileşenini yukarıdaki örnekte senin koduna göre ayarladık.
// Eğer Navbar zaten App.jsx içinde değil de main.jsx içindeyse dokunma.
export default App