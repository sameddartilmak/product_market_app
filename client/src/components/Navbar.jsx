// client/src/components/Navbar.jsx
import { Link } from 'react-router-dom'
import { useContext } from 'react'
import { AuthContext } from '../context/AuthContext'

function Navbar() {
  // Verileri artık direkt LocalStorage'dan değil, Context'ten alıyoruz.
  // Bu sayede profil resmi değişince burası da anında değişiyor.
  const { user, logout } = useContext(AuthContext)

  return (
    <nav style={styles.navbar}>
      <div style={styles.container}>
        
        {/* LOGO: Admin ise panele, Müşteri ise vitrine gider */}
        <Link to={user?.role === 'admin' ? "/admin" : "/"} style={styles.brand}>
           {user?.role === 'admin' ? '🛡️ Yönetim Paneli' : '📦 Kiralama App'}
        </Link>

        <div style={styles.navLinks}>
          {user ? (
            <>
              {/* --- ADMİN GÖRÜNÜMÜ --- */}
              {user.role === 'admin' ? (
                <>
                  <span style={{color:'#ccc'}}>Hoşgeldin, Admin</span>
                </>
              ) : (
                /* --- MÜŞTERİ GÖRÜNÜMÜ --- */
                <>
                  <Link to="/" style={styles.link}>Vitrin</Link>
                  <Link to="/messages" style={styles.link}>💬 Mesajlar</Link>
                  <Link to="/add-product" style={styles.addButton}>+ İlan Ver</Link>
                  
                  {/* --- PROFİL ALANI (RESİM + İSİM) --- */}
                  <Link to="/profile" style={styles.profileBadge}>
                    <img 
                        src={user.profile_image || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} 
                        alt="Profil" 
                        style={styles.avatar} 
                    />
                    <div style={styles.userInfo}>
                        <span style={styles.username}>{user.username}</span>
                        <span style={styles.roleTag}>Müşteri</span>
                    </div>
                  </Link>
                  {/* ---------------------------------- */}
                </>
              )}

              {/* ÇIKIŞ BUTONU */}
              <button onClick={logout} style={styles.logoutBtn}>Çıkış</button>
            </>
          ) : (
            /* --- GİRİŞ YAPMAMIŞ KULLANICI --- */
            <Link to="/login" style={styles.link}>Giriş Yap</Link>
          )}
        </div>
      </div>
    </nav>
  )
}

// CSS Stilleri
const styles = {
  navbar: {
    backgroundColor: '#1f2937', // Koyu gri (Modern)
    color: '#fff',
    padding: '0.8rem 0', // Biraz incelttik
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
  },
  
  // --- YENİ EKLENEN PROFİL STİLLERİ ---
  profileBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    textDecoration: 'none',
    backgroundColor: 'rgba(255,255,255,0.1)', // Hafif transparan arka plan
    padding: '5px 12px',
    borderRadius: '30px',
    transition: 'background 0.3s',
    border: '1px solid rgba(255,255,255,0.2)'
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #10b981' // Yeşil çerçeve
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    lineHeight: '1.1'
  },
  username: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: '0.9rem'
  },
  roleTag: {
    fontSize: '0.7rem',
    color: '#9ca3af', // Açık gri
    textTransform: 'uppercase'
  },
  // ------------------------------------

  logoutBtn: {
    backgroundColor: '#ef4444', // Kırmızı
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    transition: 'background 0.3s',
    marginLeft: '10px'
  }
}

export default Navbar