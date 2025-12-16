// client/src/pages/Register.jsx
import { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate, Link } from 'react-router-dom'

function Register() {
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  })

  const handleChange = (e) => {
    setFormData({
        ...formData,
        [e.target.name]: e.target.value
    })
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    try {
      await axios.post('http://127.0.0.1:5000/api/auth/register', formData)
      
      toast.success("Kayıt başarılı! Giriş yapılıyor...")
      
      // Başarılı olursa 1.5 saniye sonra Login sayfasına yönlendir
      setTimeout(() => {
        navigate('/login')
      }, 1500)

    } catch (error) {
      if (error.response) {
        toast.error(error.response.data.message || 'Kayıt başarısız')
      } else {
        toast.error('Sunucuya bağlanılamadı')
      }
    }
  }

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', textAlign: 'center', fontFamily: 'Arial' }}>
      <h2>Kayıt Ol</h2>
      <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        <input 
          type="text" name="username" placeholder="Kullanıcı Adı" 
          value={formData.username} onChange={handleChange} required
          style={{ padding: '10px' }}
        />
        
        <input 
          type="email" name="email" placeholder="Email Adresi" 
          value={formData.email} onChange={handleChange} required
          style={{ padding: '10px' }}
        />

        <input 
          type="password" name="password" placeholder="Şifre" 
          value={formData.password} onChange={handleChange} required
          style={{ padding: '10px' }}
        />
        
        <button type="submit" style={{ padding: '10px', backgroundColor: '#3498db', color: 'white', border: 'none', cursor: 'pointer', fontWeight:'bold' }}>
          Kayıt Ol
        </button>
      </form>

      <p style={{marginTop: '20px'}}>
        Zaten hesabın var mı? <Link to="/login" style={{color: '#3498db'}}>Giriş Yap</Link>
      </p>
    </div>
  )
}

export default Register