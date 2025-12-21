import axios from 'axios';

const axiosClient = axios.create({
  // Backend adresinizin doğru olduğundan emin olun
  baseURL: 'http://127.0.0.1:5000/api', 
  
  // İsteğin sonsuza kadar beklemesini önlemek için 10 saniye süre tanıdık
  timeout: 10000, 
  
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- İSTEK (REQUEST) INTERCEPTOR ---
axiosClient.interceptors.request.use(
  (config) => {
    // Token'ı sessionStorage'dan alıp header'a ekliyoruz
    const token = sessionStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- YANIT (RESPONSE) INTERCEPTOR ---
axiosClient.interceptors.response.use(
  (response) => {
    // Başarılı yanıtları olduğu gibi döndür
    return response;
  },
  (error) => {
    const { response } = error;

    // 1. Durum: Sunucudan yanıt geldi (401, 403, 500 vb.)
    if (response) {
      if (response.status === 401) {
        // Eğer kullanıcı zaten Giriş veya Kayıt sayfasındaysa yönlendirme YAPMA.
        // Bu sayede "Yanlış şifre" uyarısını ekranda gösterebiliriz.
        const currentPath = window.location.pathname;

        if (currentPath !== '/login' && currentPath !== '/register') {
          console.warn("Oturum süresi doldu, çıkış yapılıyor...");
          
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('user');
          
          // SPA mantığını bozmadan sert yönlendirme yap (State temizlenir)
          window.location.href = '/login'; 
        }
      }
    } 
    // 2. Durum: Sunucuya hiç ulaşılamadı (Network Error)
    else if (error.request) {
      console.error("Sunucuya ulaşılamıyor. Backend çalışıyor mu?");
    }

    return Promise.reject(error);
  }
);

export default axiosClient;