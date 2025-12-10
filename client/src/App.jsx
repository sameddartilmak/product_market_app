// client/src/App.jsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Sayfalar
import Login from './pages/Login'
import Home from './pages/Home'
import AddProduct from './pages/AddProduct'
import ProductDetail from './pages/ProductDetail' // Detay sayfası
import Profile from './pages/Profile'             // <-- Profil sayfası (Bunu unutmuş olabiliriz)

// Bileşenler
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <Router>
      <ToastContainer position="top-right" autoClose={3000} />
      
      {/* Navbar her sayfada sabit durur */}
      <Navbar /> 

      <Routes>
        {/* 1. Ana Sayfa */}
        <Route path="/" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
        } />

        {/* 2. Ürün Ekleme */}
        <Route path="/add-product" element={
            <ProtectedRoute>
              <AddProduct />
            </ProtectedRoute>
        } />
        
        {/* 3. Ürün Detay */}
        <Route path="/product/:id" element={
            <ProtectedRoute>
               <ProductDetail />
            </ProtectedRoute>
        } />

        {/* 4. Profil Sayfası (Sorunlu olan kısım burasıydı) */}
        <Route path="/profile" element={
            <ProtectedRoute>
               <Profile />
            </ProtectedRoute>
        } />
        
        {/* 5. Giriş Yap */}
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  )
}

export default App