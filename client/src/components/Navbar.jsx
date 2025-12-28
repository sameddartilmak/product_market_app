import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';


import { 
  Container, 
  Group, 
  Button, 
  Text, 
  Avatar, 
  Menu, 
  Box,
  Indicator,
  Image
} from '@mantine/core';

function Navbar() {
  const { user, logout, unreadCount } = useContext(AuthContext);
  const navigate = useNavigate();

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
         <Group 
            gap="xs" 
            component={Link} 
            to={user?.role === 'admin' ? "/admin" : "/"} 
            style={{ textDecoration: 'none', cursor: 'pointer' }}
          >   
             <Image 
                src="/logo1.png"
                alt="Logo" 
                w={160} 
                h={60} 
                fit="contain" 
                fallbackSrc="https://placehold.co/40?text=Logo"
             />

            {user?.role === 'admin' && (
                <Text 
                  size="xl" 
                  fw={900} 
                  variant="gradient" 
                  gradient={{ from: 'red', to: 'orange', deg: 90 }} 
                >
                   🛡️ YÖNETİM
                </Text>
            )}
          </Group>


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
                    <Indicator 
                        color="red" 
                        size={9} 
                        offset={6} 
                        processing 
                        disabled={!unreadCount || unreadCount === 0} 
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

                <Menu shadow="md" width={240} trigger="hover" openDelay={100} closeDelay={400}>
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
                          📋 Taleplerim <Text span c="dimmed" size="xs" ml={5}>(Alım/Satım/Takas)</Text>
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