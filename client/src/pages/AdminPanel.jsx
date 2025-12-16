// client/src/pages/AdminPanel.jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'

function AdminPanel() {
  const navigate = useNavigate()
  
  // Hangi sekmedeyiz?
  const [activeTab, setActiveTab] = useState('dashboard') // dashboard, users, products, transactions
  
  // Veriler
  const [stats, setStats] = useState({ users: 0, products: 0, income: 0 })
  const [dataList, setDataList] = useState({ users: [], products: [], transactions: [] })
  const [loading, setLoading] = useState(true)

  const token = localStorage.getItem('token')

  useEffect(() => {
    // Admin değilse at
    if (localStorage.getItem('role') !== 'admin') {
        navigate('/')
        return
    }
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
        // İstatistikleri Çek
        const resStats = await axios.get('http://127.0.0.1:5000/api/admin/stats', { headers: { Authorization: `Bearer ${token}` }})
        setStats(resStats.data)

        // Tablo Verilerini Çek
        const resData = await axios.get('http://127.0.0.1:5000/api/admin/all-data', { headers: { Authorization: `Bearer ${token}` }})
        setDataList(resData.data)
        
        setLoading(false)
    } catch (error) {
        toast.error('Veriler yüklenemedi.')
    }
  }

  // --- SİLME İŞLEMLERİ ---
  const handleDelete = async (type, id) => {
    if (!window.confirm("Bu kaydı silmek istediğinize emin misiniz?")) return;

    try {
        await axios.delete(`http://127.0.0.1:5000/api/admin/delete-${type}/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        toast.success("Kayıt silindi.")
        fetchAllData() // Tabloyu yenile
    } catch (error) {
        toast.error("Silme başarısız.")
    }
  }

  if (loading) return <div style={{textAlign:'center', marginTop:'50px'}}>Yönetici Paneli Yükleniyor...</div>

  return (
    <div style={styles.wrapper}>
      
      {/* SOL MENÜ (SIDEBAR) */}
      <div style={styles.sidebar}>
        <h3 style={{color:'white', textAlign:'center', marginBottom:'30px'}}>YÖNETİM</h3>
        <button style={activeTab === 'dashboard' ? styles.activeMenu : styles.menuItem} onClick={() => setActiveTab('dashboard')}>📊 Gösterge Paneli</button>
        <button style={activeTab === 'users' ? styles.activeMenu : styles.menuItem} onClick={() => setActiveTab('users')}>👥 Kullanıcılar</button>
        <button style={activeTab === 'products' ? styles.activeMenu : styles.menuItem} onClick={() => setActiveTab('products')}>📦 Ürünler</button>
        <button style={activeTab === 'transactions' ? styles.activeMenu : styles.menuItem} onClick={() => setActiveTab('transactions')}>💰 İşlemler</button>
      </div>

      {/* SAĞ İÇERİK (CONTENT) */}
      <div style={styles.content}>
        
        {/* --- 1. DASHBOARD --- */}
        {activeTab === 'dashboard' && (
            <div>
                <h2>Genel Durum</h2>
                <div style={styles.statsGrid}>
                    <div style={{...styles.card, borderLeft:'5px solid #3498db'}}>
                        <h3>Kullanıcılar</h3>
                        <h1>{stats.users}</h1>
                    </div>
                    <div style={{...styles.card, borderLeft:'5px solid #2ecc71'}}>
                        <h3>Ürünler</h3>
                        <h1>{stats.products}</h1>
                    </div>
                    <div style={{...styles.card, borderLeft:'5px solid #9b59b6'}}>
                        <h3>Ciro (%3)</h3>
                        <h1 style={{color:'#9b59b6'}}>{stats.income} TL</h1>
                    </div>
                </div>
            </div>
        )}

        {/* --- 2. KULLANICILAR TABLOSU --- */}
        {activeTab === 'users' && (
            <div>
                <h2>Kullanıcı Yönetimi</h2>
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.th}>
                            <th>ID</th><th>Kullanıcı Adı</th><th>Email</th><th>Rol</th><th>İşlem</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dataList.users.map(u => (
                            <tr key={u.id} style={styles.tr}>
                                <td>{u.id}</td>
                                <td>{u.username}</td>
                                <td>{u.email}</td>
                                <td>{u.role}</td>
                                <td>
                                    {u.role !== 'admin' && (
                                        <button onClick={() => handleDelete('user', u.id)} style={styles.delBtn}>Sil</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {/* --- 3. ÜRÜNLER TABLOSU --- */}
        {activeTab === 'products' && (
            <div>
                <h2>Ürün Yönetimi</h2>
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.th}>
                            <th>ID</th><th>Ürün</th><th>Fiyat</th><th>Satıcı</th><th>Durum</th><th>İşlem</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dataList.products.map(p => (
                            <tr key={p.id} style={styles.tr}>
                                <td>{p.id}</td>
                                <td>{p.title}</td>
                                <td>{p.price} TL</td>
                                <td>{p.owner}</td>
                                <td>{p.status}</td>
                                <td>
                                    <button onClick={() => handleDelete('product', p.id)} style={styles.delBtn}>İlanı Kaldır</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {/* --- 4. İŞLEMLER TABLOSU --- */}
        {activeTab === 'transactions' && (
            <div>
                <h2>İşlem Geçmişi</h2>
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.th}>
                            <th>ID</th><th>Ürün</th><th>Alıcı</th><th>Satıcı</th><th>Tutar</th><th>Tür</th><th>İşlem</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dataList.transactions.map(t => (
                            <tr key={t.id} style={styles.tr}>
                                <td>{t.id}</td>
                                <td>{t.product}</td>
                                <td>{t.buyer}</td>
                                <td>{t.seller}</td>
                                <td>{t.price} TL</td>
                                <td>{t.type}</td>
                                <td>
                                    <button onClick={() => handleDelete('transaction', t.id)} style={styles.delBtn}>İptal Et</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

      </div>
    </div>
  )
}

const styles = {
  wrapper: { display: 'flex', minHeight: '100vh', backgroundColor: '#f4f6f9' },
  sidebar: { width: '250px', backgroundColor: '#34495e', color: 'white', padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' },
  content: { flex: 1, padding: '40px' },
  
  menuItem: { padding: '15px', backgroundColor: 'transparent', border: 'none', color: '#bdc3c7', textAlign: 'left', cursor: 'pointer', fontSize: '1rem' },
  activeMenu: { padding: '15px', backgroundColor: '#2c3e50', border: 'none', color: 'white', textAlign: 'left', cursor: 'pointer', fontSize: '1rem', borderLeft: '4px solid #3498db' },
  
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop:'20px' },
  card: { backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', textAlign: 'center' },
  
  table: { width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', marginTop: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' },
  th: { backgroundColor: '#ecf0f1', textAlign: 'left', padding: '15px', borderBottom: '2px solid #bdc3c7' },
  tr: { borderBottom: '1px solid #eee' },
  delBtn: { backgroundColor: '#e74c3c', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }
}

// Tablo hücreleri (td) için global stil eklemek yerine JSX içinde inline style zor olduğu için basit tuttum.
// React'ta global CSS veya styled-component daha iyidir ama bu iş görür.

export default AdminPanel