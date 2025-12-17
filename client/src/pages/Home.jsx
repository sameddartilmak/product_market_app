// client/src/pages/Home.jsx
import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'

function Home() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchProducts = async (query = '') => {
    setLoading(true)
    try {
      const url = query 
        ? `http://127.0.0.1:5000/api/products/?search=${query}` 
        : 'http://127.0.0.1:5000/api/products/'
        
      const res = await axios.get(url)
      setProducts(res.data)
    } catch (error) {
      toast.error('Ürünler yüklenirken hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchProducts(searchTerm)
  }

  const clearSearch = () => {
    setSearchTerm('')
    fetchProducts('')
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      
      {/* ARAMA ALANI */}
      <div style={styles.searchContainer}>
        <form onSubmit={handleSearch} style={{ display: 'flex', width: '100%', maxWidth: '600px', gap: '10px' }}>
            <input 
                type="text" 
                placeholder="Ne aramıştınız? (Örn: iPhone, Çadır, Kırmızı...)" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
            />
            <button type="submit" style={styles.searchButton}>Ara 🔍</button>
            {searchTerm && (
                <button type="button" onClick={clearSearch} style={styles.clearButton}>X</button>
            )}
        </form>
      </div>

      <h2 style={{ textAlign: 'center', margin: '30px 0', color: '#333' }}>
        {searchTerm ? `"${searchTerm}" için sonuçlar` : 'Vitrin Ürünleri'}
      </h2>

      {loading ? (
        <div style={{ textAlign: 'center' }}>Yükleniyor...</div>
      ) : (
        <div style={styles.grid}>
          {products.length > 0 ? (
            products.map((product) => (
              // --- DEĞİŞİKLİK BURADA: KARTIN KENDİSİ ARTIK BİR LINK ---
              <Link to={`/product/${product.id}`} key={product.id} style={styles.card}>
                
                <div style={styles.imageContainer}>
                    <img 
                        src={product.image_url || 'https://via.placeholder.com/300'} 
                        alt={product.title} 
                        style={styles.image} 
                    />
                    <span style={{
                        ...styles.badge, 
                        backgroundColor: product.listing_type === 'rent' ? '#f39c12' : '#2ecc71'
                    }}>
                        {product.listing_type === 'rent' ? 'Kiralık' : 'Satılık'}
                    </span>
                </div>
                
                <div style={styles.cardBody}>
                  <h3 style={styles.cardTitle}>{product.title}</h3>
                  <p style={{ color: '#777', fontSize: '0.9rem', margin:0 }}>{product.category}</p>
                  <p style={styles.price}>{product.price} TL</p>
                  
                  {/* İncele butonu kaldırıldı, çünkü kartın kendisi tıklanabilir */}
                </div>
              </Link>
            ))
          ) : (
            <div style={{ width: '100%', textAlign: 'center', gridColumn: '1 / -1' }}>
                <p>Aradığınız kriterlere uygun ürün bulunamadı. 😔</p>
                <button onClick={clearSearch} style={styles.resetButton}>Tümünü Göster</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const styles = {
  // Arama Stilleri
  searchContainer: { display: 'flex', justifyContent: 'center', marginBottom: '20px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '10px' },
  searchInput: { flex: 1, padding: '12px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '1rem', outline: 'none' },
  searchButton: { padding: '12px 25px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  clearButton: { padding: '12px 15px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  resetButton: { padding: '10px 20px', backgroundColor: '#95a5a6', color: 'white', border:'none', borderRadius:'5px', cursor:'pointer' },

  // Grid
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '25px' },
  
  // KART STİLİ (LINK OLDUĞU İÇİN textDecoration İPTAL EDİLDİ)
  card: {
    border: '1px solid #eee',
    borderRadius: '10px',
    overflow: 'hidden',
    backgroundColor: 'white',
    boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    display: 'flex',
    flexDirection: 'column',
    textDecoration: 'none', // Link alt çizgisini kaldır
    color: 'inherit',       // Yazı rengini koru (Mavi yapma)
    cursor: 'pointer'
  },
  
  imageContainer: { width: '100%', height: '200px', backgroundColor: '#f9f9f9', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  image: { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' },
  badge: { position: 'absolute', top: '10px', right: '10px', color: 'white', padding: '5px 10px', borderRadius: '15px', fontSize: '0.8rem', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' },
  
  cardBody: { padding: '15px', display: 'flex', flexDirection: 'column', flex: 1 },
  
  cardTitle: { 
    margin: '0 0 5px 0', 
    fontSize: '1.1rem', 
    color: '#333', 
    fontWeight: 'bold',
    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' 
  },
  
  price: { fontSize: '1.2rem', color: '#27ae60', fontWeight: 'bold', marginTop: 'auto', paddingTop: '10px' }
}

export default Home