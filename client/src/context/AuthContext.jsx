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
    if (!sessionStorage.getItem('token')) return;

    try {
        const res = await axiosClient.get('/messages/conversations');
        setUnreadCount(res.data.length); 
    } catch (error) {
        console.error("Mesaj sayısı güncellenemedi:", error);
    }
  }

  // --- 1. Başlangıç Kontrolü (Sayfa Yenilenince) ---
  useEffect(() => {
    const checkUserLoggedIn = () => {
      try {
        const storedUser = sessionStorage.getItem('user')
        const storedToken = sessionStorage.getItem('token')
        // Role bilgisini de kontrol et
        const storedRole = sessionStorage.getItem('role')

        if (storedUser && storedToken) {
          const parsedUser = JSON.parse(storedUser);
          // Eğer user objesinin içinde role yoksa, storedRole'dan ekle
          if (!parsedUser.role && storedRole) {
            parsedUser.role = storedRole;
          }
          setUser(parsedUser)
        }
      } catch (error) {
        console.error("❌ Auth verisi okunurken hata:", error)
        sessionStorage.removeItem('user')
        sessionStorage.removeItem('token')
        sessionStorage.removeItem('role')
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
        const interval = setInterval(updateUnreadCount, 30000);
        return () => clearInterval(interval);
    }
  }, [user]);

  // --- 2. Giriş İşlemi ---
  const login = (userData, token) => {
    setUser(userData)
    
    // DEĞİŞİKLİK: Token, User ve ROLE sessionStorage'a kaydediliyor
    sessionStorage.setItem('token', token) 
    sessionStorage.setItem('user', JSON.stringify(userData))
    
    // User objesinden role'ü alıp ayrıca kaydediyoruz (Admin paneli için kritik)
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
    
    // DEĞİŞİKLİK: Tüm session verilerini temizle
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    sessionStorage.removeItem('role') // Role silindi
    
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