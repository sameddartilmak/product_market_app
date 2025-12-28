import { createContext, useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import axiosClient from '../api/axiosClient'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  
  const updateUnreadCount = async () => {
    if (!sessionStorage.getItem('token')) return;

    try {
        const res = await axiosClient.get('/messages/conversations');
        const unreadChats = res.data.filter(c => c.is_unread).length;
        setUnreadCount(unreadChats); 

    } catch (error) {
        console.error("Mesaj sayısı güncellenemedi:", error);
    }
  }

  useEffect(() => {
    const checkUserLoggedIn = () => {
      try {
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
        sessionStorage.clear();
      } finally {
        setLoading(false)
      }
    }

    checkUserLoggedIn()
  }, [])

  useEffect(() => {
    if (user) {
        updateUnreadCount(); 
        const interval = setInterval(updateUnreadCount, 30000);
        return () => clearInterval(interval);
    }
  }, [user]);

  const login = (userData, token) => {
    setUser(userData)
    
    sessionStorage.setItem('token', token) 
    sessionStorage.setItem('user', JSON.stringify(userData))
    
    if (userData.role) {
        sessionStorage.setItem('role', userData.role);
    }
    
    updateUnreadCount(); 

    toast.success(`Tekrar hoş geldin, ${userData.name || userData.username || 'Gezgin'}! 👋`)
  }

  const logout = () => {
    setUser(null)
    setUnreadCount(0)

    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    sessionStorage.removeItem('role')
    
    toast.info("Başarıyla çıkış yapıldı. Görüşmek üzere! 🌟")
    
    setTimeout(() => {
        window.location.href = '/'
    }, 500)
  }

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