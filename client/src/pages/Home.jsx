import { useEffect, useState } from 'react'
import axios from 'axios'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'

import { 
  Container, 
  SimpleGrid, 
  Card, 
  Image, 
  Text, 
  Badge, 
  Button, 
  Group, 
  TextInput, 
  Loader, 
  Center,
  Box,
  Title,
  rem
} from '@mantine/core';

function Home() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('') 

  const categories = [
    { id: 'arac', label: '🚗 Araç' },
    { id: 'emlak', label: '🏠 Emlak' },
    { id: 'elektronik', label: '💻 Elektronik' },
    { id: 'esya', label: '🛋️ Eşya' },
    { id: 'giyim', label: '👕 Giyim' },
    { id: 'diger', label: '📦 Diğer' }
  ]

  const getImageUrl = (url) => {
    if (!url) return 'https://placehold.co/300x200?text=Resim+Yok';
    if (url.startsWith('http')) return url;
    return `http://127.0.0.1:5000${url}`;
  };

  const getListingBadge = (type) => {
    switch (type) {
        case 'rent': return { color: 'orange', label: 'Kiralık' };
        case 'swap': return { color: 'purple', label: 'Takaslık' };
        default: return { color: 'green', label: 'Satılık' };
    }
  };

  const fetchProducts = async (search = '', category = '') => {
    setLoading(true)
    try {
      // URL oluşturma
      let url = 'http://127.0.0.1:5000/api/products/?'
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (category) params.append('category', category)
      
      const res = await axios.get(url + params.toString())
      setProducts(res.data)
    } catch (error) {
      console.error(error)
      toast.error('Ürünler yüklenirken hata oluştu.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchProducts(searchTerm, selectedCategory)
  }

  const handleCategoryClick = (catId) => {
    const newCategory = selectedCategory === catId ? '' : catId
    setSelectedCategory(newCategory)
    fetchProducts(searchTerm, newCategory)
  }

  const clearAll = () => {
    setSearchTerm('')
    setSelectedCategory('')
    fetchProducts('', '')
  }

  return (
    <Container size="xl" py="xl">

      <Container size="sm" mb={30}>
        <form onSubmit={handleSearch}>
            <Group justify="center" gap="xs">
                <TextInput 
                    placeholder="Ne aramıştınız?"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    size="md"
                    style={{ flex: 1 }}
                    radius="md"
                />
                <Button type="submit" size="md" radius="md" color="dark">
                    Ara 🔍
                </Button>
                
                {(searchTerm || selectedCategory) && (
                    <Button 
                        type="button" 
                        onClick={clearAll} 
                        color="red" 
                        variant="light" 
                        size="md" 
                        radius="md"
                    >
                        Temizle ✕
                    </Button>
                )}
            </Group>
        </form>
      </Container>

      <Group justify="center" mb={40} gap="sm">
        <Button 
            onClick={() => handleCategoryClick('')}
            variant={selectedCategory === '' ? 'filled' : 'default'}
            color="blue"
            radius="xl"
            size="sm"
        >
            Tümü
        </Button>

        {categories.map((cat) => (
            <Button
                key={cat.id}
                onClick={() => handleCategoryClick(cat.id)}
                variant={selectedCategory === cat.id ? 'filled' : 'default'}
                color="blue"
                radius="xl"
                size="sm"
            >
                {cat.label}
            </Button>
        ))}
      </Group>

      <Title order={2} ta="center" mb="lg" c="dimmed">
        {selectedCategory 
            ? `${categories.find(c => c.id === selectedCategory)?.label} Vitrini` 
            : 'Tüm İlanlar'}
        {searchTerm && <Text span size="md" fw={400}> (Arama sonucu: "{searchTerm}")</Text>}
      </Title>

      {loading ? (
        <Center h={200}>
            <Loader size="xl" type="dots" />
        </Center>
      ) : (
        <>
            {products.length > 0 ? (
                <SimpleGrid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing="lg">
                    {products.map((product) => {
                        const badgeInfo = getListingBadge(product.listing_type);
                        
                        return (
                            <Card 
                                key={product.id} 
                                shadow="sm" 
                                padding="lg" 
                                radius="md" 
                                withBorder
                                component={Link} 
                                to={`/product/${product.id}`}
                                style={{ textDecoration: 'none', color: 'inherit', transition: 'transform 0.2s' }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <Card.Section>
                                    <Box pos="relative"> 
                                        <Image
                                            src={getImageUrl(product.image_url)}
                                            height={180}
                                            alt={product.title}
                                            fit="cover" 
                                            fallbackSrc="https://placehold.co/300x200?text=Hata"
                                            bg="#f8f9fa" 
                                        />
                                        
                                        {/* Durum Badge'i */}
                                        <Badge 
                                            color={badgeInfo.color} 
                                            variant="filled"
                                            style={{ position: 'absolute', top: 10, right: 10, zIndex: 1 }}
                                        >
                                            {badgeInfo.label}
                                        </Badge>
                                    </Box>
                                </Card.Section>

                                <Group justify="space-between" mt="md" mb="xs">
                                    <Text fw={600} truncate>{product.title}</Text>
                                </Group>

                                <Group justify="space-between" align="center" mt="sm">
                                    <Badge color="gray" variant="light" size="sm" tt="capitalize">
                                        {product.category}
                                    </Badge>
                                    <Text fw={700} size="lg" c="green">
                                        {product.price} TL
                                    </Text>
                                </Group>

                                <Button 
                                    color="blue" 
                                    fullWidth 
                                    mt="md" 
                                    radius="md" 
                                    variant="light"
                                >
                                    Detayları Gör
                                </Button>
                            </Card>
                        );
                    })}
                </SimpleGrid>
            ) : (
                <Container size="sm" ta="center" py={50} bg="gray.0" style={{ borderRadius: '10px' }}>
                    <Title order={3} mb="sm">Sonuç Bulunamadı 😔</Title>
                    <Text c="dimmed" mb="lg">Aradığınız kriterlere uygun ilan yok.</Text>
                    <Button onClick={clearAll} variant="outline" color="blue">
                        Filtreleri Temizle
                    </Button>
                </Container>
            )}
        </>
      )}
    </Container>
  )
}

export default Home