// client/src/pages/ProductDetail.jsx
import { useEffect, useState, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import MessageModal from '../components/MessageModal'
import { AuthContext } from '../context/AuthContext'
import Swal from 'sweetalert2'

function ProductDetail() {
  // --- MANTIK KISMI (AYNEN KORUNDU) ---
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

  // --- KİRALAMA HESAPLAMASI ---
  useEffect(() => {
    if (startDate && endDate && product) {
        const start = new Date(startDate)
        const end = new Date(endDate)
        const diffTime = end - start
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

    const result = await Swal.fire({
        title: 'Satın Almak İstiyor musunuz?',
        text: `Bu ürün için hesabınızdan ${product.price} TL tahsil edilecektir.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        cancelButtonColor: '#9ca3af',
        confirmButtonText: 'Evet, Satın Al!',
        cancelButtonText: 'Vazgeç'
    })

    if (!result.isConfirmed) return

    try {
        const token = localStorage.getItem('token')
        Swal.fire({
            title: 'İşlem Yapılıyor...',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading() }
        })

        await axios.post('http://127.0.0.1:5000/api/transactions/buy', 
            { product_id: product.id }, 
            { headers: { Authorization: `Bearer ${token}` } }
        )
        
        Swal.fire({
            icon: 'success',
            title: 'Hayırlı Olsun! 🎉',
            text: 'Satın alma işlemi başarıyla gerçekleşti.',
            confirmButtonColor: '#10b981'
        })

        fetchProduct()

    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Bir Sorun Oluştu',
            text: error.response?.data?.message || "Satın alma işlemi başarısız.",
            confirmButtonColor: '#ef4444'
        })
    }
  }

  // --- KİRALAMA FONKSİYONU ---
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

    const result = await Swal.fire({
        title: 'Kiralama Onayı',
        html: `
            <div style="text-align: left; font-size: 1rem;">
                <p><strong>Ürün:</strong> ${product.title}</p>
                <p><strong>Süre:</strong> ${rentDays} Gün</p>
                <p><strong>Tarihler:</strong> ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}</p>
                <hr>
                <h3 style="color: #f59e0b; text-align:center">Toplam: ${rentTotal} TL</h3>
            </div>
        `,
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#f59e0b',
        cancelButtonColor: '#9ca3af',
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
            confirmButtonColor: '#10b981'
        })
        
        setStartDate('')
        setEndDate('')
        
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Hata',
            text: error.response?.data?.message || "Kiralama başarısız.",
            confirmButtonColor: '#ef4444'
        })
    }
  }

  // --- SLIDER FONKSİYONLARI ---
  const nextSlide = () => { if (!product?.images) return; setCurrentImageIndex((prev) => (prev === product.images.length - 1 ? 0 : prev + 1)) }
  const prevSlide = () => { if (!product?.images) return; setCurrentImageIndex((prev) => (prev === 0 ? product.images.length - 1 : prev - 1)) }
  const selectImage = (index) => { setCurrentImageIndex(index) }

  if (loading) return <div style={styles.loadingContainer}>Yükleniyor...</div>
  if (!product) return <div style={styles.loadingContainer}>Ürün bulunamadı.</div>

  const isOwner = user && product.owner && user.id === product.owner.id
  const isSold = product.status === 'sold'
  const isRent = product.listing_type === 'rent'

  // --- YENİ TASARIM (JSX) ---
  return (
    <div style={styles.pageBackground}>
      <div style={styles.pageContainer}>
        
        {/* Üst Kısım: Breadcrumb & Kategori */}
        <div style={styles.topBar}>
            <span style={styles.categoryBadge}>{product.category}</span>
            <span style={styles.dateBadge}>📅 {new Date(product.created_at).toLocaleDateString('tr-TR')}</span>
        </div>

        <div style={styles.mainGrid}>
            
            {/* SOL KOLON: GÖRSELLER */}
            <div style={styles.imageColumn}>
                <div style={styles.mainImageWrapper}>
                    {isSold && <div style={styles.soldOverlay}>SATILDI</div>}
                    
                    {product.images && product.images.length > 0 ? (
                        <>
                            {product.images.length > 1 && <button onClick={prevSlide} style={styles.navBtnLeft}>❮</button>}
                            <img 
                                src={product.images[currentImageIndex]} 
                                alt={product.title} 
                                style={{ ...styles.mainImage, filter: isSold ? 'grayscale(100%)' : 'none' }} 
                            />
                            {product.images.length > 1 && <button onClick={nextSlide} style={styles.navBtnRight}>❯</button>}
                        </>
                    ) : (
                        <div style={styles.placeholder}>Görsel Yok</div>
                    )}
                </div>

                {/* Küçük Resimler */}
                {product.images && product.images.length > 1 && (
                    <div style={styles.thumbnailRow}>
                        {product.images.map((img, index) => (
                            <img 
                                key={index} 
                                src={img} 
                                onClick={() => selectImage(index)}
                                style={{
                                    ...styles.thumbnail,
                                    borderColor: currentImageIndex === index ? '#4f46e5' : 'transparent',
                                    opacity: currentImageIndex === index ? 1 : 0.6
                                }} 
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* SAĞ KOLON: BİLGİ VE AKSİYON */}
            <div style={styles.infoColumn}>
                <h1 style={styles.productTitle}>{product.title}</h1>
                
                <div style={styles.ownerInfo}>
                    <span style={styles.ownerAvatar}>👤</span>
                    <span>Satıcı: <strong>{product.owner ? product.owner.username : 'Bilinmiyor'}</strong></span>
                </div>

                <div style={styles.priceTag}>
                    {product.price} <span style={{fontSize:'1.2rem'}}>TL</span>
                    {isRent && <span style={styles.perDayText}>/ gün</span>}
                </div>

                <div style={styles.divider}></div>

                <div style={styles.descriptionBox}>
                    <h3 style={styles.sectionTitle}>Ürün Açıklaması</h3>
                    <p style={styles.descriptionText}>{product.description || 'Açıklama girilmemiş.'}</p>
                </div>

                {/* AKSİYON KARTI (SATIN AL / KİRALA) */}
                <div style={styles.actionCard}>
                    
                    {/* Durum: SATILDI */}
                    {isSold && (
                        <div style={styles.alertBoxRed}>Bu ürün satılmıştır. İşlem yapılamaz.</div>
                    )}

                    {/* Durum: KENDİ İLANIN */}
                    {!isSold && isOwner && (
                        <div style={styles.alertBoxGray}>Bu kendi ilanınızdır.</div>
                    )}

                    {/* Durum: İŞLEM YAPILABİLİR (YABANCI) */}
                    {!isSold && !isOwner && (
                        <>
                            {isRent ? (
                                // --- KİRALAMA FORMU ---
                                <div style={styles.rentForm}>
                                    <h4 style={styles.actionTitle}>Kiralama Tarihleri</h4>
                                    <div style={styles.dateInputs}>
                                        <div style={{flex:1}}>
                                            <label style={styles.inputLabel}>Başlangıç</label>
                                            <input 
                                                type="date" 
                                                value={startDate} 
                                                onChange={(e) => setStartDate(e.target.value)}
                                                min={new Date().toISOString().split('T')[0]}
                                                style={styles.input}
                                            />
                                        </div>
                                        <div style={{flex:1}}>
                                            <label style={styles.inputLabel}>Bitiş</label>
                                            <input 
                                                type="date" 
                                                value={endDate} 
                                                onChange={(e) => setEndDate(e.target.value)}
                                                min={startDate || new Date().toISOString().split('T')[0]}
                                                style={styles.input}
                                            />
                                        </div>
                                    </div>

                                    {rentDays > 0 && (
                                        <div style={styles.rentSummary}>
                                            <span>Toplam ({rentDays} Gün):</span>
                                            <span style={styles.rentTotal}>{rentTotal} TL</span>
                                        </div>
                                    )}

                                    <button onClick={handleRent} style={styles.btnPrimaryOrange}>
                                        Hemen Kirala
                                    </button>
                                </div>
                            ) : (
                                // --- SATIN ALMA BUTONU ---
                                <button onClick={handleBuy} style={styles.btnPrimaryGreen}>
                                    Güvenle Satın Al
                                </button>
                            )}

                            <button onClick={() => setIsModalOpen(true)} style={styles.btnSecondary}>
                                💬 Satıcıya Mesaj At
                            </button>
                        </>
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
    </div>
  )
}

// --- YENİ STİLLER (CSS Object) ---
const styles = {
  loadingContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#6366f1', fontSize: '1.2rem' },
  
  pageBackground: { minHeight: '100vh', backgroundColor: '#f9fafb', padding: '40px 20px', fontFamily: '"Segoe UI", sans-serif' },
  pageContainer: { maxWidth: '1100px', margin: '0 auto' },
  
  topBar: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
  categoryBadge: { backgroundColor: '#e0e7ff', color: '#4338ca', padding: '6px 12px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase' },
  dateBadge: { color: '#6b7280', fontSize: '0.9rem' },

  mainGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '40px' },

  // Sol Kolon
  imageColumn: { display: 'flex', flexDirection: 'column', gap: '15px' },
  mainImageWrapper: { position: 'relative', width: '100%', height: '450px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' },
  mainImage: { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' },
  placeholder: { color: '#9ca3af' },
  
  soldOverlay: { position: 'absolute', backgroundColor: 'rgba(31, 41, 55, 0.85)', color: 'white', padding: '10px 30px', borderRadius: '8px', fontSize: '1.5rem', fontWeight: 'bold', zIndex: 10, backdropFilter: 'blur(4px)' },
  
  navBtnLeft: { position: 'absolute', left: '10px', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', zIndex: 5 },
  navBtnRight: { position: 'absolute', right: '10px', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', zIndex: 5 },

  thumbnailRow: { display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' },
  thumbnail: { width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover', border: '2px solid transparent', cursor: 'pointer', transition: 'all 0.2s' },

  // Sağ Kolon
  infoColumn: { display: 'flex', flexDirection: 'column' },
  productTitle: { fontSize: '2.2rem', fontWeight: '800', color: '#111827', lineHeight: '1.2', marginBottom: '10px' },
  
  ownerInfo: { display: 'flex', alignItems: 'center', gap: '10px', color: '#4b5563', marginBottom: '20px' },
  ownerAvatar: { fontSize: '1.2rem' },

  priceTag: { fontSize: '2.5rem', fontWeight: '700', color: '#111827', marginBottom: '20px', letterSpacing: '-1px' },
  perDayText: { fontSize: '1rem', color: '#6b7280', fontWeight: '400' },

  divider: { height: '1px', backgroundColor: '#e5e7eb', margin: '10px 0 25px 0' },

  descriptionBox: { marginBottom: '30px' },
  sectionTitle: { fontSize: '1.1rem', fontWeight: '700', color: '#374151', marginBottom: '10px' },
  descriptionText: { color: '#4b5563', lineHeight: '1.6', whiteSpace: 'pre-wrap' },

  // Aksiyon Kartı
  actionCard: { backgroundColor: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' },
  actionTitle: { margin: '0 0 15px 0', fontSize: '1.1rem', color: '#374151' },
  
  rentForm: { display: 'flex', flexDirection: 'column', gap: '15px' },
  dateInputs: { display: 'flex', gap: '15px' },
  inputLabel: { display: 'block', fontSize: '0.85rem', color: '#6b7280', marginBottom: '5px', fontWeight: '600' },
  input: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', outline: 'none', fontSize: '0.95rem' },

  rentSummary: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff7ed', padding: '15px', borderRadius: '8px', border: '1px solid #ffedd5' },
  rentTotal: { fontWeight: 'bold', fontSize: '1.2rem', color: '#c2410c' },

  // Butonlar
  btnPrimaryGreen: { width: '100%', padding: '14px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '10px', fontSize: '1.1rem', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s', marginBottom: '10px' },
  btnPrimaryOrange: { width: '100%', padding: '14px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '10px', fontSize: '1.1rem', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' },
  btnSecondary: { width: '100%', padding: '14px', backgroundColor: '#f3f4f6', color: '#4b5563', border: 'none', borderRadius: '10px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s', marginTop: '10px' },

  // Uyarı Kutuları
  alertBoxRed: { backgroundColor: '#fef2f2', color: '#b91c1c', padding: '15px', borderRadius: '8px', textAlign: 'center', fontWeight: '600' },
  alertBoxGray: { backgroundColor: '#f3f4f6', color: '#4b5563', padding: '15px', borderRadius: '8px', textAlign: 'center', fontWeight: '600' }
}

export default ProductDetail