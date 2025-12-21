import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { toast } from 'react-toastify';
import { Container, Title, Card, Badge, Group, Text, Button, Stack, Avatar, Grid } from '@mantine/core';
import Swal from 'sweetalert2';

function IncomingRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        try {
            // Backend rotası: @transactions_bp.route('/incoming', ...)
            // Blueprint prefix'i muhtemelen '/transactions' veya '/api/transactions'
            const res = await axiosClient.get('/transactions/incoming');
            setRequests(res.data);
        } catch (error) {
            console.error(error);
            toast.error("Talepler yüklenemedi.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleStatusUpdate = async (id, status) => {
        // UI için metinler (approved/rejected)
        const actionText = status === 'approved' ? 'Onaylamak' : 'Reddetmek';
        const confirmBtnColor = status === 'approved' ? '#10b981' : '#ef4444';

        // Backend'in beklediği komutlar (approve/reject)
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
            // DÜZELTME: Backend POST bekliyor ve URL '/respond' ile bitiyor.
            // Ayrıca body içinde 'action' anahtarı bekliyor.
            await axiosClient.post(`/transactions/${id}/respond`, { action: backendAction });
            
            toast.success(`Talep ${status === 'approved' ? 'onaylandı' : 'reddedildi'}.`);
            
            // Listeyi güncelle: İşlem yapılanı listeden çıkar
            setRequests(prev => prev.filter(req => req.id !== id));
            
        } catch (error) {
            console.error(error);
            toast.error("İşlem başarısız: " + (error.response?.data?.message || "Hata oluştu"));
        }
    };

    // Duruma göre renk seçimi
    const getStatusBadge = (status) => {
        if (!status) return { color: 'gray', label: 'Bilinmiyor' };
        const s = status.toLowerCase();
        switch (s) {
            case 'pending': return { color: 'yellow', label: '⏳ Onay Bekliyor' };
            case 'approved': return { color: 'green', label: '✅ Onaylandı' };
            case 'rejected': return { color: 'red', label: '❌ Reddedildi' };
            case 'completed': return { color: 'blue', label: '🏁 Tamamlandı' };
            default: return { color: 'gray', label: status };
        }
    };

    // Profil Resmi URL Düzeltici
    const getImageUrl = (url) => {
        if (!url) return null;
        // Eğer backend URL'i zaten varsa dokunma, yoksa ekle
        return url.startsWith('http') ? url : `http://127.0.0.1:5000${url}`;
    };

    if (loading) return <div style={{textAlign:'center', marginTop:'50px', color:'#6366f1'}}>Yükleniyor...</div>;

    return (
        <Container size="md" py="xl">
            <Title order={2} mb="lg" ta="center" c="dimmed">📥 Gelen Talepler</Title>

            {requests.length === 0 ? (
                <div style={{textAlign: 'center', padding: '50px', backgroundColor: '#f9fafb', borderRadius: '10px'}}>
                    <Text size="xl">📭</Text>
                    <Text c="dimmed" size="lg" mt="sm">Henüz bekleyen bir talep yok.</Text>
                </div>
            ) : (
                <Stack>
                    {requests.map((req) => {
                        const badgeInfo = getStatusBadge(req.status);
                        const startDate = req.start_date ? new Date(req.start_date).toLocaleDateString('tr-TR') : '-';
                        const endDate = req.end_date ? new Date(req.end_date).toLocaleDateString('tr-TR') : '-';
                        const isRent = req.transaction_type === 'RENT'; // Backend 'transaction_type' gönderiyor

                        return (
                            <Card key={req.id} shadow="sm" padding="lg" radius="md" withBorder>
                                <Grid gutter="md" align="center">
                                    
                                    {/* 1. Ürün Resmi ve Bilgisi */}
                                    <Grid.Col span={{ base: 12, sm: 2 }}>
                                        <Avatar 
                                            src={getImageUrl(req.product_image)} 
                                            size="xl" 
                                            radius="md" 
                                            color="blue"
                                        >
                                            📦
                                        </Avatar>
                                    </Grid.Col>

                                    {/* 2. Detaylar */}
                                    <Grid.Col span={{ base: 12, sm: 6 }}>
                                        <Group gap="xs" mb={5}>
                                            <Text fw={700} size="lg">{req.product_title || "Ürün Adı Yok"}</Text>
                                            <Badge variant="dot" color={isRent ? 'orange' : 'teal'}>
                                                {isRent ? 'Kiralama' : req.transaction_type}
                                            </Badge>
                                        </Group>
                                        
                                        <Group gap="xs" mb={5}>
                                            <Text size="sm" c="dimmed">Talep Eden:</Text>
                                            <Badge variant="outline" color="gray" size="sm">@{req.buyer_name}</Badge>
                                        </Group>

                                        {isRent && (
                                            <Text size="sm" c="dimmed">
                                                📅 {startDate} - {endDate}
                                            </Text>
                                        )}
                                    </Grid.Col>

                                    {/* 3. Fiyat ve Aksiyonlar */}
                                    <Grid.Col span={{ base: 12, sm: 4 }} style={{ textAlign: 'right' }}>
                                        <Text size="xl" fw={800} c="blue" mb="md">
                                            {req.price?.toLocaleString('tr-TR')} TL
                                        </Text>

                                        {/* Sadece PENDING ise butonları göster */}
                                        {(req.status === 'pending' || req.status === 'PENDING') && (
                                            <Group justify="end" gap="xs">
                                                <Button 
                                                    color="red" 
                                                    variant="light" 
                                                    size="xs"
                                                    onClick={() => handleStatusUpdate(req.id, 'rejected')}
                                                >
                                                    Reddet
                                                </Button>
                                                <Button 
                                                    color="green" 
                                                    size="xs"
                                                    onClick={() => handleStatusUpdate(req.id, 'approved')}
                                                >
                                                    Onayla
                                                </Button>
                                            </Group>
                                        )}

                                        {/* PENDING değilse rozeti göster */}
                                        {req.status !== 'pending' && req.status !== 'PENDING' && (
                                            <Badge color={badgeInfo.color} size="lg">{badgeInfo.label}</Badge>
                                        )}
                                    </Grid.Col>

                                </Grid>
                            </Card>
                        );
                    })}
                </Stack>
            )}
        </Container>
    );
}

export default IncomingRequests;