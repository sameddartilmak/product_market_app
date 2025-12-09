// client/src/pages/Login.jsx
import { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      // Backend'e istek atıyoruz
      const response = await axios.post('http://127.0.0.1:5000/api/auth/login', {
        username: username,
        password: password
      })
      
      // Başarılı olursa
      toast.success(response.data.message)
      localStorage.setItem('token', response.data.access_token) // Token'ı kaydet

    } catch (error) {
      // Hata olursa
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