// client/src/pages/Login.jsx
import { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
// Düzeltme: Tek satırda hem useNavigate hem Link import edildi
import { useNavigate, Link } from 'react-router-dom'

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
      
      const user = response.data.user
      
      toast.success(`Hoş geldin ${user.username}!`)
      
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('username', user.username)
      localStorage.setItem('role', user.role)
      localStorage.setItem('user_id', user.id)

      setTimeout(() => {
        if (user.role === 'admin') {
            navigate('/admin')
        } else {
            navigate('/')
        }
        window.location.reload() 
      }, 1500)

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
      <p style={{marginTop: '20px'}}>
        Hesabın yok mu? <Link to="/register" style={{color: '#4CAF50', fontWeight: 'bold', textDecoration: 'none'}}>Hemen Kayıt Ol</Link>
      </p>

    </div>
  )
}

export default Login