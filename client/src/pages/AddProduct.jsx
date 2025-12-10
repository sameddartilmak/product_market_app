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
    category: 'elektronik', // Varsayılan kategori
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
    
    // Basit doğrulama
    if (!formData.title || !formData.price) {
      toast.warning('Lütfen başlık ve fiyat alanlarını doldurun.')
      return
    }

    try {
      // Backend'e gönderirken Token eklememiz lazım (Çünkü korumalı rota)
      const token = localStorage.getItem('token')
      
      const config = {
        headers: {
          Authorization: `Bearer ${token}` // Kimlik kartımızı gösteriyoruz
        }
      }

      await axios.post('http://127.0.0.1:5000/api/products/', formData, config)
      
      toast.success('İlan başarıyla oluşturuldu!')
      
      // Başarılı olursa ana sayfaya yönlendir
      setTimeout(() => {
        navigate('/')
      }, 1500)

    } catch (error) {
      toast.error(error.response?.data?.message || 'Bir hata oluştu')
    }
  }

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', boxShadow: '0 0 10px rgba(0,0,0,0.1)', borderRadius: '8px' }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Yeni İlan Oluştur</h2>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
        {/* Başlık */}
        <div>
          <label>Ürün Adı:</label>
          <input 
            type="text" name="title" 
            value={formData.title} onChange={handleChange} 
            style={styles.input} required 
          />
        </div>

        {/* Fiyat */}
        <div>
          <label>Fiyat (TL):</label>
          <input 
            type="number" name="price" 
            value={formData.price} onChange={handleChange} 
            style={styles.input} required 
          />
        </div>

        {/* Kategori */}
        <div>
          <label>Kategori:</label>
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
          <label>Resim Linki (URL):</label>
          <input 
            type="text" name="image_url" 
            placeholder="https://ornek.com/resim.jpg"
            value={formData.image_url} onChange={handleChange} 
            style={styles.input} 
          />
        </div>

        {/* Açıklama */}
        <div>
          <label>Açıklama:</label>
          <textarea 
            name="description" 
            value={formData.description} onChange={handleChange} 
            rows="4"
            style={styles.input} 
          ></textarea>
        </div>

        <button type="submit" style={styles.button}>İlanı Yayınla</button>
      </form>
    </div>
  )
}

const styles = {
  input: {
    width: '100%',
    padding: '10px',
    marginTop: '5px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    fontSize: '16px'
  },
  button: {
    backgroundColor: '#2ecc71',
    color: 'white',
    padding: '12px',
    border: 'none',
    borderRadius: '4px',
    fontSize: '18px',
    cursor: 'pointer',
    marginTop: '10px'
  }
}

export default AddProduct