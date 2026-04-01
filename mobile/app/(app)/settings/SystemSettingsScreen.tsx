import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SectionCard, PageContainer } from '@/components/ui/Premium';
import Header from '@/components/Header';

type ModalType = 'room' | 'vehicle' | 'duty' | 'emergency';

const SECTION_META: Record<ModalType, { icon: string; color: string; title: string }> = {
  room: { icon: 'bed-outline', color: '#8B5CF6', title: 'Room Categories' },
  vehicle: { icon: 'car-outline', color: '#22C55E', title: 'Vehicle Fleet Types' },
  duty: { icon: 'people-outline', color: '#3B82F6', title: 'Duty Departments' },
  emergency: { icon: 'warning-outline', color: '#EF4444', title: 'Emergency Protocols' },
};

export default function SystemSettingsScreen() {
  const [roomCategories, setRoomCategories] = useState(['Standard', 'Deluxe', 'Suite', 'VIP Suite', 'VVIP Suite']);
  const [vehicleTypes, setVehicleTypes] = useState(['Sedan', 'SUV', 'MUV', 'Luxury Car', 'Mini Bus']);
  const [dutyCategories, setDutyCategories] = useState(['Housekeeping', 'Security', 'Kitchen', 'Front Desk', 'Maintenance', 'Transport']);
  const [emergencyContacts, setEmergencyContacts] = useState<{ name: string; phone: string }[]>([
    { name: 'Admin Office', phone: '100' }, { name: 'Security Control', phone: '101' }, { name: 'Medical Emergency', phone: '108' },
  ]);
  const [language, setLanguage] = useState('English');
  const [modalConfig, setModalConfig] = useState<{ visible: boolean; type: ModalType; value: string; phone?: string; index: number | null }>({ visible: false, type: 'room', value: '', index: null });

  const openModal = (type: ModalType, value = '', index: number | null = null, phone = '') => setModalConfig({ visible: true, type, value, phone, index });

  const handleSave = () => {
    if (!modalConfig.value.trim()) return;
    const { type, value, phone, index } = modalConfig;
    if (type === 'room') { const u = [...roomCategories]; index !== null ? (u[index] = value) : u.push(value); setRoomCategories(u); }
    else if (type === 'vehicle') { const u = [...vehicleTypes]; index !== null ? (u[index] = value) : u.push(value); setVehicleTypes(u); }
    else if (type === 'duty') { const u = [...dutyCategories]; index !== null ? (u[index] = value) : u.push(value); setDutyCategories(u); }
    else if (type === 'emergency') { const u = [...emergencyContacts]; const n = { name: value, phone: phone || '' }; index !== null ? (u[index] = n) : u.push(n); setEmergencyContacts(u); }
    setModalConfig({ ...modalConfig, visible: false });
  };

  const confirmDelete = (type: ModalType, index: number) => {
    Alert.alert('Delete Entry', 'Remove this category?', [{ text: 'Keep', style: 'cancel' }, {
      text: 'Delete', style: 'destructive', onPress: () => {
        if (type === 'room') setRoomCategories(roomCategories.filter((_, i) => i !== index));
        if (type === 'vehicle') setVehicleTypes(vehicleTypes.filter((_, i) => i !== index));
        if (type === 'duty') setDutyCategories(dutyCategories.filter((_, i) => i !== index));
        if (type === 'emergency') setEmergencyContacts(emergencyContacts.filter((_, i) => i !== index));
      }
    }]);
  };

  const renderSection = (type: ModalType, items: any[]) => {
    const meta = SECTION_META[type];
    return (
      <Card style={s.sectionCard} key={type}>
        <View style={s.sectionHeader}>
          <View style={s.sectionTitleRow}>
            <View style={[s.sectionIconWrap, { backgroundColor: meta.color + '18' }]}>
              <Ionicons name={meta.icon as any} size={16} color={meta.color} />
            </View>
            <Text style={[s.sectionTitle, { color: meta.color }]}>{meta.title}</Text>
          </View>
          <TouchableOpacity onPress={() => openModal(type)} style={[s.addBtn, { backgroundColor: meta.color }]}>
            <Ionicons name="add" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
        {items.map((item, i) => {
          const label = typeof item === 'string' ? item : item.name;
          const sub = typeof item === 'string' ? null : item.phone;
          return (
            <View key={i} style={s.itemRow}>
              <View style={[s.itemDot, { backgroundColor: meta.color }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.itemText}>{label}</Text>
                {sub && <Text style={s.itemSub}>{sub}</Text>}
              </View>
              <TouchableOpacity onPress={() => type === 'emergency' ? openModal(type, (item as any).name, i, (item as any).phone) : openModal(type, item, i)} style={s.iconBtn}>
                <Ionicons name="create-outline" size={16} color="#22C55E" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => confirmDelete(type, i)} style={s.iconBtn}>
                <Ionicons name="trash-outline" size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          );
        })}
      </Card>
    );
  };

  return (
    <PageContainer>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}>
        <Header title="System Settings" subtitle="Master categories and preferences" fallback="/(drawer)/settings" />

        {renderSection('room', roomCategories)}
        {renderSection('vehicle', vehicleTypes)}
        {renderSection('duty', dutyCategories)}
        {renderSection('emergency', emergencyContacts)}

        {/* Language Prefs */}
        <SectionCard title="System Language" icon="language-outline">
          <View style={s.langGrid}>
            {['English', 'हिन्दी (Hindi)', 'Bilingual'].map(l => {
              const active = language === l;
              return (
                <TouchableOpacity key={l} onPress={() => setLanguage(l)}
                  style={[s.langChip, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                  <Text style={[s.langText, active && { color: '#fff' }]}>{l}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Button title="Save Preferences" onPress={() => Alert.alert('Saved', 'Global settings updated.')} />
        </SectionCard>
      </ScrollView>

      <Modal visible={modalConfig.visible} onClose={() => setModalConfig({ ...modalConfig, visible: false })}
        title={`${modalConfig.index === null ? 'Add' : 'Update'} Entry`}
        footer={<View style={{ flexDirection: 'row', gap: spacing.md }}><Button title="Cancel" variant="outline" onPress={() => setModalConfig({ ...modalConfig, visible: false })} /><Button title="Save" onPress={handleSave} /></View>}>
        <SectionCard title="Details" icon="pencil-outline">
          <Input label="Entry Name" value={modalConfig.value} onChangeText={v => setModalConfig({ ...modalConfig, value: v })} />
          {modalConfig.type === 'emergency' && (
            <Input label="Phone / Extension" keyboardType="phone-pad" value={modalConfig.phone} onChangeText={v => setModalConfig({ ...modalConfig, phone: v })} />
          )}
        </SectionCard>
      </Modal>
    </PageContainer>
  );
}

const s = StyleSheet.create({
  sectionCard: { padding: 14, marginBottom: 14, borderRadius: 14 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', marginBottom: 8 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionIconWrap: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  addBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  itemDot: { width: 6, height: 6, borderRadius: 3 },
  itemText: { fontSize: 13, color: colors.text, fontWeight: '500' },
  itemSub: { fontSize: 11, color: colors.muted },
  iconBtn: { padding: 4 },
  langGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  langChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff' },
  langText: { fontSize: 12, fontWeight: '600', color: colors.text },
});
