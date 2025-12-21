import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

// Mantine Bileşenleri (Indicator kaldırıldı)
import { 
  Container, 
  Group, 
  Button, 
  Text, 
  Avatar, 
  Menu, 
  Box 
} from '@mantine/core';

function Navbar() {
  // unreadCount'a artık ihtiyacımız yok
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  // Profil Resmi URL Düzeltici
  const getAvatarUrl = (url) => {
    if (!url) return null;
    return url.startsWith('http') ? url : `http://127.0.0.1:5000${url}`;
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
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
                {user.role === 'admin' ? (
                  <Text c="dimmed" size="sm" fw={500}>Hoşgeldin, Admin</Text>
                ) : (
                  <>
                    <Button variant="subtle" component={Link} to="/" color="gray">
                      Vitrin
                    </Button>

                    {/* Mesajlar Butonu (Sayı göstergesi kaldırıldı) */}
                    <Button variant="subtle" component={Link} to="/messages" color="gray">
                      💬 Mesajlar
                    </Button>

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

                {/* --- PROFİL MENÜSÜ --- */}
                <Menu shadow="md" width={200} trigger="hover" openDelay={100} closeDelay={400}>
                  <Menu.Target>
                    <Button 
                        variant="light" 
                        color="blue" 
                        pl={5} 
                        leftSection={
                            <Avatar 
                                src={getAvatarUrl(user.profile_image)} 
                                alt={user.username} 
                                radius="xl" 
                                size={30} 
                            >
                                {user.username.charAt(0).toUpperCase()}
                            </Avatar>
                        }
                    >
                        {user.username}
                    </Button>
                  </Menu.Target>

                  <Menu.Dropdown>
                    <Menu.Label>Hesap</Menu.Label>
                    
                    {user.role !== 'admin' && (
                      <>
                        <Menu.Item component={Link} to="/profile">
                            👤 Profilim
                        </Menu.Item>

                        <Menu.Item component={Link} to="/requests">
                          📥 Gelen Talepler <Text span c="dimmed" size="xs" ml={5}>(Kiralama)</Text>
                        </Menu.Item>        
                        <Menu.Item component={Link} to="/swaps">
                             🔄 Takaslarım <Text span c="dimmed" size="xs" ml={5}>(Takas)</Text>
                        </Menu.Item>
                      </>
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