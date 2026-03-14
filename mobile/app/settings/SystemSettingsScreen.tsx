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
  Modal 
} from '@/components/ui';

type ModalType = 'room' | 'vehicle' | 'duty' | 'emergency';

export default function SystemSettingsScreen() {
    const [roomCategories, setRoomCategories] = useState(['Standard', 'Deluxe', 'Suite', 'VIP Suite', 'VVIP Suite']);
    const [vehicleTypes, setVehicleTypes] = useState(['Sedan', 'SUV', 'MUV', 'Luxury Car', 'Mini Bus']);
    const [dutyCategories, setDutyCategories] = useState(['Housekeeping', 'Security', 'Kitchen', 'Front Desk', 'Maintenance', 'Transport']);
    const [emergencyContacts, setEmergencyContacts] = useState<{ name: string; phone: string }[]>([
        { name: 'Admin Office', phone: '100' },
        { name: 'Security Control', phone: '101' },
        { name: 'Medical Emergency', phone: '108' },
    ]);
    const [language, setLanguage] = useState('English');

    const [modalConfig, setModalConfig] = useState<{ 
        visible: boolean; 
        type: ModalType; 
        value: string; 
        phone?: string; 
        index: number | null 
    }>({
        visible: false,
        type: 'room',
        value: '',
        index: null
    });

    const openModal = (type: ModalType, value = '', index: number | null = null, phone = '') => {
        setModalConfig({ visible: true, type, value, phone, index });
    };

    const handleSave = () => {
        if (!modalConfig.value.trim()) return;

        const { type, value, phone, index } = modalConfig;

        if (type === 'room') {
            const updated = [...roomCategories];
            index !== null ? (updated[index] = value) : updated.push(value);
            setRoomCategories(updated);
        } else if (type === 'vehicle') {
            const updated = [...vehicleTypes];
            index !== null ? (updated[index] = value) : updated.push(value);
            setVehicleTypes(updated);
        } else if (type === 'duty') {
            const updated = [...dutyCategories];
            index !== null ? (updated[index] = value) : updated.push(value);
            setDutyCategories(updated);
        } else if (type === 'emergency') {
            const updated = [...emergencyContacts];
            const newItem = { name: value, phone: phone || '' };
            index !== null ? (updated[index] = newItem) : updated.push(newItem);
            setEmergencyContacts(updated);
        }

        setModalConfig({ ...modalConfig, visible: false });
    };

    const confirmDelete = (type: ModalType, index: number) => {
        Alert.alert('Delete Entry', 'Remove this category from the system?', [
            { text: 'Keep', style: 'cancel' },
            { 
                text: 'Delete', 
                style: 'destructive', 
                onPress: () => {
                    if (type === 'room') setRoomCategories(roomCategories.filter((_, i) => i !== index));
                    if (type === 'vehicle') setVehicleTypes(vehicleTypes.filter((_, i) => i !== index));
                    if (type === 'duty') setDutyCategories(dutyCategories.filter((_, i) => i !== index));
                    if (type === 'emergency') setEmergencyContacts(emergencyContacts.filter((_, i) => i !== index));
                } 
            }
        ]);
    };

    const SettingsSection = ({ title, icon, items, type, onAdd, onEdit, onDelete }: any) => (
        <Card style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                    <Ionicons name={icon} size={18} color={colors.primary} />
                    <Text style={styles.sectionTitle}>{title}</Text>
                </View>
                <TouchableOpacity onPress={onAdd}>
                    <Ionicons name="add-circle" size={24} color={colors.primary} />
                </TouchableOpacity>
            </View>
            <View style={styles.itemsList}>
                {items.map((item: any, i: number) => {
                    const label = typeof item === 'string' ? item : item.name;
                    const subLabel = typeof item === 'string' ? null : item.phone;
                    return (
                        <View key={i} style={styles.itemRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.itemText}>{label}</Text>
                                {subLabel && <Text style={styles.itemSubText}>{subLabel}</Text>}
                            </View>
                            <View style={styles.itemActions}>
                                <TouchableOpacity onPress={() => onEdit(item, i)}>
                                    <Ionicons name="create-outline" size={18} color={colors.success} />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={() => onDelete(i)}>
                                    <Ionicons name="trash-outline" size={18} color={colors.error} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                })}
            </View>
        </Card>
    );

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>System Settings</Text>
                    <Text style={styles.subtitle}>Configure master categories and app preferences</Text>
                </View>

                <SettingsSection 
                    title="Room Categories" 
                    icon="bed-outline" 
                    items={roomCategories} 
                    type="room"
                    onAdd={() => openModal('room')}
                    onEdit={(v: string, i: number) => openModal('room', v, i)}
                    onDelete={(i: number) => confirmDelete('room', i)}
                />

                <SettingsSection 
                    title="Vehicle Fleet Types" 
                    icon="car-outline" 
                    items={vehicleTypes} 
                    type="vehicle"
                    onAdd={() => openModal('vehicle')}
                    onEdit={(v: string, i: number) => openModal('vehicle', v, i)}
                    onDelete={(i: number) => confirmDelete('vehicle', i)}
                />

                <SettingsSection 
                    title="Duty Departments" 
                    icon="people-outline" 
                    items={dutyCategories} 
                    type="duty"
                    onAdd={() => openModal('duty')}
                    onEdit={(v: string, i: number) => openModal('duty', v, i)}
                    onDelete={(i: number) => confirmDelete('duty', i)}
                />

                <SettingsSection 
                    title="Emergency Protocols" 
                    icon="warning-outline" 
                    items={emergencyContacts} 
                    type="emergency"
                    onAdd={() => openModal('emergency')}
                    onEdit={(v: any, i: number) => openModal('emergency', v.name, i, v.phone)}
                    onDelete={(i: number) => confirmDelete('emergency', i)}
                />

                <Card style={styles.prefsCard}>
                    <Text style={styles.modalLabel}>System Language</Text>
                    <View style={styles.langGrid}>
                        {['English', 'हिन्दी (Hindi)', 'Bilingual'].map(l => (
                            <TouchableOpacity 
                                key={l} 
                                style={[styles.langChip, language === l && styles.langChipActive]}
                                onPress={() => setLanguage(l)}
                            >
                                <Text style={[styles.langChipText, language === l && styles.langChipTextActive]}>{l}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <Button title="Save Preferences" onPress={() => Alert.alert('Saved', 'Global settings updated.')} />
                </Card>

                <View style={{ height: 40 }} />
            </ScrollView>

            <Modal
                visible={modalConfig.visible}
                onClose={() => setModalConfig({ ...modalConfig, visible: false })}
                title={`${modalConfig.index === null ? 'Add' : 'Update'} Entry`}
                footer={
                    <View style={{ flexDirection: 'row', gap: spacing.md }}>
                        <Button title="Cancel" variant="outline" onPress={() => setModalConfig({ ...modalConfig, visible: false })} />
                        <Button title="Save Changes" onPress={handleSave} />
                    </View>
                }
            >
                <Input 
                    label="Entry Name" 
                    value={modalConfig.value} 
                    onChangeText={v => setModalConfig({ ...modalConfig, value: v })}
                />
                {modalConfig.type === 'emergency' && (
                    <Input 
                        label="Phone / Extension" 
                        keyboardType="phone-pad"
                        value={modalConfig.phone} 
                        onChangeText={v => setModalConfig({ ...modalConfig, phone: v })}
                    />
                )}
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
    sectionCard: { padding: spacing.md, marginBottom: spacing.md },
    sectionHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingBottom: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        marginBottom: spacing.sm
    },
    sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    sectionTitle: { ...typography.body, fontWeight: '700', color: colors.primary },
    itemsList: { gap: spacing.xs },
    itemRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingVertical: spacing.xs 
    },
    itemText: { fontSize: 13, color: colors.text, fontWeight: '500' },
    itemSubText: { fontSize: 11, color: colors.muted },
    itemActions: { flexDirection: 'row', gap: spacing.md },
    prefsCard: { padding: spacing.md, marginTop: spacing.md },
    modalLabel: { fontSize: 12, fontWeight: '700', color: colors.muted, marginBottom: spacing.sm, textTransform: 'uppercase' },
    langGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
    langChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: 16,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
    },
    langChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
    langChipText: { fontSize: 11, color: colors.text },
    langChipTextActive: { color: colors.primary, fontWeight: '700' },
});
