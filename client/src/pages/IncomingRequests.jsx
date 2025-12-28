import { useEffect, useState } from 'react';
import axiosClient from '../api/axiosClient';
import { toast } from 'react-toastify';
import { Container, Title, Card, Badge, Group, Text, Button, Stack, Avatar, Grid, Tabs, Blockquote } from '@mantine/core';
import Swal from 'sweetalert2';

function Requests() {
    const [incomingRequests, setIncomingRequests] = useState([]);
    const [outgoingRequests, setOutgoingRequests] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('incoming');

    const fetchAllRequests = async () => {
        setLoading(true);
        try {
            const [resIncoming, resOutgoing] = await Promise.all([
                axiosClient.get('/transactions/incoming'),
                axiosClient.get('/transactions/outgoing')
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
            fetchAllRequests(); 
        } catch (error) {
            console.error(error);
            toast.error("İşlem başarısız: " + (error.response?.data?.message || "Hata oluştu"));
        }
    };

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

    const renderRequestCard = (req, isIncoming) => {
        const statusBadge = getStatusBadge(req.status);
        const typeBadge = getTypeBadge(req.transaction_type);
        const startDate = req.start_date ? new Date(req.start_date).toLocaleDateString('tr-TR') : null;
        const endDate = req.end_date ? new Date(req.end_date).toLocaleDateString('tr-TR') : null;

        const counterPartyLabel = isIncoming ? "Talep Eden:" : "Satıcı:";
        const counterPartyName = req.other_party_name || (isIncoming ? req.buyer_name : req.seller_name);

        return (
            <Card key={req.id} shadow="sm" padding="lg" radius="md" withBorder mb="md">
                <Grid gutter="md" align="start">

                    <Grid.Col span={{ base: 12, sm: 2 }}>
                        <Avatar 
                            src={getImageUrl(req.product_image)} 
                            size="xl" 
                            radius="md" 
                            color="blue"
                        >📦</Avatar>
                    </Grid.Col>

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

                        {startDate && endDate && (
                            <Text size="sm" c="dimmed">
                                📅 {startDate} - {endDate}
                            </Text>
                        )}

                        {req.transaction_type === 'swap' && req.swap_product_title && (
                            <Group mt={10} align="center">
                                <Text size="sm" fw={600} c="indigo">🔄 Teklif Edilen:</Text>
                                <Group gap={5}>
                                    {req.swap_product_image && (
                                        <Avatar src={getImageUrl(req.swap_product_image)} size="sm" radius="sm" />
                                    )}
                                    <Text size="sm" fw={500}>{req.swap_product_title}</Text>
                                </Group>
                            </Group>
                        )}

                        {req.message && (
                            <Blockquote 
                                color="blue" 
                                p="xs" 
                                mt="sm" 
                                iconSize={20}
                                style={{ fontSize: '0.9rem', backgroundColor: '#f8f9fa' }}
                            >
                                {req.message}
                            </Blockquote>
                        )}
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, sm: 4 }} style={{ textAlign: 'right' }}>
                        {req.transaction_type !== 'swap' && req.price > 0 && (
                            <Text size="xl" fw={800} c="blue" mb="md">
                                {req.price?.toLocaleString('tr-TR')} TL
                            </Text>
                        )}

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