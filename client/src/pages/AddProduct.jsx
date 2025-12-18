// client/src/pages/AddProduct.jsx
import { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

function AddProduct() {
  const navigate = useNavigate()
  
  // --- STATE VE MANTIK KISMI (AYNEN KORUNDU) ---
  const [formData, setFormData] = useState({
    title: '', 
    description: '', 
    price: '', 
    category: 'elektronik', 
    listing_type: 'sale'
  })
  
  const [selectedFiles, setSelectedFiles] = useState([])

  const handleChange = (e) => {
    setFormData({ 
      ...formData, 
      [e.target.name]: e.target.value 
    })
  }

  const handleFileChange = (e) => {
    setSelectedFiles(e.target.files)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const data = new FormData()
    data.append('title', formData.title)
    data.append('description', formData.description)
    data.append('price', formData.price)
    data.append('category', formData.category)
    data.append('listing_type', formData.listing_type)

    for (let i = 0; i < selectedFiles.length; i++) {
        data.append('images', selectedFiles[i])
    }

    try {
      const token = localStorage.getItem('token')
      
      await axios.post('http://127.0.0.1:5000/api/products/', data, {
        headers: { 
            Authorization: `Bearer ${token}`
        }
      })
      
      toast.success('İlan başarıyla yayında! 🚀')
      
      setTimeout(() => {
        navigate('/')
      }, 1500)

    } catch (error) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Yükleme sırasında hata oluştu.')
    }
  }

  // --- TASARIM (JSX) KISMI ---
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        
        {/* Başlık Alanı */}
        <div style={styles.header}>
            <h2 style={styles.title}>Yeni İlan Oluştur</h2>
            <p style={styles.subtitle}>Ürününü binlerce kişiye ulaştır.</p>
        </div>
      
        <form onSubmit={handleSubmit} style={styles.form}>
        
            {/* Ürün Adı */}
            <div style={styles.formGroup}>
                <label style={styles.label}>Ürün Başlığı</label>
                <input 
                    type="text" name="title" 
                    value={formData.title} onChange={handleChange} 
                    style={styles.input} required 
                    placeholder="Örn: iPhone 13 Pro - Hatasız"
                />
            </div>

            {/* Yan Yana Alanlar: Fiyat ve Tür */}
            <div style={styles.row}>
                <div style={{flex: 1}}>
                    <label style={styles.label}>Fiyat (TL)</label>
                    <input 
                        type="number" name="price" 
                        value={formData.price} onChange={handleChange} 
                        style={styles.input} required 
                        placeholder="0.00"
                    />
                </div>
                <div style={{flex: 1}}>
                    <label style={styles.label}>İlan Türü</label>
                    <select name="listing_type" value={formData.listing_type} onChange={handleChange} style={styles.select}>
                        <option value="sale">Satılık 🏷️</option>
                        <option value="rent">Kiralık 📅</option>
                    </select>
                </div>
            </div>

            {/* Komisyon Hesaplama Kartı (Sadece Fiyat Girilince Görünür) */}
            {formData.price && (
                <div style={styles.calculationCard}>
                    <div style={styles.calcRow}>
                        <span style={styles.calcLabel}>Satış Fiyatı:</span>
                        <span style={{fontWeight:'600'}}>{parseFloat(formData.price).toFixed(2)} TL</span>
                    </div>
                    <div style={styles.calcRow}>
                        <span style={styles.calcLabel}>Hizmet Bedeli (%3):</span>
                        <span style={{color: '#e74c3c'}}>-{(formData.price * 0.03).toFixed(2)} TL</span>
                    </div>
                    <div style={{...styles.calcRow, borderTop: '1px solid #dee2e6', paddingTop: '8px', marginTop: '8px'}}>
                        <span style={{fontWeight:'bold', color:'#2d3436'}}>Kazancınız:</span>
                        <span style={{color: '#27ae60', fontWeight: 'bold', fontSize:'1.1rem'}}>
                            +{(formData.price * 0.97).toFixed(2)} TL
                        </span>
                    </div>
                </div>
            )}

            {/* Kategori */}
            <div style={styles.formGroup}>
                <label style={styles.label}>Kategori</label>
                <select name="category" value={formData.category} onChange={handleChange} style={styles.select}>
                    <option value="elektronik">📱 Elektronik</option>
                    <option value="mobilya">🛋️ Mobilya</option>
                    <option value="giyim">👕 Giyim</option>
                    {/* DÜZELTME: 'g' harfi yerine kamp emojisi eklendi */}
                    <option value="outdoor">🏕️ Outdoor / Kamp</option> 
                    <option value="arac">🚗 Araç & Parça</option>
                    <option value="diger">📦 Diğer</option>
                </select>
            </div>

            {/* Fotoğraf Yükleme Alanı - Daha Modern */}
            <div style={styles.uploadBox}>
                <div style={{textAlign: 'center'}}>
                    <span style={{fontSize: '2rem'}}>📷</span>
                    <p style={{margin: '5px 0', fontWeight:'500', color:'#555'}}>Fotoğrafları Buradan Seçin</p>
                    <small style={{color:'#888', display:'block', marginBottom:'10px'}}>Çoklu seçim yapabilirsiniz</small>
                </div>
                <input 
                    type="file" 
                    multiple 
                    onChange={handleFileChange}
                    accept="image/*" 
                    style={styles.fileInput}
                />
                {selectedFiles.length > 0 && (
                    <div style={{marginTop:'10px', color:'#27ae60', fontSize:'0.9rem', textAlign:'center'}}>
                        ✅ {selectedFiles.length} dosya seçildi
                    </div>
                )}
            </div>

            {/* Açıklama */}
            <div style={styles.formGroup}>
                <label style={styles.label}>Açıklama</label>
                <textarea 
                    name="description" 
                    value={formData.description} onChange={handleChange} 
                    rows="4"
                    style={styles.textarea} 
                    placeholder="Ürünün teknik özelliklerinden, kullanım durumundan ve varsa kusurlarından bahsedin..."
                ></textarea>
            </div>

            {/* Buton */}
            <button type="submit" style={styles.button}>
                İlanı Yayınla
            </button>
        </form>
      </div>
    </div>
  )
}

// --- MODERN STYLES OBJECT ---
const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f0f2f5', // Hafif gri arka plan (modern görünüm)
    padding: '40px 20px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start'
  },
  card: {
    width: '100%',
    maxWidth: '650px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)', // Yumuşak, modern gölge
    padding: '30px',
    boxSizing: 'border-box'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px',
    borderBottom: '1px solid #eee',
    paddingBottom: '20px'
  },
  title: {
    margin: '0',
    color: '#1a1a1a',
    fontSize: '24px',
    fontWeight: '700'
  },
  subtitle: {
    margin: '5px 0 0',
    color: '#666',
    fontSize: '14px'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  row: {
    display: 'flex',
    gap: '20px',
  },
  label: {
    marginBottom: '8px',
    fontWeight: '600',
    color: '#34495e',
    fontSize: '0.9rem'
  },
  input: {
    width: '100%',
    padding: '12px 15px',
    borderRadius: '8px',
    border: '1px solid #dde1e7',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s',
    backgroundColor: '#fdfdfd',
    boxSizing: 'border-box'
  },
  select: {
    width: '100%',
    padding: '12px 15px',
    borderRadius: '8px',
    border: '1px solid #dde1e7',
    fontSize: '15px',
    backgroundColor: 'white',
    cursor: 'pointer',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '12px 15px',
    borderRadius: '8px',
    border: '1px solid #dde1e7',
    fontSize: '15px',
    resize: 'vertical',
    fontFamily: 'inherit',
    minHeight: '100px',
    boxSizing: 'border-box'
  },
  calculationCard: {
    backgroundColor: '#f8f9fa',
    border: '1px solid #e9ecef',
    borderRadius: '8px',
    padding: '15px',
    fontSize: '0.9rem'
  },
  calcRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '6px'
  },
  calcLabel: {
    color: '#6c757d'
  },
  uploadBox: {
    border: '2px dashed #cbd5e0',
    borderRadius: '8px',
    padding: '20px',
    backgroundColor: '#f8fafc',
    position: 'relative',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  fileInput: {
    width: '100%',
    marginTop: '10px'
  },
  button: {
    backgroundColor: '#2ecc71',
    color: 'white',
    padding: '15px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '10px',
    boxShadow: '0 4px 6px rgba(46, 204, 113, 0.2)',
    transition: 'transform 0.1s, box-shadow 0.1s'
  }
}

export default AddProduct