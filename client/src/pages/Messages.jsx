// client/src/pages/Messages.jsx
import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'

function Messages() {
  const navigate = useNavigate()
  
  // State'ler
  const [conversations, setConversations] = useState([]) // Sol menüdeki kişiler
  const [selectedUser, setSelectedUser] = useState(null) // Şu an kimle konuşuyoruz?
  const [chatHistory, setChatHistory] = useState([])     // Mesaj balonları
  const [newMessage, setNewMessage] = useState('')       // Yazılan cevap
  const [loading, setLoading] = useState(true)

  // Otomatik kaydırma için referans
  const messagesEndRef = useRef(null)

  const token = localStorage.getItem('token')
  const currentUserId = parseInt(localStorage.getItem('user_id'))

  useEffect(() => {
    if (!token) {
        navigate('/login')
        return
    }
    fetchConversations()
  }, [])

  // Mesaj atınca veya sohbet değişince en alta kaydır
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatHistory])

  // 1. Konuşma Listesini Getir
  const fetchConversations = async () => {
    try {
        const res = await axios.get('http://127.0.0.1:5000/api/messages/conversations', {
            headers: { Authorization: `Bearer ${token}` }
        })
        setConversations(res.data)
        setLoading(false)
    } catch (error) {
        console.error(error)
        toast.error("Mesajlar yüklenemedi.")
    }
  }

  // 2. Bir Kişiye Tıklayınca Mesajları Getir
  const selectUser = async (user) => {
    setSelectedUser(user)
    try {
        const res = await axios.get(`http://127.0.0.1:5000/api/messages/${user.user_id}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        setChatHistory(res.data)
    } catch (error) {
        toast.error("Sohbet geçmişi alınamadı.")
    }
  }

  // 3. Cevap Yaz ve Gönder
  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    try {
        await axios.post('http://127.0.0.1:5000/api/messages/send', {
            receiver_id: selectedUser.user_id,
            content: newMessage
        }, {
            headers: { Authorization: `Bearer ${token}` }
        })
        
        // Mesajı listeye ekle (Backend'den tekrar çekmeden hızlıca ekranda gösterelim)
        setChatHistory([...chatHistory, {
            id: Date.now(), // Geçici ID
            sender_id: currentUserId,
            content: newMessage,
            is_me: true,
            date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }])
        
        setNewMessage('')
        
    } catch (error) {
        toast.error("Mesaj gönderilemedi.")
    }
  }

  if (loading) return <div style={{textAlign:'center', marginTop:'50px'}}>Mesajlar yükleniyor...</div>

  return (
    <div style={styles.container}>
      
      {/* SOL TARA: KİŞİ LİSTESİ */}
      <div style={styles.sidebar}>
        <h3 style={styles.sidebarHeader}>Mesajlar</h3>
        <div style={styles.userList}>
            {conversations.length === 0 ? (
                <p style={{padding:'20px', color:'#999'}}>Henüz mesajınız yok.</p>
            ) : (
                conversations.map(c => (
                    <div 
                        key={c.user_id} 
                        onClick={() => selectUser(c)}
                        style={{
                            ...styles.userItem,
                            backgroundColor: selectedUser?.user_id === c.user_id ? '#e3f2fd' : 'white'
                        }}
                    >
                        <div style={styles.avatar}>{c.username.charAt(0).toUpperCase()}</div>
                        <div style={{overflow:'hidden'}}>
                            <div style={{fontWeight:'bold'}}>{c.username}</div>
                            <div style={styles.lastMsg}>{c.last_message}</div>
                        </div>
                    </div>
                ))
            )}
        </div>
      </div>

      {/* SAĞ TARAF: SOHBET EKRANI */}
      <div style={styles.chatArea}>
        {selectedUser ? (
            <>
                {/* Sohbet Başlığı */}
                <div style={styles.chatHeader}>
                    <h3 style={{margin:0}}>{selectedUser.username}</h3>
                </div>

                {/* Mesaj Balonları */}
                <div style={styles.messagesList}>
                    {chatHistory.map((msg) => (
                        <div 
                            key={msg.id} 
                            style={{
                                ...styles.messageRow,
                                justifyContent: msg.is_me ? 'flex-end' : 'flex-start'
                            }}
                        >
                            <div style={{
                                ...styles.bubble,
                                backgroundColor: msg.is_me ? '#3498db' : '#ecf0f1',
                                color: msg.is_me ? 'white' : 'black',
                                borderBottomRightRadius: msg.is_me ? '0' : '10px',
                                borderBottomLeftRadius: msg.is_me ? '10px' : '0'
                            }}>
                                <div>{msg.content}</div>
                                <div style={{
                                    fontSize:'0.7rem', 
                                    textAlign:'right', 
                                    marginTop:'5px', 
                                    opacity:0.8
                                }}>{msg.date}</div>
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                {/* Mesaj Yazma Kutusu */}
                <form onSubmit={handleSendMessage} style={styles.inputArea}>
                    <input 
                        type="text" 
                        placeholder="Bir mesaj yazın..." 
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        style={styles.input}
                    />
                    <button type="submit" style={styles.sendBtn}>➤</button>
                </form>
            </>
        ) : (
            <div style={styles.emptyState}>
                <h3>💬 Sohbet Seçin</h3>
                <p>Mesajlaşmak için soldan bir kişi seçin.</p>
            </div>
        )}
      </div>

    </div>
  )
}

const styles = {
  container: { display: 'flex', height: '600px', backgroundColor: 'white', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)', overflow: 'hidden', margin: '40px auto', maxWidth: '1000px' },
  
  sidebar: { width: '300px', borderRight: '1px solid #eee', display: 'flex', flexDirection: 'column' },
  sidebarHeader: { padding: '20px', borderBottom: '1px solid #eee', margin: 0, backgroundColor: '#f8f9fa' },
  userList: { overflowY: 'auto', flex: 1 },
  userItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '15px', cursor: 'pointer', borderBottom: '1px solid #f1f1f1', transition: 'background 0.2s' },
  avatar: { width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#34495e', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' },
  lastMsg: { fontSize: '0.85rem', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' },
  
  chatArea: { flex: 1, display: 'flex', flexDirection: 'column' },
  chatHeader: { padding: '15px 20px', borderBottom: '1px solid #eee', backgroundColor: '#fff', fontWeight: 'bold' },
  messagesList: { flex: 1, padding: '20px', overflowY: 'auto', backgroundColor: '#f5f7f9', display: 'flex', flexDirection: 'column', gap: '10px' },
  
  messageRow: { display: 'flex', width: '100%' },
  bubble: { maxWidth: '70%', padding: '10px 15px', borderRadius: '10px', boxShadow: '0 1px 2px rgba(0,0,0,0.1)', wordWrap: 'break-word' },
  
  inputArea: { padding: '15px', borderTop: '1px solid #eee', display: 'flex', gap: '10px', backgroundColor: 'white' },
  input: { flex: 1, padding: '10px', borderRadius: '20px', border: '1px solid #ddd', outline: 'none' },
  sendBtn: { backgroundColor: '#3498db', color: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', fontSize: '1.2rem' },
  
  emptyState: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#999' }
}

export default Messages