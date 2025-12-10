import { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

function Profile() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchMyProducts()
  }, [])

  const fetchMyProducts = async () => {
    try {
      const token = localStorage.getItem('token')
      // Token yoksa direkt login'e at
      if (!token) {
        navigate('/login')
        return
      }

      const config = { headers: { Authorization: `Bearer ${token}` } }

      const response = await axios.get('http://127.0.0.1:5000/api/products/my-products', config)
      setProducts(response.data)
      setLoading(false)
    } catch (error) {
      console.error(error)
      // Eğer 401 hatası alırsak (Token bitmişse) çıkış yaptır
      if (error.response && error.response.status === 401) {
        toast.error('Oturum süreniz doldu, lütfen tekrar giriş yapın.')
        localStorage.removeItem('token')
        navigate('/login')
      } else {
        toast.error('Profil bilgileri yüklenemedi')
      }
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
      setProducts(products.filter(p => p.id !== productId))
    } catch (error) {
      toast.error('Silme işlemi başarısız')
    }
  }

  if (loading) return <div style={{textAlign:'center', marginTop:'50px'}}>Yükleniyor...</div>

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: '40px', padding: '30px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
        <h1 style={{ color: '#4f46e5' }}>👤 Profilim</h1>
        <p style={{ color: '#6b7280' }}>Hoş geldin! İlanlarını buradan yönetebilirsin.</p>
      </div>

      <h3 style={{ marginBottom: '20px', borderBottom: '2px solid #e5e7eb', paddingBottom: '10px' }}>
        Yayındaki İlanlarım ({products.length})
      </h3>

      {products.length === 0 ? (
        <p style={{ color: '#666' }}>Henüz hiç ilan vermediniz.</p>
      ) : (
        // Yeni CSS Grid Yapısı
        <div className="card-grid">
          {products.map((product) => (
            <div key={product.id} className="product-card">
              <div className="card-image-container" style={{ height: '150px' }}>
                {product.image_url ? (
                  <img src={product.image_url} alt={product.title} className="card-image" />
                ) : (
                  <span>Resim Yok</span>
                )}
              </div>
              <div className="card-content">
                <h4 style={{ marginBottom: '5px' }}>{product.title}</h4>
                <p style={{ color: '#10b981', fontWeight: 'bold', marginBottom: '10px' }}>{product.price} TL</p>
                
                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'flex-end' }}>
                    <button 
                      onClick={() => handleDelete(product.id)}
                      className="btn btn-danger"
                      style={{ padding: '5px 15px', fontSize: '0.9rem' }}
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