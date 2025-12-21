import { useState, useContext, useEffect } from 'react'
import axiosClient from '../api/axiosClient' // DÜZELTME: Global Client kullanıldı
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
  // YENİ: Beni Hatırla State'i
  const [rememberMe, setRememberMe] = useState(false)
  
  const { login } = useContext(AuthContext)
  const navigate = useNavigate()

  // --- 1. SAYFA AÇILINCA HAFIZAYI KONTROL ET ---
  useEffect(() => {
    const savedCreds = localStorage.getItem('remember_creds');
    if (savedCreds) {
        try {
            // Bilgiler Base64 ile şifreli kaydedilmişti, şimdi çözüyoruz
            const decoded = atob(savedCreds); 
            const [savedUser, savedPass] = decoded.split(':');
            
            if (savedUser && savedPass) {
                setUsername(savedUser);
                setPassword(savedPass);
                setRememberMe(true); // Kutucuğu da işaretli yap
                // toast.info("Bilgileriniz hatırlandı, giriş yapmak için butona tıklayın.");
            }
        } catch (e) {
            console.error("Hatırlanan veriler okunamadı", e);
            localStorage.removeItem('remember_creds');
        }
    }
  }, []);

  // --- MANTIK KISMI ---
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      // DÜZELTME: Uzun URL yerine axiosClient kullanıldı
      const res = await axiosClient.post('/auth/login', {
        username: username,
        password: password
      })

      // --- DEDEKTİF MODU BAŞLANGIÇ ---
      console.log("🔴 1. SUNUCUDAN GELEN TÜM VERİ:", res.data);
      
      if (!res.data.user) {
          console.error("⛔ HATA: Sunucu 'user' objesini göndermedi!");
          toast.error("Sunucu hatası: Kullanıcı bilgisi alınamadı.");
          return; 
      }
      // -------------------------------

      if (res.data.access_token) {
          // --- 2. BENİ HATIRLA MANTIĞI ---
          if (rememberMe) {
              // Bilgileri basitçe şifreleyip (Base64) kaydet: "kullanici:sifre" formatında
              const creds = btoa(`${username}:${password}`);
              localStorage.setItem('remember_creds', creds);
          } else {
              // Eğer tik kaldırıldıysa hafızayı temizle
              localStorage.removeItem('remember_creds');
          }
          // -------------------------------

          const serverRole = res.data.user.role || "";
          const safeRole = serverRole.toString().trim().toLowerCase();
          
          localStorage.setItem('role', safeRole);

          login(res.data.user, res.data.access_token)
          toast.success(`Hoşgeldin ${res.data.user.username}!`)
          
          if (safeRole === 'admin') {
            navigate('/admin');
          } else {
            navigate('/'); 
          }
      }

    } catch (error) {
      console.error("Giriş Hatası:", error);
      toast.error(error.response?.data?.message || 'Giriş başarısız!')
    }
  }

  // --- TASARIM KISMI ---
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

      {/* Kart Alanı */}
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

            <Button fullWidth mt="xl" type="submit" color="blue">
                Giriş Yap 🚀
            </Button>
        </form>
      </Paper>
    </Container>
  )
}

export default Login