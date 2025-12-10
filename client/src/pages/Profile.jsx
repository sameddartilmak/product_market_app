// client/src/pages/Profile.jsx
import { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'

function Profile() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [username, setUsername] = useState('Kullanıcı')

  // Token'dan bilgileri çekip API'ye istek atacağız
  useEffect(() => {
    fetchMyProducts()
  }, [])

  const fetchMyProducts = async () => {
    try {
      const token = localStorage.getItem('token')
      const config = { headers: { Authorization: `Bearer ${token}` } }

      // 1. Benim ürünlerimi çek
      const response = await axios.get('http://127.0.0.1:5000/api/products/my-products', config)
      setProducts(response.data)
      setLoading(false)
      
      // (İsteğe bağlı) Kullanıcı adını token'dan veya başka bir endpointten alabiliriz.
      // Şimdilik basitçe "Değerli Kullanıcımız" diyelim veya localStorage'da tuttuysak oradan alalım.
    } catch (error) {
      toast.error('Profil bilgileri yüklenemedi')
      setLoading(false)
    }
  }

  const handleDelete = async (productId) => {
    if (!window.confirm('Bu ürünü silmek istediğinize emin misiniz?')) return

    try {
      const token = localStorage.getItem('token')
      const config = { headers: { Authorization: `Bearer ${token}` } }

      await axios.delete(`http://127.0.0.1:5000/api/products/${productId}`, config)
      
      toast.success('Ürün silindi!')
      // Listeyi güncelle (Silinen ürünü ekrandan kaldır)
      setProducts(products.filter(p => p.id !== productId))
      
    } catch (error) {
      toast.error(error.response?.data?.message || 'Silme işlemi başarısız')
    }
  }

  if (loading) return <div style={{textAlign:'center', marginTop:'50px'}}>Yükleniyor...</div>

  return (
    <div style={{ maxWidth: '1000px', margin: '40px auto', padding: '20px' }}>
      
      {/* Profil Başlığı */}
      <div style={styles.header}>
        <h1>👤 Profilim</h1>
        <p>Eklediğiniz ilanları buradan yönetebilirsiniz.</p>
      </div>

      <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px' }}>İlanlarım ({products.length})</h2>

      {products.length === 0 ? (
        <p style={{ marginTop: '20px', color: '#666' }}>Henüz hiç ilan vermediniz.</p>
      ) : (
        <div style={styles.grid}>
          {products.map((product) => (
            <div key={product.id} style={styles.card}>
              <div style={styles.imageContainer}>
                {product.image_url ? (
                  <img src={product.image_url} alt={product.title} style={styles.image} />
                ) : (
                  <div style={styles.placeholder}>Resim Yok</div>
                )}
              </div>
              <div style={styles.cardBody}>
                <h4>{product.title}</h4>
                <p style={{ color: '#2ecc71', fontWeight: 'bold' }}>{product.price} TL</p>
                <div style={styles.actions}>
                    {/* Silme Butonu */}
                    <button 
                      onClick={() => handleDelete(product.id)}
                      style={styles.deleteButton}
                    >
                      Sil 🗑️
                    </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  header: {
    textAlign: 'center',
    marginBottom: '40px',
    backgroundColor: '#f8f9fa',
    padding: '30px',
    borderRadius: '10px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '20px',
    marginTop: '20px'
  },
  card: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: 'white'
  },
  imageContainer: {
    height: '120px',
    backgroundColor: '#eee',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  cardBody: {
    padding: '10px'
  },
  actions: {
    marginTop: '10px',
    display: 'flex',
    justifyContent: 'flex-end'
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    color: 'white',
    border: 'none',
    padding: '5px 10px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem'
  }
}

export default Profile