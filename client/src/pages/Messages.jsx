import { useState, useEffect, useRef, useContext } from 'react'
import axiosClient from '../api/axiosClient'
import { toast } from 'react-toastify'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext'

function Messages() {
  const navigate = useNavigate()
  
  // Navbar'daki bildirim göstergesi için Context'i kullanıyoruz
  const { setUnreadCount } = useContext(AuthContext);

  const [conversations, setConversations] = useState([]) 
  const [selectedUser, setSelectedUser] = useState(null) 
  const [chatHistory, setChatHistory] = useState([])     
  const [newMessage, setNewMessage] = useState('')       
  const [loading, setLoading] = useState(true)

  const messagesEndRef = useRef(null)

  const getUserID = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
        try {
            return JSON.parse(userStr).id;
        } catch (e) {
            return null;
        }
    }
    return null;
  };
  const currentUserId = getUserID();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
        navigate('/login')
        return
    }
    fetchConversations()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [chatHistory])

  const fetchConversations = async () => {
    try {
        const res = await axiosClient.get('/messages/conversations')
        
        // --- GÜNCELLEME: Rastgele sayı kaldırıldı ---
        const formattedData = res.data.map(conv => {
            return {
                ...conv,
                // Backend 'is_unread' gönderiyorsa onu al, yoksa varsayılan false olsun (veya true)
                is_unread: conv.is_unread !== undefined ? conv.is_unread : true 
            };
        })
        
        setConversations(formattedData)
        
        // Navbar'daki sayıyı güncelle (Kaç farklı kişiden okunmamış mesaj var)
        const totalUnread = formattedData.filter(c => c.is_unread).length;
        setUnreadCount(totalUnread);
        
        setLoading(false)
    } catch (error) {
        console.error(error)
        toast.error("Mesajlar yüklenemedi.")
    }
  }

  const selectUser = async (user) => {
    setSelectedUser(user)

    // Mesajı okundu olarak işaretle
    if (user.is_unread) {
        setConversations(prev => prev.map(c => 
            c.user_id === user.user_id ? { ...c, is_unread: false } : c
        ))
        
        // Navbar'daki bildirim sayısını 1 azalt
        setUnreadCount(prev => (prev > 0 ? prev - 1 : 0));
    }

    try {
        const res = await axiosClient.get(`/messages/${user.user_id}`)
        setChatHistory(res.data)
    } catch (error) {
        toast.error("Sohbet geçmişi alınamadı.")
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    try {
        await axiosClient.post('/messages/send', {
            receiver_id: selectedUser.user_id,
            content: newMessage
        })
        
        setChatHistory([...chatHistory, {
            id: Date.now(), 
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

  // --- HELPER: Avatar Gösterici ---
  const renderAvatar = (imageUrl, username, size = '45px') => {
      const hasImage = Boolean(imageUrl);
      const fullUrl = hasImage && !imageUrl.startsWith('http') 
          ? `http://127.0.0.1:5000${imageUrl}` 
          : imageUrl;

      return (
          <div style={{...styles.avatarBase, width: size, height: size}}>
              {hasImage ? (
                  <img 
                      src={fullUrl} 
                      alt={username} 
                      style={{width: '100%', height: '100%', objectFit: 'cover', display: 'block'}}
                      onError={(e) => { e.target.style.display = 'none'; }} 
                  />
              ) : (
                  <span style={{fontWeight:'bold', color:'#4b5563', fontSize: '1.2rem'}}>
                      {username?.charAt(0).toUpperCase()}
                  </span>
              )}
          </div>
      );
  };

  if (loading) return (
    <div style={{display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', color:'#6366f1'}}>
        <h3>Yükleniyor...</h3>
    </div>
  )

  return (
    <div style={styles.pageWrapper}>
        <div style={styles.container}>
        
        {/* SOL TARAF: KİŞİ LİSTESİ (SIDEBAR) */}
        <div style={styles.sidebar}>
            <div style={styles.sidebarHeader}>
                <h3 style={styles.headerTitle}>Gelen Kutusu</h3>
            </div>

            <div style={styles.userList}>
                {conversations.length === 0 ? (
                    <div style={styles.emptySidebar}>
                        <span style={{fontSize:'2rem'}}>📭</span>
                        <p>Henüz mesajınız yok.</p>
                    </div>
                ) : (
                    conversations.map(c => (
                        <div 
                            key={c.user_id} 
                            onClick={() => selectUser(c)}
                            style={{
                                ...styles.userItem,
                                backgroundColor: selectedUser?.user_id === c.user_id 
                                    ? '#f3f4f6' 
                                    : (c.is_unread ? '#eff6ff' : 'transparent'),
                                borderRight: selectedUser?.user_id === c.user_id 
                                    ? '4px solid #4f46e5' 
                                    : '4px solid transparent'
                            }}
                        >
                            <div style={styles.avatarContainer}>
                                {renderAvatar(c.profile_image, c.username)}
                            </div>
                            
                            <div style={styles.userInfo}>
                                <div style={{
                                    ...styles.userName, 
                                    fontWeight: c.is_unread ? '800' : '600',
                                    color: c.is_unread ? '#111827' : '#4b5563'
                                }}>
                                    {c.username}
                                </div>
                                <div style={{
                                    ...styles.lastMsg,
                                    fontWeight: c.is_unread ? '600' : '400',
                                    color: c.is_unread ? '#4f46e5' : '#6b7280'
                                }}>
                                    {c.last_message}
                                </div>
                            </div>

                            {/* --- Sağ Taraf: Saat ve Kırmızı Nokta --- */}
                            <div style={styles.metaInfo}>
                                <span style={styles.metaTime}>14:30</span>
                                {c.is_unread && (
                                    // Sadece kırmızı nokta (içinde sayı yok)
                                    <div style={styles.unreadBadge}></div>
                                )}
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
                    <div style={styles.chatHeader}>
                        <div style={styles.headerAvatar}>
                             {renderAvatar(selectedUser.profile_image, selectedUser.username, '40px')}
                        </div>
                        <div>
                            <h3 style={styles.chatUserName}>{selectedUser.username}</h3>
                            <span style={styles.statusText}>Çevrimiçi</span>
                        </div>
                    </div>

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
                                    backgroundColor: msg.is_me ? '#4f46e5' : 'white',
                                    color: msg.is_me ? 'white' : '#1f2937',
                                    borderRadius: msg.is_me ? '18px 18px 0 18px' : '18px 18px 18px 0',
                                    boxShadow: msg.is_me ? '0 4px 6px rgba(79, 70, 229, 0.2)' : '0 2px 4px rgba(0,0,0,0.05)'
                                }}>
                                    <div style={styles.msgContent}>{msg.content}</div>
                                    <div style={{
                                        ...styles.msgDate,
                                        color: msg.is_me ? 'rgba(255,255,255,0.7)' : '#9ca3af'
                                    }}>
                                        {msg.date}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    <form onSubmit={handleSendMessage} style={styles.inputArea}>
                        <input 
                            type="text" 
                            placeholder="Bir mesaj yazın..." 
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            style={styles.input}
                        />
                        <button type="submit" style={styles.sendBtn}>
                            <span style={{fontSize:'1.2rem', marginLeft:'2px'}}>➤</span>
                        </button>
                    </form>
                </>
            ) : (
                <div style={styles.emptyState}>
                    <div style={styles.emptyIcon}>💬</div>
                    <h3 style={{color:'#374151'}}>Sohbet Başlatın</h3>
                    <p style={{color:'#6b7280'}}>Mesajlaşmak için soldaki listeden bir kişi seçin.</p>
                </div>
            )}
        </div>

        </div>
    </div>
  )
}

// --- STYLES ---
const styles = {
  pageWrapper: {
    minHeight: '100vh',
    backgroundColor: '#f9fafb',
    display: 'flex',
    justifyContent: 'center',
    padding: '40px 20px',
    fontFamily: '"Segoe UI", sans-serif'
  },
  container: { 
    display: 'flex', 
    width: '100%',
    maxWidth: '1100px', 
    height: '75vh',
    backgroundColor: 'white', 
    borderRadius: '24px', 
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)', 
    overflow: 'hidden',
    border: '1px solid #e5e7eb'
  },
  
  // SOL TARAF (SIDEBAR)
  sidebar: { 
    width: '320px', 
    borderRight: '1px solid #e5e7eb', 
    display: 'flex', 
    flexDirection: 'column',
    backgroundColor: 'white'
  },
  sidebarHeader: { 
    padding: '25px 20px', 
    borderBottom: '1px solid #e5e7eb', 
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: { margin: 0, fontSize: '1.2rem', fontWeight: '800', color: '#111827' },
  
  userList: { overflowY: 'auto', flex: 1, padding: '10px' },
  emptySidebar: { textAlign: 'center', marginTop: '50px', color: '#9ca3af' },
  
  userItem: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: '12px', 
    padding: '12px 15px', 
    cursor: 'pointer', 
    borderRadius: '12px', 
    marginBottom: '5px',
    transition: 'all 0.2s ease',
    position: 'relative'
  },
  
  avatarContainer: {
    position: 'relative',
    display: 'flex',       
    alignItems: 'center',
    justifyContent: 'center',
    width: '45px',         
    height: '45px',        
    flexShrink: 0          
  },
  avatarBase: {
      borderRadius: '50%',
      backgroundColor: '#e5e7eb',
      color: '#4b5563',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 'bold',
      fontSize: '1.1rem',
      flexShrink: 0,
      overflow: 'hidden',
      border: '1px solid #d1d5db' 
  },

  userInfo: { 
    flex: 1, 
    overflow: 'hidden', 
    display:'flex', 
    flexDirection:'column', 
    justifyContent:'center' 
  },
  userName: { fontSize: '0.95rem' },
  lastMsg: { fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' },
  
  // --- SAĞ TARAF (METADATA) ---
  metaInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '8px', // Aralık biraz açıldı
    minWidth: '40px'
  },
  metaTime: {
    fontSize: '0.7rem',
    color: '#9ca3af',
    fontWeight: '500'
  },
  
  // GÜNCELLEME: Sadece Kırmızı Nokta Stili
  unreadBadge: {
    backgroundColor: '#ef4444', // Kırmızı
    width: '10px',              // Küçük boyut
    height: '10px',
    borderRadius: '50%',        // Tam yuvarlak
    boxShadow: '0 2px 4px rgba(239, 68, 68, 0.4)',
    flexShrink: 0
  },

  chatArea: { flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#fdfdfd' },
  
  chatHeader: { 
    padding: '15px 25px', 
    borderBottom: '1px solid #f3f4f6', 
    backgroundColor: 'white', 
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    boxShadow: '0 4px 6px -4px rgba(0,0,0,0.05)',
    zIndex: 10
  },
  headerAvatar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  chatUserName: { margin: 0, fontSize: '1.1rem', color: '#111827' },
  statusText: { fontSize: '0.8rem', color: '#10b981', fontWeight: '500' },

  messagesList: { 
    flex: 1, 
    padding: '30px', 
    overflowY: 'auto', 
    backgroundColor: '#f9fafb',
    display: 'flex', 
    flexDirection: 'column', 
    gap: '15px',
    backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 1px)',
    backgroundSize: '20px 20px'
  },
  
  messageRow: { display: 'flex', width: '100%' },
  bubble: { 
    maxWidth: '65%', 
    padding: '12px 18px', 
    position: 'relative',
    fontSize: '0.95rem',
    lineHeight: '1.5'
  },
  msgContent: { wordWrap: 'break-word' }, 
  
  msgDate: { fontSize:'0.7rem', textAlign:'right', marginTop:'6px', fontWeight: '500' },
  
  inputArea: { 
    padding: '20px', 
    borderTop: '1px solid #e5e7eb', 
    display: 'flex', 
    gap: '12px', 
    backgroundColor: 'white',
    alignItems: 'center'
  },
  input: { 
    flex: 1, 
    padding: '14px 20px', 
    borderRadius: '24px', 
    border: '1px solid #e5e7eb', 
    outline: 'none', 
    backgroundColor: '#f9fafb',
    fontSize: '1rem',
    transition: 'border-color 0.2s',
    color: '#374151'
  },
  sendBtn: { 
    backgroundColor: '#4f46e5', 
    color: 'white', 
    border: 'none', 
    width: '48px', 
    height: '48px', 
    borderRadius: '50%', 
    cursor: 'pointer', 
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 6px rgba(79, 70, 229, 0.3)',
    transition: 'transform 0.1s'
  },
  
  emptyState: { 
    flex: 1, 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center', 
    backgroundColor: '#f9fafb'
  },
  emptyIcon: { fontSize: '4rem', marginBottom: '20px', opacity: 0.5 }
}

export default Messages;