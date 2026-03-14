import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  getGuestTransportTable, 
  assignDriverToGuest, 
  assignVehicleToGuest,
  getAssignableDriversByDate,
  getAssignableVehicles,
  releaseVehicle,
  closeGuestDriver
} from '@/api/guestTransport.api';
import { colors, spacing, typography } from '@/theme';
import { 
  Card, 
  Button, 
  Input, 
  Badge, 
  Modal, 
  Table 
} from '@/components/ui';
import { formatDate, formatTime } from '@/utils/dateTime';

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

  useEffect(() => {
    loadTransport();
  }, [page, search]);

  const loadTransport = async () => {
    setLoading(true);
    try {
      const res = await getGuestTransportTable({
        page,
        limit: 10,
        search: search || undefined,
        sortBy: 'entry_date',
        sortOrder: 'desc'
      });
      setRecords(res.data || []);
      setTotalCount(res.totalCount || 0);
      setStatusCounts(res.stats || {});
    } catch (error) {
      console.error('Failed to load transport', error);
      Alert.alert('Error', 'Could not load transport data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadTransport();
  }, []);

  const loadDrivers = async (date: string) => {
    try {
      const res = await getAssignableDriversByDate(date);
      setDrivers(res || []);
    } catch (err) {
      console.error("Driver fetch failed", err);
    }
  };

  const loadVehicles = async () => {
    try {
      const res = await getAssignableVehicles();
      setVehicles(res || []);
    } catch (err) {
      console.error("Vehicle fetch failed", err);
    }
  };

  const handleAssignDriver = async () => {
    if (!selectedRecord || !selectedDriver) {
      Alert.alert("Validation", "Please select a driver first");
      return;
    }
    setActionLoading(true);
    try {
      await assignDriverToGuest({
        guest_id: selectedRecord.guest_id,
        driver_id: selectedDriver,
        trip_date: selectedRecord.entry_date, // Default to entry date
        start_time: '09:00', // Default start time
      });

      Alert.alert("Success", "Driver assigned successfully");
      loadTransport();
      setShowAssignModal(false);
    } catch (error) {
      Alert.alert("Error", "Driver assignment failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignVehicle = async () => {
    if (!selectedRecord || !selectedVehicle) {
      Alert.alert("Validation", "Please select a vehicle first");
      return;
    }
    setActionLoading(true);
    try {
      await assignVehicleToGuest({
        guest_id: selectedRecord.guest_id,
        vehicle_no: selectedVehicle,
        assigned_at: new Date().toISOString(),
      });

      Alert.alert("Success", "Vehicle assigned successfully");
      loadTransport();
      setShowAssignModal(false);
    } catch (error) {
      Alert.alert("Error", "Vehicle assignment failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReleaseVehicleItem = async (vehicleId: string) => {
    try {
      await releaseVehicle(vehicleId);
      Alert.alert("Success", "Vehicle Released");
      loadTransport();
    } catch {
      Alert.alert("Error", "Could not release vehicle");
    }
  };

  const handleCloseTripItem = async (tripId: string) => {
    try {
      await closeGuestDriver(tripId);
      Alert.alert("Success", "Trip closed");
      loadTransport();
    } catch {
      Alert.alert("Error", "Trip closing failed");
    }
  };

  const columns = [
    {
      key: 'guest_name',
      title: 'Guest',
      width: 140,
      render: (r: any) => (
        <View>
          <Text style={styles.cellMainText}>{r.guest_name}</Text>
          <Text style={styles.cellSubText}>{r.inout_status}</Text>
        </View>
      ),
    },
    {
      key: 'driver',
      title: 'Driver',
      width: 120,
      render: (r: any) => (
        <View>
          <Text style={styles.cellMainText}>{r.driver_name || '—'}</Text>
          <Text style={styles.cellSubText}>{r.trip_date ? formatDate(r.trip_date) : ''}</Text>
        </View>
      ),
    },
    {
      key: 'vehicle',
      title: 'Vehicle',
      width: 120,
      render: (r: any) => (
        <View>
          <Text style={styles.cellMainText}>{r.vehicle_no || '—'}</Text>
          <Text style={styles.cellSubText}>{r.vehicle_name || ''}</Text>
        </View>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      width: 100,
      render: (r: any) => (
        <View style={styles.actionRow}>
          <TouchableOpacity 
            onPress={() => { setSelectedRecord(r); setShowViewModal(true); }}
            style={styles.actionIcon}
          >
            <Ionicons name="eye-outline" size={20} color={colors.info} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionIcon}
            onPress={() => {
              setSelectedRecord(r);
              setShowAssignModal(true);
              setSelectedDriver(null);
              setSelectedVehicle(null);
              loadDrivers(r.entry_date);
              loadVehicles();
            }}
          >
            <Ionicons name="car-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      ),
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Transport Management</Text>
          <Text style={styles.subtitle}>Coordinate driver and vehicle assignments</Text>
        </View>

        {/* Action Bar */}
        <View style={styles.actionBar}>
           <View style={styles.searchBox}>
               <Ionicons name="search-outline" size={20} color={colors.muted} style={styles.searchIcon} />
               <Input 
                 placeholder="Search guest or driver..." 
                 value={search}
                 onChangeText={setSearch}
                 containerStyle={{ marginBottom: 0, flex: 1 }}
                 inputStyle={{ borderWidth: 0, height: 40, fontSize: 14 }}
               />
           </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsGrid}>
            <Card style={styles.statBox}>
                <Text style={[styles.statNum, { color: colors.primary }]}>{statusCounts.total || 0}</Text>
                <Text style={styles.statLabel}>Total Visits</Text>
            </Card>
            <Card style={styles.statBox}>
                <Text style={[styles.statNum, { color: colors.success }]}>{statusCounts.driverAssigned || 0}</Text>
                <Text style={styles.statLabel}>Driver Assigned</Text>
            </Card>
            <Card style={styles.statBox}>
                <Text style={[styles.statNum, { color: colors.warning }]}>{statusCounts.unassigned || 0}</Text>
                <Text style={styles.statLabel}>Unassigned</Text>
            </Card>
        </View>

        <Table 
          columns={columns} 
          data={records} 
          keyExtractor={(item: any, index: number) => (item.guest_id || index).toString()}
          containerStyle={styles.table}
        />

        <View style={styles.pagination}>
            <Button 
                title="Prev" 
                variant="outline" 
                size="sm" 
                disabled={page === 1} 
                onPress={() => setPage(page - 1)} 
            />
            <Text style={styles.pageText}>Page {page}</Text>
            <Button 
                title="Next" 
                variant="outline" 
                size="sm" 
                disabled={records.length < 10} 
                onPress={() => setPage(page + 1)} 
            />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        visible={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Transport Details"
        footer={
          <View style={{ flexDirection: 'row', gap: spacing.md, width: '100%' }}>
            {selectedRecord?.guest_driver_id && (
              <Button 
                title="Close Trip" 
                variant="outline" 
                style={{ flex: 1, borderColor: colors.error }} 
                textStyle={{ color: colors.error }}
                onPress={() => handleCloseTripItem(selectedRecord.guest_driver_id)} 
              />
            )}
            {selectedRecord?.guest_vehicle_id && (
              <Button 
                title="Release Alt" 
                variant="outline" 
                style={{ flex: 1, borderColor: colors.warning }} 
                textStyle={{ color: colors.warning }}
                onPress={() => handleReleaseVehicleItem(selectedRecord.guest_vehicle_id)} 
              />
            )}
            <Button title="Done" style={{ flex: 1 }} onPress={() => setShowViewModal(false)} />
          </View>
        }
      >
        {selectedRecord && (
            <View>
                <DetailRow label="Guest" value={selectedRecord.guest_name} />
                <DetailRow label="Designation" value={selectedRecord.designation_name} />
                <DetailRow label="In Date" value={formatDate(selectedRecord.entry_date)} />
                <DetailRow label="Out Date" value={formatDate(selectedRecord.exit_date)} />
                <View style={styles.sectionDivider} />
                <Text style={styles.modalSectionTitle}>Driver Information</Text>
                <DetailRow label="Name" value={selectedRecord.driver_name} />
                <DetailRow label="Contact" value={selectedRecord.driver_contact} />
                <DetailRow label="Trip Date" value={selectedRecord.trip_date ? formatDate(selectedRecord.trip_date) : ''} />
                <DetailRow label="Trip Status" value={selectedRecord.trip_status} />
                <View style={styles.sectionDivider} />
                <Text style={styles.modalSectionTitle}>Vehicle Information</Text>
                <DetailRow label="Vehicle No" value={selectedRecord.vehicle_no} />
                <DetailRow label="Model" value={selectedRecord.model} />
                <DetailRow label="Color" value={selectedRecord.color} />
            </View>
        )}
      </Modal>

      {/* Assignment Modal */}
      <Modal
        visible={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Transport Assignment"
        footer={
          <View style={{ flexDirection: 'row', gap: spacing.md, width: '100%' }}>
            <Button 
              title="Assign Driver" 
              style={{ flex: 1 }} 
              onPress={handleAssignDriver} 
              disabled={!selectedDriver || actionLoading}
              loading={actionLoading && !!selectedDriver}
            />
            <Button 
              title="Assign Vehicle" 
              variant="outline"
              style={{ flex: 1 }} 
              onPress={handleAssignVehicle} 
              disabled={!selectedVehicle || actionLoading}
              loading={actionLoading && !!selectedVehicle}
            />
          </View>
        }
      >
        <ScrollView style={{ maxHeight: 400 }}>
          <Text style={styles.modalLabel}>Available Drivers ({drivers.length})</Text>
          <View style={styles.chipGrid}>
            {drivers.map((d: any) => (
              <TouchableOpacity
                key={d.driver_id}
                style={[styles.chip, selectedDriver === d.driver_id && styles.chipActive]}
                onPress={() => setSelectedDriver(d.driver_id)}
              >
                <Text style={[styles.chipText, selectedDriver === d.driver_id && styles.chipTextActive]}>
                  {d.driver_name}
                </Text>
              </TouchableOpacity>
            ))}
            {drivers.length === 0 && <Text style={styles.emptyText}>No available drivers for this date.</Text>}
          </View>

          <View style={styles.sectionDivider} />

          <Text style={styles.modalLabel}>Assignable Vehicles ({vehicles.length})</Text>
          <View style={styles.chipGrid}>
            {vehicles.map((v: any) => (
              <TouchableOpacity
                key={v.vehicle_id}
                style={[styles.chip, selectedVehicle === v.vehicle_no && styles.chipActive]}
                onPress={() => setSelectedVehicle(v.vehicle_no)}
              >
                <Text style={[styles.chipText, selectedVehicle === v.vehicle_no && styles.chipTextActive]}>
                  {v.vehicle_no} ({v.model})
                </Text>
              </TouchableOpacity>
            ))}
            {vehicles.length === 0 && <Text style={styles.emptyText}>No available vehicles found.</Text>}
          </View>
        </ScrollView>
      </Modal>
    </View>
  );
}

const DetailRow = ({ label, value }: { label: string, value: string }) => (
    <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value || '—'}</Text>
    </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.lg },
  header: { marginBottom: spacing.lg },
  title: { ...typography.h2, color: colors.primary },
  subtitle: { ...typography.small, color: colors.muted },
  actionBar: { marginBottom: spacing.md },
  searchBox: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingLeft: spacing.sm,
    height: 40,
  },
  searchIcon: { marginRight: spacing.xs },
  statsGrid: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: spacing.xl,
    gap: spacing.sm
  },
  statBox: { flex: 1, alignItems: 'center', padding: spacing.md },
  statNum: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 10, color: colors.muted, marginTop: 2, textAlign: 'center' },
  table: { marginBottom: spacing.md },
  cellMainText: { fontSize: 13, fontWeight: '600', color: colors.text },
  cellSubText: { fontSize: 11, color: colors.muted, marginTop: 2 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  actionIcon: { padding: 4 },
  pagination: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    alignItems: 'center', 
    gap: spacing.xl,
    marginTop: spacing.md 
  },
  pageText: { ...typography.body, fontWeight: '600' },
  detailRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border 
  },
  detailLabel: { ...typography.small, color: colors.muted },
  detailValue: { ...typography.small, fontWeight: '600', color: colors.text, flex: 1, textAlign: 'right', marginLeft: 10 },
  sectionDivider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  modalSectionTitle: { ...typography.label, color: colors.primary, marginBottom: spacing.sm },
  modalLabel: { fontSize: 12, fontWeight: '700', color: colors.muted, marginBottom: spacing.sm, textTransform: 'uppercase' },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { fontSize: 12, color: colors.text },
  chipTextActive: { color: colors.primary, fontWeight: '700' },
  emptyText: { fontSize: 12, color: colors.muted, fontStyle: 'italic', paddingVertical: 8 },
});
