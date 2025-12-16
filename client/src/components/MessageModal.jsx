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
        onClose() // Pencereyi kapat

    } catch (error) {
        toast.error("Mesaj gönderilemedi.")
    } finally {
        setSending(false)
    }
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
            <h3>Satıcıya Mesaj Gönder</h3>
            <button onClick={onClose} style={styles.closeBtn}>X</button>
        </div>
        
        <p style={{color:'#666', fontSize:'0.9rem', marginBottom:'10px'}}>
            <strong>Ürün:</strong> {productTitle}
        </p>

        <textarea 
            rows="5" 
            placeholder="Merhaba, ürün hala satılık mı? Son fiyat ne olur?" 
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={styles.textarea}
        ></textarea>

        <div style={styles.footer}>
            <button onClick={onClose} style={styles.cancelBtn}>İptal</button>
            <button onClick={handleSend} style={styles.sendBtn} disabled={sending}>
                {sending ? 'Gönderiliyor...' : 'Gönder ➤'}
            </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', // Arka planı karart
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    backgroundColor: 'white', width: '90%', maxWidth: '500px',
    padding: '20px', borderRadius: '10px', boxShadow: '0 5px 15px rgba(0,0,0,0.3)'
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px'
  },
  closeBtn: { background:'none', border:'none', fontSize:'1.2rem', cursor:'pointer' },
  textarea: {
    width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd',
    fontSize: '1rem', fontFamily: 'inherit', resize: 'vertical'
  },
  footer: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '15px' },
  cancelBtn: { padding: '10px 20px', backgroundColor: '#ccc', border: 'none', borderRadius: '5px', cursor: 'pointer' },
  sendBtn: { padding: '10px 20px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }
}

export default MessageModal