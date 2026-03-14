import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@/theme';
import { 
  Card, 
  Button, 
  Input, 
  Badge, 
  Modal, 
  Table 
} from '@/components/ui';

type Notification = { 
    id: string; 
    type: 'WhatsApp' | 'SMS' | 'Email'; 
    recipient: string; 
    message: string; 
    sentAt: string; 
    status: 'Delivered' | 'Sent' | 'Failed' | 'Pending' 
};

const TEMPLATES = [
  { name: 'Guest Welcome', type: 'WhatsApp', content: 'Welcome to Government Guest House. Your room {room_number} is ready.' },
  { name: 'Vehicle Assignment', type: 'WhatsApp', content: 'Vehicle {vehicle_number} assigned. Driver: {driver_name}.' },
  { name: 'Duty Reminder', type: 'SMS', content: 'Your duty is scheduled for {time_slot} at {location}.' },
];

export default function NotificationScreen() {
    const [logs, setLogs] = useState<Notification[]>([
        { id: 'N001', type: 'WhatsApp', recipient: 'Ram Singh (Driver)', message: 'Vehicle assignment for Shri Rajesh Kumar', sentAt: '2025-12-06 09:15 AM', status: 'Delivered' },
        { id: 'N002', type: 'WhatsApp', recipient: 'Shri Rajesh Kumar', message: 'Welcome to Guest House - Info Package', sentAt: '2025-12-06 09:10 AM', status: 'Delivered' },
        { id: 'N003', type: 'SMS', recipient: 'All Staff', message: 'Room 201 cleaning required by 2 PM', sentAt: '2025-12-06 08:30 AM', status: 'Sent' },
    ]);

    const [showComposeModal, setShowComposeModal] = useState(false);
    const [form, setForm] = useState({ 
        type: 'WhatsApp' as 'WhatsApp' | 'SMS' | 'Email', 
        recipientGroup: 'Single User', 
        message: '' 
    });

    const sendNow = () => {
        if (!form.message.trim()) {
            Alert.alert('Validation', 'Please enter a message');
            return;
        }
        const newLog: Notification = {
            id: `N${String(logs.length + 1).padStart(3, '0')}`,
            type: form.type,
            recipient: form.recipientGroup,
            message: form.message,
            sentAt: new Date().toLocaleString(),
            status: 'Delivered'
        };
        setLogs([newLog, ...logs]);
        setShowComposeModal(false);
        setForm({ ...form, message: '' });
        Alert.alert('Success', 'Notification sent successfully');
    };

    const columns = [
        {
            key: 'recipient',
            title: 'Recipient',
            width: 140,
            render: (n: Notification) => (
                <View>
                    <Text style={styles.cellMainText}>{n.recipient}</Text>
                    <Text style={styles.cellSubText}>{n.type}</Text>
                </View>
            ),
        },
        {
            key: 'status',
            title: 'Status',
            width: 100,
            render: (n: Notification) => (
                <Badge 
                    label={n.status} 
                    variant={n.status === 'Delivered' ? 'success' : n.status === 'Failed' ? 'error' : 'info'} 
                />
            ),
        },
        {
            key: 'sentAt',
            title: 'Sent At',
            width: 120,
            render: (n: Notification) => <Text style={styles.cellSubText}>{n.sentAt}</Text>,
        },
    ];

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>Notifications</Text>
                    <Text style={styles.subtitle}>Broadcast alerts and automated triggers</Text>
                </View>

                {/* Stats Row */}
                <View style={styles.statsGrid}>
                    <Card style={styles.statBox}>
                        <Text style={[styles.statNum, { color: colors.success }]}>{logs.filter(l => l.status === 'Delivered').length}</Text>
                        <Text style={styles.statLabel}>Delivered</Text>
                    </Card>
                    <Card style={styles.statBox}>
                        <Text style={[styles.statNum, { color: colors.warning }]}>{logs.filter(l => l.status === 'Pending').length}</Text>
                        <Text style={styles.statLabel}>Pending</Text>
                    </Card>
                    <Card style={styles.statBox}>
                        <Text style={[styles.statNum, { color: colors.error }]}>{logs.filter(l => l.status === 'Failed').length}</Text>
                        <Text style={styles.statLabel}>Failed</Text>
                    </Card>
                </View>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Templates</Text>
                    <Button 
                        title="New Message" 
                        size="sm" 
                        onPress={() => setShowComposeModal(true)} 
                    />
                </View>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templatesRow}>
                    {TEMPLATES.map((t, i) => (
                        <TouchableOpacity 
                            key={i} 
                            style={styles.templateCard}
                            onPress={() => {
                                setForm({ type: t.type as any, recipientGroup: 'Single User', message: t.content });
                                setShowComposeModal(true);
                            }}
                        >
                            <View style={styles.templateHeader}>
                                <Text style={styles.templateName}>{t.name}</Text>
                                <Ionicons 
                                    name={t.type === 'WhatsApp' ? 'logo-whatsapp' : 'chatbox-ellipses-outline'} 
                                    size={16} 
                                    color={colors.primary} 
                                />
                            </View>
                            <Text style={styles.templateContent} numberOfLines={2}>{t.content}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <Text style={[styles.sectionTitle, { marginTop: spacing.lg, marginBottom: spacing.md }]}>Recent Logs</Text>
                <Table 
                    columns={columns} 
                    data={logs} 
                    keyExtractor={(item) => item.id}
                    containerStyle={styles.table}
                />

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Compose Modal */}
            <Modal
                visible={showComposeModal}
                onClose={() => setShowComposeModal(false)}
                title="Compose Notification"
                footer={
                    <View style={{ flexDirection: 'row', gap: spacing.md }}>
                        <Button title="Cancel" variant="outline" onPress={() => setShowComposeModal(false)} />
                        <Button title="Broadcast Now" onPress={sendNow} />
                    </View>
                }
            >
                <ScrollView keyboardShouldPersistTaps="handled">
                    <Text style={styles.modalLabel}>Channel</Text>
                    <View style={styles.chipGrid}>
                        {['WhatsApp', 'SMS', 'Email'].map(t => (
                            <TouchableOpacity 
                                key={t} 
                                style={[styles.channelChip, form.type === t && styles.channelChipActive]}
                                onPress={() => setForm({...form, type: t as any})}
                            >
                                <Text style={[styles.channelChipText, form.type === t && styles.channelChipTextActive]}>{t}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={styles.modalLabel}>Recipient Group</Text>
                    <View style={styles.chipGrid}>
                        {['Single User', 'All Drivers', 'All Staff'].map(r => (
                            <TouchableOpacity 
                                key={r} 
                                style={[styles.channelChip, form.recipientGroup === r && styles.channelChipActive]}
                                onPress={() => setForm({...form, recipientGroup: r})}
                            >
                                <Text style={[styles.channelChipText, form.recipientGroup === r && styles.channelChipTextActive]}>{r}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Input 
                        label="Message content" 
                        multiline
                        numberOfLines={4}
                        value={form.message} 
                        onChangeText={v => setForm({...form, message: v})}
                        placeholder="Type your message here..."
                    />
                </ScrollView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { padding: spacing.lg },
    header: { marginBottom: spacing.lg },
    title: { ...typography.h2, color: colors.primary },
    subtitle: { ...typography.small, color: colors.muted },
    statsGrid: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        marginBottom: spacing.xl,
        gap: spacing.sm
    },
    statBox: { flex: 1, alignItems: 'center', padding: spacing.md },
    statNum: { fontSize: 20, fontWeight: '700' },
    statLabel: { fontSize: 10, color: colors.muted, marginTop: 2 },
    sectionHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: spacing.md 
    },
    sectionTitle: { ...typography.label, color: colors.primary },
    templatesRow: { flexDirection: 'row', marginBottom: spacing.sm },
    templateCard: {
        width: 200,
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        marginRight: spacing.md,
    },
    templateHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
    templateName: { fontSize: 13, fontWeight: '700', color: colors.text },
    templateContent: { fontSize: 11, color: colors.muted, lineHeight: 16 },
    table: { marginBottom: spacing.md },
    cellMainText: { fontSize: 13, fontWeight: '600', color: colors.text },
    cellSubText: { fontSize: 11, color: colors.muted, marginTop: 2 },
    actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    actionIcon: { padding: 4 },
    modalLabel: { ...typography.small, fontWeight: '700', color: colors.muted, marginBottom: spacing.sm },
    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
    channelChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    channelChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    channelChipText: { fontSize: 12, color: colors.text },
    channelChipTextActive: { color: colors.white, fontWeight: '600' },
});
