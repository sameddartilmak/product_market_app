// client/src/context/AuthContext.jsx
import { createContext, useState, useEffect } from 'react'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  
  // Sayfa yenilenince Kullanıcıyı Hatırla
  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  // --- KRİTİK KISIM BURASI ---
  // login fonksiyonu hem 'userData' hem de 'token' almalı!
  const login = (userData, token) => {
    setUser(userData)
    
    // Token'ı kesinlikle kaydediyoruz
    localStorage.setItem('token', token) 
    localStorage.setItem('user', JSON.stringify(userData))
    
    console.log("✅ AuthContext: Token LocalStorage'a kaydedildi:", token)
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    window.location.href = '/'
  }

  const updateUser = (newUserData) => {
    // Eğer user null ise boş obje kabul et ki uygulama patlamasın
    const currentUser = user || {} 
    const updatedUser = { ...currentUser, ...newUserData }
    
    setUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
    console.log("✅ AuthContext: Kullanıcı güncellendi ->", updatedUser)
  }
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}