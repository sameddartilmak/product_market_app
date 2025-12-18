import { useState } from 'react'
import axios from 'axios'
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

  // --- MANTIK KISMI (AYNEN KORUNDU) ---
  const handleChange = (e) => {
    setFormData({
        ...formData,
        [e.target.name]: e.target.value
    })
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    try {
      await axios.post('http://127.0.0.1:5000/api/auth/register', formData)
      
      toast.success("Kayıt başarılı! Giriş yapılıyor...")
      
      // Başarılı olursa 1.5 saniye sonra Login sayfasına yönlendir
      setTimeout(() => {
        navigate('/login')
      }, 1500)

    } catch (error) {
      if (error.response) {
        toast.error(error.response.data.message || 'Kayıt başarısız')
      } else {
        toast.error('Sunucuya bağlanılamadı')
      }
    }
  }

  // --- TASARIM KISMI (MANTINE İLE YENİLENDİ) ---
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
          <Stack gap="md"> {/* Elemanlar arasına otomatik boşluk bırakır */}
            
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