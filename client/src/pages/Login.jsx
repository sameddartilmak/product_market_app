// client/src/pages/Login.jsx
import { useState, useContext } from 'react'
import axios from 'axios'
import { AuthContext } from '../context/AuthContext' // Context'i import ettik
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  
  // AuthContext'ten login fonksiyonunu çekiyoruz
  const { login } = useContext(AuthContext)
  
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      // Backend'e istek at
      const res = await axios.post('http://127.0.0.1:5000/api/auth/login', {
        username: username,
        password: password
      })

      // --- KRİTİK NOKTA BURASI ---
      // Backend'den gelen Token ve User bilgisini Context'e gönderiyoruz.
      // Context bunu LocalStorage'a kaydedecek.
      if (res.data.access_token) {
          console.log("Giriş Başarılı! Token:", res.data.access_token) // Konsoldan kontrol edebilirsin
          login(res.data.user, res.data.access_token)
          
          toast.success('Giriş başarılı! Yönlendiriliyorsunuz...')
          navigate('/') // Ana sayfaya yönlendir
      }

    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Giriş başarısız!')
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={{textAlign:'center', marginBottom:'20px'}}>Giriş Yap</h2>
        <form onSubmit={handleSubmit}>
          
          <div style={styles.inputGroup}>
            <label>Kullanıcı Adı</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label>Şifre</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
            />
          </div>

          <button type="submit" style={styles.button}>Giriş Yap 🚀</button>
        </form>
      </div>
    </div>
  )
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', marginTop: '50px' },
  card: { width: '400px', padding: '30px', border: '1px solid #ddd', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' },
  inputGroup: { marginBottom: '15px' },
  input: { width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc' },
  button: { width: '100%', padding: '12px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '1rem' }
}

export default Login