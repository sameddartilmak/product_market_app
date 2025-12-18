// client/src/pages/Login.jsx
import { useState, useContext } from 'react'
import axios from 'axios'
import { AuthContext } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-toastify'

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  
  const { login } = useContext(AuthContext)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      // API'ye istek atıyoruz
      const res = await axios.post('http://127.0.0.1:5000/api/auth/login', {
        username: username,
        password: password
      })

      // --- DEDEKTİF MODU BAŞLANGIÇ ---
      console.log("🔴 1. SUNUCUDAN GELEN TÜM VERİ:", res.data);
      
      if (!res.data.user) {
          console.error("⛔ HATA: Sunucu 'user' objesini göndermedi! Sadece token geldi.");
          toast.error("Sunucu hatası: Kullanıcı bilgisi alınamadı.");
          return; // İşlemi durdur
      }

      console.log("🔴 2. KULLANICI ROLÜ:", res.data.user.role);
      // -------------------------------

      if (res.data.access_token) {
          // Güvenli rol temizliği (Boşluk silme ve küçük harf yapma)
          const serverRole = res.data.user.role || "";
          const safeRole = serverRole.toString().trim().toLowerCase();

          console.log("🔴 3. İŞLENMİŞ ROL:", safeRole);
          localStorage.setItem('role', safeRole);

          // Context'i güncelle
          login(res.data.user, res.data.access_token)
          toast.success(`Hoşgeldin ${res.data.user.username}!`)
          
          // YÖNLENDİRME KARARI
          if (safeRole === 'admin') {
            console.log("✅ Admin tespit edildi -> /admin rotasına gidiliyor.");
            navigate('/admin');
          } else {
            console.log("✅ Müşteri tespit edildi -> Ana sayfaya gidiliyor.");
            navigate('/'); 
          }
      }

    } catch (error) {
      console.error("Giriş Hatası:", error);
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

        {/* --- KAYIT OL BÖLÜMÜ --- */}
        <div style={styles.registerContainer}>
            <p>
                Hesabınız yok mu? <br />
                <Link to="/register" style={styles.registerLink}>
                    Hemen Kayıt Olun ✨
                </Link>
            </p>
        </div>
        {/* ----------------------- */}

      </div>
    </div>
  )
}

const styles = {
  container: { display: 'flex', justifyContent: 'center', marginTop: '50px' },
  card: { width: '400px', padding: '30px', border: '1px solid #ddd', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', backgroundColor: 'white' },
  inputGroup: { marginBottom: '15px' },
  input: { width: '100%', padding: '10px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc' },
  button: { width: '100%', padding: '12px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '1rem' },
  
  registerContainer: { marginTop: '20px', textAlign: 'center', fontSize: '0.95rem', color: '#666', borderTop: '1px solid #eee', paddingTop: '15px' },
  registerLink: { color: '#3498db', fontWeight: 'bold', textDecoration: 'none', marginLeft: '5px' }
}

export default Login