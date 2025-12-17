// client/src/pages/ProductDetail.jsx
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import MessageModal from '../components/MessageModal'

function ProductDetail() {
  const { id } = useParams()
  
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await axios.get(`http://127.0.0.1:5000/api/products/${id}`)
        setProduct(res.data)
        setLoading(false)
      } catch (error) {
        toast.error('Ürün bilgileri alınamadı.')
        setLoading(false)
      }
    }
    fetchProduct()
  }, [id])

  const nextSlide = () => {
    if (!product?.images) return
    setCurrentImageIndex((prev) => (prev === product.images.length - 1 ? 0 : prev + 1))
  }

  const prevSlide = () => {
    if (!product?.images) return
    setCurrentImageIndex((prev) => (prev === 0 ? product.images.length - 1 : prev - 1))
  }

  const selectImage = (index) => {
    setCurrentImageIndex(index)
  }

  if (loading) return <div style={{textAlign:'center', marginTop:'50px'}}>Yükleniyor...</div>
  if (!product) return <div style={{textAlign:'center', marginTop:'50px'}}>Ürün bulunamadı.</div>

  const currentUserId = parseInt(localStorage.getItem('user_id') || '0')
  const isOwner = product.owner.id === currentUserId

  return (
    // YENİ: Dış Kapsayıcı (Başlık ve Kutuyu ortalamak için)
    <div style={styles.pageWrapper}>
      
      {/* 1. BAŞLIK ARTIK BURADA (KUTUNUN DIŞINDA) */}
      <h1 style={styles.mainTitle}>{product.title}</h1>

      {/* 2. BEYAZ KUTU (RESİM VE DETAYLAR) */}
      <div style={styles.container}>
        
        {/* SOL: RESİM GALERİSİ */}
        <div style={styles.imageSection}>
          {product.images && product.images.length > 0 ? (
            <>
              <div style={styles.sliderContainer}>
                  {product.images.length > 1 && (
                      <button onClick={prevSlide} style={styles.arrowLeft}>❮</button>
                  )}
                  <img 
                      src={product.images[currentImageIndex]} 
                      alt={product.title} 
                      style={styles.mainImage} 
                  />
                  {product.images.length > 1 && (
                      <button onClick={nextSlide} style={styles.arrowRight}>❯</button>
                  )}
              </div>
              {product.images.length > 1 && (
                  <div style={styles.thumbnailContainer}>
                      {product.images.map((img, index) => (
                          <img 
                              key={index} 
                              src={img} 
                              alt={`thumb-${index}`}
                              onClick={() => selectImage(index)}
                              style={{
                                  ...styles.thumbnail,
                                  border: currentImageIndex === index ? '2px solid #3498db' : '2px solid transparent',
                                  opacity: currentImageIndex === index ? 1 : 0.6
                              }} 
                          />
                      ))}
                  </div>
              )}
            </>
          ) : (
            <div style={styles.placeholder}>Resim Yok</div>
          )}
        </div>

        {/* SAĞ: BİLGİLER (Başlık buradan kaldırıldı) */}
        <div style={styles.infoSection}>
          
          <p style={styles.price}>{product.price} TL</p>
          
          <div style={styles.meta}>
              <span>📂 Kategori: <strong>{product.category}</strong></span>
              <span>🏷️ Durum: <strong>{product.listing_type === 'rent' ? 'Kiralık' : 'Satılık'}</strong></span>
              <span>👤 Satıcı: <strong>{product.owner.username}</strong></span>
              <span>📅 Tarih: {new Date(product.created_at).toLocaleDateString('tr-TR')}</span>
          </div>

          <hr style={{margin:'20px 0', border:'0', borderTop:'1px solid #eee'}}/>

          <h3>Açıklama</h3>
          <p style={styles.description}>{product.description || 'Açıklama girilmemiş.'}</p>

          <div style={{marginTop: '30px'}}>
              {isOwner ? (
                  <button style={styles.disabledButton} disabled>Bu Sizin Ürününüz</button>
              ) : (
                  <button onClick={() => setIsModalOpen(true)} style={styles.messageButton}>
                      💬 Satıcıya Mesaj At
                  </button>
              )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <MessageModal 
            onClose={() => setIsModalOpen(false)} 
            receiverId={product.owner.id}
            receiverName={product.owner.username}
            productId={product.id}
        />
      )}
    </div>
  )
}

const styles = {
  // YENİ: Tüm içeriği ortalayan dış katman
  pageWrapper: {
    maxWidth: '1100px',
    margin: '40px auto',
    padding: '0 20px', // Mobilde kenarlara yapışmasın diye
  },

  // YENİ: Dışarıdaki Başlık Stili
  mainTitle: {
    fontSize: '1.5rem',
    color: '#2c3e50',
    marginBottom: '20px',
    lineHeight: '1.2',
    textAlign: 'left', // İstersen 'center' yapabilirsin
    overflowWrap: 'break-word' // Uzun kelimeleri kır
  },

  // Beyaz Kutu (Artık margin'i wrapper yönetiyor)
  container: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '40px',
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '30px',
    boxShadow: '0 5px 20px rgba(0,0,0,0.08)'
  },
  
  // SOL TARA: RESİM
  imageSection: {
    flex: 1.2, // Resim alanını biraz genişlettik
    minWidth: '300px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  sliderContainer: {
    position: 'relative',
    width: '100%',
    height: '400px',
    backgroundColor: '#f8f9fa',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    border: '1px solid #eee'
  },
  mainImage: {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain'
  },
  arrowLeft: {
    position: 'absolute',
    left: '10px',
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: 'white',
    border: 'none',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '1.2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2
  },
  arrowRight: {
    position: 'absolute',
    right: '10px',
    backgroundColor: 'rgba(0,0,0,0.5)',
    color: 'white',
    border: 'none',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    cursor: 'pointer',
    fontSize: '1.2rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2
  },
  thumbnailContainer: {
    display: 'flex',
    gap: '10px',
    marginTop: '15px',
    overflowX: 'auto',
    width: '100%',
    paddingBottom: '5px'
  },
  thumbnail: {
    width: '70px',
    height: '70px',
    objectFit: 'cover',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  placeholder: {
    width: '100%',
    height: '300px',
    backgroundColor: '#eee',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#999',
    borderRadius: '10px'
  },

  // SAĞ TARA: BİLGİ
  infoSection: {
    flex: 1,
    minWidth: '300px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start' // Yukarı yasla
  },
  // Not: Burada artık 'title' stili yok çünkü yukarı taşıdık.
  
  price: { fontSize: '2rem', color: '#27ae60', fontWeight: 'bold', margin: '0 0 20px 0' },
  meta: { display: 'flex', flexDirection: 'column', gap: '10px', color: '#555', fontSize: '1.05rem' },
  description: { lineHeight: '1.6', color: '#666', fontSize: '1.05rem', whiteSpace: 'pre-wrap' }, // pre-wrap: Satır boşluklarını korur
  
  messageButton: {
    padding: '15px 30px',
    backgroundColor: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    width: '100%',
    transition: 'background 0.3s'
  },
  disabledButton: {
    padding: '15px 30px',
    backgroundColor: '#95a5a6',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1.1rem',
    width: '100%',
    cursor: 'not-allowed'
  }
}

export default ProductDetail