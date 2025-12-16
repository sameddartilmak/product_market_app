// client/src/pages/ProductDetail.jsx
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import MessageModal from '../components/MessageModal'

function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  
  // Mesaj Modalı State'i
  const [isMsgModalOpen, setIsMsgModalOpen] = useState(false)

  // Kiralama için Tarih State'leri
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    fetchProduct()
  }, [id])

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`http://127.0.0.1:5000/api/products/${id}`)
      setProduct(response.data)
      setLoading(false)
    } catch (error) {
      console.error(error)
      toast.error('Ürün bulunamadı.')
      navigate('/')
    }
  }

  // --- SATIN ALMA / KİRALAMA FONKSİYONU ---
  const handleTransaction = async () => {
    const token = localStorage.getItem('token')
    if (!token) {
        toast.warning("İşlem yapmak için giriş yapmalısınız!")
        navigate('/login')
        return
    }

    try {
        let endpoint = ''
        let payload = { product_id: product.id }

        if (product.listing_type === 'sale') {
            endpoint = 'http://127.0.0.1:5000/api/transactions/buy'
        } 
        else if (product.listing_type === 'rent') {
            if (!startDate || !endDate) {
                toast.warning("Lütfen kiralama tarihlerini seçiniz.")
                return
            }
            endpoint = 'http://127.0.0.1:5000/api/transactions/rent'
            payload.start_date = startDate
            payload.end_date = endDate
        }
        else {
            toast.info("Takas özelliği yakında gelecek.")
            return
        }

        const response = await axios.post(endpoint, payload, {
            headers: { Authorization: `Bearer ${token}` }
        })

        toast.success(response.data.message)
        navigate('/') 

    } catch (error) {
        console.error("İşlem Hatası:", error)
        const errorMsg = error.response?.data?.message || "İşlem başarısız oldu."
        toast.error(errorMsg)
    }
  }

  if (loading) return <div style={{textAlign:'center', marginTop:'50px'}}>Yükleniyor...</div>
  if (!product) return null

  const getActionDetails = () => {
    if (product.listing_type === 'sale') return { text: `Satın Al (${product.price} TL)`, color: '#2ecc71' }
    if (product.listing_type === 'rent') return { text: `Kirala (Günlük ${product.price} TL)`, color: '#3498db' }
    if (product.listing_type === 'swap') return { text: 'Takas Teklifi Ver', color: '#9b59b6' }
    return { text: 'İşlem Yap', color: '#333' }
  }

  const action = getActionDetails()

  return (
    <div style={styles.container}>
      <button onClick={() => navigate(-1)} style={styles.backButton}>&larr; Geri Dön</button>

      <div style={styles.card}>
        <div style={styles.imageSection}>
          {product.image_url ? (
            <img src={product.image_url} alt={product.title} style={styles.image} />
          ) : (
            <div style={styles.placeholder}>Resim Yok</div>
          )}
        </div>

        <div style={styles.infoSection}>
          <div style={{display:'flex', gap:'10px', alignItems:'center'}}>
            <span style={styles.category}>{product.category}</span>
            <span style={{...styles.category, backgroundColor: action.color, color: 'white'}}>
                {product.listing_type === 'sale' ? 'SATILIK' : 'KİRALIK'}
            </span>
          </div>

          <h1 style={styles.title}>{product.title}</h1>
          <p style={{...styles.price, color: action.color}}>{product.price} TL</p>
          
          <div style={styles.divider}></div>
          
          <h3>Açıklama</h3>
          <p style={styles.description}>{product.description || 'Açıklama yok.'}</p>
          
          <div style={styles.ownerInfo}>
             <p><strong>Satıcı:</strong> {product.owner?.username}</p>
             <p><strong>Durum:</strong> {product.status === 'available' ? '🟢 Müsait' : '🔴 İşlemde/Satıldı'}</p>
          </div>

          {product.listing_type === 'rent' && product.status === 'available' && (
              <div style={styles.dateContainer}>
                  <label>Başlangıç: <input type="date" style={styles.input} value={startDate} onChange={e => setStartDate(e.target.value)} /></label>
                  <label>Bitiş: <input type="date" style={styles.input} value={endDate} onChange={e => setEndDate(e.target.value)} /></label>
              </div>
          )}

          <div style={styles.buttonGroup}>
            {product.status === 'available' ? (
                <button 
                    onClick={handleTransaction}
                    style={{...styles.actionButton, backgroundColor: action.color}}
                >
                    {action.text}
                </button>
            ) : (
                <button style={styles.disabledButton} disabled>Bu Ürün Müsait Değil</button>
            )}
            
            {/* --- GÜNCELLENEN MESAJ BUTONU --- */}
            <button 
                onClick={() => setIsMsgModalOpen(true)} 
                style={styles.messageButton}
            >
                Mesaj At
            </button>
          </div>

          {/* --- MESAJ PENCERESİ (MODAL) --- */}
          {product && (
            <MessageModal 
                isOpen={isMsgModalOpen} 
                onClose={() => setIsMsgModalOpen(false)}
                receiverId={product.owner?.id} 
                productId={product.id}
                productTitle={product.title}
            />
          )}

        </div>
      </div>
    </div>
  )
}

const styles = {
  container: { maxWidth: '1000px', margin: '40px auto', padding: '0 20px' },
  backButton: { background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer', marginBottom: '10px' },
  card: { display: 'flex', flexWrap: 'wrap', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', overflow: 'hidden', minHeight: '500px' },
  imageSection: { flex: '1', minWidth: '300px', backgroundColor: '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  image: { width: '100%', maxHeight: '500px', objectFit: 'contain' },
  placeholder: { color: '#aaa', fontWeight: 'bold', fontSize: '1.2rem' },
  infoSection: { flex: '1', padding: '40px', minWidth: '300px' },
  category: { backgroundColor: '#e0f7fa', color: '#006064', padding: '5px 12px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase' },
  title: { marginTop: '15px', fontSize: '2rem', color: '#333' },
  price: { fontSize: '1.8rem', fontWeight: 'bold', margin: '10px 0' },
  divider: { height: '1px', backgroundColor: '#eee', margin: '20px 0' },
  description: { lineHeight: '1.6', color: '#555', marginBottom: '30px' },
  ownerInfo: { backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem' },
  
  dateContainer: { display: 'flex', gap: '15px', marginBottom: '20px', backgroundColor: '#f0f9ff', padding: '10px', borderRadius: '8px' },
  input: { marginLeft: '5px', padding: '5px', borderRadius: '4px', border: '1px solid #ccc' },
  
  buttonGroup: { display: 'flex', gap: '15px', marginTop: '10px' },
  actionButton: { flex: 2, padding: '15px', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold' },
  disabledButton: { flex: 2, padding: '15px', backgroundColor: '#ccc', color: '#666', border: 'none', borderRadius: '8px', fontSize: '1rem', cursor: 'not-allowed', fontWeight: 'bold' },
  messageButton: { flex: 1, padding: '15px', backgroundColor: 'white', color: '#555', border: '2px solid #ddd', borderRadius: '8px', fontSize: '1rem', cursor: 'pointer', fontWeight: 'bold' }
}

export default ProductDetail