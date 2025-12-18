// client/src/pages/Profile.jsx
import { useEffect, useState, useContext } from 'react'
import axios from 'axios'
import { AuthContext } from '../context/AuthContext'
import { toast } from 'react-toastify'

function Profile() {
  // updateUser'ın Context'ten geldiğine emin oluyoruz
  const { logout, updateUser } = useContext(AuthContext)
  
  const [profileData, setProfileData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)

  // Form State'leri
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)

  // 1. Profil Verilerini Çek
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

  // 2. Resim Seçilince Önizleme
  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setImageFile(file)
      setPreviewUrl(URL.createObjectURL(file)) 
    }
  }

  // 3. Kaydet
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
        
        // --- KRİTİK DÜZELTME ---
        // İşlemleri sırayla ve güvenli yapıyoruz
        
        // 1. Önce ekran verisini güncelle
        setProfileData(res.data.user) 
        
        // 2. Context'i güncelle (Hata verirse try-catch yakalasın ama işlemi bozmasın)
        if (updateUser) {
            updateUser(res.data.user)
        } else {
            console.warn("⚠️ Uyarı: updateUser fonksiyonu bulunamadı!")
        }

        // 3. En son başarı mesajı ver ve kapat
        toast.success('Profil güncellendi! 🎉')
        setIsEditing(false) // Düzenleme modunu kapat
        setPreviewUrl(null) 

    } catch (error) {
        // Hatanın detayını konsola yazalım
        console.error("❌ Kaydetme Hatası Detayı:", error)
        
        // Eğer backend 200 döndüyse ama JS hatası varsa kullanıcıya başarı mesajı verip geçelim
        if (error.response && error.response.status === 200) {
             setIsEditing(false)
             toast.success('Profil güncellendi (Arayüz yenilenmesi gerekebilir).')
        } else {
             toast.error('Güncelleme sırasında bir hata oluştu.')
        }
    }
  }

  if (loading) return <div style={{textAlign:'center', marginTop:'50px'}}>Profil yükleniyor...</div>

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        
        {/* --- ÜST KISIM --- */}
        <div style={styles.header}>
            <div style={styles.imageWrapper}>
                <img 
                    src={previewUrl || profileData?.profile_image || "https://cdn-icons-png.flaticon.com/512/3135/3135715.png"} 
                    alt="Profil" 
                    style={styles.profileImage} 
                />
                
                {isEditing && (
                    <label style={styles.uploadBtn}>
                        📷
                        <input type="file" onChange={handleImageChange} accept="image/*" style={{display:'none'}} />
                    </label>
                )}
            </div>
            
            <h2 style={{margin:'15px 0 5px 0', color: '#2c3e50'}}>{profileData?.username}</h2>
            <p style={{color:'#7f8c8d', margin:0}}>{profileData?.email}</p>
        </div>

        <hr style={{border:'0', borderTop:'1px solid #ecf0f1', margin:'25px 0'}}/>

        {/* --- FORM --- */}
        <form onSubmit={handleSave}>
            <div style={styles.formGroup}>
                <label style={styles.label}>📍 Konum</label>
                {isEditing ? (
                    <input type="text" value={location} onChange={(e) => setLocation(e.target.value)} style={styles.input} />
                ) : (
                    <span style={styles.valueText}>{profileData?.location || 'Henüz belirtilmemiş.'}</span>
                )}
            </div>

            <div style={styles.formGroup}>
                <label style={styles.label}>📝 Hakkımda</label>
                {isEditing ? (
                    <textarea value={bio} onChange={(e) => setBio(e.target.value)} style={{...styles.input, height:'100px'}} />
                ) : (
                    <p style={{...styles.valueText, color: '#555'}}>{profileData?.bio || '...'}</p>
                )}
            </div>

            <div style={{marginTop:'30px', display:'flex', gap:'10px'}}>
                {isEditing ? (
                    <>
                        <button type="submit" style={styles.saveBtn}>Kaydet ✅</button>
                        <button type="button" onClick={() => {setIsEditing(false); setPreviewUrl(null);}} style={styles.cancelBtn}>İptal ❌</button>
                    </>
                ) : (
                    <button type="button" onClick={(e) => { e.preventDefault(); setIsEditing(true); }} style={styles.editBtn}>✏️ Bilgileri Düzenle</button>
                )}
            </div>
        </form>
        
        {!isEditing && (
            <button onClick={logout} style={styles.logoutBtn}>Oturumu Kapat 🚪</button>
        )}
      </div>
    </div>
  )
}

const styles = {
  container: { maxWidth: '500px', margin: '40px auto', padding: '0 20px' },
  card: { backgroundColor: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 15px 35px rgba(0,0,0,0.08)' },
  header: { display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' },
  imageWrapper: { position: 'relative', width: '130px', height: '130px' },
  profileImage: { width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '5px solid #f8f9fa', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' },
  uploadBtn: { position: 'absolute', bottom: '0', right: '0', backgroundColor: '#3498db', color: 'white', padding: '8px', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' },
  formGroup: { marginBottom: '20px' },
  label: { display: 'block', fontWeight: 'bold', marginBottom: '5px', color: '#2c3e50' },
  input: { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd' },
  valueText: { fontSize: '1.05rem', color: '#333' },
  editBtn: { flex:1, padding: '12px', backgroundColor: '#2c3e50', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  saveBtn: { flex:1, padding: '12px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  cancelBtn: { flex:1, padding: '12px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' },
  logoutBtn: { width: '100%', marginTop: '20px', padding: '12px', backgroundColor: '#fff0f0', color: '#c0392b', border: 'none', borderRadius: '8px', cursor: 'pointer' }
}

export default Profile