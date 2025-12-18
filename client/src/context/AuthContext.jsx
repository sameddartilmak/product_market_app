// client/src/context/AuthContext.jsx
import { createContext, useState, useEffect } from 'react'
import { toast } from 'react-toastify'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  // Kullanıcı verisi
  const [user, setUser] = useState(null)
  
  // Uygulama ilk açıldığında kontrol sürerken beyaz ekran göstermek için:
  const [loading, setLoading] = useState(true)

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
        // Veri bozuksa temizle ki döngüye girmesin
        localStorage.removeItem('user')
        localStorage.removeItem('token')
      } finally {
        setLoading(false) // Kontrol bitti, uygulamayı göster
      }
    }

    checkUserLoggedIn()
  }, [])

  // --- 2. Giriş İşlemi ---
  const login = (userData, token) => {
    setUser(userData)
    
    // Verileri tarayıcıya kaydet
    localStorage.setItem('token', token) 
    localStorage.setItem('user', JSON.stringify(userData))
    
    // Kullanıcıya hoş bir karşılama (UX İyileştirmesi)
    toast.success(`Tekrar hoş geldin, ${userData.name || 'Gezgin'}! 👋`)
  }

  // --- 3. Çıkış İşlemi ---
  const logout = () => {
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    
    toast.info("Başarıyla çıkış yapıldı. Görüşmek üzere! 🌟")
    
    // Yönlendirme için kısa bir gecikme verilebilir veya direkt yapılabilir
    setTimeout(() => {
        window.location.href = '/'
    }, 500)
  }

  // --- 4. Profil Güncelleme ---
  const updateUser = (newUserData) => {
    // Mevcut kullanıcı yoksa işlem yapma
    if (!user) return

    const updatedUser = { ...user, ...newUserData }
    
    setUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
    
    toast.success("Profil bilgilerin güncellendi! ✅")
    console.log("✅ AuthContext: Kullanıcı güncellendi ->", updatedUser)
  }

  // --- Yükleniyor Ekranı (Opsiyonel ama çok profesyonel durur) ---
  if (loading) {
     return (
        <div style={{height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
            <div className="spinner">Yükleniyor...</div> {/* Buraya bir spinner componenti de koyabilirsin */}
        </div>
     )
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}