import { useState } from 'react'
import axiosClient from '../api/axiosClient' // DÜZELTME: Global Client kullanıldı
import { toast } from 'react-toastify'
import { useNavigate, Link } from 'react-router-dom'

// --- MANTINE IMPORTLARI ---
import { 
  TextInput, 
  PasswordInput, 
  Button, 
  Paper, 
  Title, 
  Text, 
  Container, 
  Anchor,
  Stack 
} from '@mantine/core';

function Register() {
  const navigate = useNavigate()
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  })

  // YENİ: Email hatasını tutacak state
  const [emailError, setEmailError] = useState('')

  // --- MANTIK KISMI ---
  const handleChange = (e) => {
    // Kullanıcı yazı yazarken hata mesajını temizle
    if (e.target.name === 'email') {
        setEmailError('');
    }

    setFormData({
        ...formData,
        [e.target.name]: e.target.value
    })
  }

  // YENİ: Email Doğrulama Fonksiyonu (Regex)
  const validateEmail = (email) => {
    // Format: yazı@yazı.yazı (Örn: a@b.com)
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleRegister = async (e) => {
    e.preventDefault()

    // 1. Email Format Kontrolü
    if (!validateEmail(formData.email)) {
        setEmailError('Lütfen geçerli bir e-posta adresi girin (örn: isim@gmail.com)');
        return; // İşlemi durdur
    }

    try {
      // DÜZELTME: Uzun URL yerine axiosClient kullanıldı
      await axiosClient.post('/auth/register', formData)
      
      toast.success("Kayıt başarılı! Giriş yapılıyor...")
      
      // Başarılı olursa 1.5 saniye sonra Login sayfasına yönlendir
      setTimeout(() => {
        navigate('/login')
      }, 1500)

    } catch (error) {
      if (error.response) {
        toast.error(error.response.data.message || error.response.data.error || 'Kayıt başarısız')
      } else {
        toast.error('Sunucuya bağlanılamadı')
      }
    }
  }

  // --- TASARIM KISMI ---
  return (
    <Container size={420} my={40}>
      
      {/* Başlık ve Yönlendirme */}
      <Title ta="center" order={2}>
        Aramıza Katılın! 🚀
      </Title>
      
      <Text c="dimmed" size="sm" ta="center" mt={5}>
        Zaten bir hesabınız var mı?{' '}
        <Anchor component={Link} to="/login" size="sm">
          Giriş Yapın
        </Anchor>
      </Text>

      {/* Form Kartı */}
      <Paper withBorder shadow="md" p={30} mt={30} radius="md">
        <form onSubmit={handleRegister}>
          <Stack gap="md"> 
            
            <TextInput 
              label="Kullanıcı Adı" 
              placeholder="Adınız Soyadınız" 
              name="username"
              value={formData.username} 
              onChange={handleChange} 
              required 
            />
            
            <TextInput 
              label="Email Adresi" 
              placeholder="ornek@email.com" 
              name="email"
              type="email"
              value={formData.email} 
              onChange={handleChange} 
              required 
              // YENİ: Hata varsa kutucuk kırmızı olur ve mesaj yazar
              error={emailError} 
            />

            <PasswordInput 
              label="Şifre" 
              placeholder="Güçlü bir şifre seçin" 
              name="password"
              value={formData.password} 
              onChange={handleChange} 
              required 
            />

            <Button type="submit" fullWidth mt="xl" color="green">
              Kayıt Ol ✨
            </Button>
            
          </Stack>
        </form>
      </Paper>

    </Container>
  )
}

export default Register