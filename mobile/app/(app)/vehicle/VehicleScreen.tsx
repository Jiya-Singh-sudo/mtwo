import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, Dimensions, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getVehiclesTable, getVehicleStats, createVehicle, updateVehicle, softDeleteVehicle } from '@/api/vehicles.api';
import { colors, spacing } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  StatChipRow, ActionButton, InfoChip, SectionCard, DetailRow, SearchBox, AddButton, EmptyState, PageContainer,
} from '@/components/ui/Premium';
import Header from '@/components/Header';

export default function VehicleScreen() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>({ total: 0, active: 0, inactive: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [form, setForm] = useState({ vehicle_no: '', vehicle_name: '', vehicle_type: '', capacity: '', status: 'ACTIVE' });

  useEffect(() => { loadVehicles(); loadStats(); }, [page, search]);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const res = await getVehiclesTable({ page, limit: 10, search: search || undefined, sortBy: 'vehicle_no', sortOrder: 'asc' });
      setVehicles(res.data || []);
    } catch { Alert.alert('Error', 'Could not load vehicle data'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const loadStats = async () => { try { setStats(await getVehicleStats()); } catch {} };
  const onRefresh = useCallback(() => { setRefreshing(true); loadVehicles(); loadStats(); }, []);

  const handleSave = async () => {
    if (!form.vehicle_no || !form.vehicle_name) { Alert.alert('Validation', 'Vehicle No and Name required'); return; }
    setLoading(true);
    try {
      if (isEdit) {
        await updateVehicle(selectedVehicle.vehicle_no, { vehicle_name: form.vehicle_name, model: form.vehicle_type, capacity: Number(form.capacity) || undefined, status: form.status } as any);
        Alert.alert('Success', 'Vehicle updated');
      } else {
        await createVehicle({ vehicle_no: form.vehicle_no, vehicle_name: form.vehicle_name, model: form.vehicle_type, capacity: Number(form.capacity) || undefined });
        Alert.alert('Success', 'Vehicle added');
      }
      setShowFormModal(false); loadVehicles(); loadStats();
    } catch (err: any) { Alert.alert('Error', err?.message || 'Failed to save'); }
    finally { setLoading(false); }
  };

  const handleDelete = (v: any) => {
    Alert.alert('Delete Vehicle', `Delete ${v.vehicle_no}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { try { await softDeleteVehicle(v.vehicle_no); loadVehicles(); loadStats(); } catch { Alert.alert('Error', 'Failed to delete'); } } },
    ]);
  };

  const openForm = (v?: any) => {
    if (v) { setIsEdit(true); setSelectedVehicle(v); setForm({ vehicle_no: v.vehicle_no, vehicle_name: v.vehicle_name || '', vehicle_type: v.vehicle_type || '', capacity: String(v.capacity || ''), status: v.status || 'ACTIVE' }); }
    else { setIsEdit(false); setForm({ vehicle_no: '', vehicle_name: '', vehicle_type: '', capacity: '', status: 'ACTIVE' }); }
    setShowFormModal(true);
  };

  const statChips = [
    { key: 'total', label: 'Total', icon: 'car-sport-outline', color: colors.primary, value: stats.total || 0 },
    { key: 'active', label: 'Active', icon: 'checkmark-circle-outline', color: '#22C55E', value: stats.active || 0 },
    { key: 'inactive', label: 'Inactive', icon: 'close-circle-outline', color: '#EF4444', value: stats.inactive || 0 },
  ];

  return (
    <PageContainer>
      <FlatList
        data={vehicles}
        keyExtractor={(item, idx) => (item.vehicle_no || idx).toString()}
        renderItem={({ item: v }) => (
          <Card style={s.card}>
            <View style={s.cardHeader}>
              <View style={[s.cardIcon, { backgroundColor: v.status === 'ACTIVE' ? '#22C55E18' : '#EF444418' }]}>
                <Ionicons name="car-sport-outline" size={20} color={v.status === 'ACTIVE' ? '#22C55E' : '#EF4444'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle} numberOfLines={1}>{v.vehicle_no}</Text>
                <Text style={s.cardSub} numberOfLines={1}>{v.vehicle_name || '—'}</Text>
              </View>
              <Badge label={v.status} variant={v.status === 'ACTIVE' ? 'success' : 'error'} />
            </View>
            <View style={s.infoGrid}>
              {v.vehicle_type ? <InfoChip icon="pricetag-outline" label={v.vehicle_type} /> : null}
              {v.capacity ? <InfoChip icon="people-outline" label={`${v.capacity} seats`} /> : null}
            </View>
            <View style={s.cardActions}>
              <ActionButton icon="eye-outline" color="#3B82F6" label="View" onPress={() => { setSelectedVehicle(v); setShowViewModal(true); }} />
              <ActionButton icon="create-outline" color="#22C55E" label="Edit" onPress={() => openForm(v)} />
              <ActionButton icon="trash-outline" color="#EF4444" label="Delete" onPress={() => handleDelete(v)} />
            </View>
          </Card>
        )}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListHeaderComponent={
          <>
            <Header title="Vehicle Management" subtitle="Maintain your transport fleet" fallback="/(drawer)/vehicle" />
            <StatChipRow chips={statChips} />
            <View style={s.toolbar}>
              <SearchBox>
                <Input placeholder="Search vehicle..." value={search} onChangeText={setSearch}
                  containerStyle={{ marginBottom: 0, flex: 1 }} inputStyle={{ borderWidth: 0, height: 40, fontSize: 14, paddingHorizontal: 0 }} />
              </SearchBox>
              <AddButton label="Add" onPress={() => openForm()} />
            </View>
          </>
        }
        ListEmptyComponent={!loading ? <EmptyState icon="car-sport-outline" title="No vehicles found" /> : null}
        ListFooterComponent={vehicles.length > 0 ? (
          <View style={s.pagination}>
            <Button title="← Prev" variant="outline" size="sm" disabled={page === 1} onPress={() => setPage(page - 1)} />
            <Text style={s.pageText}>Page {page}</Text>
            <Button title="Next →" variant="outline" size="sm" disabled={vehicles.length < 10} onPress={() => setPage(page + 1)} />
          </View>
        ) : null}
      />

      {/* ── Form Modal ── */}
      <Modal visible={showFormModal} onClose={() => setShowFormModal(false)} title={isEdit ? 'Edit Vehicle' : 'Add Vehicle'}
        footer={<View style={{ flexDirection: 'row', gap: spacing.md }}><Button title="Cancel" variant="outline" onPress={() => setShowFormModal(false)} /><Button title="Save" onPress={handleSave} loading={loading} /></View>}>
        <ScrollView keyboardShouldPersistTaps="handled">
          <SectionCard title="Vehicle Info" icon="car-sport-outline">
            {!isEdit && <Input label="Vehicle Number" placeholder="MH-12-AB-1234" value={form.vehicle_no} onChangeText={v => setForm({ ...form, vehicle_no: v })} />}
            <Input label="Vehicle Name" placeholder="Innova / Swift" value={form.vehicle_name} onChangeText={v => setForm({ ...form, vehicle_name: v })} />
            <Input label="Type" placeholder="SUV / Sedan" value={form.vehicle_type} onChangeText={v => setForm({ ...form, vehicle_type: v })} />
            <Input label="Capacity" placeholder="e.g. 7" keyboardType="numeric" value={form.capacity} onChangeText={v => setForm({ ...form, capacity: v })} />
          </SectionCard>
          {isEdit && (
            <SectionCard title="Status" icon="toggle-outline">
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                {['ACTIVE', 'INACTIVE'].map(st => (
                  <TouchableOpacity key={st} onPress={() => setForm({ ...form, status: st })}
                    style={[s.statusOption, form.status === st && s.statusOptionActive]}>
                    <Ionicons name={st === 'ACTIVE' ? 'checkmark-circle-outline' : 'close-circle-outline'} size={16}
                      color={form.status === st ? '#fff' : (st === 'ACTIVE' ? '#22C55E' : '#EF4444')} />
                    <Text style={[s.statusLabel, form.status === st && { color: '#fff' }]}>{st}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </SectionCard>
          )}
        </ScrollView>
      </Modal>

      {/* ── View Modal ── */}
      <Modal visible={showViewModal} onClose={() => setShowViewModal(false)} title="Vehicle Details"
        footer={<Button title="Close" variant="outline" onPress={() => setShowViewModal(false)} />}>
        {selectedVehicle && (
          <SectionCard title="Details" icon="car-sport-outline">
            <DetailRow label="Vehicle No" value={selectedVehicle.vehicle_no} highlight />
            <DetailRow label="Name" value={selectedVehicle.vehicle_name} />
            <DetailRow label="Type" value={selectedVehicle.vehicle_type} />
            <DetailRow label="Capacity" value={String(selectedVehicle.capacity || '—')} />
            <DetailRow label="Status" value={selectedVehicle.status} />
          </SectionCard>
        )}
      </Modal>
    </PageContainer>
  );
}

const s = StyleSheet.create({
  // card: radius 14, shadow — matches Food/Room/Guest/Transport/Driver
  card: { marginBottom: 12, padding: 14, borderRadius: 14, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  // icon circle: 42×42 r12 — same as all pages
  cardIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  cardSub: { fontSize: 12, color: colors.muted, marginTop: 1 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  // actions: consistent border-top separator — matches Food/Transport
  cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10 },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  pageText: { fontSize: 13, fontWeight: '600', color: colors.text },
  // status pills: borderRadius 20, border — matches Report/DriverDuty filter pills
  statusOption: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff' },
  statusOptionActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  statusLabel: { fontSize: 13, fontWeight: '600', color: colors.text },
});
