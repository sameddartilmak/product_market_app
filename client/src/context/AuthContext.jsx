import { createContext, useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import axiosClient from '../api/axiosClient'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // --- Mesaj Sayısını Güncelleme ---
  const updateUnreadCount = async () => {
    // sessionStorage kontrolü (Login.jsx ile uyumlu)
    if (!sessionStorage.getItem('token')) return;

    try {
        const res = await axiosClient.get('/messages/conversations');
        
        // --- DÜZELTME BURADA ---
        // Eskiden: res.data.length (Tüm sohbet sayısını veriyordu)
        // Şimdi: Sadece is_unread değeri true olanları sayıyoruz.
        const unreadChats = res.data.filter(c => c.is_unread).length;
        setUnreadCount(unreadChats); 

    } catch (error) {
        console.error("Mesaj sayısı güncellenemedi:", error);
    }
  }

  // --- 1. Başlangıç Kontrolü (Sayfa Yenilenince) ---
  useEffect(() => {
    const checkUserLoggedIn = () => {
      try {
        // localStorage yerine sessionStorage kullanıyoruz
        const storedUser = sessionStorage.getItem('user')
        const storedToken = sessionStorage.getItem('token')
        const storedRole = sessionStorage.getItem('role')

        if (storedUser && storedToken) {
          const parsedUser = JSON.parse(storedUser);
          
          if (!parsedUser.role && storedRole) {
            parsedUser.role = storedRole;
          }
          
          setUser(parsedUser)
        }
      } catch (error) {
        console.error("❌ Auth verisi okunurken hata:", error)
        sessionStorage.clear(); // Hata varsa her şeyi temizle
      } finally {
        setLoading(false)
      }
    }

    checkUserLoggedIn()
  }, [])

  // --- Kullanıcı varsa mesaj sayısını takip et ---
  useEffect(() => {
    if (user) {
        updateUnreadCount(); 
        // 30 saniyede bir yeni mesaj var mı diye kontrol et
        const interval = setInterval(updateUnreadCount, 30000);
        return () => clearInterval(interval);
    }
  }, [user]);

  // --- 2. Giriş İşlemi ---
  const login = (userData, token) => {
    setUser(userData)
    
    // Login.jsx ile uyumlu: Verileri sessionStorage'a kaydediyoruz.
    // Böylece sekme kapanınca oturum biter, diğer sekmelerle karışmaz.
    sessionStorage.setItem('token', token) 
    sessionStorage.setItem('user', JSON.stringify(userData))
    
    if (userData.role) {
        sessionStorage.setItem('role', userData.role);
    }
    
    updateUnreadCount(); 

    toast.success(`Tekrar hoş geldin, ${userData.name || userData.username || 'Gezgin'}! 👋`)
  }

  // --- 3. Çıkış İşlemi ---
  const logout = () => {
    setUser(null)
    setUnreadCount(0)
    
    // Çıkışta sessionStorage temizlenir
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    sessionStorage.removeItem('role')
    
    toast.info("Başarıyla çıkış yapıldı. Görüşmek üzere! 🌟")
    
    setTimeout(() => {
        window.location.href = '/'
    }, 500)
  }

  // --- 4. Profil Güncelleme ---
  const updateUser = (newUserData) => {
    if (!user) return

    const updatedUser = { ...user, ...newUserData }
    
    setUser(updatedUser)
    sessionStorage.setItem('user', JSON.stringify(updatedUser))
    
    toast.success("Profil bilgilerin güncellendi! ✅")
  }

  if (loading) {
     return (
        <div style={{height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#6366f1'}}>
            <h3>Yükleniyor...</h3>
        </div>
     )
  }

  return (
    <AuthContext.Provider value={{ 
        user, 
        login, 
        logout, 
        updateUser, 
        loading,
        unreadCount,       
        setUnreadCount,    
        updateUnreadCount  
    }}>
      {children}
    </AuthContext.Provider>
  )
}