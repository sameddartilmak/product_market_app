import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// Mantine Bileşenleri
import { 
  Container, 
  Group, 
  Button, 
  Text, 
  Avatar, 
  Menu, 
  Indicator, 
  Box, 
  rem 
} from '@mantine/core';

function Navbar() {
  const { user, logout, unreadCount } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    // Header Kapsayıcısı (Beyaz arka plan, alt çizgi, sticky)
    <Box 
      component="header" 
      style={{ 
        borderBottom: `1px solid #e9ecef`, 
        backgroundColor: 'white', 
        position: 'sticky', 
        top: 0, 
        zIndex: 100 
      }}
    >
      <Container size="lg" h={70}>
        <Group h="100%" justify="space-between">
          
          {/* --- 1. LOGO --- */}
          <Text 
            component={Link} 
            to={user?.role === 'admin' ? "/admin" : "/"} 
            size="xl" 
            fw={900} 
            variant="gradient" 
            gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
            style={{ textDecoration: 'none' }}
          >
             {user?.role === 'admin' ? '🛡️ YÖNETİM' : '📦 PAZARYERİ'}
          </Text>

          {/* --- 2. NAVİGASYON --- */}
          <Group gap="md">
            
            {user ? (
              <>
                {/* --- ADMİN GÖRÜNÜMÜ --- */}
                {user.role === 'admin' ? (
                  <Text c="dimmed" size="sm" fw={500}>Hoşgeldin, Admin</Text>
                ) : (
                  /* --- MÜŞTERİ GÖRÜNÜMÜ --- */
                  <>
                    <Button variant="subtle" component={Link} to="/" color="gray">
                      Vitrin
                    </Button>

                    {/* Mesajlar Butonu ve Bildirim Rozeti */}
                    <Indicator 
                      inline 
                      label={unreadCount} 
                      size={16} 
                      color="red" 
                      disabled={unreadCount === 0} // 0 ise rozeti gizle
                      offset={4}
                    >
                      <Button variant="subtle" component={Link} to="/messages" color="gray">
                        💬 Mesajlar
                      </Button>
                    </Indicator>

                    <Button 
                      component={Link} 
                      to="/add-product" 
                      variant="filled" 
                      color="green" 
                      radius="xl"
                    >
                      + İlan Ver
                    </Button>
                  </>
                )}

                {/* --- PROFİL MENÜSÜ (DROPDOWN) --- */}
                <Menu shadow="md" width={200} trigger="hover" openDelay={100} closeDelay={400}>
                  <Menu.Target>
                    <Button 
                        variant="light" 
                        color="blue" 
                        pl={5} // Sol padding'i biraz kıstık ki avatar yapışsın
                        leftSection={
                            <Avatar 
                                src={user.profile_image} 
                                alt={user.username} 
                                radius="xl" 
                                size={30} 
                            />
                        }
                    >
                        {user.username}
                    </Button>
                  </Menu.Target>

                  <Menu.Dropdown>
                    <Menu.Label>Hesap</Menu.Label>
                    
                    {user.role !== 'admin' && (
                        <Menu.Item component={Link} to="/profile">
                          👤 Profilim
                        </Menu.Item>
                    )}
                    
                    <Menu.Divider />
                    
                    <Menu.Item 
                      color="red" 
                      onClick={handleLogout}
                    >
                      🚪 Çıkış Yap
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              </>
            ) : (
              /* --- GİRİŞ YAPMAMIŞ KULLANICI --- */
              <Group>
                <Button variant="default" component={Link} to="/login">
                  Giriş Yap
                </Button>
                <Button component={Link} to="/register">
                  Kayıt Ol
                </Button>
              </Group>
            )}
          </Group>

        </Group>
      </Container>
    </Box>
  );
}

export default Navbar;