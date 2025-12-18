// client/src/pages/ProductDetail.jsx
import { useEffect, useState, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import MessageModal from '../components/MessageModal'
import { AuthContext } from '../context/AuthContext'
import Swal from 'sweetalert2'

function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // --- KİRALAMA İÇİN STATE ---
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [rentTotal, setRentTotal] = useState(0)
  const [rentDays, setRentDays] = useState(0)

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

  useEffect(() => {
    fetchProduct()
  }, [id])

  // --- KİRALAMA HESAPLAMASI (Tarihler değiştikçe çalışır) ---
  useEffect(() => {
    if (startDate && endDate && product) {
        const start = new Date(startDate)
        const end = new Date(endDate)
        
        // Gün farkını bul (Milisaniye cinsinden)
        const diffTime = end - start
        
        // Milisaniyeyi güne çevir
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays > 0) {
            setRentDays(diffDays)
            setRentTotal(diffDays * product.price)
        } else {
            setRentDays(0)
            setRentTotal(0)
        }
    }
  }, [startDate, endDate, product])

  // --- SATIN ALMA İŞLEMİ ---
  const handleBuy = async () => {
    if (!user) {
        // Giriş yapmamışsa şık bir uyarı verelim
        Swal.fire({
            icon: 'warning',
            title: 'Giriş Yapmalısınız',
            text: 'Satın alma işlemi için lütfen giriş yapın.',
            confirmButtonText: 'Giriş Yap',
            confirmButtonColor: '#3498db'
        }).then((result) => {
            if (result.isConfirmed) navigate('/login')
        })
        return
    }

    // 1. Şık Onay Penceresi
    const result = await Swal.fire({
        title: 'Satın Almak İstiyor musunuz?',
        text: `Bu ürün için hesabınızdan ${product.price} TL tahsil edilecektir.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#27ae60', // Yeşil
        cancelButtonColor: '#95a5a6',  // Gri
        confirmButtonText: 'Evet, Satın Al!',
        cancelButtonText: 'Vazgeç',
        background: '#fff',
        backdrop: `
            rgba(0,0,123,0.4)
            left top
            no-repeat
        `
    })

    if (!result.isConfirmed) return // Kullanıcı vazgeçti

    try {
        const token = localStorage.getItem('token')
        
        // Yükleniyor animasyonu aç
        Swal.fire({
            title: 'İşlem Yapılıyor...',
            html: 'Ödeme onayı alınıyor, lütfen bekleyin.',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading()
            }
        })

        await axios.post('http://127.0.0.1:5000/api/transactions/buy', 
            { product_id: product.id }, 
            { headers: { Authorization: `Bearer ${token}` } }
        )
        
        // 2. Başarılı Mesajı (Konfetili vb. yapılabilir ama şimdilik şık bir modal)
        Swal.fire({
            icon: 'success',
            title: 'Hayırlı Olsun! 🎉',
            text: 'Satın alma işlemi başarıyla gerçekleşti.',
            confirmButtonColor: '#27ae60',
            confirmButtonText: 'Tamam'
        })

        fetchProduct()

    } catch (error) {
        // Hata Mesajı
        Swal.fire({
            icon: 'error',
            title: 'Bir Sorun Oluştu',
            text: error.response?.data?.message || "Satın alma işlemi başarısız.",
            confirmButtonColor: '#e74c3c'
        })
    }
  }

  // ============================================================
  // 🔥 YENİ TASARIMSAL KİRALAMA FONKSİYONU
  // ============================================================
  const handleRent = async () => {
    if (!user) {
        Swal.fire({
            icon: 'warning',
            title: 'Giriş Yapmalısınız',
            text: 'Kiralama işlemi için lütfen giriş yapın.',
            confirmButtonText: 'Giriş Yap',
            confirmButtonColor: '#3498db'
        }).then((res) => { if(res.isConfirmed) navigate('/login') })
        return
    }
    
    if (!startDate || !endDate) {
        // Küçük bir toast uyarısı (Sağ üstte çıkan)
        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true,
        })
        Toast.fire({ icon: 'info', title: 'Lütfen tarihleri seçiniz' })
        return
    }

    if (rentDays <= 0) {
        Swal.fire({ icon: 'error', title: 'Tarih Hatası', text: 'Bitiş tarihi başlangıçtan sonra olmalıdır.' })
        return
    }

    // 1. Şık Onay Penceresi (Özet Bilgiyle)
    const result = await Swal.fire({
        title: 'Kiralama Onayı',
        html: `
            <div style="text-align: left; font-size: 1rem;">
                <p><strong>Ürün:</strong> ${product.title}</p>
                <p><strong>Süre:</strong> ${rentDays} Gün</p>
                <p><strong>Tarihler:</strong> ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}</p>
                <hr>
                <h3 style="color: #f39c12; text-align:center">Toplam: ${rentTotal} TL</h3>
            </div>
        `,
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#f39c12', // Turuncu
        cancelButtonColor: '#95a5a6',
        confirmButtonText: 'Onayla ve Kirala',
        cancelButtonText: 'Vazgeç'
    })

    if (!result.isConfirmed) return

    try {
        const token = localStorage.getItem('token')
        
        Swal.fire({ title: 'İşleniyor...', didOpen: () => Swal.showLoading() })

        const payload = {
            product_id: product.id,
            start_date: startDate,
            end_date: endDate
        }

        await axios.post('http://127.0.0.1:5000/api/transactions/rent', 
            payload, 
            { headers: { Authorization: `Bearer ${token}` } }
        )
        
        Swal.fire({
            icon: 'success',
            title: 'Talebiniz Alındı! 📝',
            text: 'Kiralama talebiniz başarıyla oluşturuldu.',
            confirmButtonColor: '#27ae60'
        })
        
        setStartDate('')
        setEndDate('')
        
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Hata',
            text: error.response?.data?.message || "Kiralama başarısız.",
            confirmButtonColor: '#e74c3c'
        })
    }
  }

  // --- SLIDER FONKSİYONLARI ---
  const nextSlide = () => { if (!product?.images) return; setCurrentImageIndex((prev) => (prev === product.images.length - 1 ? 0 : prev + 1)) }
  const prevSlide = () => { if (!product?.images) return; setCurrentImageIndex((prev) => (prev === 0 ? product.images.length - 1 : prev - 1)) }
  const selectImage = (index) => { setCurrentImageIndex(index) }

  if (loading) return <div style={{textAlign:'center', marginTop:'50px'}}>Yükleniyor...</div>
  if (!product) return <div style={{textAlign:'center', marginTop:'50px'}}>Ürün bulunamadı.</div>

  const isOwner = user && product.owner && user.id === product.owner.id
  const isSold = product.status === 'sold'
  const isRent = product.listing_type === 'rent' // Ürün kiralık mı?

  return (
    <div style={styles.pageWrapper}>
      
      <h1 style={styles.mainTitle}>
        {product.title} 
        {isSold && <span style={styles.soldBadgeTitle}> (SATILDI)</span>}
        {/* Kiralıksa başlıkta belirtelim */}
        {!isSold && isRent && <span style={styles.rentBadgeTitle}> (KİRALIK)</span>}
      </h1>

      <div style={styles.container}>
        
        {/* SOL: RESİM GALERİSİ */}
        <div style={styles.imageSection}>
          {product.images && product.images.length > 0 ? (
            <>
              <div style={styles.sliderContainer}>
                  {product.images.length > 1 && <button onClick={prevSlide} style={styles.arrowLeft}>❮</button>}
                  <img 
                      src={product.images[currentImageIndex]} 
                      alt={product.title} 
                      style={{ ...styles.mainImage, filter: isSold ? 'grayscale(100%)' : 'none' }} 
                  />
                  {product.images.length > 1 && <button onClick={nextSlide} style={styles.arrowRight}>❯</button>}
                  {isSold && <div style={styles.soldOverlay}>SATILDI</div>}
              </div>
              {product.images.length > 1 && (
                  <div style={styles.thumbnailContainer}>
                      {product.images.map((img, index) => (
                          <img key={index} src={img} alt={`thumb-${index}`} onClick={() => selectImage(index)}
                              style={{ ...styles.thumbnail, border: currentImageIndex === index ? '2px solid #3498db' : '2px solid transparent', opacity: currentImageIndex === index ? 1 : 0.6 }} 
                          />
                      ))}
                  </div>
              )}
            </>
          ) : ( <div style={styles.placeholder}>Resim Yok</div> )}
        </div>

        {/* SAĞ: BİLGİLER */}
        <div style={styles.infoSection}>
          
          <p style={styles.price}>
            {product.price} TL 
            {isRent && <span style={{fontSize:'1rem', color:'#666', fontWeight:'normal'}}> / Günlük</span>}
          </p>
          
          <div style={styles.meta}>
              <span>📂 Kategori: <strong>{product.category}</strong></span>
              <span>🏷️ Tip: <strong>{isRent ? 'Kiralık' : 'Satılık'}</strong></span>
              <span>👤 İlan Sahibi: <strong>{product.owner ? product.owner.username : 'Bilinmiyor'}</strong></span>
              <span>📅 İlan Tarihi: {new Date(product.created_at).toLocaleDateString('tr-TR')}</span>
          </div>

          <hr style={{margin:'20px 0', border:'0', borderTop:'1px solid #eee'}}/>

          <h3>Açıklama</h3>
          <p style={styles.description}>{product.description || 'Açıklama girilmemiş.'}</p>

          <div style={styles.actionArea}>
              
              {/* DURUM 1: Ürün Satılmış */}
              {isSold && <button style={styles.disabledButton} disabled>❌ Bu Ürün Artık Mevcut Değil</button>}

              {/* DURUM 2: Kendi Ürünün */}
              {!isSold && isOwner && <button style={styles.disabledButton} disabled>✏️ Bu Sizin İlanınız</button>}

              {/* DURUM 3: İşlem Yapılabilir (Yabancı) */}
              {!isSold && !isOwner && (
                  <div>
                      {/* --- KİRALAMA ALANI --- */}
                      {isRent ? (
                          <div style={styles.rentContainer}>
                              <h4 style={{marginBottom:'15px', color:'#2c3e50'}}>📅 Kiralama Tarihleri</h4>
                              
                              <div style={styles.dateGroup}>
                                  <div>
                                      <label style={styles.label}>Başlangıç:</label>
                                      <input 
                                          type="date" 
                                          value={startDate} 
                                          onChange={(e) => setStartDate(e.target.value)}
                                          min={new Date().toISOString().split('T')[0]} // Bugünden öncesini seçeme
                                          style={styles.dateInput}
                                      />
                                  </div>
                                  <div>
                                      <label style={styles.label}>Bitiş:</label>
                                      <input 
                                          type="date" 
                                          value={endDate} 
                                          onChange={(e) => setEndDate(e.target.value)}
                                          min={startDate || new Date().toISOString().split('T')[0]}
                                          style={styles.dateInput}
                                      />
                                  </div>
                              </div>

                              {/* Hesaplama Özeti */}
                              {rentDays > 0 && (
                                  <div style={styles.summaryBox}>
                                      <div style={{display:'flex', justifyContent:'space-between'}}>
                                          <span>Gün Sayısı:</span>
                                          <strong>{rentDays} Gün</strong>
                                      </div>
                                      <div style={{display:'flex', justifyContent:'space-between', marginTop:'5px'}}>
                                          <span>Toplam Tutar:</span>
                                          <strong style={{color:'#27ae60', fontSize:'1.2rem'}}>{rentTotal} TL</strong>
                                      </div>
                                  </div>
                              )}

                              <div style={styles.buttonGroup}>
                                  <button onClick={handleRent} style={styles.rentButton}>
                                      🤝 Kirala
                                  </button>
                                  <button onClick={() => setIsModalOpen(true)} style={styles.messageButton}>
                                      💬 Mesaj At
                                  </button>
                              </div>
                          </div>
                      ) : (
                          // --- SATIN ALMA ALANI (Satılık Ürünler İçin) ---
                          <div style={styles.buttonGroup}>
                              <button onClick={handleBuy} style={styles.buyButton}>
                                  💳 Satın Al
                              </button>
                              <button onClick={() => setIsModalOpen(true)} style={styles.messageButton}>
                                  💬 Satıcıya Mesaj At
                              </button>
                          </div>
                      )}
                  </div>
              )}
          </div>
        </div>
      </div>

      {isModalOpen && product.owner && (
        <MessageModal 
            isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} 
            receiverId={product.owner.id} receiverName={product.owner.username} productId={product.id}
        />
      )}
    </div>
  )
}

// --- STYLES ---
const styles = {
  pageWrapper: { maxWidth: '1100px', margin: '40px auto', padding: '0 20px' },
  mainTitle: { fontSize: '1.5rem', color: '#2c3e50', marginBottom: '20px', lineHeight: '1.2', overflowWrap: 'break-word' },
  soldBadgeTitle: { color: '#e74c3c', fontWeight: 'bold', fontSize: '1rem' },
  rentBadgeTitle: { color: '#f39c12', fontWeight: 'bold', fontSize: '1rem' }, // Turuncu Kiralık yazısı
  
  container: { display: 'flex', flexWrap: 'wrap', gap: '40px', backgroundColor: 'white', borderRadius: '12px', padding: '30px', boxShadow: '0 5px 20px rgba(0,0,0,0.08)' },
  
  imageSection: { flex: 1.2, minWidth: '300px', display: 'flex', flexDirection: 'column', alignItems: 'center' },
  sliderContainer: { position: 'relative', width: '100%', height: '400px', backgroundColor: '#f8f9fa', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid #eee' },
  mainImage: { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', transition: 'filter 0.3s' },
  soldOverlay: { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-15deg)', backgroundColor: 'rgba(231, 76, 60, 0.9)', color: 'white', padding: '10px 40px', fontSize: '2rem', fontWeight: 'bold', border: '4px solid white', borderRadius: '10px', zIndex: 5 },
  arrowLeft: { position: 'absolute', left: '10px', backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  arrowRight: { position: 'absolute', right: '10px', backgroundColor: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  thumbnailContainer: { display: 'flex', gap: '10px', marginTop: '15px', overflowX: 'auto', width: '100%', paddingBottom: '5px' },
  thumbnail: { width: '70px', height: '70px', objectFit: 'cover', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.2s' },
  placeholder: { width: '100%', height: '300px', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', borderRadius: '10px' },

  infoSection: { flex: 1, minWidth: '300px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' },
  price: { fontSize: '2rem', color: '#27ae60', fontWeight: 'bold', margin: '0 0 20px 0' },
  meta: { display: 'flex', flexDirection: 'column', gap: '10px', color: '#555', fontSize: '1.05rem' },
  description: { lineHeight: '1.6', color: '#666', fontSize: '1.05rem', whiteSpace: 'pre-wrap' },
  
  actionArea: { marginTop: '30px' },
  buttonGroup: { display: 'flex', gap: '15px', flexWrap: 'wrap', marginTop:'15px' },
  
  // Satın Al Butonu (Yeşil)
  buyButton: { flex: 1, padding: '15px 20px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.3s', minWidth: '150px' },
  
  // Kirala Butonu (Turuncu)
  rentButton: { flex: 1, padding: '15px 20px', backgroundColor: '#f39c12', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.3s', minWidth: '150px' },
  
  // Mesaj Butonu (Mavi)
  messageButton: { flex: 1, padding: '15px 20px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1rem', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.3s', minWidth: '150px' },
  
  disabledButton: { padding: '15px 30px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1.1rem', width: '100%', cursor: 'not-allowed' },

  // --- Kiralama Özel Stilleri ---
  rentContainer: { backgroundColor: '#fcfcfc', padding: '20px', borderRadius: '10px', border: '1px solid #eee' },
  dateGroup: { display: 'flex', gap: '20px', flexWrap: 'wrap' },
  label: { display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' },
  dateInput: { padding: '10px', borderRadius: '5px', border: '1px solid #ccc', width: '100%' },
  summaryBox: { marginTop: '15px', padding: '15px', backgroundColor: '#e8f6f3', borderRadius: '8px', borderLeft: '4px solid #27ae60' }
}

export default ProductDetail