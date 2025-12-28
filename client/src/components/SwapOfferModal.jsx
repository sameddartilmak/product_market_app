import { useEffect, useState } from 'react';
import { 
    Modal, 
    Button, 
    ScrollArea, 
    Group, 
    Text, 
    Image, 
    Textarea, 
    SimpleGrid, 
    Card, 
    Badge,
    Stack
} from '@mantine/core';
import axiosClient from '../api/axiosClient';
import { toast } from 'react-toastify';

function SwapOfferModal({ isOpen, onClose, targetProduct }) {
    const [myProducts, setMyProducts] = useState([]);
    const [selectedProductId, setSelectedProductId] = useState(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchMyProducts();
        }
    }, [isOpen]);

    const fetchMyProducts = async () => {
        try {
            const res = await axiosClient.get('/products/my-products');
            const available = res.data.filter(p => p.status === 'available');
            setMyProducts(available);
        } catch (error) {
            console.error(error);
            toast.error("Ürünleriniz yüklenemedi.");
        } finally {
            setLoading(false);
        }
    };

    const handleSendOffer = async () => {
        if (!selectedProductId) {
            toast.warning("Lütfen teklif etmek istediğiniz ürünü seçin.");
            return;
        }

        try {
            await axiosClient.post('/transactions/swap-offer', { 
                target_product_id: targetProduct.id,
                offered_product_id: selectedProductId,
                message: message
            });
            toast.success("Takas teklifiniz gönderildi! 🚀");
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Teklif gönderilemedi.");
        }
    };

    const getImageUrl = (url) => {
        if (!url) return null;
        return url.startsWith('http') ? url : `http://127.0.0.1:5000${url}`;
    };
    return (
        <Modal 
            opened={isOpen} 
            onClose={onClose} 
            title={<Text fw={700} size="lg">🔄 Takas Teklifi Yap</Text>} 
            size="lg"
            centered
        >
            <Stack gap="sm">
                <Text size="sm" c="dimmed">
                    <strong>{targetProduct?.title}</strong> için hangi ürününüzü teklif etmek istersiniz?
                </Text>

                <ScrollArea h={400} type="always" offsetScrollbars style={{ border: '1px solid #eee', borderRadius: '8px', padding: '10px' }}>
                    {loading ? (
                        <Text ta="center" mt="xl">Yükleniyor...</Text>
                    ) : (
                        myProducts.length === 0 ? (
                            <Stack align="center" mt="xl">
                                <Text size="3rem">📦</Text>
                                <Text c="dimmed">Takas yapabileceğiniz aktif bir ürününüz yok.</Text>
                            </Stack>
                        ) : (

                            <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                                {myProducts.map(prod => {
                                    const isSelected = selectedProductId === prod.id;
                                    return (
                                        <Card 
                                            key={prod.id} 
                                            padding="sm" 
                                            radius="md" 
                                            withBorder
                                            onClick={() => setSelectedProductId(prod.id)}
                                            style={{ 
                                                cursor: 'pointer',
                                                borderColor: isSelected ? '#228be6' : '#dee2e6',
                                                borderWidth: isSelected ? '2px' : '1px',
                                                backgroundColor: isSelected ? '#f0f9ff' : 'white',
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            <Card.Section>
                                                <Image 
                                                    src={getImageUrl(prod.image_url)} 
                                                    height={140} 
                                                    alt={prod.title} 
                                                    fallbackSrc="https://placehold.co/400x200?text=Resim+Yok"
                                                />
                                            </Card.Section>

                                            <Group justify="space-between" mt="md" mb="xs">
                                                <Text fw={600} truncate>{prod.title}</Text>
                                                {isSelected && <Badge color="blue" variant="light">Seçildi</Badge>}
                                            </Group>

                                            <Group justify="space-between" align="center">
                                                <Badge size="sm" color="gray" variant="outline">{prod.category}</Badge>
                                                <Text size="sm" fw={700} c="blue">{prod.price} TL</Text>
                                            </Group>
                                        </Card>
                                    );
                                })}
                            </SimpleGrid>
                        )
                    )}
                </ScrollArea>
                <Textarea 
                    label="Satıcıya Not (Opsiyonel)"
                    placeholder="Merhaba, bu ürünle takas düşünür müsün? Üstüne nakit de verebilirim..."
                    minRows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                />

                <Group justify="flex-end" mt="sm">
                    <Button variant="default" onClick={onClose}>İptal</Button>
                    <Button 
                        onClick={handleSendOffer} 
                        disabled={!selectedProductId}
                        color="blue"
                    >
                        Teklifi Gönder 🚀
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
}

export default SwapOfferModal;