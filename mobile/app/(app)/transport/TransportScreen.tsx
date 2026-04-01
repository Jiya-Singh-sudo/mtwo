import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getGuestTransportTable,
  assignDriverToGuest,
  assignVehicleToGuest,
  getAssignableDriversByDate,
  getAssignableVehicles,
  releaseVehicle,
  closeGuestDriver,
} from '@/api/guestTransport.api';
import { colors, spacing } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  StatChipRow,
  ActionButton,
  InfoChip,
  SectionCard,
  DetailRow,
  SearchBox,
  AddButton,
  EmptyState,
  PageContainer,
} from '@/components/ui/Premium';
import { formatDate, formatTime } from '@/utils/dateTime';
import Header from '@/components/Header';

export default function TransportScreen() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [statusCounts, setStatusCounts] = useState<any>({});
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  // Modals
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  // Assignment states
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { loadTransport(); }, [page, search]);

  const loadTransport = async () => {
    setLoading(true);
    try {
      const res = await getGuestTransportTable({ page, limit: 10, search: search || undefined, sortBy: 'entry_date', sortOrder: 'desc' });
      setRecords(res.data || []); setTotalCount(res.totalCount || 0); setStatusCounts(res.stats || {});
    } catch { Alert.alert('Error', 'Could not load transport data'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const onRefresh = useCallback(() => { setRefreshing(true); loadTransport(); }, []);

  const loadDrivers = async (date: string) => {
    try { const res = await getAssignableDriversByDate(date); setDrivers(res || []); } catch {}
  };
  const loadVehicles = async () => {
    try { const res = await getAssignableVehicles(); setVehicles(res || []); } catch {}
  };

  const handleAssignDriver = async () => {
    if (!selectedRecord || !selectedDriver) { Alert.alert('Validation', 'Select a driver first'); return; }
    setActionLoading(true);
    try {
      await assignDriverToGuest({ guest_id: selectedRecord.guest_id, driver_id: selectedDriver, trip_date: selectedRecord.entry_date, start_time: '09:00' });
      Alert.alert('Success', 'Driver assigned'); loadTransport(); setShowAssignModal(false);
    } catch { Alert.alert('Error', 'Driver assignment failed'); }
    finally { setActionLoading(false); }
  };

  const handleAssignVehicle = async () => {
    if (!selectedRecord || !selectedVehicle) { Alert.alert('Validation', 'Select a vehicle first'); return; }
    setActionLoading(true);
    try {
      await assignVehicleToGuest({ guest_id: selectedRecord.guest_id, vehicle_no: selectedVehicle, assigned_at: new Date().toISOString() });
      Alert.alert('Success', 'Vehicle assigned'); loadTransport(); setShowAssignModal(false);
    } catch { Alert.alert('Error', 'Vehicle assignment failed'); }
    finally { setActionLoading(false); }
  };

  const handleReleaseVehicle = async (id: string) => {
    try { await releaseVehicle(id); Alert.alert('Success', 'Vehicle released'); loadTransport(); }
    catch { Alert.alert('Error', 'Could not release vehicle'); }
  };

  const handleCloseTrip = async (id: string) => {
    try { await closeGuestDriver(id); Alert.alert('Success', 'Trip closed'); loadTransport(); }
    catch { Alert.alert('Error', 'Trip closing failed'); }
  };

  const openAssign = (r: any) => {
    setSelectedRecord(r); setSelectedDriver(null); setSelectedVehicle(null);
    loadDrivers(r.entry_date); loadVehicles(); setShowAssignModal(true);
  };

  const statChips = [
    { key: 'total', label: 'Total', icon: 'car-outline', color: colors.primary, value: statusCounts.total || 0 },
    { key: 'assigned', label: 'Driver', icon: 'person-outline', color: '#22C55E', value: statusCounts.driverAssigned || 0 },
    { key: 'unassigned', label: 'Pending', icon: 'time-outline', color: '#F59E0B', value: statusCounts.unassigned || 0 },
  ];

  return (
    <PageContainer>
      <FlatList
        data={records}
        keyExtractor={(item, idx) => (item.guest_id || idx).toString()}
        renderItem={({ item: r }) => (
          <Card style={s.card}>
            <View style={s.cardHeader}>
              <View style={[s.cardIcon, { backgroundColor: r.driver_name ? '#22C55E18' : '#F59E0B18' }]}>
                <Ionicons name="car-outline" size={20} color={r.driver_name ? '#22C55E' : '#F59E0B'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle} numberOfLines={1}>{r.guest_name}</Text>
                <Text style={s.cardSub} numberOfLines={1}>{r.designation_name || r.inout_status || '—'}</Text>
              </View>
              <Badge label={r.driver_name ? 'Assigned' : 'Pending'} variant={r.driver_name ? 'success' : 'warning'} />
            </View>

            <View style={s.infoGrid}>
              <InfoChip icon="person-outline" label={r.driver_name || 'No driver'} muted={!r.driver_name} />
              <InfoChip icon="car-sport-outline" label={r.vehicle_no || 'No vehicle'} muted={!r.vehicle_no} />
              <InfoChip icon="log-in-outline" label={formatDate(r.entry_date)} />
              {r.exit_date ? <InfoChip icon="log-out-outline" label={formatDate(r.exit_date)} /> : null}
            </View>

            <View style={s.cardActions}>
              <ActionButton icon="eye-outline" color="#3B82F6" label="View" onPress={() => { setSelectedRecord(r); setShowViewModal(true); }} />
              <ActionButton icon="car-outline" color={colors.primary} label="Assign" onPress={() => openAssign(r)} />
              {r.guest_driver_id && <ActionButton icon="close-circle-outline" color="#EF4444" label="Close Trip" onPress={() => handleCloseTrip(r.guest_driver_id)} />}
              {r.guest_vehicle_id && <ActionButton icon="return-down-back-outline" color="#F97316" label="Release" onPress={() => handleReleaseVehicle(r.guest_vehicle_id)} />}
            </View>
          </Card>
        )}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListHeaderComponent={
          <>
            <Header title="Transport Management" subtitle="Coordinate driver and vehicle assignments" fallback="/(drawer)/transport" />
            <StatChipRow chips={statChips} />
            <View style={s.toolbar}>
              <SearchBox>
                <Input placeholder="Search guest or driver..." value={search} onChangeText={setSearch}
                  containerStyle={{ marginBottom: 0, flex: 1 }} inputStyle={{ borderWidth: 0, height: 40, fontSize: 14, paddingHorizontal: 0 }} />
              </SearchBox>
            </View>
          </>
        }
        ListEmptyComponent={!loading ? <EmptyState icon="car-outline" title="No transport records" /> : null}
        ListFooterComponent={records.length > 0 ? (
          <View style={s.pagination}>
            <Button title="← Prev" variant="outline" size="sm" disabled={page === 1} onPress={() => setPage(page - 1)} />
            <Text style={s.pageText}>Page {page}</Text>
            <Button title="Next →" variant="outline" size="sm" disabled={records.length < 10} onPress={() => setPage(page + 1)} />
          </View>
        ) : null}
      />

      {/* ── View Modal ── */}
      <Modal visible={showViewModal} onClose={() => setShowViewModal(false)} title="Transport Details"
        footer={
          <View style={{ flexDirection: 'row', gap: spacing.md, width: '100%' }}>
            {selectedRecord?.guest_driver_id && (
              <Button title="Close Trip" variant="outline" style={{ flex: 1, borderColor: colors.error }} textStyle={{ color: colors.error }}
                onPress={() => { handleCloseTrip(selectedRecord.guest_driver_id); setShowViewModal(false); }} />
            )}
            {selectedRecord?.guest_vehicle_id && (
              <Button title="Release" variant="outline" style={{ flex: 1, borderColor: colors.warning }} textStyle={{ color: colors.warning }}
                onPress={() => { handleReleaseVehicle(selectedRecord.guest_vehicle_id); setShowViewModal(false); }} />
            )}
            <Button title="Done" style={{ flex: 1 }} onPress={() => setShowViewModal(false)} />
          </View>
        }
      >
        {selectedRecord && (
          <ScrollView style={{ maxHeight: Dimensions.get('window').height * 0.6 }}>
            <SectionCard title="Guest Info" icon="person-outline">
              <DetailRow label="Guest" value={selectedRecord.guest_name} highlight />
              <DetailRow label="Designation" value={selectedRecord.designation_name} />
              <DetailRow label="Entry Date" value={formatDate(selectedRecord.entry_date)} />
              <DetailRow label="Exit Date" value={formatDate(selectedRecord.exit_date)} />
            </SectionCard>
            <SectionCard title="Driver" icon="car-outline">
              <DetailRow label="Name" value={selectedRecord.driver_name} />
              <DetailRow label="Contact" value={selectedRecord.driver_contact} />
              <DetailRow label="Trip Date" value={selectedRecord.trip_date ? formatDate(selectedRecord.trip_date) : ''} />
              <DetailRow label="Status" value={selectedRecord.trip_status} />
            </SectionCard>
            <SectionCard title="Vehicle" icon="car-sport-outline">
              <DetailRow label="Vehicle No" value={selectedRecord.vehicle_no} />
              <DetailRow label="Model" value={selectedRecord.model} />
              <DetailRow label="Color" value={selectedRecord.color} />
            </SectionCard>
          </ScrollView>
        )}
      </Modal>

      {/* ── Assignment Modal ── */}
      <Modal visible={showAssignModal} onClose={() => setShowAssignModal(false)} title="Transport Assignment"
        footer={
          <View style={{ flexDirection: 'row', gap: spacing.md, width: '100%' }}>
            <Button title="Assign Driver" style={{ flex: 1 }} onPress={handleAssignDriver} disabled={!selectedDriver || actionLoading} loading={actionLoading && !!selectedDriver} />
            <Button title="Assign Vehicle" variant="outline" style={{ flex: 1 }} onPress={handleAssignVehicle} disabled={!selectedVehicle || actionLoading} loading={actionLoading && !!selectedVehicle} />
          </View>
        }
      >
        <ScrollView style={{ maxHeight: Dimensions.get('window').height * 0.55 }}>
          <SectionCard title={`Available Drivers (${drivers.length})`} icon="person-outline">
            {drivers.length === 0 && <Text style={s.emptySelectText}>No available drivers for this date</Text>}
            {drivers.map((d: any) => (
              <TouchableOpacity key={d.driver_id} onPress={() => setSelectedDriver(d.driver_id)}
                style={[s.selectItem, selectedDriver === d.driver_id && s.selectItemActive]}>
                <View style={s.selectItemLeft}>
                  <View style={[s.selectAvatar, selectedDriver === d.driver_id && { backgroundColor: '#22C55E' }]}>
                    <Ionicons name="person-outline" size={14} color={selectedDriver === d.driver_id ? '#fff' : '#22C55E'} />
                  </View>
                  <Text style={[s.selectName, selectedDriver === d.driver_id && { color: '#22C55E', fontWeight: '700' }]}>{d.driver_name}</Text>
                </View>
                {selectedDriver === d.driver_id && <Ionicons name="checkmark-circle" size={18} color="#22C55E" />}
              </TouchableOpacity>
            ))}
          </SectionCard>

          <SectionCard title={`Available Vehicles (${vehicles.length})`} icon="car-sport-outline">
            {vehicles.length === 0 && <Text style={s.emptySelectText}>No available vehicles</Text>}
            {vehicles.map((v: any) => (
              <TouchableOpacity key={v.vehicle_id} onPress={() => setSelectedVehicle(v.vehicle_no)}
                style={[s.selectItem, selectedVehicle === v.vehicle_no && s.selectItemActive]}>
                <View style={s.selectItemLeft}>
                  <View style={[s.selectAvatar, selectedVehicle === v.vehicle_no && { backgroundColor: colors.primary }]}>
                    <Ionicons name="car-sport-outline" size={14} color={selectedVehicle === v.vehicle_no ? '#fff' : colors.primary} />
                  </View>
                  <View>
                    <Text style={[s.selectName, selectedVehicle === v.vehicle_no && { color: colors.primary, fontWeight: '700' }]}>{v.vehicle_no}</Text>
                    <Text style={s.selectSub}>{v.model}</Text>
                  </View>
                </View>
                {selectedVehicle === v.vehicle_no && <Ionicons name="checkmark-circle" size={18} color={colors.primary} />}
              </TouchableOpacity>
            ))}
          </SectionCard>
        </ScrollView>
      </Modal>
    </PageContainer>
  );
}

const s = StyleSheet.create({
  card: { marginBottom: 12, padding: 14, borderRadius: 14, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  cardIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  cardSub: { fontSize: 12, color: colors.muted, marginTop: 1 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10 },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  pageText: { fontSize: 13, fontWeight: '600', color: colors.text },
  selectItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', borderRadius: 8 },
  selectItemActive: { backgroundColor: colors.primary + '08' },
  selectItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  selectAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#22C55E18', alignItems: 'center', justifyContent: 'center' },
  selectName: { fontSize: 13, color: colors.text },
  selectSub: { fontSize: 11, color: colors.muted, marginTop: 1 },
  emptySelectText: { textAlign: 'center', padding: 16, color: colors.muted, fontSize: 12, fontStyle: 'italic' },
});
