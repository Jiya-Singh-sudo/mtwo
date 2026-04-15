import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, Dimensions, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getVehiclesTable, getVehicleStats, createVehicle, updateVehicle, softDeleteVehicle } from '@/api/vehicles.api';
import { getDriversTable, getDriverStats, createDriver, updateDriver, softDeleteDriver} from '@/api/driver.api';
import { colors, spacing } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  StatChipRow, ActionButton, InfoChip, SectionCard, DetailRow, SearchBox, AddButton, EmptyState, PageContainer,
} from '@/components/ui/Premium';
// import Header from '@/components/Header';
import PageHeader from '@/components/ui/PageHeader';
export default function VehicleScreen() {
  const [activeTab, setActiveTab] = useState<'vehicles' | 'drivers'>('vehicles');
  // const [statusFilter, setStatusFilter] = useState<'ACTIVE' | 'INACTIVE' | undefined>(undefined);
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE' | 'ALL'>('ALL');
  const [totalCount, setTotalCount] = useState(0);

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>({ total: 0, active: 0, inactive: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const [drivers, setDrivers] = useState<any[]>([]);
  const [driverStats, setDriverStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [selectedDriver, setSelectedDriver] = useState<any>(null);
  // const [showDriverFormModal, setShowDriverFormModal] = useState(false);
  // const [showDriverViewModal, setShowDriverViewModal] = useState(false);
  // const [isDriverEdit, setIsDriverEdit] = useState(false);
  const [driverForm, setDriverForm] = useState({
    driver_name: '',
    driver_contact: '',
    driver_alternate_contact: '',
    driver_license: '',
    license_expiry_date: '',
  });
  const [showAddDriver, setShowAddDriver] = useState(false);
  const [showEditDriver, setShowEditDriver] = useState(false);
  const [showDeleteDriver, setShowDeleteDriver] = useState(false);
  const [viewDriver, setViewDriver] = useState<any>(null);

  // const [showFormModal, setShowFormModal] = useState(false);
  // const [showViewModal, setShowViewModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  // const [isEdit, setIsEdit] = useState(false);
  const [vehicleForm, setForm] = useState({
    vehicle_no: '',
    vehicle_name: '',
    model: '',
    manufacturing: '',
    capacity: '',
    color: '',
    is_active: 'ACTIVE',
  });
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [showEditVehicle, setShowEditVehicle] = useState(false);
  const [showDeleteVehicle, setShowDeleteVehicle] = useState(false);
  const [viewVehicle, setViewVehicle] = useState<any>(null);

  useEffect(() => {
    if (activeTab === 'vehicles') {
      loadVehicles();
      loadStats(); // OK
    } else {
      loadDrivers();
      loadDriverStats(); // OK
    }
  }, [page, search, activeTab, status]);

  // Vehicle functions
  const loadVehicles = async () => {
    setLoading(true);
    console.log('FILTER:', status);

    try {
      const res = await getVehiclesTable({ page, limit: 10, search: search || undefined, status: status !== 'ALL' ? status : undefined, sortBy: 'vehicle_no', sortOrder: 'asc' });
      setVehicles(res.data || []);
      setTotalCount(res.totalCount || 0);
    } catch { Alert.alert('Error', 'Could not load vehicle data'); 
    }
    finally { setLoading(false); setRefreshing(false); }
  };
  const handleAddVehicle = async () => {
    try {
      await createVehicle({
        vehicle_no: vehicleForm.vehicle_no,
        vehicle_name: vehicleForm.vehicle_name,
        model: vehicleForm.model || undefined,
        manufacturing: vehicleForm.manufacturing || undefined,
        capacity: vehicleForm.capacity ? Number(vehicleForm.capacity) : undefined,
        color: vehicleForm.color || undefined,
      });

      setShowAddVehicle(false);
      loadVehicles();
      loadStats();

    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed');
    }
  };
  const handleEditVehicle = async () => {
    try {
      await updateVehicle(selectedVehicle.vehicle_no, {
        vehicle_name: vehicleForm.vehicle_name,
        model: vehicleForm.model,
        manufacturing: vehicleForm.manufacturing,
        capacity: vehicleForm.capacity ? Number(vehicleForm.capacity) : undefined,
        color: vehicleForm.color,
      });

      setShowEditVehicle(false);
      loadVehicles();
      loadStats();

    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed');
    }
  };
  const handleDeleteVehicle = async () => {
    try {
      await softDeleteVehicle(selectedVehicle.vehicle_no);

      setShowDeleteVehicle(false);
      setSelectedVehicle(null);

      loadVehicles();
      loadStats();

    } catch {
      Alert.alert('Error', 'Failed to delete');
    }
  };

  // Driver functions
  const loadDrivers = async () => {
    setLoading(true);
    try {
      const res = await getDriversTable({
        page,
        limit: 10,
        search: search || undefined,
        status:
          status === 'ALL'
            ? undefined
            : (status === 'ACTIVE' ? 'active' : 'inactive'),
        sortBy: 'driver_name',
        sortOrder: 'asc',
      });
      // const res = await getDriversTable({
      //   page,
      //   limit: 10,
      //   search: search || undefined,
      //   status: status !== 'ALL' ? status : undefined,
      //   sortBy: 'driver_name',
      //   sortOrder: 'asc',
      // });
      setDrivers(res.data || []);
      setTotalCount(res.totalCount || 0);
    } catch {
      Alert.alert('Error', 'Could not load drivers');
    } finally {
      setLoading(false);
    }
  };
  const loadDriverStats = async () => {
    try {
      setDriverStats(await getDriverStats());
    } catch {}
  };
  const handleAddDriver = async () => {
    try {
      await createDriver(driverForm);
      setShowAddDriver(false);
      loadDrivers();
      loadDriverStats();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed');
    }
  };

  const handleEditDriver = async () => {
    try {
      await updateDriver(selectedDriver.driver_id, driverForm);
      setShowEditDriver(false);
      loadDrivers();
      loadDriverStats();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed');
    }
  };

  const handleDeleteDriverConfirm = async () => {
    try {
      await softDeleteDriver(selectedDriver.driver_id);
      setShowDeleteDriver(false);
      setSelectedDriver(null);
      loadDrivers();
      loadDriverStats();
    } catch {
      Alert.alert('Error', 'Failed to delete');
    }
  };

  const loadStats = async () => { try { setStats(await getVehicleStats()); } catch {} };
  const onRefresh = useCallback(() => { setRefreshing(true); loadVehicles(); loadStats(); }, []);

  const statChips = [
    {
      key: 'ALL',
      label: 'Total',
      value: activeTab === 'vehicles' ? stats.total : driverStats.total,
      icon: 'grid-outline',
      color: '#3B82F6',
      onPress: () => {
        setStatus('ALL');
        setPage(1);
      },
    },
    {
      key: 'ACTIVE',
      label: 'Active',
      value: activeTab === 'vehicles' ? stats.active : driverStats.active,
      icon: 'checkmark-circle-outline',
      color: status === 'ACTIVE' ? '#16A34A' : '#22C55E',
      onPress: () => {
        setStatus('ACTIVE');
        setPage(1);
      },
    },
    {
      key: 'INACTIVE',
      label: 'Inactive',
      value: activeTab === 'vehicles' ? stats.inactive : driverStats.inactive,
      icon: 'close-circle-outline',
      color: status === 'INACTIVE' ? '#EF4444' : '#ec1a1a',
      onPress: () => {
        setStatus('INACTIVE');
        setPage(1);
      },
    },
  ];

  const renderVehicle = (v: any) => (
    <Card style={s.card}>
      <View style={s.cardHeader}>
        <View style={[s.cardIcon, { backgroundColor: v.is_active === 'ACTIVE' ? '#22C55E18' : '#EF444418' }]}>
          <Ionicons name="car-sport-outline" size={20} color={v.is_active === 'ACTIVE' ? '#22C55E' : '#EF4444'} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle}>{v.vehicle_no}</Text>
          <Text style={s.cardSub}>{v.vehicle_name || '—'}</Text>
        </View>

        <Badge label={v.is_active} variant={v.is_active === 'ACTIVE' ? 'success' : 'error'} />
      </View>

      <View style={s.infoGrid}>
        {v.capacity && <InfoChip icon="people-outline" label={`${v.capacity} seats`} />}
      </View>

      <View style={s.cardActions}>
        <ActionButton icon="eye-outline" color="#3B82F6" label="View" onPress={() => {
          setSelectedVehicle(v);
          setViewVehicle(v);
        }} />

        <ActionButton icon="create-outline" color="#22C55E" label="Edit" 
          onPress={() => {
            setSelectedVehicle(v);
            setForm({
              vehicle_no: v.vehicle_no,
              vehicle_name: v.vehicle_name,
              model: v.model || '',
              manufacturing: v.manufacturing || '',
              capacity: String(v.capacity || ''),
              color: v.color || '',
              is_active: v.is_active || 'ACTIVE',
            });
            setShowEditVehicle(true);
          }} />

        <ActionButton icon="trash-outline" color="#EF4444" label="Delete" 
        onPress={() => {
          setSelectedVehicle(v);
          setShowDeleteVehicle(true);
        }} />
      </View>
    </Card>
  );
  const renderDriver = (d: any) => (
    <Card style={s.card}>
      <View style={s.cardHeader}>
        <View style={[s.cardIcon, { backgroundColor: d.is_active ? '#22C55E18' : '#EF444418' }]}>
          <Ionicons name="person-outline" size={20} color={d.is_active ? '#22C55E' : '#EF4444'} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={s.cardTitle}>{d.driver_name}</Text>
          <Text style={s.cardSub}>{d.driver_contact}</Text>
        </View>

        <Badge label={d.is_active ? 'ACTIVE' : 'INACTIVE'} variant={d.is_active ? 'success' : 'error'} />
      </View>

      <View style={s.infoGrid}>
        <InfoChip icon="card-outline" label={d.driver_license} />
        {d.license_expiry_date && (
          <InfoChip icon="calendar-outline" label={d.license_expiry_date} />
        )}
      </View>

      <View style={s.cardActions}>
        <ActionButton icon="eye-outline" label="View" color="#3B82F6" onPress={() => {
          setSelectedDriver(d);
          setViewDriver(d);
        }} />

        <ActionButton icon="create-outline" label="Edit" color="#22C55E" 
        onPress={() => {
          setSelectedDriver(d);
          setDriverForm({
            driver_name: d.driver_name,
            driver_contact: d.driver_contact,
            driver_alternate_contact: d.driver_alternate_contact || '',
            driver_license: d.driver_license,
            license_expiry_date: d.license_expiry_date || '',
          });
          setShowEditDriver(true);
        }} />

        <ActionButton icon="trash-outline" label="Delete" color="#EF4444" 
        onPress={() => {
          setSelectedDriver(d);
          setShowDeleteDriver(true);
        }} />
      </View>
    </Card>
  );
  return (
    <PageContainer>
      <FlatList
        data={activeTab === 'vehicles' ? vehicles : drivers}
        keyExtractor={(item, idx) => (item.vehicle_no || idx).toString()}
        renderItem={({ item }) =>
          activeTab === 'vehicles' ? renderVehicle(item) : renderDriver(item)
        }
        // renderItem={({ item: v }) => (
        //   <Card style={s.card}>
        //     <View style={s.cardHeader}>
        //       <View style={[s.cardIcon, { backgroundColor: v.is_active === 'ACTIVE' ? '#22C55E18' : '#EF444418' }]}>
        //         <Ionicons name="car-sport-outline" size={20} color={v.is_active === 'ACTIVE' ? '#22C55E' : '#EF4444'} />
        //       </View>
        //       <View style={{ flex: 1 }}>
        //         <Text style={s.cardTitle} numberOfLines={1}>{v.vehicle_no}</Text>
        //         <Text style={s.cardSub} numberOfLines={1}>{v.vehicle_name || '—'}</Text>
        //       </View>
        //       <Badge label={v.is_active} variant={v.is_active === 'ACTIVE' ? 'success' : 'error'} />
        //     </View>
        //     <View style={s.infoGrid}>
        //       {v.vehicle_type ? <InfoChip icon="pricetag-outline" label={v.vehicle_type} /> : null}
        //       {v.capacity ? <InfoChip icon="people-outline" label={`${v.capacity} seats`} /> : null}
        //     </View>
        //     <View style={s.cardActions}>
        //       <ActionButton icon="eye-outline" color="#3B82F6" label="View" onPress={() => { setSelectedVehicle(v); setViewVehicle(v);(true); }} />
        //       <ActionButton icon="create-outline" color="#22C55E" label="Edit" onPress={() => openForm(v)} />
        //       <ActionButton icon="trash-outline" color="#EF4444" label="Delete" onPress={() => handleDelete(v)} />
        //     </View>
        //   </Card>
        // )}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListHeaderComponent={
          <>
            <PageHeader title="Vehicle Management" subtitle="Maintain your transport fleet" fallback="/(drawer)/vehicle" />
            <StatChipRow chips={statChips} />
            {/* <View style={s.toolbar}>
              <SearchBox>
                <Input placeholder="Search vehicle..." value={search} onChangeText={setSearch}
                  containerStyle={{ marginBottom: 0, flex: 1 }} inputStyle={{ borderWidth: 0, height: 40, fontSize: 14, paddingHorizontal: 0 }} />
              </SearchBox>
              <AddButton label="Add" onPress={() => openForm()} />
            </View> */}
            <View style={s.tabs}>
              <TouchableOpacity
                style={[s.tab, activeTab === 'vehicles' && s.activeTab]}
                onPress={() => {
                  setActiveTab('vehicles');
                  setStatus('ALL');
                  setPage(1);
                }}
              >
                <Text style={[s.tabText, activeTab === 'vehicles' && s.activeTabText]}>
                  Vehicles
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[s.tab, activeTab === 'drivers' && s.activeTab]}
                onPress={() => {
                  setActiveTab('drivers');
                  setStatus('ALL');
                  setPage(1);
                }}
              >
                <Text style={[s.tabText, activeTab === 'drivers' && s.activeTabText]}>
                  Drivers
                </Text>
              </TouchableOpacity>
              <AddButton
                label={activeTab === 'vehicles' ? "Add Vehicle" : "Add Driver"}
                onPress={() => {
                  if (activeTab === 'vehicles') {
                    setShowAddVehicle(true);
                  } else {
                    setShowAddDriver(true);
                  }
                }}
              />
            </View>
          </>
        }
        // ListEmptyComponent={!loading ? <EmptyState icon="car-sport-outline" title="No vehicles found" /> : null}
        ListEmptyComponent={
          !loading ? (
            <EmptyState 
              icon={activeTab === 'vehicles' ? "car-sport-outline" : "person-outline"} 
              title={activeTab === 'vehicles' ? "No vehicles found" : "No drivers found"} 
            />
          ) : null
        }
        ListFooterComponent={
          ((activeTab === 'vehicles' ? vehicles : drivers).length > 0) ? (
            <View style={s.pagination}>
              <Button
                title="← Prev"
                variant="outline"
                size="sm"
                disabled={page === 1}
                onPress={() => setPage(p => p - 1)}
              />
              <Text style={s.pageText}>Page {page}</Text>
              <Button
                title="Next →"
                variant="outline"
                size="sm"
                disabled={page * 10 >= totalCount}
                onPress={() => setPage(p => p + 1)}
              />
            </View>
          ) : null
        }
      />

      {/* ── Add Vehicle Modal ── */}
      <Modal
        visible={showAddVehicle}
        onClose={() => setShowAddVehicle(false)}
        title="Add Vehicle"
        footer={<Button title="Save" onPress={handleAddVehicle} />}
      >
        <Input label="Vehicle Number" value={vehicleForm.vehicle_no}
          onChangeText={v => setForm({ ...vehicleForm, vehicle_no: v })} />

        <Input label="Vehicle Name" value={vehicleForm.vehicle_name}
          onChangeText={v => setForm({ ...vehicleForm, vehicle_name: v })} />
      </Modal>
      {/* ── Edit Vehicle Modal ── */}
      <Modal
        visible={showEditVehicle}
        onClose={() => setShowEditVehicle(false)}
        title="Edit Vehicle"
        footer={<Button title="Save Changes" onPress={handleEditVehicle} />}
      >
        <Input label="Vehicle Name" value={vehicleForm.vehicle_name}
          onChangeText={v => setForm({ ...vehicleForm, vehicle_name: v })} />
      </Modal>

      {/* ── Delete Vehicle Modal ── */}
      <Modal
        visible={showDeleteVehicle}
        onClose={() => setShowDeleteVehicle(false)}
        title="Delete Vehicle"
        footer={<Button title="Delete" onPress={handleDeleteVehicle} />}
      >
        <Text>Delete {selectedVehicle?.vehicle_no}?</Text>
      </Modal>
      {/* ── View Modal ── */}
      <Modal
        visible={!!viewVehicle}
        onClose={() => setViewVehicle(null)}
        title="Vehicle Details"
        footer={<Button title="Close" variant="outline" onPress={() => setViewVehicle(null)} />}
      >
        {viewVehicle && (
          <SectionCard title="Details" icon="car-sport-outline">
            <DetailRow label="Vehicle No" value={viewVehicle.vehicle_no} highlight />
            <DetailRow label="Name" value={viewVehicle.vehicle_name} />
            <DetailRow label="Type" value={viewVehicle.vehicle_type} />
            <DetailRow label="Capacity" value={String(viewVehicle.capacity || '—')} />
            <DetailRow label="Status" value={viewVehicle.is_active} />
          </SectionCard>
        )}
      </Modal>

      {/* ── Add Driver Modal ── */}
      <Modal
        visible={showAddDriver}
        onClose={() => setShowAddDriver(false)}
        title="Add Driver"
        footer={<Button title="Save" onPress={handleAddDriver} />}
      >
        <Input label="Name" value={driverForm.driver_name}
          onChangeText={v => setDriverForm({ ...driverForm, driver_name: v })} />

        <Input label="Contact" value={driverForm.driver_contact}
          onChangeText={v => setDriverForm({ ...driverForm, driver_contact: v })} />

        <Input label="License" value={driverForm.driver_license}
          onChangeText={v => setDriverForm({ ...driverForm, driver_license: v })} />

        <Input label="Expiry Date"
          value={driverForm.license_expiry_date}
          onChangeText={v => setDriverForm({ ...driverForm, license_expiry_date: v })}
        />
      </Modal>
      {/* ── Edit Driver Modal ── */}
      <Modal
        visible={showEditDriver}
        onClose={() => setShowEditDriver(false)}
        title="Edit Driver"
        footer={<Button title="Save" onPress={handleEditDriver} />}
      >
        <Input label="Name" value={driverForm.driver_name}
          onChangeText={v => setDriverForm({ ...driverForm, driver_name: v })} />
      </Modal>
      {/* ── Delete Driver Modal ── */}
      <Modal
        visible={showDeleteDriver}
        onClose={() => setShowDeleteDriver(false)}
        title="Delete Driver"
        footer={<Button title="Delete" onPress={handleDeleteDriverConfirm} />}
      >
        <Text>Delete {selectedDriver?.driver_name}?</Text>
      </Modal>

      {/* ── Driver View Modal ── */}
      <Modal
        visible={!!viewDriver}
        onClose={() => setViewDriver(null)}
        title="Driver Details"
      >
        {viewDriver && (
          <>
            <DetailRow label="Name" value={viewDriver.driver_name} />
            <DetailRow label="Contact" value={viewDriver.driver_contact} />
            <DetailRow label="License" value={viewDriver.driver_license} />
          </>
        )}
      </Modal>
      {/* <Modal
        visible={showDriverViewModal}
        onClose={() => setShowDriverViewModal(false)}
        title="Driver Details"
      >
        {selectedDriver && (
          <>
            <DetailRow label="Name" value={selectedDriver.driver_name} />
            <DetailRow label="Contact" value={selectedDriver.driver_contact} />
            <DetailRow label="License" value={selectedDriver.driver_license} />
          </>
        )}
      </Modal> */}
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  tab: {  
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#fff',
  },
  tabText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
  },
  activeTabText: {
    color: colors.primary,
  },
});
