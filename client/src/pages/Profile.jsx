// client/src/pages/Profile.jsx
import { useEffect, useState, useContext } from 'react'
import axiosClient from '../api/axiosClient' 
import { AuthContext } from '../context/AuthContext'
import { toast } from 'react-toastify'

function Profile() {
  const { logout, updateUser } = useContext(AuthContext)
  
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)

  const [bio, setBio] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  // --- KONUM İÇİN YENİ STATE'LER ---
  const [cities, setCities] = useState([])       // Tüm İller
  const [districts, setDistricts] = useState([]) // Seçilen İlin İlçeleri
  
  const [selectedCity, setSelectedCity] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')

  // --- 1. Profil ve İl/İlçe Verisini Çek ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        // A) Profil Verisini Çek
        const resProfile = await axiosClient.get('/auth/profile')
        const userData = resProfile.data
        
        setProfileData(userData)
        setBio(userData.bio || '')

        // Mevcut Konumu Parçala (Örn: "Seyhan, Adana" -> District: Seyhan, City: Adana)
        if (userData.location && userData.location.includes(',')) {
            const parts = userData.location.split(',').map(s => s.trim())
            // Genelde format "İlçe, İl" şeklindedir
            if (parts.length >= 2) {
                // Not: State'e atamayı şehir listesi yüklendikten sonra yapmak daha sağlıklı, 
                // ama burada ön hazırlık yapıyoruz.
                // Gerçek eşleştirme aşağıda yapılacak.
            }
        }

        // B) İl/İlçe JSON Verisini Çek
        const resLocation = await fetch('/ililce.json') // public klasöründen okur
        const locationData = await resLocation.json()
        setCities(locationData)

        // C) Mevcut Konumu State'e Yerleştir
        if (userData.location) {
            const parts = userData.location.split(',').map(s => s.trim())
            if (parts.length === 2) {
                const districtName = parts[0]
                const cityName = parts[1]

                // Şehri bul ve seç
                const cityObj = locationData.find(c => c.name === cityName)
                if (cityObj) {
                    setSelectedCity(cityObj.name)
                    setDistricts(cityObj.districts) // O ilin ilçelerini yükle
                    setSelectedDistrict(districtName) // İlçeyi seç
                }
            }
        }

      } catch (error) {
        console.error("Veri çekme hatası:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // --- 2. İl Seçildiğinde Çalışır ---
  const handleCityChange = (e) => {
      const cityName = e.target.value
      setSelectedCity(cityName)
      
      // Şehri bul ve ilçelerini güncelle
      const cityObj = cities.find(c => c.name === cityName)
      if (cityObj) {
          setDistricts(cityObj.districts)
          setSelectedDistrict('') // İlçe seçimini sıfırla
      } else {
          setDistricts([])
          setSelectedDistrict('')
      }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      setPreviewUrl(URL.createObjectURL(file)) 
    }
  }

  const handleSave = async (e) => {
    e.preventDefault() 
    
    // Konumu birleştir: "İlçe, İl"
    let locationString = ''
    if (selectedCity && selectedDistrict) {
        locationString = `${selectedDistrict}, ${selectedCity}`
    } else if (selectedCity) {
        locationString = selectedCity
    }

    const formData = new FormData()
    formData.append('bio', bio)
    formData.append('location', locationString) // Backend'e tek string gidiyor
    
    if (imageFile) {
        formData.append('profile_image', imageFile)
    }

    try {
        const res = await axiosClient.put('/auth/profile', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        })
        
        setProfileData(res.data.user) 
        
        if (updateUser) {
            updateUser(res.data.user)
        }

        toast.success('Profil güncellendi! 🎉')
        setIsEditing(false) 
        setPreviewUrl(null) 

    } catch (error) {
        console.error("Hata:", error)
        toast.error('Güncelleme başarısız.')
    }
  }

  if (loading) return (
    <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', color:'#6366f1'}}>
        <h3>Yükleniyor...</h3>
    </div>
  )

  return (
    <div style={styles.pageContainer}>
      <div style={styles.card}>
        
        <div style={styles.banner}></div>

        <div style={styles.headerContent}>
            <div style={styles.avatarContainer}>
                <img 
                    src={previewUrl || (profileData?.profile_image ? (profileData.profile_image.startsWith('http') ? profileData.profile_image : `http://127.0.0.1:5000${profileData.profile_image}`) : "https://cdn-icons-png.flaticon.com/512/3135/3135715.png")} 
                    alt="Profil" 
                    style={styles.avatar} 
                />
                {isEditing && (
                    <label style={styles.cameraButton} title="Fotoğrafı Değiştir">
                        📷
                        <input type="file" onChange={handleImageChange} accept="image/*" style={{display:'none'}} />
                    </label>
                )}
            </div>
            
            <h2 style={styles.username}>{profileData?.username}</h2>
            <p style={styles.email}>{profileData?.email}</p>
        </div>

        <div style={styles.bodyContent}>
            <form onSubmit={handleSave}>
                
                {/* --- KONUM SEÇİMİ (COMBO BOX) --- */}
                <div style={styles.inputGroup}>
                    <label style={styles.label}>📍 Konum</label>
                    {isEditing ? (
                        <div style={{display: 'flex', gap: '10px'}}>
                            {/* İL SEÇİMİ */}
                            <select 
                                value={selectedCity} 
                                onChange={handleCityChange} 
                                style={styles.select}
                            >
                                <option value="">İl Seçiniz</option>
                                {cities.map(city => (
                                    <option key={city.slug} value={city.name}>{city.name}</option>
                                ))}
                            </select>

                            {/* İLÇE SEÇİMİ */}
                            <select 
                                value={selectedDistrict} 
                                onChange={(e) => setSelectedDistrict(e.target.value)} 
                                style={styles.select}
                                disabled={!selectedCity} // İl seçilmeden aktif olmaz
                            >
                                <option value="">İlçe Seçiniz</option>
                                {districts.map(dist => (
                                    <option key={dist.slug} value={dist.name}>{dist.name}</option>
                                ))}
                            </select>
                        </div>
                    ) : (
                        <div style={styles.readOnlyBox}>
                            {profileData?.location || 'Konum belirtilmedi'}
                        </div>
                    )}
                </div>

                <div style={styles.inputGroup}>
                    <label style={styles.label}>📝 Hakkında</label>
                    {isEditing ? (
                        <textarea 
                            value={bio} 
                            onChange={(e) => setBio(e.target.value)} 
                            style={styles.textarea} 
                            placeholder="Kendinizden bahsedin..."
                        />
                    ) : (
                        <div style={styles.readOnlyBox}>
                            {profileData?.bio || 'Hakkında bilgisi yok.'}
                        </div>
                    )}
                </div>

                <div style={styles.actionButtons}>
                    {isEditing ? (
                        <>
                            <button type="button" onClick={() => {setIsEditing(false); setPreviewUrl(null);}} style={styles.cancelBtn}>
                                İptal
                            </button>
                            <button type="submit" style={styles.saveBtn}>
                                Kaydet
                            </button>
                        </>
                    ) : (
                        <button type="button" onClick={(e) => { e.preventDefault(); setIsEditing(true); }} style={styles.editBtn}>
                            Profili Düzenle
                        </button>
                    )}
                </div>
            </form>

            {!isEditing && (
                <div style={styles.footer}>
                    <button onClick={logout} style={styles.logoutLink}>
                        Çıkış Yap
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  pageContainer: {
    minHeight: '100vh',
    backgroundColor: '#f3f4f6', 
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center', 
    padding: '20px',
    fontFamily: '"Segoe UI", sans-serif'
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: 'white',
    borderRadius: '24px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.08)',
    overflow: 'hidden',
    position: 'relative'
  },
  banner: {
    height: '140px',
    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', 
  },
  headerContent: {
    marginTop: '-70px', 
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingBottom: '20px'
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: '10px'
  },
  avatar: {
    width: '130px',
    height: '130px',
    borderRadius: '50%',
    border: '5px solid white',
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
    objectFit: 'cover',
    backgroundColor: 'white'
  },
  cameraButton: {
    position: 'absolute',
    bottom: '5px',
    right: '5px',
    backgroundColor: '#1f2937',
    color: 'white',
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
    fontSize: '18px',
    transition: 'transform 0.2s'
  },
  username: { margin: '5px 0', fontSize: '24px', fontWeight: '700', color: '#1f2937' },
  email: { margin: '0', fontSize: '14px', color: '#6b7280' },
  bodyContent: { padding: '0 30px 40px 30px' },
  inputGroup: { marginBottom: '20px' },
  label: { display: 'block', fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '6px', textTransform: 'uppercase' },
  readOnlyBox: { padding: '12px 0', borderBottom: '1px solid #e5e7eb', color: '#374151', fontSize: '15px' },
  
  // --- YENİ SELECT STİLİ ---
  select: {
    flex: 1, // Yan yana eşit alan kaplasınlar
    padding: '12px 10px',
    borderRadius: '10px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    outline: 'none',
    backgroundColor: '#f9fafb',
    cursor: 'pointer',
    color: '#374151'
  },

  textarea: { width: '100%', padding: '12px 15px', borderRadius: '10px', border: '1px solid #d1d5db', fontSize: '15px', outline: 'none', minHeight: '80px', backgroundColor: '#f9fafb', fontFamily: 'inherit', resize: 'vertical' },
  actionButtons: { display: 'flex', gap: '10px', marginTop: '30px' },
  editBtn: { width: '100%', padding: '12px', backgroundColor: '#6366f1', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', fontSize: '15px', boxShadow: '0 4px 6px rgba(99, 102, 241, 0.2)' },
  saveBtn: { flex: 2, padding: '12px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', fontSize: '15px' },
  cancelBtn: { flex: 1, padding: '12px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '600', cursor: 'pointer', fontSize: '15px' },
  footer: { marginTop: '20px', textAlign: 'center', borderTop: '1px solid #f3f4f6', paddingTop: '20px' },
  logoutLink: { background: 'none', border: 'none', color: '#ef4444', fontSize: '14px', fontWeight: '500', cursor: 'pointer', textDecoration: 'underline' }
}
 
export default Profile