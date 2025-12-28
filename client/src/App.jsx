import { Routes, Route, Link } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import IncomingRequests from './pages/IncomingRequests';
import { Box, Container, Title, Text, Button, Center, Stack } from '@mantine/core';
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register' 
import Profile from './pages/Profile'
import AddProduct from './pages/AddProduct'
import ProductDetail from './pages/ProductDetail'
import Messages from './pages/Messages'
import AdminPanel from './pages/AdminPanel' 

function App() {
  return (
    <Box bg="gray.0" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <ToastContainer position="bottom-right" autoClose={3000} theme="colored" />
      <Navbar />
      
      <Box style={{ flex: 1, paddingBottom: '40px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/add-product" element={<AddProduct />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="/requests" element={<IncomingRequests />} />
          
          <Route path="*" element={
            <Container>
              <Center h="60vh">
                <Stack align="center" gap="md">
                  <Title order={1} size={100} c="gray.3" style={{ lineHeight: 1 }}>404</Title>
                  <Title order={2}>Aradığınız sayfayı bulamadık 😔</Title>
                  <Text c="dimmed" ta="center" maw={500}>
                    Gitmek istediğiniz sayfa kaldırılmış, adı değiştirilmiş veya geçici olarak kullanım dışı olabilir.
                  </Text>
                  <Button component={Link} to="/" size="md" variant="outline" color="blue">
                    Ana Sayfaya Dön
                  </Button>
                </Stack>
              </Center>
            </Container>
          } />

        </Routes>
      </Box>
    
    </Box>
  )
}

export default App