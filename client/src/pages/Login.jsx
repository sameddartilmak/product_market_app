import { useState, useContext } from 'react'
import axios from 'axios'
import { AuthContext } from '../context/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'react-toastify'

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
  
  const { login } = useContext(AuthContext)
  const navigate = useNavigate()

  // --- MANTIK KISMI (AYNEN KORUNDU) ---
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      // API'ye istek atıyoruz
      const res = await axios.post('http://127.0.0.1:5000/api/auth/login', {
        username: username,
        password: password
      })

      // --- DEDEKTİF MODU BAŞLANGIÇ ---
      console.log("🔴 1. SUNUCUDAN GELEN TÜM VERİ:", res.data);
      
      if (!res.data.user) {
          console.error("⛔ HATA: Sunucu 'user' objesini göndermedi! Sadece token geldi.");
          toast.error("Sunucu hatası: Kullanıcı bilgisi alınamadı.");
          return; // İşlemi durdur
      }

      console.log("🔴 2. KULLANICI ROLÜ:", res.data.user.role);
      // -------------------------------

      if (res.data.access_token) {
          // Güvenli rol temizliği (Boşluk silme ve küçük harf yapma)
          const serverRole = res.data.user.role || "";
          const safeRole = serverRole.toString().trim().toLowerCase();

          console.log("🔴 3. İŞLENMİŞ ROL:", safeRole);
          
          // CRITICAL FIX: Admin panelinin çalışması için bunu localStorage'a atıyoruz
          localStorage.setItem('role', safeRole);

          // Context'i güncelle
          login(res.data.user, res.data.access_token)
          toast.success(`Hoşgeldin ${res.data.user.username}!`)
          
          // YÖNLENDİRME KARARI
          if (safeRole === 'admin') {
            console.log("✅ Admin tespit edildi -> /admin rotasına gidiliyor.");
            navigate('/admin');
          } else {
            console.log("✅ Müşteri tespit edildi -> Ana sayfaya gidiliyor.");
            navigate('/'); 
          }
      }

    } catch (error) {
      console.error("Giriş Hatası:", error);
      toast.error(error.response?.data?.message || 'Giriş başarısız!')
    }
  }

  // --- TASARIM KISMI (MANTINE İLE YENİLENDİ) ---
  return (
    <Container size={420} my={40}>
      
      {/* Başlık Alanı */}
      <Title ta="center" order={2}>
        Tekrar Hoşgeldiniz! 👋
      </Title>
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Hesabınız yok mu?{' '}
        <Anchor component={Link} to="/register" size="sm">
          Hemen Kayıt Olun
        </Anchor>
      </Text>

      {/* Kart Alanı (Gölge ve Kenarlık) */}
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
                <Checkbox label="Beni Hatırla" />
                <Anchor component="button" size="sm" onClick={(e) => { e.preventDefault(); toast.info("Bu özellik yakında gelecek!"); }}>
                    Şifremi Unuttum?
                </Anchor>
            </Group>

            <Button fullWidth mt="xl" type="submit" color="blue">
                Giriş Yap 🚀
            </Button>
        </form>
      </Paper>
    </Container>
  )
}

export default Login