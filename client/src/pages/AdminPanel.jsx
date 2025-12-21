import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axiosClient from '../api/axiosClient'; // axiosClient kullanıyoruz
import { toast } from 'react-toastify'

function AdminPanel() {
  const navigate = useNavigate()
  
  const [activeTab, setActiveTab] = useState('dashboard') 
  
  const [stats, setStats] = useState({ users: 0, products: 0, income: 0 })
  // dataList başlangıçta boş array olmalı ki map ederken hata vermesin
  const [dataList, setDataList] = useState({ users: [], products: [], transactions: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // sessionStorage kullanıyoruz (Login yapını buna çevirmiştik)
    const role = sessionStorage.getItem('role');
    
    if (role !== 'admin') {
        toast.error("Yetkisiz giriş denemesi.");
        navigate('/')
        return
    }
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    setLoading(true);
    try {
        // 1. İstatistikleri çek
        const resStats = await axiosClient.get('/admin/stats')
        setStats(resStats.data)

        // 2. Tablo verilerini çek (Eğer backend'de bu endpoint hazırsa)
        try {
            const resData = await axiosClient.get('/admin/all-data')
            if(resData.data) {
                setDataList(resData.data)
            }
        } catch (err) {
            console.log("Tablo verileri çekilemedi (Endpoint eksik olabilir).");
        }
        
    } catch (error) {
        console.error(error);
        toast.error('Admin verileri yüklenemedi.')
    } finally {
        setLoading(false)
    }
  }

  const handleDelete = async (type, id) => {
    if (!window.confirm("Bu kaydı silmek istediğinize emin misiniz?")) return;

    try {
        await axiosClient.delete(`/admin/delete-${type}/${id}`)
        toast.success("Kayıt silindi.")
        fetchAllData() 
    } catch (error) {
        toast.error("Silme başarısız.")
    }
  }

  if (loading) return (
    <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', backgroundColor:'#f3f4f6', color:'#4f46e5'}}>
        <h3>Yönetici Paneli Yükleniyor...</h3>
    </div>
  )

  // --- TASARIM KISMI ---
  return (
    <div style={styles.wrapper}>
      
      {/* SOL MENÜ (SIDEBAR) */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
            <h2 style={styles.brand}>YÖNETİCİ</h2>
            <p style={styles.roleBadge}>Admin Paneli</p>
        </div>
        
        <nav style={styles.nav}>
            <button 
                style={activeTab === 'dashboard' ? styles.activeMenu : styles.menuItem} 
                onClick={() => setActiveTab('dashboard')}
            >
                📊 Gösterge Paneli
            </button>
            <button 
                style={activeTab === 'users' ? styles.activeMenu : styles.menuItem} 
                onClick={() => setActiveTab('users')}
            >
                👥 Kullanıcılar
            </button>
            <button 
                style={activeTab === 'products' ? styles.activeMenu : styles.menuItem} 
                onClick={() => setActiveTab('products')}
            >
                📦 Ürünler
            </button>
            <button 
                style={activeTab === 'transactions' ? styles.activeMenu : styles.menuItem} 
                onClick={() => setActiveTab('transactions')}
            >
                💰 İşlemler
            </button>
        </nav>

        <div style={styles.sidebarFooter}>
            <button onClick={() => navigate('/')} style={styles.exitBtn}>Siteye Dön ↩</button>
        </div>
      </div>

      {/* SAĞ İÇERİK (CONTENT) */}
      <div style={styles.content}>
        
        {/* Başlık Alanı */}
        <div style={styles.topBar}>
            <h1 style={styles.pageTitle}>
                {activeTab === 'dashboard' && 'Genel Bakış'}
                {activeTab === 'users' && 'Kullanıcı Listesi'}
                {activeTab === 'products' && 'Ürün Envanteri'}
                {activeTab === 'transactions' && 'Finansal İşlemler'}
            </h1>
            <div style={styles.userProfile}>Admin</div>
        </div>

        {/* --- 1. DASHBOARD --- */}
        {activeTab === 'dashboard' && (
            <div style={styles.dashboardContainer}>
                <div style={styles.statsGrid}>
                    {/* Kullanıcı Kartı */}
                    <div style={styles.card}>
                        <div style={{...styles.iconBox, backgroundColor:'#e0e7ff', color:'#4338ca'}}>👥</div>
                        <div>
                            <p style={styles.cardLabel}>Toplam Kullanıcı</p>
                            <h2 style={styles.cardValue}>{stats.users || 0}</h2>
                        </div>
                    </div>

                    {/* Ürün Kartı */}
                    <div style={styles.card}>
                        <div style={{...styles.iconBox, backgroundColor:'#d1fae5', color:'#065f46'}}>📦</div>
                        <div>
                            <p style={styles.cardLabel}>Aktif Ürünler</p>
                            <h2 style={styles.cardValue}>{stats.products || 0}</h2>
                        </div>
                    </div>

                    {/* Ciro Kartı */}
                    <div style={styles.card}>
                        <div style={{...styles.iconBox, backgroundColor:'#fae8ff', color:'#86198f'}}>💰</div>
                        <div>
                            <p style={styles.cardLabel}>Toplam Ciro (%3)</p>
                            <h2 style={styles.cardValue}>{stats.income || 0} TL</h2>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- 2. KULLANICILAR TABLOSU --- */}
        {activeTab === 'users' && (
            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.theadRow}>
                            <th style={styles.th}>ID</th>
                            <th style={styles.th}>Kullanıcı Adı</th>
                            <th style={styles.th}>Email</th>
                            <th style={styles.th}>Rol</th>
                            <th style={styles.th}>İşlem</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dataList.users && dataList.users.length > 0 ? dataList.users.map(u => (
                            <tr key={u.id} style={styles.tr}>
                                <td style={styles.td}>#{u.id}</td>
                                <td style={styles.td}>
                                    <span style={{fontWeight:'600', color:'#111827'}}>{u.username}</span>
                                </td>
                                <td style={styles.td}>{u.email}</td>
                                <td style={styles.td}>
                                    <span style={u.role === 'admin' ? styles.badgeAdmin : styles.badgeUser}>{u.role}</span>
                                </td>
                                <td style={styles.td}>
                                    {u.role !== 'admin' && (
                                        <button onClick={() => handleDelete('user', u.id)} style={styles.delBtn}>Sil</button>
                                    )}
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="5" style={{padding:'20px', textAlign:'center'}}>Kullanıcı bulunamadı.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        )}

        {/* --- 3. ÜRÜNLER TABLOSU --- */}
        {activeTab === 'products' && (
            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.theadRow}>
                            <th style={styles.th}>ID</th>
                            <th style={styles.th}>Ürün</th>
                            <th style={styles.th}>Fiyat</th>
                            <th style={styles.th}>Satıcı</th>
                            <th style={styles.th}>Durum</th>
                            <th style={styles.th}>İşlem</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dataList.products && dataList.products.length > 0 ? dataList.products.map(p => (
                            <tr key={p.id} style={styles.tr}>
                                <td style={styles.td}>#{p.id}</td>
                                <td style={styles.td}>
                                    <span style={{fontWeight:'600'}}>{p.title}</span>
                                </td>
                                <td style={styles.td}>{p.price} TL</td>
                                <td style={styles.td}>{p.owner}</td>
                                <td style={styles.td}>
                                    <span style={p.status === 'active' ? styles.badgeSuccess : styles.badgeWarning}>{p.status}</span>
                                </td>
                                <td style={styles.td}>
                                    <button onClick={() => handleDelete('product', p.id)} style={styles.delBtn}>İlanı Kaldır</button>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="6" style={{padding:'20px', textAlign:'center'}}>Ürün bulunamadı.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        )}

        {/* --- 4. İŞLEMLER TABLOSU --- */}
        {activeTab === 'transactions' && (
            <div style={styles.tableContainer}>
                <table style={styles.table}>
                    <thead>
                        <tr style={styles.theadRow}>
                            <th style={styles.th}>ID</th>
                            <th style={styles.th}>Ürün</th>
                            <th style={styles.th}>Alıcı</th>
                            <th style={styles.th}>Satıcı</th>
                            <th style={styles.th}>Tutar</th>
                            <th style={styles.th}>Tür</th>
                            <th style={styles.th}>İşlem</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dataList.transactions && dataList.transactions.length > 0 ? dataList.transactions.map(t => (
                            <tr key={t.id} style={styles.tr}>
                                <td style={styles.td}>#{t.id}</td>
                                <td style={styles.td}>{t.product}</td>
                                <td style={styles.td}>{t.buyer}</td>
                                <td style={styles.td}>{t.seller}</td>
                                <td style={{...styles.td, color:'#059669', fontWeight:'bold'}}>{t.price} TL</td>
                                <td style={styles.td}>
                                    <span style={styles.badgeInfo}>{t.type}</span>
                                </td>
                                <td style={styles.td}>
                                    <button onClick={() => handleDelete('transaction', t.id)} style={styles.delBtn}>İptal Et</button>
                                </td>
                            </tr>
                        )) : (
                            <tr><td colSpan="7" style={{padding:'20px', textAlign:'center'}}>İşlem bulunamadı.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        )}

      </div>
    </div>
  )
}

// --- MODERN CSS STYLES ---
const styles = {
  wrapper: { display: 'flex', minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: '"Segoe UI", sans-serif' },
  sidebar: { width: '280px', backgroundColor: '#111827', color: '#e5e7eb', display: 'flex', flexDirection: 'column', position: 'fixed', height: '100%', left: 0, top: 0 },
  sidebarHeader: { padding: '30px 20px', borderBottom: '1px solid #1f2937', textAlign: 'center' },
  brand: { margin: 0, fontSize: '1.5rem', fontWeight: '800', letterSpacing: '1px', color: 'white' },
  roleBadge: { fontSize: '0.8rem', color: '#9ca3af', marginTop: '5px', textTransform: 'uppercase', letterSpacing: '2px' },
  nav: { flex: 1, padding: '20px 10px', display: 'flex', flexDirection: 'column', gap: '5px' },
  sidebarFooter: { padding: '20px', borderTop: '1px solid #1f2937' },
  exitBtn: { width: '100%', padding: '10px', backgroundColor: '#374151', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', transition: '0.2s' },
  menuItem: { padding: '14px 20px', backgroundColor: 'transparent', border: 'none', color: '#9ca3af', textAlign: 'left', cursor: 'pointer', fontSize: '0.95rem', borderRadius: '8px', transition: 'all 0.2s', fontWeight: '500' },
  activeMenu: { padding: '14px 20px', backgroundColor: '#4f46e5', border: 'none', color: 'white', textAlign: 'left', cursor: 'pointer', fontSize: '0.95rem', borderRadius: '8px', fontWeight: '600', boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.4)' },
  content: { flex: 1, padding: '40px', marginLeft: '280px' }, 
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' },
  pageTitle: { fontSize: '2rem', fontWeight: 'bold', color: '#111827', margin: 0 },
  userProfile: { backgroundColor: 'white', padding: '8px 20px', borderRadius: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', fontWeight: '600', color: '#374151' },
  statsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '30px' },
  card: { backgroundColor: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', display: 'flex', alignItems: 'center', gap: '20px' },
  iconBox: { width: '60px', height: '60px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem' },
  cardLabel: { margin: 0, color: '#6b7280', fontSize: '0.9rem', fontWeight: '600' },
  cardValue: { margin: '5px 0 0 0', fontSize: '2rem', fontWeight: '800', color: '#111827' },
  tableContainer: { backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  theadRow: { backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' },
  th: { padding: '16px 24px', fontSize: '0.75rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' },
  tr: { borderBottom: '1px solid #f3f4f6', transition: 'background 0.2s' },
  td: { padding: '16px 24px', fontSize: '0.95rem', color: '#4b5563' },
  delBtn: { backgroundColor: '#fee2e2', color: '#ef4444', border: '1px solid #fecaca', padding: '6px 14px', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', transition: '0.2s' },
  badgeAdmin: { backgroundColor: '#e0e7ff', color: '#4338ca', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' },
  badgeUser: { backgroundColor: '#f3f4f6', color: '#4b5563', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600' },
  badgeSuccess: { backgroundColor: '#d1fae5', color: '#065f46', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' },
  badgeWarning: { backgroundColor: '#fef3c7', color: '#92400e', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' },
  badgeInfo: { backgroundColor: '#dbeafe', color: '#1e40af', padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' }
}

export default AdminPanel