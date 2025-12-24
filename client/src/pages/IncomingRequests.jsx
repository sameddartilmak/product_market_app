import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { toast } from 'react-toastify';
import { Container, Title, Card, Badge, Group, Text, Button, Stack, Avatar, Grid, Tabs } from '@mantine/core';
import Swal from 'sweetalert2';

function Requests() {
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [outgoingRequests, setOutgoingRequests] = useState([]); // Giden taleplerim
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('incoming'); // 'incoming' veya 'outgoing'

    const fetchAllRequests = async () => {
        setLoading(true);
        try {
            // Promise.all ile iki isteği aynı anda atıyoruz
            const [resIncoming, resOutgoing] = await Promise.all([
                axiosClient.get('/transactions/incoming'),
                axiosClient.get('/transactions/outgoing') // Backend'de bu rotanın olması lazım
            ]);

            setIncomingRequests(resIncoming.data);
            setOutgoingRequests(resOutgoing.data);
        } catch (error) {
            console.error(error);
            toast.error("Talepler yüklenirken hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllRequests();
    }, []);

    const handleStatusUpdate = async (id, status) => {
        const actionText = status === 'approved' ? 'Onaylamak' : 'Reddetmek';
        const confirmBtnColor = status === 'approved' ? '#10b981' : '#ef4444';
        const backendAction = status === 'approved' ? 'approve' : 'reject';

        const result = await Swal.fire({
            title: 'Emin misiniz?',
            text: `Bu talebi ${actionText} üzeresiniz.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: confirmBtnColor,
            confirmButtonText: status === 'approved' ? 'Evet, Onayla' : 'Evet, Reddet',
            cancelButtonText: 'Vazgeç'
        });

        if (!result.isConfirmed) return;

        try {
            await axiosClient.post(`/transactions/${id}/respond`, { action: backendAction });
            toast.success(`Talep ${status === 'approved' ? 'onaylandı' : 'reddedildi'}.`);
            fetchAllRequests(); // Listeleri güncelle
        } catch (error) {
            console.error(error);
            toast.error("İşlem başarısız: " + (error.response?.data?.message || "Hata oluştu"));
        }
    };

    // Durum Rozeti Rengi
    const getStatusBadge = (status) => {
        if (!status) return { color: 'gray', label: 'Bilinmiyor' };
        const s = status.toLowerCase();
        switch (s) {
            case 'pending': return { color: 'yellow', label: '⏳ Onay Bekliyor' };
            case 'approved': return { color: 'green', label: '✅ Onaylandı' };
            case 'rejected': return { color: 'red', label: '❌ Reddedildi' };
            case 'completed': return { color: 'blue', label: '🏁 Tamamlandı' };
            case 'cancelled': return { color: 'gray', label: '🚫 İptal Edildi' };
            default: return { color: 'gray', label: status };
        }
    };

    // İşlem Türü Rozeti (Satış, Kiralama, Takas)
    const getTypeBadge = (type) => {
        if (!type) return { color: 'gray', label: 'Genel' };
        const t = type.toUpperCase();
        switch (t) {
            case 'SALE': return { color: 'blue', label: '💰 Satın Alma' };
            case 'RENT': return { color: 'orange', label: '📅 Kiralama' };
            case 'SWAP': return { color: 'purple', label: '🔄 Takas' };
            default: return { color: 'gray', label: type };
        }
    };

    const getImageUrl = (url) => {
        if (!url) return null;
        return url.startsWith('http') ? url : `http://127.0.0.1:5000${url}`;
    };

    // --- KART RENDER FONKSİYONU ---
    // isIncoming = true ise -> Bana gelen talep (Onayla/Reddet butonları var)
    // isIncoming = false ise -> Benim gönderdiğim talep (Sadece durum gösterilir)
    const renderRequestCard = (req, isIncoming) => {
        const statusBadge = getStatusBadge(req.status);
        const typeBadge = getTypeBadge(req.transaction_type);
        const startDate = req.start_date ? new Date(req.start_date).toLocaleDateString('tr-TR') : null;
        const endDate = req.end_date ? new Date(req.end_date).toLocaleDateString('tr-TR') : null;

        // Karşı taraf kim? (Gelen talepse 'buyer', Giden talepse 'seller' veya 'product owner')
        const counterPartyLabel = isIncoming ? "Talep Eden:" : "Satıcı:";
        const counterPartyName = isIncoming ? req.buyer_name : req.seller_name; // Backend'den seller_name gelmeli

        return (
            <Card key={req.id} shadow="sm" padding="lg" radius="md" withBorder mb="md">
                <Grid gutter="md" align="center">
                    
                    {/* 1. Ürün Görseli */}
                    <Grid.Col span={{ base: 12, sm: 2 }}>
                        <Avatar 
                            src={getImageUrl(req.product_image)} 
                            size="xl" 
                            radius="md" 
                            color="blue"
                        >📦</Avatar>
                    </Grid.Col>

                    {/* 2. Detaylar */}
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Group gap="xs" mb={5}>
                            <Text fw={700} size="lg">{req.product_title || "Ürün Adı Yok"}</Text>
                            <Badge variant="light" color={typeBadge.color}>
                                {typeBadge.label}
                            </Badge>
                        </Group>
                        
                        <Group gap="xs" mb={5}>
                            <Text size="sm" c="dimmed">{counterPartyLabel}</Text>
                            <Badge variant="outline" color="gray" size="sm">@{counterPartyName || 'Kullanıcı'}</Badge>
                        </Group>

                        {/* Kiralama Tarihleri */}
                        {startDate && endDate && (
                            <Text size="sm" c="dimmed">
                                📅 {startDate} - {endDate}
                            </Text>
                        )}
                        
                        {/* Takas ise Teklif Edilen Ürün Bilgisi (Opsiyonel) */}
                        {req.transaction_type === 'SWAP' && req.swap_product_title && (
                            <Text size="sm" c="indigo" mt={5}>
                                🔄 Teklif Edilen: <b>{req.swap_product_title}</b>
                            </Text>
                        )}
                    </Grid.Col>

                    {/* 3. Fiyat ve Aksiyonlar */}
                    <Grid.Col span={{ base: 12, sm: 4 }} style={{ textAlign: 'right' }}>
                        {req.transaction_type !== 'SWAP' && (
                            <Text size="xl" fw={800} c="blue" mb="md">
                                {req.price?.toLocaleString('tr-TR')} TL
                            </Text>
                        )}

                        {/* BUTONLAR SADECE GELEN TALEPLERDE VE BEKLEMEDEYSE GÖRÜNÜR */}
                        {isIncoming && req.status.toLowerCase() === 'pending' ? (
                            <Group justify="end" gap="xs">
                                <Button 
                                    color="red" variant="light" size="xs"
                                    onClick={() => handleStatusUpdate(req.id, 'rejected')}
                                >
                                    Reddet
                                </Button>
                                <Button 
                                    color="green" size="xs"
                                    onClick={() => handleStatusUpdate(req.id, 'approved')}
                                >
                                    Onayla
                                </Button>
                            </Group>
                        ) : (
                            // Giden talepse veya işlem bitmişse sadece durumu göster
                            <Badge color={statusBadge.color} size="lg" variant="filled">
                                {statusBadge.label}
                            </Badge>
                        )}
                    </Grid.Col>
                </Grid>
            </Card>
        );
    };

    if (loading) return <div style={{textAlign:'center', marginTop:'50px', color:'#6366f1'}}>Yükleniyor...</div>;

    return (
        <Container size="md" py="xl">
            <Title order={2} mb="xl" ta="center" c="dimmed">📋 Talep Yönetimi</Title>

            <Tabs value={activeTab} onChange={setActiveTab} variant="outline" radius="md">
                <Tabs.List grow mb="lg">
                    <Tabs.Tab value="incoming" leftSection="📥">
                        Gelen Talepler ({incomingRequests.length})
                    </Tabs.Tab>
                    <Tabs.Tab value="outgoing" leftSection="📤">
                        Giden Taleplerim ({outgoingRequests.length})
                    </Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="incoming">
                    {incomingRequests.length === 0 ? (
                        <div style={styles.emptyState}>
                            <Text size="xl">📭</Text>
                            <Text c="dimmed">Size gelen herhangi bir talep yok.</Text>
                        </div>
                    ) : (
                        <Stack>
                            {incomingRequests.map(req => renderRequestCard(req, true))}
                        </Stack>
                    )}
                </Tabs.Panel>

                <Tabs.Panel value="outgoing">
                    {outgoingRequests.length === 0 ? (
                        <div style={styles.emptyState}>
                            <Text size="xl">🚀</Text>
                            <Text c="dimmed">Henüz bir ürün için talepte bulunmadınız.</Text>
                        </div>
                    ) : (
                        <Stack>
                            {outgoingRequests.map(req => renderRequestCard(req, false))}
                        </Stack>
                    )}
                </Tabs.Panel>
            </Tabs>
        </Container>
    );
}

const styles = {
    emptyState: {
        textAlign: 'center', 
        padding: '50px', 
        backgroundColor: '#f9fafb', 
        borderRadius: '10px',
        border: '1px dashed #d1d5db'
    }
};

export default Requests;