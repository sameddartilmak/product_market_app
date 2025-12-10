// client/src/components/Navbar.jsx
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'


function Navbar() {
  const navigate = useNavigate()
  
  // Basit kontrol: Token varsa giriş yapılmıştır
  const isLoggedIn = !!localStorage.getItem('token')

  const handleLogout = () => {
    // 1. Kimliği (Token) sil
    localStorage.removeItem('token')
    
    // 2. Bilgi ver
    toast.info('Çıkış yapıldı 👋')
    
    // 3. Giriş sayfasına yönlendir
    navigate('/login')
    
    // 4. Sayfayı yenile (Navbar'ın güncellenmesi için en basit yol)
    window.location.reload()
  }

  return (
    <nav style={styles.navbar}>
      <div style={styles.container}>
        {/* Logo Sol Tarafta */}
        <Link to="/" style={styles.brand}>
          📦 Kiralama App
        </Link>

        {/* Linkler Sağ Tarafta */}
        <div style={styles.navLinks}>
          {isLoggedIn ? (
            <>
              <Link to="/" style={styles.link}>Ana Sayfa</Link>
              
              {/* Dikkat Çeken İlan Ver Butonu */}
              <Link to="/add-product" style={styles.addButton}>
                + İlan Ver
              </Link>
              <Link to="/profile" style={styles.link}>Profilim</Link>
              <button onClick={handleLogout} style={styles.logoutBtn}>
                Çıkış Yap
              </button>
            </>
          ) : (
            <Link to="/login" style={styles.link}>Giriş Yap</Link>
          )}
        </div>
      </div>
    </nav>
  )
}

// CSS Stilleri (CSS dosyasıyla uğraşmamak için burada yazdık)
const styles = {
  navbar: {
    backgroundColor: '#333',
    color: '#fff',
    padding: '1rem 0',
    marginBottom: '2rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
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
    textDecoration: 'none'
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
    transition: 'color 0.3s'
  },
  addButton: {
    backgroundColor: '#2ecc71', // Yeşil renk
    color: 'white',
    padding: '8px 16px',
    borderRadius: '20px',
    textDecoration: 'none',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    transition: 'transform 0.2s'
  },
  logoutBtn: {
    backgroundColor: '#e74c3c', // Kırmızı renk
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem'
  }
}

export default Navbar