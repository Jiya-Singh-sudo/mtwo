import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  StatChipRow, SectionCard, SearchBox, AddButton, EmptyState, PageContainer,
} from '@/components/ui/Premium';
import Header from '@/components/Header';

type Notification = { id: string; type: 'WhatsApp' | 'SMS' | 'Email'; recipient: string; message: string; sentAt: string; status: 'Delivered' | 'Sent' | 'Failed' | 'Pending' };
const CHANNEL_META: Record<string, { color: string; icon: string }> = { WhatsApp: { color: '#25D366', icon: 'logo-whatsapp' }, SMS: { color: '#3B82F6', icon: 'chatbox-ellipses-outline' }, Email: { color: '#F59E0B', icon: 'mail-outline' } };
const STATUS_VARIANT: Record<string, 'success' | 'error' | 'info' | 'warning'> = { Delivered: 'success', Failed: 'error', Sent: 'info', Pending: 'warning' };

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
  const [form, setForm] = useState({ type: 'WhatsApp' as 'WhatsApp' | 'SMS' | 'Email', recipientGroup: 'Single User', message: '' });

  const sendNow = () => {
    if (!form.message.trim()) { Alert.alert('Validation', 'Enter a message'); return; }
    setLogs([{ id: `N${String(logs.length + 1).padStart(3, '0')}`, type: form.type, recipient: form.recipientGroup, message: form.message, sentAt: new Date().toLocaleString(), status: 'Delivered' }, ...logs]);
    setShowComposeModal(false); setForm({ ...form, message: '' });
    Alert.alert('Success', 'Notification sent');
  };

  const statChips = [
    { key: 'delivered', label: 'Delivered', icon: 'checkmark-circle-outline', color: '#22C55E', value: logs.filter(l => l.status === 'Delivered').length },
    { key: 'pending', label: 'Pending', icon: 'time-outline', color: '#F59E0B', value: logs.filter(l => l.status === 'Pending').length },
    { key: 'failed', label: 'Failed', icon: 'close-circle-outline', color: '#EF4444', value: logs.filter(l => l.status === 'Failed').length },
  ];

  return (
    <PageContainer>
      <FlatList
        data={logs}
        keyExtractor={(item) => item.id}
        renderItem={({ item: n }) => {
          const meta = CHANNEL_META[n.type] || { color: colors.muted, icon: 'chatbox-outline' };
          return (
            <Card style={s.card}>
              <View style={s.cardHeader}>
                <View style={[s.cardIcon, { backgroundColor: meta.color + '18' }]}>
                  <Ionicons name={meta.icon as any} size={18} color={meta.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle} numberOfLines={1}>{n.recipient}</Text>
                  <Text style={s.cardSub}>{n.type} · {n.sentAt}</Text>
                </View>
                <Badge label={n.status} variant={STATUS_VARIANT[n.status] || 'info'} />
              </View>
              <Text style={s.messageText} numberOfLines={2}>{n.message}</Text>
            </Card>
          );
        }}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}
        ListHeaderComponent={
          <>
            <Header title="Notifications" subtitle="Broadcast alerts and triggers" fallback="/(drawer)/notification" />
            <StatChipRow chips={statChips} />

            {/* Templates */}
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Templates</Text>
              <AddButton label="Compose" onPress={() => setShowComposeModal(true)} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.templatesRow}>
              {TEMPLATES.map((t, i) => {
                const meta = CHANNEL_META[t.type] || { color: colors.muted, icon: 'chatbox-outline' };
                return (
                  <TouchableOpacity key={i} style={s.templateCard}
                    onPress={() => { setForm({ type: t.type as any, recipientGroup: 'Single User', message: t.content }); setShowComposeModal(true); }}>
                    <View style={s.templateHeader}>
                      <View style={[s.templateIconWrap, { backgroundColor: meta.color + '18' }]}>
                        <Ionicons name={meta.icon as any} size={14} color={meta.color} />
                      </View>
                      <Text style={s.templateName}>{t.name}</Text>
                    </View>
                    <Text style={s.templateContent} numberOfLines={2}>{t.content}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <Text style={s.sectionTitle2}>Recent Logs</Text>
          </>
        }
        ListEmptyComponent={<EmptyState icon="notifications-outline" title="No notifications yet" />}
      />

      {/* ── Compose Modal ── */}
      <Modal visible={showComposeModal} onClose={() => setShowComposeModal(false)} title="Compose Notification"
        footer={<View style={{ flexDirection: 'row', gap: spacing.md }}><Button title="Cancel" variant="outline" onPress={() => setShowComposeModal(false)} /><Button title="Broadcast" onPress={sendNow} /></View>}>
        <ScrollView keyboardShouldPersistTaps="handled">
          <SectionCard title="Channel" icon="send-outline">
            <View style={s.chipGrid}>
              {(['WhatsApp', 'SMS', 'Email'] as const).map(t => {
                const active = form.type === t; const meta = CHANNEL_META[t];
                return (
                  <TouchableOpacity key={t} onPress={() => setForm({ ...form, type: t })}
                    style={[s.channelChip, active && { backgroundColor: meta.color, borderColor: meta.color }]}>
                    <Ionicons name={meta.icon as any} size={14} color={active ? '#fff' : meta.color} />
                    <Text style={[s.channelText, active && { color: '#fff' }]}>{t}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </SectionCard>
          <SectionCard title="Recipients" icon="people-outline">
            <View style={s.chipGrid}>
              {['Single User', 'All Drivers', 'All Staff'].map(r => {
                const active = form.recipientGroup === r;
                return (
                  <TouchableOpacity key={r} onPress={() => setForm({ ...form, recipientGroup: r })}
                    style={[s.recipientChip, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                    <Text style={[s.recipientText, active && { color: '#fff' }]}>{r}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </SectionCard>
          <SectionCard title="Message" icon="document-text-outline">
            <Input multiline numberOfLines={4} value={form.message} onChangeText={v => setForm({ ...form, message: v })} placeholder="Type your message..." />
          </SectionCard>
        </ScrollView>
      </Modal>
    </PageContainer>
  );
}

const s = StyleSheet.create({
  card: { marginBottom: 10, padding: 14, borderRadius: 14, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  cardIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: colors.text },
  cardSub: { fontSize: 11, color: colors.muted, marginTop: 1 },
  messageText: { fontSize: 12, color: colors.muted, lineHeight: 18 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.primary },
  sectionTitle2: { fontSize: 15, fontWeight: '700', color: colors.primary, marginTop: spacing.lg, marginBottom: spacing.md },
  templatesRow: { flexDirection: 'row', marginBottom: spacing.sm },
  templateCard: { width: 200, backgroundColor: '#fff', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E5E7EB', marginRight: 10 },
  templateHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  templateIconWrap: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  templateName: { fontSize: 13, fontWeight: '700', color: colors.text },
  templateContent: { fontSize: 11, color: colors.muted, lineHeight: 16 },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  channelChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff' },
  channelText: { fontSize: 12, fontWeight: '600', color: colors.text },
  recipientChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff' },
  recipientText: { fontSize: 12, fontWeight: '600', color: colors.text },
});
