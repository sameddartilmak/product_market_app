import { useEffect, useState } from 'react';
import { Modal, Button, ScrollArea, Group, Text, Image, Checkbox, Textarea } from '@mantine/core';
import axiosClient from '../api/axiosClient';
import { toast } from 'react-toastify';

function SwapOfferModal({ isOpen, onClose, targetProduct }) {
    const [myProducts, setMyProducts] = useState([]);
    const [selectedProductId, setSelectedProductId] = useState(null);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);

    // Kullanıcının kendi müsait ürünlerini çek
    useEffect(() => {
        if (isOpen) {
            fetchMyProducts();
        }
    }, [isOpen]);

    const fetchMyProducts = async () => {
        try {
            const res = await axiosClient.get('/products/my-products');
            // Sadece 'available' olanları filtrele
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
            await axiosClient.post('/swap/offer', {
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

    // Resim URL Düzeltici
    const getImageUrl = (url) => {
        if (!url) return null;
        return url.startsWith('http') ? url : `http://127.0.0.1:5000${url}`;
    };

    return (
        <Modal opened={isOpen} onClose={onClose} title="🔄 Takas Teklifi Yap" size="lg">
            <Text size="sm" mb="md" c="dimmed">
                <strong>{targetProduct?.title}</strong> için hangi ürününüzü teklif etmek istersiniz?
            </Text>

            <ScrollArea h={300} type="always" offsetScrollbars>
                {loading ? <Text>Yükleniyor...</Text> : (
                    myProducts.length === 0 ? (
                        <Text c="red">Takas yapabileceğiniz müsait bir ürününüz yok.</Text>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {myProducts.map(prod => (
                                <div 
                                    key={prod.id} 
                                    onClick={() => setSelectedProductId(prod.id)}
                                    style={{
                                        padding: '10px',
                                        border: selectedProductId === prod.id ? '2px solid #228be6' : '1px solid #eee',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '15px'
                                    }}
                                >
                                    <Image 
                                        src={getImageUrl(prod.image_url)} 
                                        width={50} height={50} radius="md" 
                                        fallbackSrc="https://placehold.co/50"
                                    />
                                    <div style={{ flex: 1 }}>
                                        <Text fw={500}>{prod.title}</Text>
                                        <Text size="xs" c="dimmed">{prod.category}</Text>
                                    </div>
                                    {selectedProductId === prod.id && <span>✅</span>}
                                </div>
                            ))}
                        </div>
                    )
                )}
            </ScrollArea>

            <Textarea 
                placeholder="Satıcıya bir not ekle (Opsiyonel)"
                mt="md"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
            />

            <Group justify="flex-end" mt="md">
                <Button variant="default" onClick={onClose}>İptal</Button>
                <Button onClick={handleSendOffer} disabled={!selectedProductId}>Teklifi Gönder</Button>
            </Group>
        </Modal>
    );
}

export default SwapOfferModal;