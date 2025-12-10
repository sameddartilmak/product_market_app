import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

function Navbar() {
  const navigate = useNavigate()
  const isLoggedIn = !!localStorage.getItem('token')

  const handleLogout = () => {
    localStorage.removeItem('token')
    toast.info('Çıkış yapıldı 👋')
    navigate('/login')
    window.location.reload()
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="nav-brand">
          📦 Kiralama App
        </Link>

        {/* Linkler */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {isLoggedIn ? (
            <>
              <Link to="/" className="nav-link">Ana Sayfa</Link>
              <Link to="/profile" className="nav-link">Profilim</Link>
              
              {/* Özel Buton */}
              <Link to="/add-product" className="btn btn-success" style={{ marginLeft: '20px', textDecoration:'none' }}>
                + İlan Ver
              </Link>
              
              <button onClick={handleLogout} className="btn btn-danger" style={{ marginLeft: '15px' }}>
                Çıkış
              </button>
            </>
          ) : (
            <Link to="/login" className="nav-link">Giriş Yap</Link>
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