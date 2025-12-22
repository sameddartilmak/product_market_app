import { useEffect, useState, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import axiosClient from '../api/axiosClient' 
import { toast } from 'react-toastify'
import MessageModal from '../components/MessageModal'
import { AuthContext } from '../context/AuthContext'
import Swal from 'sweetalert2'

// --- MANTINE DATES IMPORTLARI ---
import { DatePickerInput } from '@mantine/dates';
import '@mantine/dates/styles.css'; 
import 'dayjs/locale/tr'; 

function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)

  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  // --- KİRALAMA STATE ---
  const [dateRange, setDateRange] = useState([null, null]); 
  const [rentTotal, setRentTotal] = useState(0)
  const [rentDays, setRentDays] = useState(0)
  
  // Backend'den gelecek dolu günlerin Zaman Damgaları (Timestamp)
  const [busyTimestamps, setBusyTimestamps] = useState([]); 

  // --- 1. Ürün Bilgilerini Çek ---
  const fetchProduct = async () => {
    try {
      const res = await axiosClient.get(`/products/${id}`)
      setProduct(res.data)
      setLoading(false)
    } catch (error) {
      toast.error('Ürün bilgileri alınamadı.')
      setLoading(false)
    }
  }

  // --- 2. Dolu Günleri Çek ve Sayısal Veriye Çevir ---
  const fetchAvailability = async () => {
    try {
        const res = await axiosClient.get(`/products/${id}/availability`);
        // Backend: ['2025-12-22', '2025-12-23']
        
        const timestamps = res.data.map(dateStr => {
            const [year, month, day] = dateStr.split('-').map(Number);
            // Yerel saatte gece yarısı 00:00:00 oluşturuyoruz
            return new Date(year, month - 1, day).getTime();
        });

        console.log("Dolu Tarihler (Timestamp):", timestamps);
        setBusyTimestamps(timestamps);

    } catch (error) {
        console.error("Takvim verisi alınamadı", error);
    }
  }

  useEffect(() => {
    fetchProduct();
    fetchAvailability(); 
  }, [id])


  // --- YARDIMCI: HER TÜRLÜ TARİHİ STANDART DATE OBJESİNE ÇEVİRİR ---
  // Bu fonksiyon hatayı önleyen kilit noktadır.
  const getNativeDate = (dateInput) => {
      if (!dateInput) return null;
      // Eğer Day.js objesi ise .toDate() fonksiyonu vardır
      if (typeof dateInput.toDate === 'function') {
          return dateInput.toDate();
      }
      // Zaten Date objesi ise
      if (dateInput instanceof Date) {
          return dateInput;
      }
      // String veya timestamp ise
      return new Date(dateInput);
  }

  // --- TAKVİMDE GÜNLERİ ENGELLEME ---
  const isDateDisabled = (dateInput) => {
    // 1. Önce veriyi güvenli Date objesine çevir
    const date = getNativeDate(dateInput);
    if (!date || isNaN(date.getTime())) return false; // Hatalı tarihse geç

    // 2. Geçmiş tarihleri engelle
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) return true;

    // 3. Dolu tarihleri engelle
    // Takvimdeki günün Timestamp değerini (Gece yarısı 00:00) buluyoruz
    const checkTime = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

    // Listede varsa engelle
    return busyTimestamps.includes(checkTime);
  };


  // --- HESAPLAMA VE ÇAKIŞMA KONTROLÜ ---
  useEffect(() => {
    const [rawStart, rawEnd] = dateRange;
    // Gelen tarihleri de güvenli hale getir
    const start = getNativeDate(rawStart);
    const end = getNativeDate(rawEnd);

    if (start && end && product) {
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 

        // Seçilen aralıkta yasaklı gün var mı?
        let isConflict = false;
        let currentDate = new Date(start);
        
        while (currentDate <= end) {
            const currentTime = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()).getTime();
            
            if (busyTimestamps.includes(currentTime)) {
                isConflict = true;
                break;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }

        if (isConflict) {
            setRentDays(0);
            setRentTotal(0);
            toast.error("Seçtiğiniz aralıkta dolu günler var.");
            setDateRange([null, null]); 
        } else {
            setRentDays(diffDays);
            setRentTotal(diffDays * product.price);
        }
    } else {
        setRentDays(0);
        setRentTotal(0);
    }
  }, [dateRange, product, busyTimestamps])


  // --- SATIN ALMA İŞLEMİ ---
  const handleBuy = async () => {
    if (!user) {
        Swal.fire({ icon: 'warning', title: 'Giriş Yap', text: 'Lütfen giriş yapın.' }).then((res) => { if(res.isConfirmed) navigate('/login') })
        return
    }

    const result = await Swal.fire({
        title: 'Satın Alma Onayı',
        text: `${product.price} TL ödemeyi onaylıyor musunuz?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#10b981',
        confirmButtonText: 'Satın Al'
    })

    if (!result.isConfirmed) return

    try {
        await axiosClient.post('/transactions/buy', { product_id: product.id })
        Swal.fire('Başarılı', 'Ürün satın alındı!', 'success');
        fetchProduct();
    } catch (error) {
        Swal.fire('Hata', error.response?.data?.message || 'İşlem başarısız', 'error');
    }
  }

  // --- KİRALAMA FONKSİYONU ---
  const handleRent = async () => {
    if (!user) {
        Swal.fire({ icon: 'warning', title: 'Giriş Yap', text: 'Lütfen giriş yapın.' }).then((res) => { if(res.isConfirmed) navigate('/login') })
        return
    }

    const [rawStart, rawEnd] = dateRange;
    const start = getNativeDate(rawStart);
    const end = getNativeDate(rawEnd);
    
    if (!start || !end) {
        toast.info('Lütfen başlangıç ve bitiş tarihlerini seçin.');
        return
    }

    const diffTime = Math.abs(end - start);
    const calculatedDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
    const calculatedTotal = calculatedDays * product.price;

    const result = await Swal.fire({
        title: 'Kiralama Onayı',
        html: `
            <div style="text-align: left; font-size: 1rem;">
                <p><strong>Ürün:</strong> ${product.title}</p>
                <p><strong>Tarihler:</strong> ${start.toLocaleDateString('tr-TR')} - ${end.toLocaleDateString('tr-TR')}</p>
                <p><strong>Süre:</strong> ${calculatedDays} Gün</p>
                <hr>
                <h3 style="color: #f59e0b; text-align:center">Toplam: ${calculatedTotal.toLocaleString('tr-TR')} TL</h3>
            </div>
        `,
        icon: 'info',
        showCancelButton: true,
        confirmButtonText: 'Onayla ve Kirala',
        confirmButtonColor: '#f59e0b',
        cancelButtonText: 'Vazgeç'
    })

    if (!result.isConfirmed) return

    try {
        Swal.fire({ title: 'İşleniyor...', didOpen: () => Swal.showLoading() })

        // Backend formatı (YYYY-MM-DD)
        const formatDate = (d) => {
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }

        const payload = {
            product_id: product.id,
            start_date: formatDate(start),
            end_date: formatDate(end)
        }

        await axiosClient.post('/transactions/rent', payload)
        
        Swal.fire('Başarılı', 'Kiralama talebi oluşturuldu! Satıcı onayı bekleniyor.', 'success');
        
        setDateRange([null, null]); 
        fetchAvailability(); 
        
    } catch (error) {
        Swal.fire('Hata', error.response?.data?.message || "Kiralama başarısız.", 'error');
    }
  }

  const nextSlide = () => { if (!product?.images) return; setCurrentImageIndex((prev) => (prev === product.images.length - 1 ? 0 : prev + 1)) }
  const prevSlide = () => { if (!product?.images) return; setCurrentImageIndex((prev) => (prev === 0 ? product.images.length - 1 : prev - 1)) }
  const selectImage = (index) => { setCurrentImageIndex(index) }

  if (loading) return <div style={styles.loadingContainer}>Yükleniyor...</div>
  if (!product) return <div style={styles.loadingContainer}>Ürün bulunamadı.</div>

  const isOwner = user && product.owner && user.id === product.owner.id
  const isSold = product.status === 'sold'
  const isRent = product.listing_type === 'rent'

  return (
    <div style={styles.pageBackground}>
      <div style={styles.pageContainer}>
        
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
                {product.images && product.images.length > 1 && (
                    <div style={styles.thumbnailRow}>
                        {product.images.map((img, index) => (
                            <img 
                                key={index} src={img} onClick={() => selectImage(index)}
                                style={{...styles.thumbnail, borderColor: currentImageIndex === index ? '#4f46e5' : 'transparent', opacity: currentImageIndex === index ? 1 : 0.6}} 
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* SAĞ KOLON: BİLGİ */}
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

                <div style={styles.actionCard}>
                    {isSold && <div style={styles.alertBoxRed}>Bu ürün satılmıştır.</div>}
                    {!isSold && isOwner && <div style={styles.alertBoxGray}>Bu kendi ilanınızdır.</div>}

                    {!isSold && !isOwner && (
                        <>
                            {isRent ? (
                                <div style={styles.rentForm}>
                                    <h4 style={styles.actionTitle}>Müsaitlik Durumu ve Kiralama</h4>
                                    
                                    <DatePickerInput
                                      key={busyTimestamps.length > 0 ? busyTimestamps.join('-') : "empty"}
                                      type="range"
                                      label="Kiralama Tarihleri Seçin"
                                      placeholder="Başlangıç - Bitiş"
                                      value={dateRange}
                                      onChange={setDateRange}
                                      minDate={new Date()} 
                                      
                                      excludeDate={isDateDisabled} 
                                      
                                      locale="tr"
                                      clearable
                                      numberOfColumns={1}
                                      style={{ width: '100%' }}
                                    />

                                    {rentDays > 0 && (
                                        <div style={styles.rentSummary}>
                                            <span>Toplam ({rentDays} Gün):</span>
                                            <span style={styles.rentTotal}>{rentTotal.toLocaleString('tr-TR')} TL</span>
                                        </div>
                                    )}

                                    <button onClick={handleRent} style={styles.btnPrimaryOrange}>Hemen Kirala</button>
                                </div>
                            ) : (
                                <button onClick={handleBuy} style={styles.btnPrimaryGreen}>Güvenle Satın Al</button>
                            )}
                            <button onClick={() => setIsModalOpen(true)} style={styles.btnSecondary}>💬 Satıcıya Mesaj At</button>
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

// --- STYLES ---
const styles = {
  loadingContainer: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#6366f1', fontSize: '1.2rem' },
  pageBackground: { minHeight: '100vh', backgroundColor: '#f9fafb', padding: '40px 20px', fontFamily: '"Segoe UI", sans-serif' },
  pageContainer: { maxWidth: '1100px', margin: '0 auto' },
  topBar: { display: 'flex', justifyContent: 'space-between', marginBottom: '20px' },
  categoryBadge: { backgroundColor: '#e0e7ff', color: '#4338ca', padding: '6px 12px', borderRadius: '20px', fontSize: '0.9rem', fontWeight: '600', textTransform: 'uppercase' },
  dateBadge: { color: '#6b7280', fontSize: '0.9rem' },
  mainGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '40px' },
  imageColumn: { display: 'flex', flexDirection: 'column', gap: '15px' },
  mainImageWrapper: { position: 'relative', width: '100%', height: '450px', backgroundColor: 'white', borderRadius: '16px', border: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.02)' },
  mainImage: { maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' },
  placeholder: { color: '#9ca3af' },
  soldOverlay: { position: 'absolute', backgroundColor: 'rgba(31, 41, 55, 0.85)', color: 'white', padding: '10px 30px', borderRadius: '8px', fontSize: '1.5rem', fontWeight: 'bold', zIndex: 10, backdropFilter: 'blur(4px)' },
  navBtnLeft: { position: 'absolute', left: '10px', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', zIndex: 5 },
  navBtnRight: { position: 'absolute', right: '10px', backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', zIndex: 5 },
  thumbnailRow: { display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '5px' },
  thumbnail: { width: '80px', height: '80px', borderRadius: '8px', objectFit: 'cover', border: '2px solid transparent', cursor: 'pointer', transition: 'all 0.2s' },
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
  actionCard: { backgroundColor: 'white', padding: '25px', borderRadius: '16px', border: '1px solid #e5e7eb', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' },
  actionTitle: { margin: '0 0 15px 0', fontSize: '1.1rem', color: '#374151' },
  rentForm: { display: 'flex', flexDirection: 'column', gap: '15px' },
  rentSummary: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff7ed', padding: '15px', borderRadius: '8px', border: '1px solid #ffedd5' },
  rentTotal: { fontWeight: 'bold', fontSize: '1.2rem', color: '#c2410c' },
  btnPrimaryGreen: { width: '100%', padding: '14px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '10px', fontSize: '1.1rem', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s', marginBottom: '10px' },
  btnPrimaryOrange: { width: '100%', padding: '14px', backgroundColor: '#f59e0b', color: 'white', border: 'none', borderRadius: '10px', fontSize: '1.1rem', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s' },
  btnSecondary: { width: '100%', padding: '14px', backgroundColor: '#f3f4f6', color: '#4b5563', border: 'none', borderRadius: '10px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s', marginTop: '10px' },
  alertBoxRed: { backgroundColor: '#fef2f2', color: '#b91c1c', padding: '15px', borderRadius: '8px', textAlign: 'center', fontWeight: '600' },
  alertBoxGray: { backgroundColor: '#f3f4f6', color: '#4b5563', padding: '15px', borderRadius: '8px', textAlign: 'center', fontWeight: '600' }
}

export default ProductDetail