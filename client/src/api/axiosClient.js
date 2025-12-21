import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'http://127.0.0.1:5000/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    // DÜZELTME 1: Token'ı artık sessionStorage'dan alıyoruz
    // (Böylece tarayıcı kapanıp açıldığında silinmiş oluyor)
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

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.log("Oturum süresi doldu veya yetkisiz giriş.");
      
      // DÜZELTME 2: 401 gelirse oturumu temizle ve yönlendir
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      window.location.href = '/login'; 
    }
    return Promise.reject(error);
  }
);

export default axiosClient;