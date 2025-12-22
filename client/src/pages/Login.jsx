import { useState, useContext, useEffect } from 'react'
import axiosClient from '../api/axiosClient' 
import { AuthContext } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import Swal from 'sweetalert2' // YENİ: Hata mesajını bununla göstereceğiz

// --- MANTINE IMPORTLARI ---
import { 
  TextInput, 
  PasswordInput, 
  Checkbox, 
  Anchor, 
  Paper, 
  Title, 
  Text, 
  Container, 
  Group, 
  Button 
} from '@mantine/core';

function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  
  const { login } = useContext(AuthContext)
  const navigate = useNavigate()

  // --- 1. SAYFA AÇILINCA HAFIZAYI KONTROL ET ---
  useEffect(() => {
    const savedCreds = localStorage.getItem('remember_creds');
    if (savedCreds) {
        try {
            const decoded = atob(savedCreds); 
            const [savedUser, savedPass] = decoded.split(':');
            
            if (savedUser && savedPass) {
                setUsername(savedUser);
                setPassword(savedPass);
                setRememberMe(true);
            }
        } catch (e) {
            console.error("Hatırlanan veriler okunamadı", e);
            localStorage.removeItem('remember_creds');
        }
    }
  }, []);

  // --- MANTIK KISMI ---
  const handleSubmit = async (e) => {
    e.preventDefault() // Sayfanın yenilenmesini engeller
    setLoading(true);

    try {
      // 1. İsteği Gönder
      const res = await axiosClient.post('/auth/login', {
        username: username,
        password: password
      })

      // 2. Başarılıysa İşlemleri Yap
      if (res.data.access_token) {

        localStorage.setItem('token', res.data.access_token);
        
          // --- BENİ HATIRLA ---
          if (rememberMe) {
              const creds = btoa(`${username}:${password}`);
              localStorage.setItem('remember_creds', creds);
          } else {
              localStorage.removeItem('remember_creds');
          }

          // Rolü güvenli hale getir
          const serverRole = res.data.user.role || "";
          const safeRole = serverRole.toString().trim().toLowerCase();
          
          const userWithRole = { ...res.data.user, role: safeRole };

          login(userWithRole, res.data.access_token)
          
          if (safeRole === 'admin') {
            navigate('/admin');
          } else {
            navigate('/'); 
          }
      }

    } catch (error) {
      console.error("Giriş Hatası Detayı:", error);
      
      // Hata Mesajını Belirle
      let errorMessage = 'Kullanıcı adı veya şifre hatalı!';
      
      if (error.response) {
          // Sunucudan gelen mesaj varsa onu kullan
          errorMessage = error.response.data.message || errorMessage;
          
          // Eğer sunucu 500 hatası verdiyse
          if (error.response.status === 500) {
              errorMessage = "Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.";
          }
      } else if (error.request) {
          // Sunucuya hiç ulaşılamadıysa
          errorMessage = "Sunucuya bağlanılamadı. İnternetinizi kontrol edin.";
      }

      // YENİ: SweetAlert ile ekrana bas (Gözden kaçması imkansız)
      Swal.fire({
        icon: 'error',
        title: 'Giriş Başarısız',
        text: errorMessage,
        confirmButtonColor: '#d33',
        confirmButtonText: 'Tamam'
      });
      
    } finally {
      setLoading(false);
    }
  }

  // --- TASARIM KISMI ---
  return (
    <Container size={420} my={40}>
      <Title ta="center" order={2}>
        Tekrar Hoşgeldiniz! 👋
      </Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Hesabınız yok mu?{' '}
        <Anchor component={Link} to="/register" size="sm">
          Hemen Kayıt Olun
        </Anchor>
      </Text>

      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={handleSubmit}>
            
            <TextInput 
                label="Kullanıcı Adı" 
                placeholder="örn: samed" 
                required 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            
            <PasswordInput 
                label="Şifre" 
                placeholder="Şifreniz" 
                required 
                mt="md" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />

            <Group justify="space-between" mt="lg">
                <Checkbox 
                    label="Beni Hatırla" 
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.currentTarget.checked)}
                />
                <Anchor component="button" size="sm" onClick={(e) => { e.preventDefault(); toast.info("Bu özellik yakında gelecek!"); }}>
                    Şifremi Unuttum?
                </Anchor>
            </Group>

            <Button 
                fullWidth 
                mt="xl" 
                type="submit" 
                color="blue" 
                loading={loading}
                disabled={loading}
            >
                Giriş Yap 🚀
            </Button>
        </form>
      </Paper>
    </Container>
  )
}

export default Login