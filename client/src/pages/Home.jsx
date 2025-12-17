// client/src/pages/Home.jsx
import { useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

function Home() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:5000/api/products')
      
      // --- DEBUG İÇİN KONSOLA YAZDIRIYORUZ ---
      console.log("Backend'den Gelen Veri:", response.data) 

      // Veri formatını otomatik algıla ve hatayı önle
      if (Array.isArray(response.data)) {
        // Eğer direkt liste geldiyse (Beklediğimiz bu)
        setProducts(response.data)
      } else if (response.data.products && Array.isArray(response.data.products)) {
        // Eğer { products: [...] } şeklinde paketlenmiş geldiyse
        setProducts(response.data.products)
      } else if (response.data.data && Array.isArray(response.data.data)) {
         // Eğer { data: [...] } şeklinde geldiyse
         setProducts(response.data.data)
      } else {
        console.error("Beklenmedik veri formatı:", response.data)
        setProducts([]) 
      }
      
      setLoading(false)
    } catch (error) {
      console.error("Hata Detayı:", error)
      toast.error('Ürünler yüklenirken hata oluştu')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px', color: 'white' }}>
        <h2>Yükleniyor...</h2>
      </div>
    )
  }

  return (
    <div>
      <h1 style={{ marginBottom: '30px', color: '#1f2937' }}>Vitrin</h1>

      {products.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <h3>⚠️ Ürün listesi boş veya yüklenemedi.</h3>
        </div>
      ) : (
        <div className="card-grid">
          {products.map((product) => (
            
            <div 
              key={product.id} 
              className="product-card"
              onClick={() => navigate(`/product/${product.id}`)}
              style={{ cursor: 'pointer', position: 'relative' }} 
            >
              <div className="card-image-container">
                {product.image_url ? (
                  <img src={product.image_url} alt={product.title} className="card-image" />
                ) : (
                  <span>Resim Yok</span>
                )}
              </div>

              <div className="card-content">
                <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>{product.title}</h3>
                <p style={{ color: '#6b7280', fontSize: '0.9rem', marginBottom: '15px', flex: 1 }}>
                  {product.description ? product.description.substring(0, 60) + '...' : '...'}
                </p>
                
                {/* BUTON KALDIRILDI, SADECE FİYAT KALDI */}
                <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid #eee' }}>
                  <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#10b981' }}>
                    {product.price} TL
                  </span>
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
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '20px'
  },
  card: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    backgroundColor: 'white'
  },
  imageContainer: {
    height: '150px',
    backgroundColor: '#f4f4f4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  placeholder: {
    color: '#999',
    fontWeight: 'bold'
  },
  cardBody: {
    padding: '15px'
  },
  title: {
    margin: '0 0 10px 0',
    fontSize: '1.1rem',
    color: '#333'
  },
  description: {
    fontSize: '0.9rem',
    color: '#666',
    marginBottom: '15px',
    height: '40px'
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  price: {
    fontWeight: 'bold',
    color: '#2ecc71',
    fontSize: '1.2rem'
  },
  button: {
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    padding: '5px 15px',
    borderRadius: '4px',
    cursor: 'pointer'
  }
}

export default Home