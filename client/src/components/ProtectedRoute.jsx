// client/src/components/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom'

// Bu bileşen, içine aldığı sayfayı (children) korur
function ProtectedRoute({ children }) {
  // 1. Cüzdanı kontrol et: Token var mı?
  const token = localStorage.getItem('token')

  // 2. Eğer token YOKSA, direkt Login sayfasına şutla
  if (!token) {
    // replace: Geçmişi siler ki 'Geri' tuşuna basınca tekrar girmeye çalışmasın
    return <Navigate to="/login" replace />
  }

  // 3. Token VARSA, buyur geç (Sayfayı göster)
  return children
}

export default ProtectedRoute