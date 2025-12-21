import { createContext, useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import axiosClient from '../api/axiosClient' // EKLENDİ: API isteği için

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  // Kullanıcı verisi
  const [user, setUser] = useState(null)
  
  // YENİ: Okunmamış mesaj sayısı state'i
  const [unreadCount, setUnreadCount] = useState(0)

  // Uygulama ilk açıldığında kontrol sürerken beyaz ekran göstermek için:
  const [loading, setLoading] = useState(true)

  // --- YENİ: Mesaj Sayısını Güncelleme Fonksiyonu ---
  const updateUnreadCount = async () => {
    // Eğer kullanıcı veya token yoksa işlem yapma
    if (!localStorage.getItem('token')) return;

    try {
        const res = await axiosClient.get('/messages/conversations');
        // NOT: Backend henüz 'is_unread' sayısını ayrı vermediği için
        // şimdilik listedeki toplam konuşma sayısını alıyoruz.
        // İleride: const count = res.data.filter(c => c.is_unread).length;
        setUnreadCount(res.data.length); 
    } catch (error) {
        console.error("Mesaj sayısı güncellenemedi:", error);
    }
  }

  // --- 1. Başlangıç Kontrolü (Sayfa Yenilenince) ---
  useEffect(() => {
    const checkUserLoggedIn = () => {
      try {
        const storedUser = localStorage.getItem('user')
        const storedToken = localStorage.getItem('token')

        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser))
        }
      } catch (error) {
        console.error("❌ Auth verisi okunurken hata:", error)
        localStorage.removeItem('user')
        localStorage.removeItem('token')
      } finally {
        setLoading(false)
      }
    }

    checkUserLoggedIn()
  }, [])

  // --- YENİ: Kullanıcı varsa mesaj sayısını düzenli kontrol et ---
  useEffect(() => {
    if (user) {
        updateUnreadCount(); // İlk yüklemede çek
        
        // Opsiyonel: Her 30 saniyede bir yeni mesaj var mı diye arkada kontrol et
        const interval = setInterval(updateUnreadCount, 30000);
        return () => clearInterval(interval);
    }
  }, [user]); // user değişince (login olunca) çalışır

  // --- 2. Giriş İşlemi ---
  const login = (userData, token) => {
    setUser(userData)
    
    // Verileri tarayıcıya kaydet
    localStorage.setItem('token', token) 
    localStorage.setItem('user', JSON.stringify(userData))
    
    // YENİ: Giriş yapınca mesaj sayısını hemen çek
    updateUnreadCount(); 

    toast.success(`Tekrar hoş geldin, ${userData.name || userData.username || 'Gezgin'}! 👋`)
  }

  // --- 3. Çıkış İşlemi ---
  const logout = () => {
    setUser(null)
    setUnreadCount(0) // YENİ: Çıkışta sayacı sıfırla
    
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    
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
    localStorage.setItem('user', JSON.stringify(updatedUser))
    
    toast.success("Profil bilgilerin güncellendi! ✅")
  }

  // --- Yükleniyor Ekranı ---
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
        unreadCount,       // Dışarıya açtık (Navbar kullanacak)
        setUnreadCount,    // Dışarıya açtık (Messages.jsx manuel azaltacak)
        updateUnreadCount  // Dışarıya açtık (Gerekirse tetiklemek için)
    }}>
      {children}
    </AuthContext.Provider>
  )
}