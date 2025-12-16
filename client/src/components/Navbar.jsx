// client/src/components/Navbar.jsx
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

function Navbar() {
  const navigate = useNavigate()
  
  // LocalStorage'dan bilgileri çekiyoruz
  const token = localStorage.getItem('token')
  const username = localStorage.getItem('username')
  const role = localStorage.getItem('role') // 'admin' veya 'customer'

  // Token varsa giriş yapılmış demektir
  const isLoggedIn = !!token

  const handleLogout = () => {
    localStorage.clear() // Tüm verileri (token, user, role) sil
    toast.info('Çıkış yapıldı 👋')
    navigate('/login')
    // Navbar'ın yenilenmesi için sayfayı reload ediyoruz
    window.location.reload()
  }

  return (
    <nav style={styles.navbar}>
      <div style={styles.container}>
        
        {/* Logo: Admin ise panele, Müşteri ise vitrine gider */}
        <Link to={role === 'admin' ? "/admin" : "/"} style={styles.brand}>
           {role === 'admin' ? '🛡️ Yönetim Paneli' : '📦 Kiralama App'}
        </Link>

        <div style={styles.navLinks}>
          {isLoggedIn ? (
            <>
              {/* --- ADMİN İSE GÖSTERİLECEKLER --- */}
              {role === 'admin' ? (
                <>
                  <span style={{color:'#ccc'}}>Hoşgeldin, Admin</span>
                  {/* Adminin Vitrin veya Profil butonuna ihtiyacı yok, her şey panelde */}
                </>
              ) : (
              /* --- MÜŞTERİ İSE GÖSTERİLECEKLER --- */
                <>
                  <Link to="/" style={styles.link}>Vitrin</Link>
                  <Link to="/profile" style={styles.link}>Profilim</Link>
                  <Link to="/messages" style={styles.link}>💬 Mesajlarım</Link>
                  <Link to="/add-product" style={styles.addButton}>+ İlan Ver</Link>
                  <div style={styles.userBadge}>
                    <span style={{fontWeight: 'bold'}}>{username}</span>
                  </div>
                </>
              )}

              {/* Herkes için Çıkış Butonu */}
              <button onClick={handleLogout} style={styles.logoutBtn}>Çıkış</button>
            </>
          ) : (
            <Link to="/login" style={styles.link}>Giriş Yap</Link>
          )}
        </div>
      </div>
    </nav>
  )
}
// CSS Stilleri (Javascript Objesi Olarak)
const styles = {
  navbar: {
    backgroundColor: '#1f2937', // Daha modern koyu gri
    color: '#fff',
    padding: '1rem 0',
    marginBottom: '2rem',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
  },
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  brand: {
    color: '#fff',
    fontSize: '1.5rem',
    fontWeight: 'bold',
    textDecoration: 'none',
    letterSpacing: '1px'
  },
  navLinks: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  link: {
    color: '#ecf0f1',
    textDecoration: 'none',
    fontSize: '1rem',
    transition: 'color 0.3s',
    cursor: 'pointer'
  },
  addButton: {
    backgroundColor: '#10b981', // Yeşil
    color: 'white',
    padding: '8px 16px',
    borderRadius: '20px',
    textDecoration: 'none',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    transition: 'transform 0.2s',
    display: 'inline-block'
  },
  userBadge: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end', // Sağa yasla
    lineHeight: '1.2',
    borderRight: '1px solid #4b5563', // Ayırıcı çizgi
    paddingRight: '15px',
    marginRight: '-5px'
  },
  roleTag: {
    fontSize: '0.75rem',
    color: '#9ca3af', // Açık gri
    textTransform: 'uppercase'
  },
  logoutBtn: {
    backgroundColor: '#ef4444', // Kırmızı
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    transition: 'background 0.3s'
  }
}

export default Navbar