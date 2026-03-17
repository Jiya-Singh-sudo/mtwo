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
  getActiveGuests, 
  createGuest, 
  updateGuest, 
  softDeleteGuest,
  cancelGuestInOut,
} from '@/api/guest.api';
import { getActiveDesignationList } from '@/api/designation.api';
import { updateGuestInOut } from '@/api/guestInOut.api';
import { updateGuestDesignation, createGuestDesignation } from '@/api/guestDesignation.api';
import { colors, spacing, typography } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { formatDate, formatTime, toDateInputValue } from '@/utils/dateTime';
import Header from '@/components/Header';

const { width } = Dimensions.get('window');

export default function GuestManagementScreen() {
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [statusCounts, setStatusCounts] = useState<any>({});
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [entryDateFrom, setEntryDateFrom] = useState('');
  const [entryDateTo, setEntryDateTo] = useState('');

  // Modals
  const [showViewModal, setShowViewModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<any>(null);
  const [isEdit, setIsEdit] = useState(false);

  // Form State
  const [form, setForm] = useState({
    guest_name: '',
    guest_name_local: '',
    guest_mobile: '',
    guest_alternate_mobile: '',
    guest_address: '',
    guest_email: '',
  
    designation_id: '',
    designation_name: '',
    department: '',
    organization: '',
    office_location: '',
  
    entry_date: '',
    entry_time: '',
    exit_date: '',
    exit_time: '',
  
    companions: 0,
    requires_driver: false,
    purpose: '',
  });

  const [designations, setDesignations] = useState<any[]>([]);
  const [showDesignationDropdown, setShowDesignationDropdown] = useState(false);
  const [designationSearch, setDesignationSearch] = useState('');

  const isLockedStatus = (status: string) => status === 'Exited' || status === 'Cancelled';
  const isCheckinLocked = (status: string) => status === 'Entered' || status === 'Inside';

  useEffect(() => {
    loadGuests();
  }, [page, status, search, entryDateFrom, entryDateTo]);

  useEffect(() => {
    loadDesignations();
  }, []);

  const loadDesignations = async () => {
    try {
      const data = await getActiveDesignationList();
      setDesignations(data || []);
    } catch (err) {
      console.error('Failed to load designations', err);
    }
  };

  const loadGuests = async () => {
    setLoading(true);
    try {
      const res = await getActiveGuests({
        page,
        limit: 10,
        status: status !== 'All' ? status : undefined,
        search: search || undefined,
        entryDateFrom: entryDateFrom || undefined,
        entryDateTo: entryDateTo || undefined,
      });
      setGuests(res.data || []);
      setTotalCount(res.totalCount || 0);
      setStatusCounts(res.statusCounts || {});
    } catch (error) {
      console.error('Failed to load guests', error);
      Alert.alert('Error', 'Could not load guest data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadGuests();
  }, []);

  const handleSave = async () => {
    if (!form.guest_name || !form.guest_mobile) {
      Alert.alert('Validation', 'Name and Mobile are required.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        guest: {
          guest_name: form.guest_name,
          guest_name_local_language: form.guest_name_local,
          guest_mobile: form.guest_mobile,
          guest_alternate_mobile: form.guest_alternate_mobile,
          guest_address: form.guest_address,
          email: form.guest_email,
        },

        designation: {
          designation_id: form.designation_id || undefined,
          designation_name: form.designation_name,
          department: form.department,
          organization: form.organization,
          office_location: form.office_location,
        },

        inout: {
          entry_date: form.entry_date,
          entry_time: form.entry_time,
          exit_date: form.exit_date || null,
          exit_time: form.exit_time || null,
          purpose: form.purpose,
          companions: Number(form.companions),
          requires_driver: form.requires_driver,
        }
      };

      if (isEdit && selectedGuest) {
        // Update guest
        await updateGuest(selectedGuest.guest_id, payload.guest);
        
        // Update designation
        if (selectedGuest.gd_id) {
          await updateGuestDesignation(selectedGuest.gd_id, payload.designation);
        } else {
          await createGuestDesignation({ guest_id: selectedGuest.guest_id, ...payload.designation });
        }

        // Update InOut
        if (selectedGuest.inout_id) {
          await updateGuestInOut(selectedGuest.inout_id, payload.inout);
        }

        Alert.alert('Success', 'Guest profile updated');
      } else {
        await createGuest(payload);
        Alert.alert('Success', 'Guest registered successfully');
      }
      setShowFormModal(false);
      loadGuests();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelVisit = async (inoutId: string) => {
    try {
      await cancelGuestInOut(inoutId);
      Alert.alert('Success', 'Visit cancelled');
      loadGuests();
    } catch (err) {
      Alert.alert('Error', 'Cancellation failed');
    }
  };

  const handleDeleteGuest = async (id: string) => {
    try {
      await softDeleteGuest(id);
      Alert.alert('Success', 'Guest removed');
      loadGuests();
    } catch (err) {
      Alert.alert('Error', 'Deactivation failed');
    }
  };

  const openForm = (g?: any) => {
    if (g) {
      setIsEdit(true);
      setSelectedGuest(g);
      setForm({
        guest_name: g.guest_name || '',
        guest_name_local: g.guest_name_local_language || '',
        guest_mobile: g.guest_mobile || '',
        guest_alternate_mobile: g.guest_alternate_mobile || '',
        guest_address: g.guest_address || '',
        guest_email: g.email || '',

        designation_id: g.designation_id || '',
        designation_name: g.designation_name || '',
        department: g.department || '',
        organization: g.organization || '',
        office_location: g.office_location || '',

        entry_date: g.entry_date ? toDateInputValue(g.entry_date) : '',
        entry_time: g.entry_time || '',
        exit_date: g.exit_date ? toDateInputValue(g.exit_date) : '',
        exit_time: g.exit_time || '',

        companions: g.companions || 0,
        requires_driver: g.requires_driver || false,
        purpose: g.purpose || '',
      });
      setDesignationSearch(g.designation_name || '');
    } else {
      setIsEdit(false);
      setForm({
        guest_name: '',
        guest_name_local: '',
        guest_mobile: '',
        guest_alternate_mobile: '',
        guest_address: '',
        guest_email: '',

        designation_id: '',
        designation_name: '',
        department: '',
        organization: '',
        office_location: '',

        entry_date: new Date().toISOString().split('T')[0],
        entry_time: '10:00',
        exit_date: '',
        exit_time: '',

        companions: 0,
        requires_driver: false,
        purpose: '',
      });
      setDesignationSearch('');
    }
    setShowFormModal(true);
  };

  const columns = [
    {
      key: 'guest_name',
      title: 'Guest',
      width: 160,
      render: (g: any) => (
        <View>
          <Text style={styles.cellMainText}>{g.guest_name}</Text>
          <Text style={styles.cellSubText}>{g.designation_name}</Text>
        </View>
      ),
    },
    {
      key: 'mobile',
      title: 'Mobile',
      width: 120,
      render: (g: any) => (
        <View>
          <Text style={{ fontSize: 13 }}>{g.guest_mobile}</Text>
          {g.guest_alternate_mobile ? <Text style={styles.cellSubText}>{g.guest_alternate_mobile}</Text> : null}
        </View>
      )
    },
    {
      key: 'checkin',
      title: 'Check-in',
      width: 120,
      render: (g: any) => (
        <View>
          <Text style={{ fontSize: 13 }}>{formatDate(g.entry_date)}</Text>
          <Text style={styles.cellSubText}>{formatTime(g.entry_time)}</Text>
        </View>
      )
    },
    {
      key: 'checkout',
      title: 'Check-out',
      width: 120,
      render: (g: any) => (
        <View>
          <Text style={{ fontSize: 13 }}>{formatDate(g.exit_date)}</Text>
          <Text style={styles.cellSubText}>{formatTime(g.exit_time)}</Text>
        </View>
      )
    },
    {
      key: 'status',
      title: 'Status',
      width: 100,
      render: (g: any) => {
        let variant: any = 'muted';
        if (g.inout_status === 'Entered' || g.inout_status === 'Inside') variant = 'success';
        if (g.inout_status === 'Scheduled') variant = 'warning';
        if (g.inout_status === 'Exited') variant = 'info';
        if (g.inout_status === 'Cancelled') variant = 'error';
        return <Badge label={g.inout_status} variant={variant} />;
      },
    },
    {
      key: 'actions',
      title: 'Actions',
      width: 160,
      render: (g: any) => (
        <View style={styles.actionRow}>
          <TouchableOpacity onPress={() => { setSelectedGuest(g); setShowViewModal(true); }} style={styles.actionIcon}>
            <Ionicons name="eye-outline" size={20} color={colors.info} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => openForm(g)} 
            style={styles.actionIcon}
            disabled={isLockedStatus(g.inout_status)}
          >
            <Ionicons 
              name="create-outline" 
              size={20} 
              color={isLockedStatus(g.inout_status) ? colors.muted : colors.success} 
            />
          </TouchableOpacity>
          {g.inout_status === 'Scheduled' && (
            <TouchableOpacity 
              onPress={() => {
                Alert.alert('Cancel Visit', `Are you sure you want to cancel ${g.guest_name}'s visit?`, [
                  { text: 'No', style: 'cancel' },
                  { text: 'Yes, Cancel', style: 'destructive', onPress: () => handleCancelVisit(g.inout_id) }
                ]);
              }} 
              style={styles.actionIcon}
            >
              <Ionicons name="close-circle-outline" size={20} color="#F97316" />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            onPress={() => Alert.alert('Assign Room', 'Room assignment feature coming soon')} 
            style={styles.actionIcon}
          >
            <Ionicons name="bed-outline" size={20} color="#9333EA" />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => {
              Alert.alert('Remove Guest', `Are you sure about removing ${g.guest_name}?`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: () => handleDeleteGuest(g.guest_id) }
              ]);
            }}
            style={styles.actionIcon}
          >
            <Ionicons name="trash-outline" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      ),
    },
  ];

  const statCards = [
    { label: 'All', key: 'All', icon: 'list-outline', color: colors.primary, bg: colors.primaryBg },
    { label: 'Inside', key: 'Inside', icon: 'home-outline', color: '#3B82F6', bg: '#EFF6FF' },
    { label: 'Upcoming', key: 'Scheduled', icon: 'time-outline', color: '#EAB308', bg: '#FEF9C3' },
    { label: 'Entered', key: 'Entered', icon: 'enter-outline', color: '#22C55E', bg: '#F0FDF4' },
    { label: 'Exited', key: 'Exited', icon: 'exit-outline', color: '#6B7280', bg: '#F3F4F6' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Header 
          title="Guest Management" 
          subtitle="Administrative control for all visitor credentials"
          fallback="/(drawer)/guest"
        />

        <View style={styles.actionBar}>
           <View style={styles.searchBox}>
               <Ionicons name="search-outline" size={20} color={colors.muted} style={styles.searchIcon} />
               <Input 
                 placeholder="Search guests..." 
                 value={search}
                 onChangeText={setSearch}
                 containerStyle={{ marginBottom: 0, flex: 1 }}
                 inputStyle={{ borderWidth: 0, height: 40, fontSize: 14 }}
               />
           </View>
           <Button title="+ New" size="sm" onPress={() => openForm()} />
        </View>

        <View style={styles.filterBar}>
          <Input 
            placeholder="From: YYYY-MM-DD" 
            value={entryDateFrom}
            onChangeText={setEntryDateFrom}
            containerStyle={{ flex: 1, marginBottom: 0 }}
            inputStyle={{ height: 36, fontSize: 12 }}
          />
          <Input 
            placeholder="To: YYYY-MM-DD" 
            value={entryDateTo}
            onChangeText={setEntryDateTo}
            containerStyle={{ flex: 1, marginBottom: 0 }}
            inputStyle={{ height: 36, fontSize: 12 }}
          />
          {(entryDateFrom || entryDateTo) && (
            <TouchableOpacity onPress={() => { setEntryDateFrom(''); setEntryDateTo(''); }} style={styles.clearFilters}>
              <Ionicons name="close-circle" size={20} color={colors.muted} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsRow}>
          {statCards.map((card) => (
            <TouchableOpacity 
              key={card.key} 
              onPress={() => setStatus(card.key)}
              activeOpacity={0.8}
            >
                <Card style={[
                    styles.statCard, 
                    status === card.key && { borderColor: card.color, borderWidth: 2 }
                ]}>
                    <View style={[styles.statIconWrap, { backgroundColor: card.bg }]}>
                        <Ionicons name={card.icon as any} size={20} color={card.color} />
                    </View>
                    <Text style={styles.statValue}>{statusCounts[card.key] || 0}</Text>
                    <Text style={styles.statLabel}>{card.label}</Text>
                </Card>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Table 
          columns={columns} 
          data={guests} 
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
              disabled={guests.length < 10} 
              onPress={() => setPage(page + 1)} 
            />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        visible={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Guest Profile"
        footer={<Button title="Close" variant="outline" onPress={() => setShowViewModal(false)} />}
      >
        {selectedGuest && (
            <ScrollView style={{ maxHeight: Dimensions.get('window').height * 0.7 }}>
                <Text style={styles.modalSectionTitle}>Basic Information</Text>
                <DetailRow label="Full Name" value={selectedGuest.guest_name} />
                <DetailRow label="Local Language" value={selectedGuest.guest_name_local_language} />
                <DetailRow label="Mobile" value={selectedGuest.guest_mobile} />
                <DetailRow label="Alt Mobile" value={selectedGuest.guest_alternate_mobile} />
                <DetailRow label="Email" value={selectedGuest.email} />
                <DetailRow label="Address" value={selectedGuest.guest_address} />
                
                <View style={styles.divider} />
                <Text style={styles.modalSectionTitle}>Designation Details</Text>
                <DetailRow label="Designation" value={selectedGuest.designation_name} />
                <DetailRow label="Department" value={selectedGuest.department} />
                <DetailRow label="Organization" value={selectedGuest.organization} />
                <DetailRow label="Office Location" value={selectedGuest.office_location} />
                
                <View style={styles.divider} />
                <Text style={styles.modalSectionTitle}>Visit Information</Text>
                <DetailRow label="Visit Status" value={selectedGuest.inout_status} />
                <DetailRow label="Entry Date" value={formatDate(selectedGuest.entry_date)} />
                <DetailRow label="Entry Time" value={formatTime(selectedGuest.entry_time)} />
                <DetailRow label="Exit Date" value={formatDate(selectedGuest.exit_date)} />
                <DetailRow label="Exit Time" value={formatTime(selectedGuest.exit_time)} />
                <DetailRow label="Purpose" value={selectedGuest.purpose} />
                <DetailRow label="Companions" value={String(selectedGuest.companions || 0)} />
                <DetailRow label="Driver Required" value={selectedGuest.requires_driver ? 'Yes' : 'No'} />
            </ScrollView>
        )}
      </Modal>

      {/* Form Modal */}
      <Modal
        visible={showFormModal}
        onClose={() => setShowFormModal(false)}
        title={isEdit ? 'Update Guest' : 'Register New Guest'}
        footer={
            <View style={{ flexDirection: 'row', gap: spacing.md, width: '100%', paddingTop: spacing.sm }}>
                <Button title="Cancel" variant="outline" style={{ flex: 1 }} onPress={() => setShowFormModal(false)} />
                <Button title="Confirm" style={{ flex: 1 }} onPress={handleSave} loading={loading} />
            </View>
        }
      >
        <ScrollView style={{ maxHeight: Dimensions.get('window').height * 0.7 }}>
            <Text style={styles.modalSectionTitle}>Guest Information</Text>
            <Input 
                label="Full Name *" 
                value={form.guest_name} 
                onChangeText={v => setForm({...form, guest_name: v})}
            />
            <Input 
                label="Local language Name" 
                value={form.guest_name_local} 
                onChangeText={v => setForm({...form, guest_name_local: v})}
            />
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
                <Input 
                    label="Mobile Number *" 
                    keyboardType="phone-pad"
                    value={form.guest_mobile} 
                    onChangeText={v => setForm({...form, guest_mobile: v})}
                    containerStyle={{ flex: 1 }}
                />
                <Input 
                    label="Alt Mobile" 
                    keyboardType="phone-pad"
                    value={form.guest_alternate_mobile} 
                    onChangeText={v => setForm({...form, guest_alternate_mobile: v})}
                    containerStyle={{ flex: 1 }}
                />
            </View>
            <Input 
                label="Work Email" 
                keyboardType="email-address"
                value={form.guest_email} 
                onChangeText={v => setForm({...form, guest_email: v})}
            />
            <Input 
                label="Address" 
                value={form.guest_address} 
                onChangeText={v => setForm({...form, guest_address: v})}
                multiline
            />

            <View style={styles.divider} />
            <Text style={styles.modalSectionTitle}>Designation</Text>
            
            <View style={{ position: 'relative', zIndex: 100 }}>
              <Input 
                  label="Search / Add Designation" 
                  value={designationSearch} 
                  onChangeText={v => {
                    setDesignationSearch(v);
                    setForm({...form, designation_name: v, designation_id: ''});
                    setShowDesignationDropdown(true);
                  }}
                  onFocus={() => setShowDesignationDropdown(true)}
              />
              {showDesignationDropdown && (
                <View style={styles.dropdown}>
                  <ScrollView nestedScrollEnabled style={{ maxHeight: 150 }}>
                    {designations
                      .filter(d => d.designation_name.toLowerCase().includes(designationSearch.toLowerCase()))
                      .map((d, idx) => (
                        <TouchableOpacity 
                          key={d.designation_id || idx} 
                          style={styles.dropdownItem}
                          onPress={() => {
                            setDesignationSearch(d.designation_name);
                            setForm({
                              ...form, 
                              designation_id: d.designation_id, 
                              designation_name: d.designation_name,
                              department: d.department || form.department,
                              organization: d.organization || form.organization,
                              office_location: d.office_location || form.office_location
                            });
                            setShowDesignationDropdown(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{d.designation_name}</Text>
                        </TouchableOpacity>
                      ))}
                    {designationSearch !== '' && !designations.some(d => d.designation_name.toLowerCase() === designationSearch.toLowerCase()) && (
                      <TouchableOpacity 
                        style={styles.dropdownItem}
                        onPress={() => setShowDesignationDropdown(false)}
                      >
                        <Text style={[styles.dropdownItemText, { color: colors.primary }]}>+ Add New: "{designationSearch}"</Text>
                      </TouchableOpacity>
                    )}
                  </ScrollView>
                </View>
              )}
            </View>

            <Input 
                label="Organization" 
                value={form.organization} 
                onChangeText={v => setForm({...form, organization: v})}
            />
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <Input 
                  label="Department" 
                  value={form.department} 
                  onChangeText={v => setForm({...form, department: v})}
                  containerStyle={{ flex: 1 }}
              />
              <Input 
                  label="Office Location" 
                  value={form.office_location} 
                  onChangeText={v => setForm({...form, office_location: v})}
                  containerStyle={{ flex: 1 }}
              />
            </View>

            <View style={styles.divider} />
            <Text style={styles.modalSectionTitle}>Visit Details</Text>
            
            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <Input 
                  label="Entry Date" 
                  placeholder="YYYY-MM-DD"
                  value={form.entry_date} 
                  onChangeText={v => setForm({...form, entry_date: v})}
                  containerStyle={{ flex: 1 }}
              />
              <Input 
                  label="Entry Time" 
                  placeholder="HH:mm"
                  value={form.entry_time} 
                  onChangeText={v => setForm({...form, entry_time: v})}
                  containerStyle={{ flex: 1 }}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <Input 
                  label="Exit Date" 
                  placeholder="YYYY-MM-DD"
                  value={form.exit_date} 
                  onChangeText={v => setForm({...form, exit_date: v})}
                  containerStyle={{ flex: 1 }}
              />
              <Input 
                  label="Exit Time" 
                  placeholder="HH:mm"
                  value={form.exit_time} 
                  onChangeText={v => setForm({...form, exit_time: v})}
                  containerStyle={{ flex: 1 }}
              />
            </View>

            <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center', marginBottom: spacing.md }}>
              <Input 
                  label="Companions" 
                  keyboardType="numeric"
                  value={String(form.companions)} 
                  onChangeText={v => setForm({...form, companions: parseInt(v) || 0})}
                  containerStyle={{ flex: 1, marginBottom: 0 }}
              />
              <TouchableOpacity 
                style={[styles.checkboxContainer, form.requires_driver && styles.checkboxActive]}
                onPress={() => setForm({...form, requires_driver: !form.requires_driver})}
              >
                <Ionicons 
                  name={form.requires_driver ? "checkbox" : "square-outline"} 
                  size={20} 
                  color={form.requires_driver ? colors.primary : colors.muted} 
                />
                <Text style={styles.checkboxLabel}>Driver Required</Text>
              </TouchableOpacity>
            </View>

            <Input 
                label="Purpose of Visit" 
                multiline
                numberOfLines={2}
                value={form.purpose} 
                onChangeText={v => setForm({...form, purpose: v})}
            />
            <View style={{ height: 100 }} />
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
  actionBar: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md, gap: spacing.sm },
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
  statsRow: { marginBottom: spacing.xl },
  statCard: { marginRight: spacing.md, minWidth: 110, alignItems: 'center', padding: spacing.md },
  statIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  statValue: { fontSize: 20, fontWeight: '700', color: colors.text },
  statLabel: { fontSize: 11, color: colors.muted },
  table: { marginBottom: spacing.md },
  cellMainText: { fontSize: 13, fontWeight: '600', color: colors.text },
  cellSubText: { fontSize: 11, color: colors.muted, marginTop: 2 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  actionIcon: { padding: 4 },
  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.xl, marginTop: spacing.md },
  pageText: { ...typography.body, fontWeight: '600' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  detailLabel: { ...typography.small, color: colors.muted },
  detailValue: { ...typography.small, fontWeight: '600', color: colors.text, flex: 1, textAlign: 'right', marginLeft: 10 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  filterBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  clearFilters: { padding: 4 },
  modalSectionTitle: { ...typography.body, fontWeight: '700', color: colors.primary, marginBottom: spacing.sm, marginTop: spacing.md },
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  checkboxActive: { },
  checkboxLabel: { fontSize: 13, color: colors.text },
  dropdown: {
    position: 'absolute',
    top: 65,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownItem: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dropdownItemText: {
    fontSize: 14,
    color: colors.text,
  },
});
