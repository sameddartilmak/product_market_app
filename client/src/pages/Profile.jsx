// client/src/pages/Profile.jsx
import { useEffect, useState, useContext } from 'react'
import axios from 'axios'
import { AuthContext } from '../context/AuthContext'
import { toast } from 'react-toastify'
// İkonlar için basit bir emoji kullanımı devam ediyor, 
// ancak tasarım bunları daha profesyonel gösterecek.

function Profile() {
  // --- MANTIK KISMI (AYNEN KORUNDU) ---
  const { logout, updateUser } = useContext(AuthContext)
  
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)

  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('token')
        if (!token) return;

        const res = await axios.get('http://127.0.0.1:5000/api/auth/profile', {
            headers: { Authorization: `Bearer ${token}` }
        })
        setProfileData(res.data)
        setBio(res.data.bio || '')
        setLocation(res.data.location || '')
      } catch (error) {
        console.error("Profil çekme hatası:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      setPreviewUrl(URL.createObjectURL(file)) 
    }
  }

  const handleSave = async (e) => {
    e.preventDefault() 
    
    const formData = new FormData()
    formData.append('bio', bio)
    formData.append('location', location)
    
    if (imageFile) {
        formData.append('profile_image', imageFile)
    }

    try {
        const token = localStorage.getItem('token')
        const res = await axios.put('http://127.0.0.1:5000/api/auth/profile', formData, {
            headers: { Authorization: `Bearer ${token}` }
        })
        
        setProfileData(res.data.user) 
        
        if (updateUser) {
            updateUser(res.data.user)
        } else {
            console.warn("⚠️ Uyarı: updateUser fonksiyonu bulunamadı!")
        }

        toast.success('Profil güncellendi! 🎉')
        setIsEditing(false) 
        setPreviewUrl(null) 

    } catch (error) {
        console.error("❌ Kaydetme Hatası Detayı:", error)
        if (error.response && error.response.status === 200) {
             setIsEditing(false)
             toast.success('Profil güncellendi.')
        } else {
             toast.error('Güncelleme sırasında bir hata oluştu.')
        }
    }
  }

  if (loading) return (
    <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', color:'#6366f1'}}>
        <h3>Yükleniyor...</h3>
    </div>
  )

  // --- YENİ TASARIM (JSX) ---
  return (
    <div style={styles.pageContainer}>
      <div style={styles.card}>
        
        {/* Dekoratif Arka Plan (Banner) */}
        <div style={styles.banner}></div>

        {/* Profil Resmi Alanı */}
        <div style={styles.headerContent}>
            <div style={styles.avatarContainer}>
                <img 
                    src={previewUrl || profileData?.profile_image || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} 
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

        {/* Form Alanı */}
        <div style={styles.bodyContent}>
            <form onSubmit={handleSave}>
                
                {/* Konum */}
                <div style={styles.inputGroup}>
                    <label style={styles.label}>📍 Konum</label>
                    {isEditing ? (
                        <input 
                            type="text" 
                            value={location} 
                            onChange={(e) => setLocation(e.target.value)} 
                            style={styles.input} 
                            placeholder="Şehir, Ülke"
                        />
                    ) : (
                        <div style={styles.readOnlyBox}>
                            {profileData?.location || 'Konum belirtilmedi'}
                        </div>
                    )}
                </div>

                {/* Hakkında */}
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

                {/* Butonlar */}
                <div style={styles.actionButtons}>
                    {isEditing ? (
                        <>
                            <button type="button" onClick={() => {setIsEditing(false); setPreviewUrl(null);}} style={styles.cancelBtn}>
                                İptal
                            </button>
                            <button type="submit" style={styles.saveBtn}>
                                Değişiklikleri Kaydet
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

// --- YENİ CSS STİLLERİ (Object Styles) ---
const styles = {
  pageContainer: {
    minHeight: '100vh',
    backgroundColor: '#f3f4f6', // Çok açık gri arka plan
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center', // Dikeyde ortala
    padding: '20px',
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif'
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
    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', // Mor-Mavi gradient
  },
  headerContent: {
    marginTop: '-70px', // Avatarı yukarı kaydırır
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
  username: {
    margin: '5px 0',
    fontSize: '24px',
    fontWeight: '700',
    color: '#1f2937'
  },
  email: {
    margin: '0',
    fontSize: '14px',
    color: '#6b7280'
  },
  bodyContent: {
    padding: '0 30px 40px 30px'
  },
  inputGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    fontSize: '13px',
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: '6px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  readOnlyBox: {
    padding: '12px 0',
    borderBottom: '1px solid #e5e7eb',
    color: '#374151',
    fontSize: '15px'
  },
  input: {
    width: '100%',
    padding: '12px 15px',
    borderRadius: '10px',
    border: '1px solid #d1d5db',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s',
    backgroundColor: '#f9fafb'
  },
  textarea: {
    width: '100%',
    padding: '12px 15px',
    borderRadius: '10px',
    border: '1px solid #d1d5db',
    fontSize: '15px',
    outline: 'none',
    minHeight: '80px',
    backgroundColor: '#f9fafb',
    fontFamily: 'inherit',
    resize: 'vertical'
  },
  actionButtons: {
    display: 'flex',
    gap: '10px',
    marginTop: '30px'
  },
  editBtn: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#6366f1', // İndigo rengi
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '15px',
    boxShadow: '0 4px 6px rgba(99, 102, 241, 0.2)',
    transition: 'transform 0.1s'
  },
  saveBtn: {
    flex: 2,
    padding: '12px',
    backgroundColor: '#10b981', // Yeşil
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '15px'
  },
  cancelBtn: {
    flex: 1,
    padding: '12px',
    backgroundColor: '#ef4444', // Kırmızı
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '15px'
  },
  footer: {
    marginTop: '20px',
    textAlign: 'center',
    borderTop: '1px solid #f3f4f6',
    paddingTop: '20px'
  },
  logoutLink: {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    textDecoration: 'underline'
  }
}

export default Profile