// client/src/pages/Login.jsx
import { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const response = await axios.post('http://127.0.0.1:5000/api/auth/login', {
        username: username,
        password: password
      })
      
      const user = response.data.user // Kullanıcı bilgilerini değişkene alalım
      
      toast.success(`Hoş geldin ${user.username}!`)
      
      // Verileri Kaydet
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('username', user.username)
      localStorage.setItem('role', user.role)
      localStorage.setItem('user_id', user.id)

      // --- AKILLI YÖNLENDİRME BURADA ---
      setTimeout(() => {
        
        if (user.role === 'admin') {
            navigate('/admin') // Admin ise Panele git
        } else {
            navigate('/') // Müşteri ise Anasayfaya git
        }

        // Navbar'ın güncellenmesi için sayfayı yenile
        window.location.reload() 
      }, 1500)
      // --------------------------------

    } catch (error) {
      if (error.response) {
        toast.error(error.response.data.message || 'Giriş başarısız')
      } else {
        toast.error('Sunucuya bağlanılamadı')
      }
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', textAlign: 'center', fontFamily: 'Arial' }}>
      <h2>Giriş Yap</h2>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input 
          type="text" placeholder="Kullanıcı Adı" 
          value={username} onChange={(e) => setUsername(e.target.value)} required
          style={{ padding: '10px' }}
        />
        <input 
          type="password" placeholder="Şifre" 
          value={password} onChange={(e) => setPassword(e.target.value)} required
          style={{ padding: '10px' }}
        />
        <button type="submit" style={{ padding: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', cursor: 'pointer' }}>
          Giriş Yap
        </button>
      </form>
    </div>
  )
}

export default Login