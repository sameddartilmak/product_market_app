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
      
      <Navbar /> 

      {/* İŞTE SİHİRLİ DOKUNUŞ BURADA 👇 */}
      <div className="main-container">
        <Routes>
          {/* ... rotaların aynen kalsın ... */}
          <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/add-product" element={<ProtectedRoute><AddProduct /></ProtectedRoute>} />
          <Route path="/product/:id" element={<ProtectedRoute><ProductDetail /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App