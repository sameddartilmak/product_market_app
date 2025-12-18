// client/src/components/MessageModal.jsx
import { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'

function MessageModal({ isOpen, onClose, receiverId, productId, productTitle }) {
  const [content, setContent] = useState('')
  const [sending, setSending] = useState(false)

  if (!isOpen) return null

  const handleSend = async () => {
    if (!content.trim()) {
        toast.warning("Boş mesaj gönderilemez.")
        return
    }

    const token = localStorage.getItem('token')
    if (!token) {
        toast.error("Giriş yapmalısınız!")
        return
    }

    setSending(true)
    try {
        await axios.post('http://127.0.0.1:5000/api/messages/send', {
            receiver_id: receiverId,
            product_id: productId,
            content: content
        }, {
            headers: { Authorization: `Bearer ${token}` }
        })

        toast.success("Mesaj gönderildi! 📨")
        setContent('')
        onClose() 

    } catch (error) {
        toast.error("Mesaj gönderilemedi.")
    } finally {
        setSending(false)
    }
  }

  // --- TASARIM KISMI ---
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        
        {/* Başlık ve Kapat Butonu */}
        <div style={styles.header}>
            <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                <span style={{fontSize:'1.5rem'}}>💬</span>
                <h3 style={styles.title}>Satıcıya Sor</h3>
            </div>
            <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>
        
        {/* Ürün Bilgisi Kartı (Context) */}
        <div style={styles.productBadge}>
            <span style={{color:'#666', fontSize:'0.85rem'}}>İlgili Ürün:</span>
            <div style={styles.productTitle}>
                🛍️ {productTitle}
            </div>
        </div>

        {/* Mesaj Yazma Alanı */}
        <div style={{marginBottom: '20px'}}>
            <label style={styles.label}>Mesajınız</label>
            <textarea 
                rows="5" 
                placeholder="Merhaba, ürün hala satılık mı? Son fiyat ne olur?" 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                style={styles.textarea}
            ></textarea>
        </div>

        {/* Aksiyon Butonları */}
        <div style={styles.footer}>
            <button onClick={onClose} style={styles.cancelBtn}>
                Vazgeç
            </button>
            <button onClick={handleSend} style={styles.sendBtn} disabled={sending}>
                {sending ? 'Gönderiliyor...' : 'Gönder ➤'}
            </button>
        </div>
      </div>
    </div>
  )
}

// --- MODERN STYLES ---
const styles = {
  overlay: {
    position: 'fixed', 
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)', // Biraz daha koyu
    backdropFilter: 'blur(5px)',        // Arka planı bulanıklaştırır (Buzlu cam etkisi)
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    zIndex: 1000,
    animation: 'fadeIn 0.2s ease-out'
  },
  modal: {
    backgroundColor: '#ffffff', 
    width: '90%', 
    maxWidth: '500px',
    padding: '25px', 
    borderRadius: '16px', // Daha oval köşeler
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)', // Derinlik katan gölge
    display: 'flex',
    flexDirection: 'column',
    position: 'relative'
  },
  header: {
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: '20px', 
    borderBottom: '1px solid #f0f0f0', 
    paddingBottom: '15px'
  },
  title: {
    margin: 0,
    fontSize: '1.25rem',
    color: '#333',
    fontWeight: '700'
  },
  closeBtn: { 
    background: '#f1f3f5', 
    border: 'none', 
    fontSize: '1.5rem', 
    cursor: 'pointer',
    color: '#868e96',
    width: '32px',
    height: '32px',
    borderRadius: '50%', // Yuvarlak kapatma butonu
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s'
  },
  productBadge: {
    backgroundColor: '#f8f9fa',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    border: '1px solid #e9ecef'
  },
  productTitle: {
    fontWeight: '600',
    color: '#2c3e50',
    marginTop: '4px',
    fontSize: '1rem'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '500',
    color: '#555',
    fontSize: '0.9rem'
  },
  textarea: {
    width: '100%', 
    padding: '12px', 
    borderRadius: '8px', 
    border: '1px solid #dde1e7',
    fontSize: '0.95rem', 
    fontFamily: 'inherit', 
    resize: 'none', // Boyutlandırmayı kapattık, daha temiz durur
    outline: 'none',
    boxSizing: 'border-box',
    backgroundColor: '#fff',
    minHeight: '120px'
  },
  footer: { 
    display: 'flex', 
    justifyContent: 'flex-end', 
    gap: '12px', 
    marginTop: '10px' 
  },
  cancelBtn: { 
    padding: '10px 20px', 
    backgroundColor: 'transparent', 
    border: '1px solid #dee2e6', 
    borderRadius: '8px', 
    cursor: 'pointer',
    color: '#6c757d',
    fontWeight: '500',
    fontSize: '0.95rem'
  },
  sendBtn: { 
    padding: '10px 24px', 
    backgroundColor: '#3498db', // Ana tema rengi
    color: 'white', 
    border: 'none', 
    borderRadius: '8px', 
    cursor: 'pointer', 
    fontWeight: '600',
    fontSize: '0.95rem',
    boxShadow: '0 4px 6px rgba(52, 152, 219, 0.2)'
  }
}

export default MessageModal