// client/src/pages/AddProduct.jsx
import { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

function AddProduct() {
  const navigate = useNavigate()
  
  // Form verilerini tutan state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category: 'elektronik',
    listing_type: 'sale', // Varsayılan: Satılık
    image_url: ''
  })

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.title || !formData.price) {
      toast.warning('Lütfen başlık ve fiyat alanlarını doldurun.')
      return
    }

    try {
      const token = localStorage.getItem('token')
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      }

      await axios.post('http://127.0.0.1:5000/api/products/', formData, config)
      
      toast.success('İlan başarıyla oluşturuldu!')
      
      setTimeout(() => {
        navigate('/')
      }, 1500)

    } catch (error) {
      toast.error(error.response?.data?.message || 'Bir hata oluştu')
    }
  }

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', boxShadow: '0 0 10px rgba(0,0,0,0.1)', borderRadius: '8px', backgroundColor: 'white' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px', color: '#333' }}>Yeni İlan Oluştur</h2>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* Başlık */}
        <div>
          <label style={styles.label}>Ürün Adı:</label>
          <input 
            type="text" name="title" 
            value={formData.title} onChange={handleChange} 
            style={styles.input} required 
            placeholder="Örn: iPhone 13, Kamp Çadırı..."
          />
        </div>

        {/* Fiyat ve Hesaplama Alanı */}
        <div>
          <label style={styles.label}>Fiyat (TL):</label>
          <input 
            type="number" name="price" 
            value={formData.price} onChange={handleChange} 
            style={styles.input} required 
            placeholder="0.00"
          />
          
          {/* --- KOMİSYON HESAPLAMA ALANI --- */}
          {formData.price && (
            <div style={styles.calculationBox}>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '5px'}}>
                    <span>🔹 Hizmet Bedeli (%3):</span>
                    <span style={{color: '#e74c3c', fontWeight: 'bold'}}>-{(formData.price * 0.03).toFixed(2)} TL</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ddd', paddingTop: '5px'}}>
                    <span>💰 Hesabınıza Geçecek:</span>
                    <span style={{color: '#2ecc71', fontWeight: 'bold'}}>+{(formData.price * 0.97).toFixed(2)} TL</span>
                </div>
            </div>
          )}
          {/* -------------------------------- */}
        </div>

        {/* İlan Türü (Satılık / Kiralık) */}
        <div>
          <label style={styles.label}>İlan Türü:</label>
          <select name="listing_type" value={formData.listing_type} onChange={handleChange} style={styles.input}>
            <option value="sale">Satılık (Ürünü satıyorum)</option>
            <option value="rent">Kiralık (Günlük kiralıyorum)</option>
          </select>
        </div>

        {/* Kategori */}
        <div>
          <label style={styles.label}>Kategori:</label>
          <select name="category" value={formData.category} onChange={handleChange} style={styles.input}>
            <option value="elektronik">Elektronik</option>
            <option value="mobilya">Mobilya</option>
            <option value="giyim">Giyim</option>
            <option value="outdoor">Outdoor / Kamp</option>
            <option value="arac">Araç & Parça</option>
            <option value="diger">Diğer</option>
          </select>
        </div>

        {/* Resim URL */}
        <div>
          <label style={styles.label}>Resim Linki (URL):</label>
          <input 
            type="text" name="image_url" 
            placeholder="https://ornek.com/resim.jpg"
            value={formData.image_url} onChange={handleChange} 
            style={styles.input} 
          />
        </div>

        {/* Açıklama */}
        <div>
          <label style={styles.label}>Açıklama:</label>
          <textarea 
            name="description" 
            value={formData.description} onChange={handleChange} 
            rows="4"
            style={styles.input} 
            placeholder="Ürünün özelliklerinden bahsedin..."
          ></textarea>
        </div>

        <button type="submit" style={styles.button}>İlanı Yayınla</button>
      </form>
    </div>
  )
}

const styles = {
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    color: '#555'
  },
  input: {
    width: '100%',
    padding: '10px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '16px',
    boxSizing: 'border-box' // Padding taşmasını önler
  },
  calculationBox: {
    marginTop: '8px',
    backgroundColor: '#f8f9fa',
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #e9ecef',
    fontSize: '0.9rem',
    color: '#495057'
  },
  button: {
    backgroundColor: '#2ecc71',
    color: 'white',
    padding: '12px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '18px',
    cursor: 'pointer',
    marginTop: '10px',
    fontWeight: 'bold',
    transition: 'background 0.3s'
  }
}

export default AddProduct