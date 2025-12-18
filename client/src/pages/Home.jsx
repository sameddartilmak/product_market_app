// client/src/pages/Home.jsx
import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'

function Home() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Arama ve Kategori State'leri
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('') // Seçili kategori

  // Sabit Kategori Listemiz (Veritabanındaki değerlerle aynı olmalı: lowercase)
  const categories = [
    { id: 'arac', label: '🚗 Araç' },
    { id: 'emlak', label: '🏠 Emlak' },
    { id: 'elektronik', label: '💻 Elektronik' },
    { id: 'esya', label: 'kanepe Eşya' }, // iconu uydurdum :)
    { id: 'giyim', label: '👕 Giyim' },
    { id: 'diger', label: '📦 Diğer' }
  ]

  // Ürünleri Çeken Fonksiyon
  const fetchProducts = async (search = '', category = '') => {
    setLoading(true)
    try {
      // URL oluşturma mantığı:
      // Hem search hem category varsa: ?search=elma&category=giyim
      let url = 'http://127.0.0.1:5000/api/products/?'
      
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (category) params.append('category', category)
      
      const res = await axios.get(url + params.toString())
      setProducts(res.data)
    } catch (error) {
      console.error(error)
      toast.error('Ürünler yüklenirken hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  // Sayfa ilk açıldığında
  useEffect(() => {
    fetchProducts()
  }, [])

  // Arama Formu Gönderilince
  const handleSearch = (e) => {
    e.preventDefault()
    // Hem arama kelimesini hem de şu an seçili kategoriyi gönder
    fetchProducts(searchTerm, selectedCategory)
  }

  // Kategori Seçilince
  const handleCategoryClick = (catId) => {
    // Eğer zaten seçili olana tıklandıysa filtreyi kaldır (Toggle mantığı)
    const newCategory = selectedCategory === catId ? '' : catId
    
    setSelectedCategory(newCategory)
    // Aramayı koru, kategoriyi değiştir
    fetchProducts(searchTerm, newCategory)
  }

  // Tüm Filtreleri Temizle
  const clearAll = () => {
    setSearchTerm('')
    setSelectedCategory('')
    fetchProducts('', '')
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      
      {/* --- 1. ARAMA ALANI --- */}
      <div style={styles.searchContainer}>
        <form onSubmit={handleSearch} style={{ display: 'flex', width: '100%', maxWidth: '600px', gap: '10px' }}>
            <input 
                type="text" 
                placeholder="Ne aramıştınız?" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
            />
            <button type="submit" style={styles.searchButton}>Ara 🔍</button>
            {(searchTerm || selectedCategory) && (
                <button type="button" onClick={clearAll} style={styles.clearButton}>Temizle X</button>
            )}
        </form>
      </div>

      {/* --- 2. KATEGORİ BUTONLARI (YENİ) --- */}
      <div style={styles.categoryContainer}>
        <button 
            onClick={() => handleCategoryClick('')}
            style={{
                ...styles.catButton,
                backgroundColor: selectedCategory === '' ? '#333' : '#eee',
                color: selectedCategory === '' ? 'white' : '#333'
            }}
        >
            Tümü
        </button>

        {categories.map((cat) => (
            <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                style={{
                    ...styles.catButton,
                    // Seçiliyse Mavi, değilse Gri yap
                    backgroundColor: selectedCategory === cat.id ? '#3498db' : '#eee',
                    color: selectedCategory === cat.id ? 'white' : '#333',
                    border: selectedCategory === cat.id ? '1px solid #2980b9' : '1px solid #ddd'
                }}
            >
                {cat.label}
            </button>
        ))}
      </div>

      {/* --- BAŞLIK --- */}
      <h2 style={{ textAlign: 'center', margin: '20px 0', color: '#333' }}>
        {selectedCategory 
            ? `${categories.find(c => c.id === selectedCategory)?.label} Kategorisi` 
            : 'Tüm Vitrin Ürünleri'}
        {searchTerm && <span style={{fontSize:'1rem', color:'#777'}}> (Arama: "{searchTerm}")</span>}
      </h2>

      {/* --- 3. ÜRÜN LİSTESİ --- */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Yükleniyor...</div>
      ) : (
        <div style={styles.grid}>
          {products.length > 0 ? (
            products.map((product) => (
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
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <span style={styles.catBadge}>{product.category}</span>
                      <p style={styles.price}>{product.price} TL</p>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div style={{ width: '100%', textAlign: 'center', gridColumn: '1 / -1', padding:'50px' }}>
                <h3>Sonuç Bulunamadı 😔</h3>
                <p>Aradığınız kriterlere uygun ürün yok.</p>
                <button onClick={clearAll} style={styles.resetButton}>Filtreleri Temizle</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const styles = {
  // Arama
  searchContainer: { display: 'flex', justifyContent: 'center', marginBottom: '15px', padding: '20px', backgroundColor: '#fff', borderRadius: '10px' },
  searchInput: { flex: 1, padding: '12px', border: '1px solid #ddd', borderRadius: '5px', fontSize: '1rem', outline: 'none' },
  searchButton: { padding: '12px 25px', backgroundColor: '#2c3e50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
  clearButton: { padding: '12px 15px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },

  // Kategori Buton Alanı
  categoryContainer: {
    display: 'flex',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '30px',
    flexWrap: 'wrap' // Mobilde alt satıra geçsin
  },
  catButton: {
    padding: '10px 20px',
    borderRadius: '25px', // Yuvarlak kenarlı hap şeklinde butonlar
    cursor: 'pointer',
    fontSize: '0.95rem',
    transition: 'all 0.2s',
    outline: 'none',
    fontWeight: '500'
  },

  // Grid
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '25px' },
  
  // Kart
  card: {
    border: '1px solid #eee',
    borderRadius: '12px',
    overflow: 'hidden',
    backgroundColor: 'white',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    transition: 'transform 0.2s, box-shadow 0.2s',
    display: 'flex',
    flexDirection: 'column',
    textDecoration: 'none',
    color: 'inherit',
    cursor: 'pointer'
  },
  imageContainer: { width: '100%', height: '200px', backgroundColor: '#f9f9f9', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  image: { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' },
  badge: { position: 'absolute', top: '10px', right: '10px', color: 'white', padding: '5px 12px', borderRadius: '15px', fontSize: '0.75rem', fontWeight: 'bold', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' },
  
  cardBody: { padding: '15px', display: 'flex', flexDirection: 'column', flex: 1 },
  cardTitle: { margin: '0 0 10px 0', fontSize: '1.1rem', color: '#333', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  
  price: { fontSize: '1.2rem', color: '#27ae60', fontWeight: 'bold', margin: 0 },
  catBadge: { fontSize: '0.8rem', color: '#777', backgroundColor:'#f0f0f0', padding:'3px 8px', borderRadius:'4px', textTransform:'capitalize'},
  
  resetButton: { padding: '10px 20px', backgroundColor: '#3498db', color: 'white', border:'none', borderRadius:'5px', cursor:'pointer', marginTop:'10px' }
}

export default Home