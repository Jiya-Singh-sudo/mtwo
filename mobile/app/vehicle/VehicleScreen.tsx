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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  getVehiclesTable, 
  getVehicleStats, 
  createVehicle, 
  updateVehicle, 
  softDeleteVehicle 
} from '@/api/vehicles.api';
import { colors, spacing, typography } from '@/theme';
import { 
  Card, 
  Button, 
  Input, 
  Badge, 
  Modal, 
  Table 
} from '@/components/ui';

export default function VehicleScreen() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>({ total: 0, active: 0, inactive: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [isEdit, setIsEdit] = useState(false);
  
  // Form State
  const [form, setForm] = useState({ 
    vehicle_no: '', 
    vehicle_name: '', 
    vehicle_type: '', 
    capacity: '', 
    status: 'ACTIVE' 
  });

  useEffect(() => {
    loadVehicles();
    loadStats();
  }, [page, search, statusFilter]);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const res = await getVehiclesTable({
        page,
        limit: 10,
        search: search || undefined,
        status: statusFilter !== 'All' ? statusFilter as 'ACTIVE' | 'INACTIVE' : undefined,
        sortBy: 'vehicle_no',
        sortOrder: 'asc'
      });
      setVehicles(res.data || []);
    } catch (error) {
      console.error('Failed to load vehicles', error);
      Alert.alert('Error', 'Could not load vehicle data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadStats = async () => {
    try {
      const s = await getVehicleStats();
      setStats(s);
    } catch (err) {
      console.error('Failed to load vehicle stats', err);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadVehicles();
    loadStats();
  }, []);

  const handleSave = async () => {
    if (!form.vehicle_no || !form.vehicle_name) {
      Alert.alert('Validation', 'Vehicle No and Name are required');
      return;
    }
    setLoading(true);
    try {
      if (isEdit) {
        await updateVehicle(selectedVehicle.vehicle_no, {
          vehicle_name: form.vehicle_name,
          model: form.vehicle_type,
          capacity: Number(form.capacity) || undefined,
          status: form.status,
        } as any);
        Alert.alert('Success', 'Vehicle updated successfully');
      } else {
        await createVehicle({
          vehicle_no: form.vehicle_no,
          vehicle_name: form.vehicle_name,
          model: form.vehicle_type,
          capacity: Number(form.capacity) || undefined,
        });
        Alert.alert('Success', 'Vehicle added successfully');
      }
      setShowFormModal(false);
      loadVehicles();
      loadStats();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to save vehicle');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (v: any) => {
    Alert.alert('Delete Vehicle', `Are you sure you want to delete ${v.vehicle_no}?`, [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive', 
        onPress: async () => {
          try {
            await softDeleteVehicle(v.vehicle_no);
            loadVehicles();
            loadStats();
          } catch (err) {
            Alert.alert('Error', 'Failed to delete vehicle');
          }
        } 
      }
    ]);
  };

  const openForm = (v?: any) => {
    if (v) {
        setIsEdit(true);
        setSelectedVehicle(v);
        setForm({
            vehicle_no: v.vehicle_no,
            vehicle_name: v.vehicle_name || '',
            vehicle_type: v.vehicle_type || '',
            capacity: String(v.capacity || ''),
            status: v.status || 'ACTIVE'
        });
    } else {
        setIsEdit(false);
        setForm({
            vehicle_no: '',
            vehicle_name: '',
            vehicle_type: '',
            capacity: '',
            status: 'ACTIVE'
        });
    }
    setShowFormModal(true);
  };

  const columns = [
    {
      key: 'vehicle_no',
      title: 'Vehicle No',
      width: 120,
      render: (v: any) => <Text style={styles.cellMainText}>{v.vehicle_no}</Text>,
    },
    {
      key: 'status',
      title: 'Status',
      width: 100,
      render: (v: any) => (
        <Badge 
          label={v.status} 
          variant={v.status === 'ACTIVE' ? 'success' : 'error'} 
        />
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      width: 120,
      render: (v: any) => (
        <View style={styles.actionRow}>
          <TouchableOpacity onPress={() => { setSelectedVehicle(v); setShowViewModal(true); }} style={styles.actionIcon}>
            <Ionicons name="eye-outline" size={20} color={colors.info} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openForm(v)} style={styles.actionIcon}>
            <Ionicons name="create-outline" size={20} color={colors.success} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(v)} style={styles.actionIcon}>
            <Ionicons name="trash-outline" size={20} color={colors.error} />
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
          <Text style={styles.title}>Vehicle Management</Text>
          <Text style={styles.subtitle}>Maintain your transport fleet</Text>
        </View>

        {/* Action Bar */}
        <View style={styles.actionBar}>
           <View style={styles.searchBox}>
               <Ionicons name="search-outline" size={20} color={colors.muted} style={styles.searchIcon} />
               <Input 
                 placeholder="Search by no or name..." 
                 value={search}
                 onChangeText={setSearch}
                 containerStyle={{ marginBottom: 0, flex: 1 }}
                 inputStyle={{ borderWidth: 0, height: 40, fontSize: 14 }}
               />
           </View>
           <Button title="Add New" size="sm" onPress={() => openForm()} style={styles.addButton} />
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
            <Card style={styles.statBox}>
                <Text style={[styles.statNum, { color: colors.primary }]}>{stats.total || 0}</Text>
                <Text style={styles.statLabel}>Total</Text>
            </Card>
            <Card style={styles.statBox}>
                <Text style={[styles.statNum, { color: colors.success }]}>{stats.active || 0}</Text>
                <Text style={styles.statLabel}>Active</Text>
            </Card>
            <Card style={styles.statBox}>
                <Text style={[styles.statNum, { color: colors.error }]}>{stats.inactive || 0}</Text>
                <Text style={styles.statLabel}>Inactive</Text>
            </Card>
        </View>

        <Table 
          columns={columns} 
          data={vehicles} 
          keyExtractor={(item: any, index: number) => (item.vehicle_no || index).toString()}
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
                disabled={vehicles.length < 10} 
                onPress={() => setPage(page + 1)} 
            />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Form Modal */}
      <Modal
        visible={showFormModal}
        onClose={() => setShowFormModal(false)}
        title={isEdit ? 'Edit Vehicle' : 'Add Vehicle'}
        footer={
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <Button title="Cancel" variant="outline" onPress={() => setShowFormModal(false)} />
                <Button title="Save" onPress={handleSave} loading={loading} />
            </View>
        }
      >
        <ScrollView keyboardShouldPersistTaps="handled">
            {!isEdit && (
                <Input 
                    label="Vehicle Number" 
                    placeholder="MH-12-AB-1234" 
                    value={form.vehicle_no} 
                    onChangeText={v => setForm({...form, vehicle_no: v})} 
                />
            )}
            <Input 
                label="Vehicle Name" 
                placeholder="Innova / Swift" 
                value={form.vehicle_name} 
                onChangeText={v => setForm({...form, vehicle_name: v})} 
            />
            <Input 
                label="Type" 
                placeholder="SUV / Sedan" 
                value={form.vehicle_type} 
                onChangeText={v => setForm({...form, vehicle_type: v})} 
            />
            <Input 
                label="Capacity" 
                placeholder="e.g. 7" 
                keyboardType="numeric"
                value={form.capacity} 
                onChangeText={v => setForm({...form, capacity: v})} 
            />
            {isEdit && (
                <View style={{ marginTop: spacing.md }}>
                    <Text style={styles.detailLabel}>Status</Text>
                    <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
                        {['ACTIVE', 'INACTIVE'].map(s => (
                            <TouchableOpacity 
                                key={s} 
                                style={[styles.statusChip, form.status === s && styles.statusChipActive]} 
                                onPress={() => setForm({...form, status: s})}
                            >
                                <Text style={[styles.statusChipText, form.status === s && styles.statusChipTextActive]}>{s}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}
        </ScrollView>
      </Modal>

      {/* View Modal */}
      <Modal
        visible={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Vehicle Details"
        footer={<Button title="Close" variant="outline" onPress={() => setShowViewModal(false)} />}
      >
        {selectedVehicle && (
            <View>
                <DetailRow label="Vehicle No" value={selectedVehicle.vehicle_no} />
                <DetailRow label="Name" value={selectedVehicle.vehicle_name} />
                <DetailRow label="Type" value={selectedVehicle.vehicle_type} />
                <DetailRow label="Capacity" value={String(selectedVehicle.capacity || '—')} />
                <DetailRow label="Status" value={selectedVehicle.status} />
            </View>
        )}
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
  actionBar: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  searchBox: { 
    flex: 1,
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
  addButton: { height: 40 },
  statsGrid: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: spacing.xl,
    gap: spacing.sm
  },
  statBox: { flex: 1, alignItems: 'center', padding: spacing.md },
  statNum: { fontSize: 20, fontWeight: '700' },
  statLabel: { fontSize: 10, color: colors.muted, marginTop: 2 },
  table: { marginBottom: spacing.md },
  cellMainText: { fontSize: 13, fontWeight: '600', color: colors.text },
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
  detailValue: { ...typography.small, fontWeight: '600', color: colors.text },
  statusChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  statusChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusChipText: { fontSize: 12, color: colors.text },
  statusChipTextActive: { color: colors.white, fontWeight: '600' },
});
