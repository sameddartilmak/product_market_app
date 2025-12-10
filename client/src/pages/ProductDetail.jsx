// client/src/pages/ProductDetail.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom' // URL'deki ID'yi almak için
import axios from 'axios'
import { toast } from 'react-toastify'

function ProductDetail() {
  const { id } = useParams() // URL'den id'yi çek (örn: /product/5 -> id=5)
  const navigate = useNavigate()
  
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`http://127.0.0.1:5000/api/products/${id}`)
        setProduct(response.data)
        setLoading(false)
      } catch (error) {
        toast.error('Ürün bulunamadı veya silinmiş.')
        navigate('/') // Hata varsa ana sayfaya at
      }
    }
    fetchProduct()
  }, [id, navigate])

  if (loading) return <div style={{textAlign:'center', marginTop:'50px'}}>Yükleniyor...</div>

  if (!product) return null

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        
        {/* Sol Taraf: Resim */}
        <div style={styles.imageSection}>
          {product.image_url ? (
            <img src={product.image_url} alt={product.title} style={styles.image} />
          ) : (
            <div style={styles.placeholder}>Resim Yok</div>
          )}
        </div>

        {/* Sağ Taraf: Bilgiler */}
        <div style={styles.infoSection}>
          <span style={styles.category}>{product.category.toUpperCase()}</span>
          <h1 style={styles.title}>{product.title}</h1>
          <p style={styles.price}>{product.price} TL</p>
          
          <div style={styles.divider}></div>
          
          <h3>Açıklama</h3>
          <p style={styles.description}>{product.description || 'Açıklama belirtilmemiş.'}</p>
          
          <div style={styles.ownerInfo}>
            <p><strong>Satıcı:</strong> {product.owner?.username}</p>
            <p><strong>Durum:</strong> {product.status === 'available' ? '🟢 Müsait' : '🔴 Kirada'}</p>
          </div>

          {/* Aksiyon Butonları */}
          <div style={styles.buttonGroup}>
            <button style={styles.rentButton}>Kirala / Satın Al</button>
            <button style={styles.messageButton}>Satıcıya Mesaj At</button>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    maxWidth: '1000px',
    margin: '40px auto',
    padding: '0 20px',
  },
  card: {
    display: 'flex',
    flexWrap: 'wrap', // Mobilde alt alta geçsin
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
    overflow: 'hidden',
    minHeight: '500px'
  },
  imageSection: {
    flex: '1',
    minWidth: '300px',
    backgroundColor: '#f8f9fa',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRight: '1px solid #eee'
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    maxHeight: '500px'
  },
  infoSection: {
    flex: '1',
    padding: '40px',
    minWidth: '300px'
  },
  category: {
    backgroundColor: '#e0f7fa',
    color: '#006064',
    padding: '5px 10px',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: 'bold'
  },
  title: {
    marginTop: '15px',
    fontSize: '2rem',
    color: '#333'
  },
  price: {
    fontSize: '1.8rem',
    color: '#2ecc71',
    fontWeight: 'bold',
    margin: '10px 0'
  },
  divider: {
    height: '1px',
    backgroundColor: '#eee',
    margin: '20px 0'
  },
  description: {
    lineHeight: '1.6',
    color: '#555',
    marginBottom: '30px'
  },
  ownerInfo: {
    backgroundColor: '#f9f9f9',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '0.9rem'
  },
  buttonGroup: {
    display: 'flex',
    gap: '15px'
  },
  rentButton: {
    flex: 1,
    padding: '15px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1rem',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  messageButton: {
    flex: 1,
    padding: '15px',
    backgroundColor: 'white',
    color: '#3498db',
    border: '2px solid #3498db',
    borderRadius: '8px',
    fontSize: '1rem',
    cursor: 'pointer',
    fontWeight: 'bold'
  }
}

export default ProductDetail