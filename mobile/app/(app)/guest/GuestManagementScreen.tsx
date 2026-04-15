import React, { useEffect, useState, useCallback } from 'react';
import { Stack } from 'expo-router';
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
  FlatList,
} from 'react-native';
import { PageContainer } from '@/components/ui/Premium';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
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
import { formatDate, formatTime, toDateInputValue } from '@/utils/dateTime';
import PageHeader from '@/components/ui/PageHeader';
import AppHeader from '@/components/ui/AppHeader';
// import StatChipRow from '@/components/StatChipRow';
// import GuestCard from '@/components/GuestCard';
// import SectionCard from '@/components/SectionCard';
// import DetailRow from '@/components/DetailRow';
// import InfoChip from '@/components/InfoChip';
// import ActionButton from '@/components/ActionButton';

const { width } = Dimensions.get('window');

// ─── helpers ──────────────────────────────────────────────────────────────────
const statusVariant = (s: string): any => {
  if (s === 'Inside' || s === 'Entered') return 'success';
  if (s === 'Scheduled') return 'warning';
  if (s === 'Exited') return 'info';
  if (s === 'Cancelled') return 'error';
  return 'muted';
};

const statusColor: Record<string, string> = {
  Inside: '#22C55E',
  Entered: '#22C55E',
  Scheduled: '#EAB308',
  Exited: '#6B7280',
  Cancelled: '#EF4444',
};

// ─── main component ───────────────────────────────────────────────────────────
export default function GuestManagementScreen() {
  const [guests, setGuests] = useState<any[]>([]);
  const [designationSearch, setDesignationSearch] = useState('');
  const [showDesignationDropdown, setShowDesignationDropdown] = useState(false);
  const [designations, setDesignations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [statusCounts, setStatusCounts] = useState<any>({});
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('All');
  const [search, setSearch] = useState('');
  const [entryDateFrom, setEntryDateFrom] = useState('');
  const [entryDateTo, setEntryDateTo] = useState('');
  const [showEntryDatePicker, setShowEntryDatePicker] = useState(false);
  const [showExitDatePicker, setShowExitDatePicker] = useState(false);
  const [showEntryTimePicker, setShowEntryTimePicker] = useState(false);
  const [showExitTimePicker, setShowExitTimePicker] = useState(false);

  // Modals
  const [showViewModal, setShowViewModal] = useState(false);
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<any>(null);
  const [isEdit, setIsEdit] = useState(false);
const statCards: any[] = [
  { label: 'All', key: 'All', icon: 'list-outline', color: colors.primary, bg: colors.primaryBg },
  { label: 'Inside', key: 'Inside', icon: 'home-outline', color: '#3B82F6', bg: '#EFF6FF' },
  { label: 'Upcoming', key: 'Scheduled', icon: 'time-outline', color: '#EAB308', bg: '#FEF9C3' },
  { label: 'Entered', key: 'Entered', icon: 'enter-outline', color: '#22C55E', bg: '#F0FDF4' },
  { label: 'Exited', key: 'Exited', icon: 'exit-outline', color: '#6B7280', bg: '#F3F4F6' },
];
const handleCancelVisit = async (id: string) => {
  try {
    await cancelGuestInOut(id);
    Alert.alert('Success', 'Visit cancelled');
    loadGuests();
  } catch {
    Alert.alert('Error', 'Cancellation failed');
  }
};
const handleDeleteGuest = async (id: string) => {
  try {
    await softDeleteGuest(id);
    Alert.alert('Success', 'Guest removed');
    loadGuests();
  } catch {
    Alert.alert('Error', 'Delete failed');
  }
};
const handleSubmit = async () => {
  try {
    setLoading(true);

    const payload = {
      guest: {
        guest_name: form.guest_name,
        guest_mobile: form.guest_mobile,
        guest_alternate_mobile: form.guest_alternate_mobile,
        guest_address: form.guest_address,
        guest_email: form.guest_email,
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
      },
    };

    if (isEdit && selectedGuest) {
      await updateGuest(selectedGuest.guest_id, payload.guest);
    } else {
      await createGuest(payload); // ✅ NOW CORRECT
    }

    Alert.alert('Success', 'Saved successfully');
    setShowFormModal(false);
    loadGuests();
  } catch (err: any) {
    Alert.alert('Error', err?.message || 'Failed');
  } finally {
    setLoading(false);
  }
};  
  // Form State
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
      entry_date: g.entry_date || '',
      entry_time: g.entry_time || '',
      exit_date: g.exit_date || '',
      exit_time: g.exit_time || '',
      companions: g.companions || 0,
      requires_driver: g.requires_driver || false,
      purpose: g.purpose || '',
    });
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
      entry_date: '',
      entry_time: '',
      exit_date: '',
      exit_time: '',
      companions: 0,
      requires_driver: false,
      purpose: '',
    });
  }
  setShowFormModal(true);
};
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
const onRefresh = async () => {
  setRefreshing(true);
  await loadGuests();
  setRefreshing(false);
};

const loadGuests = async () => {
  try {
    setLoading(true);

    const res: any = await getActiveGuests({   // ✅ FORCE TYPE HERE
      page,
      limit: 10,
      search: search || undefined,
      status: status !== 'All' ? status : undefined,
      entryDateFrom,
      entryDateTo,
    });

    setGuests(res.data || []);
    setTotalCount(res.totalCount || 0);
    setStatusCounts(res.statusCounts || {});

  } catch (err) {
    Alert.alert('Error', 'Failed to load guests');
  } finally {
    setLoading(false);
  }
};
useEffect(() => {
  loadGuests();
}, [page, status, search, entryDateFrom, entryDateTo]);
useEffect(() => {
  const loadDesignations = async () => {
    const res = await getActiveDesignationList();
    setDesignations(res?.data || []);
  };
  loadDesignations();
}, []);
const isLockedStatus = (status: string) => {
  return status === 'Exited' || status === 'Cancelled';
};
      return (
        
        <PageContainer>
            {/* <AppHeader title="Guest Management" /> */}


          {/* <Header
            title="Guest Management"
            subtitle="Administrative control for all visitor credentials"
            fallback="/(app)/_tabs"
          /> */}

          <FlatList
            data={guests}
            // keyExtractor={(item) => item.guest_id}
            keyExtractor={(item, index) => item.guest_id || index.toString()}
            refreshing={refreshing}
            onRefresh={onRefresh}
            contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}

            ListHeaderComponent={
              <>
                {/* <PageHeader
                  title="Guest Management"
                  subtitle="Administrative control for all visitor credentials"
                  fallback="/(app)/_tabs"
                /> */}

                {/* ── Toolbar ── */}
                <View style={styles.toolbar}>
                  <View style={styles.searchBox}>
                    <Ionicons name="search-outline" size={18} color={colors.muted} style={{ marginRight: 6 }} />
                    <Input
                      placeholder="Search guests..."
                      value={search}
                      onChangeText={setSearch}
                      containerStyle={{ marginBottom: 0, flex: 1 }}
                      inputStyle={{ borderWidth: 0, height: 40, fontSize: 14, paddingHorizontal: 0 }}
                    />
                  </View>
                  <TouchableOpacity style={styles.addBtn} onPress={() => openForm()}>
                    <Ionicons name="add" size={18} color="#fff" />
                    <Text style={styles.addBtnText}>New</Text>
                  </TouchableOpacity>
                </View>

                {/* ── Date filters ── */}
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
                    <TouchableOpacity
                      onPress={() => { setEntryDateFrom(''); setEntryDateTo(''); }}
                      style={{ padding: 4 }}
                    >
                      <Ionicons name="close-circle" size={20} color={colors.muted} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* ── Stat chips ── */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsRow}>
                  {statCards.map((card:any) => {
                    const active = status === card.key;
                    return (
                      <TouchableOpacity
                        key={card.key}
                        onPress={() => setStatus(card.key)}
                        activeOpacity={0.8}
                        style={[styles.statChip, active && { backgroundColor: card.color }]}
                      >
                        <View style={[styles.statIconWrap, { backgroundColor: active ? 'rgba(255,255,255,0.25)' : card.bg }]}>
                          <Ionicons name={card.icon as any} size={18} color={active ? '#fff' : card.color} />
                        </View>
                        <Text style={[styles.statValue, active && { color: '#fff' }]}>
                          {statusCounts[card.key] ?? 0}
                        </Text>
                        <Text style={[styles.statLabel, active && { color: 'rgba(255,255,255,0.85)' }]}>
                          {card.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* ── Total count ── */}
                <View style={styles.resultMeta}>
                  <Text style={styles.resultText}>
                    {loading ? 'Loading...' : `${totalCount} guests found`}
                  </Text>
                </View>
              </>
            }
            renderItem={({ item: g }) => (
              <GuestCard
                guest={g}
                onView={() => { setSelectedGuest(g); setShowViewModal(true); }}
                onEdit={() => openForm(g)}
                onCancel={() =>
                  Alert.alert('Cancel Visit', `Cancel ${g.guest_name}'s visit?`, [
                    { text: 'No', style: 'cancel' },
                    { text: 'Yes, Cancel', style: 'destructive', onPress: () => handleCancelVisit(g.inout_id) },
                  ])
                }
                onDelete={() =>
                  Alert.alert('Remove Guest', `Remove ${g.guest_name}?`, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Remove', style: 'destructive', onPress: () => handleDeleteGuest(g.guest_id) },
                  ])
                }
                locked={isLockedStatus(g.inout_status)}
              />
            )}

            ListEmptyComponent={!loading ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color={colors.muted} />
                <Text style={styles.emptyText}>No guests found</Text>
                <Text style={styles.emptySubText}>Try adjusting your filters</Text>
              </View>
            ) : null}

            ListFooterComponent={guests.length > 0 ? (
              <View style={styles.pagination}>
                <Button
                  title="← Prev"
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onPress={() => setPage(page - 1)}
                />
                <Text style={styles.pageText}>Page {page}</Text>
                <Button
                  title="Next →"
                  variant="outline"
                  size="sm"
                  disabled={guests.length < 10}
                  onPress={() => setPage(page + 1)}
                />
              </View>
            ) : null}
/>
            {/* ── Guest card list ──
            {loading && guests.length === 0 ? (
              <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
            ) : guests.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color={colors.muted} />
                <Text style={styles.emptyText}>No guests found</Text>
                <Text style={styles.emptySubText}>Try adjusting your filters</Text>
              </View>
            ) : (
              guests.map((g) => (
                <GuestCard
                  key={g.guest_id}
                  guest={g}
                  onView={() => { setSelectedGuest(g); setShowViewModal(true); }}
                  onEdit={() => openForm(g)}
                  onCancel={() =>
                    Alert.alert('Cancel Visit', `Cancel ${g.guest_name}'s visit?`, [
                      { text: 'No', style: 'cancel' },
                      { text: 'Yes, Cancel', style: 'destructive', onPress: () => handleCancelVisit(g.inout_id) },
                    ])
                  }
                  onDelete={() =>
                    Alert.alert('Remove Guest', `Remove ${g.guest_name}?`, [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Remove', style: 'destructive', onPress: () => handleDeleteGuest(g.guest_id) },
                    ])
                  }
                  locked={isLockedStatus(g.inout_status)}
                />
              ))
            )}

            ── Pagination ──
            {guests.length > 0 && (
              <View style={styles.pagination}>
                <Button
                  title="← Prev"
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onPress={() => setPage(page - 1)}
                />
                <Text style={styles.pageText}>Page {page}</Text>
                <Button
                  title="Next →"
                  variant="outline"
                  size="sm"
                  disabled={guests.length < 10}
                  onPress={() => setPage(page + 1)}
                />
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView> */}

          {/* ── View Modal ── */}
          <Modal
            visible={showViewModal}
            onClose={() => setShowViewModal(false)}
            title="Guest Profile"
            footer={<Button title="Close" variant="outline" onPress={() => setShowViewModal(false)} />}
          >
            {selectedGuest && (
              <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 1 }}
              >
                <SectionCard title="Basic Information" icon="person-outline">
                  <DetailRow label="Full Name" value={selectedGuest.guest_name} />
                  <DetailRow label="Local Name" value={selectedGuest.guest_name_local_language} />
                  <DetailRow label="Mobile" value={selectedGuest.guest_mobile} />
                  <DetailRow label="Alt Mobile" value={selectedGuest.guest_alternate_mobile} />
                  <DetailRow label="Email" value={selectedGuest.email} />
                  <DetailRow label="Address" value={selectedGuest.guest_address} />
                </SectionCard>

                <SectionCard title="Designation" icon="briefcase-outline">
                  <DetailRow label="Designation" value={selectedGuest.designation_name} />
                  <DetailRow label="Department" value={selectedGuest.department} />
                  <DetailRow label="Organization" value={selectedGuest.organization} />
                  <DetailRow label="Office" value={selectedGuest.office_location} />
                </SectionCard>

                <SectionCard title="Visit Details" icon="calendar-outline">
                  <DetailRow label="Status" value={selectedGuest.inout_status} highlight />
                  <DetailRow label="Entry Date" value={formatDate(selectedGuest.entry_date)} />
                  <DetailRow label="Entry Time" value={formatTime(selectedGuest.entry_time)} />
                  <DetailRow label="Exit Date" value={formatDate(selectedGuest.exit_date)} />
                  <DetailRow label="Exit Time" value={formatTime(selectedGuest.exit_time)} />
                  <DetailRow label="Purpose" value={selectedGuest.purpose} />
                  <DetailRow label="Companions" value={String(selectedGuest.companions || 0)} />
                  <DetailRow label="Driver Required" value={selectedGuest.requires_driver ? 'Yes' : 'No'} />
                </SectionCard>
              </ScrollView>
            )}
          </Modal>

          {/* ── Form Modal ── */}
          <Modal
            visible={showFormModal}
            onClose={() => setShowFormModal(false)}
            title={isEdit ? 'Update Guest' : 'Register New Guest'}
            footer={
              <View style={{ flexDirection: 'row', gap: spacing.md, width: '100%' }}>
                <Button title="Cancel" variant="outline" style={{ flex: 1 }} onPress={() => setShowFormModal(false)} />
                <Button title={isEdit ? 'Update' : 'Register'} style={{ flex: 1 }} onPress={handleSubmit} loading={loading} />
              </View>
            }
          >
            <ScrollView
              style={{ flex: 1 }}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
              contentContainerStyle={{ paddingBottom: 5 }}
            >
              {/* <ScrollView style={{ maxHeight: Dimensions.get('window').height * 0.65 }}> */}
                {/* Section: Guest Info */}
                <SectionCard title="Guest Information" icon="person-outline">
                  <Input
                    label="Full Name *"
                    value={form.guest_name}
                    onChangeText={v => setForm({ ...form, guest_name: v })}
                  />

                  <View style={styles.row}>
                    <Input
                      label="Mobile *"
                      keyboardType="phone-pad"
                      value={form.guest_mobile}
                      onChangeText={v => setForm({ ...form, guest_mobile: v })}
                      containerStyle={{ flex: 1 }}
                    />
                    <Input
                      label="Alt Mobile"
                      keyboardType="phone-pad"
                      value={form.guest_alternate_mobile}
                      onChangeText={v => setForm({ ...form, guest_alternate_mobile: v })}
                      containerStyle={{ flex: 1 }}
                    />
                  </View>
                  <Input
                    label="Work Email"
                    keyboardType="email-address"
                    value={form.guest_email}
                    onChangeText={v => setForm({ ...form, guest_email: v })}
                  />
                  <Input
                    label="Address"
                    value={form.guest_address}
                    onChangeText={v => setForm({ ...form, guest_address: v })}
                    multiline
                  />
                </SectionCard>

                {/* Section: Designation */}
                <SectionCard title="Designation" icon="briefcase-outline">
                  <View style={{ position: 'relative', zIndex: 100 }}>
                    <Input
                      label="Search / Add Designation"
                      value={designationSearch}
                      onChangeText={v => {
                        setDesignationSearch(v);
                        setForm({ ...form, designation_name: v, designation_id: '' });
                        setShowDesignationDropdown(true);
                      }}
                      onFocus={() => setShowDesignationDropdown(true)}
                    />
                    {showDesignationDropdown && (
                      <View style={styles.dropdown}>
                        <ScrollView
                          nestedScrollEnabled={true}
                          keyboardShouldPersistTaps="handled"
                          style={{ maxHeight: 200 }}
                        >
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
                                    office_location: d.office_location || form.office_location,
                                  });
                                  setShowDesignationDropdown(false);
                                }}
                              >
                                <Text style={styles.dropdownItemText}>{d.designation_name}</Text>
                              </TouchableOpacity>
                            ))}
                          {designationSearch !== '' &&
                            !designations.some(d => d.designation_name.toLowerCase() === designationSearch.toLowerCase()) && (
                              <TouchableOpacity
                                style={styles.dropdownItem}
                                onPress={() => setShowDesignationDropdown(false)}
                              >
                                <Text style={[styles.dropdownItemText, { color: colors.primary }]}>
                                  + Add New: "{designationSearch}"
                                </Text>
                              </TouchableOpacity>
                            )}
                        </ScrollView>
                      </View>
                    )}
                  </View>

                  <Input
                    label="Organization"
                    value={form.organization}
                    onChangeText={v => setForm({ ...form, organization: v })}
                  />
                  <View style={styles.row}>
                    <Input
                      label="Department"
                      value={form.department}
                      onChangeText={v => setForm({ ...form, department: v })}
                      containerStyle={{ flex: 1 }}
                    />
                    <Input
                      label="Office Location"
                      value={form.office_location}
                      onChangeText={v => setForm({ ...form, office_location: v })}
                      containerStyle={{ flex: 1 }}
                    />
                  </View>
                </SectionCard>

                {/* Section: Visit Details */}
                <SectionCard title="Visit Details" icon="calendar-outline">
                  <View style={styles.row}>
                    <TouchableOpacity onPress={() => setShowEntryDatePicker(true)} style={{ flex: 1 }}>
                      <Input
                        label="Entry Date"
                        value={form.entry_date}
                        editable={false}
                      />
                    </TouchableOpacity>


                    <TouchableOpacity onPress={() => setShowEntryTimePicker(true)} style={{ flex: 1 }}>
                      <Input
                        label="Entry Time"
                        value={form.entry_time}
                        editable={false}
                      />
                    </TouchableOpacity>

                  </View>
                  <View style={styles.row}>
                    <TouchableOpacity onPress={() => setShowExitDatePicker(true)} style={{ flex: 1 }}>
                      <Input
                        label="Exit Date"
                        value={form.exit_date}
                        editable={false}
                        // pointerEvents="none"
                      />
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setShowExitTimePicker(true)} style={{ flex: 1 }}>
                      <Input
                        label="Exit Time"
                        value={form.exit_time}
                        editable={false}
                      />
                    </TouchableOpacity>

                  </View>
                  <View style={styles.row}>
                    <Input
                      label="Companions"
                      keyboardType="numeric"
                      value={String(form.companions)}
                      onChangeText={v => setForm({ ...form, companions: parseInt(v) || 0 })}
                      containerStyle={{ flex: 1, marginBottom: 0 }}
                    />
                    <TouchableOpacity
                      style={[styles.driverToggle, form.requires_driver && styles.driverToggleActive]}
                      onPress={() => setForm({ ...form, requires_driver: !form.requires_driver })}
                    >
                      <Ionicons
                        name={form.requires_driver ? 'checkbox' : 'square-outline'}
                        size={20}
                        color={form.requires_driver ? colors.primary : colors.muted}
                      />
                      <Text style={[styles.driverToggleLabel, form.requires_driver && { color: colors.primary }]}>
                        Driver Required
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <Input
                    label="Purpose of Visit"
                    multiline
                    numberOfLines={3}
                    value={form.purpose}
                    onChangeText={v => setForm({ ...form, purpose: v })}
                  />
                </SectionCard>
                {showEntryDatePicker && (
                  <DateTimePicker
                    value={form.entry_date ? new Date(form.entry_date) : new Date()}
                    mode="date"
                    display="default"
                    onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {  
                      setShowEntryDatePicker(false);
                      if (selectedDate) {
                        setForm({
                          ...form,
                          entry_date: selectedDate.toISOString().split('T')[0],
                        });
                      }
                    }}
                  />
                )}
                {showEntryTimePicker && (
                  <DateTimePicker
                    value={new Date()}
                    mode="time"
                    is24Hour
                    onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                      setShowEntryTimePicker(false);
                      if (selectedDate) {
                        const time = selectedDate.toTimeString().slice(0, 5);
                        setForm({ ...form, entry_time: time });
                      }
                    }}
                  />
                )}
                {showExitDatePicker && (
                  <DateTimePicker
                    value={form.exit_date ? new Date(form.exit_date) : new Date()}
                    mode="date"
                    display="default"
                    onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                      setShowExitDatePicker(false);
                      if (selectedDate) {
                        setForm({
                          ...form,
                          exit_date: selectedDate.toISOString().split('T')[0],
                        });
                      }
                    }}
                  />
                )}
                {showExitTimePicker && (
                  <DateTimePicker
                    value={new Date()}
                    mode="time"
                    is24Hour
                    onChange={(event: DateTimePickerEvent, selectedDate?: Date) => {
                      setShowExitTimePicker(false);
                      if (selectedDate) {
                        const time = selectedDate.toTimeString().slice(0, 5);
                        setForm({ ...form, exit_time: time });
                      }
                    }}
                  />
                )}
                {/* <View style={{ height: 80 }} /> */}
              </ScrollView>

            </Modal>
          </PageContainer>
        );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function GuestCard({
  guest: g,
  onView,
  onEdit,
  onCancel,
  onDelete,
  locked,
}: {
  guest: any;
  onView: () => void;
  onEdit: () => void;
  onCancel: () => void;
  onDelete: () => void;
  locked: boolean;
}) {
  const variant = statusVariant(g.inout_status);
  const color = statusColor[g.inout_status] || '#9CA3AF';

  return (
    <Card style={styles.guestCard}>
      {/* Header row */}
      <View style={styles.cardHeader}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{(g.guest_name || '?').charAt(0).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.guestName} numberOfLines={1}>{g.guest_name}</Text>
          <Text style={styles.guestDesignation} numberOfLines={1}>
            {g.designation_name || '—'}
            {g.organization ? ` · ${g.organization}` : ''}
          </Text>
        </View>
        <Badge label={g.inout_status || 'Unknown'} variant={variant} />
      </View>

      {/* Info grid */}
      <View style={styles.infoGrid}>
        <InfoChip icon="call-outline" label={g.guest_mobile || '—'} />
        <InfoChip icon="log-in-outline" label={formatDate(g.entry_date) + (g.entry_time ? ` · ${formatTime(g.entry_time)}` : '')} />
        {g.exit_date
          ? <InfoChip icon="log-out-outline" label={formatDate(g.exit_date) + (g.exit_time ? ` · ${formatTime(g.exit_time)}` : '')} />
          : null}
        {g.companions > 0
          ? <InfoChip icon="people-outline" label={`+${g.companions} companion${g.companions > 1 ? 's' : ''}`} />
          : null}
      </View>

      {/* Action row */}
      <View style={styles.cardActions}>
        <ActionButton icon="eye-outline" color="#3B82F6" label="View" onPress={onView} />
        {!locked && <ActionButton icon="create-outline" color="#22C55E" label="Edit" onPress={onEdit} />}
        {g.inout_status === 'Scheduled' && (
          <ActionButton icon="close-circle-outline" color="#F97316" label="Cancel" onPress={onCancel} />
        )}
        <ActionButton icon="bed-outline" color="#9333EA" label="Room" onPress={() => Alert.alert('Room', 'Room assignment coming soon')} />
        {!locked && <ActionButton icon="trash-outline" color="#EF4444" label="Remove" onPress={onDelete} />}
      </View>
    </Card>
  );
}

function InfoChip({ icon, label }: { icon: any; label: string }) {
  return (
    <View style={styles.infoChip}>
      <Ionicons name={icon} size={13} color={colors.muted} style={{ marginRight: 4 }} />
      <Text style={styles.infoChipText} numberOfLines={1}>{label}</Text>
    </View>
  );
}

function ActionButton({ icon, color, label, onPress }: { icon: any; color: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: color + '15' }]} onPress={onPress}>
      <Ionicons name={icon} size={16} color={color} />
      <Text style={[styles.actionBtnLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <Card style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconWrap}>
          <Ionicons name={icon} size={16} color={colors.primary} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </Card>
  );
}

function DetailRow({ label, value, highlight }: { label: string; value?: string; highlight?: boolean }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={[styles.detailValue, highlight && { color: colors.primary, fontWeight: '700' }]}>
        {value || '—'}
      </Text>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },

  // ── toolbar
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    flex: 1,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  addBtnText: {
    color: '#fff',
    marginLeft: spacing.sm,
    fontSize: 14,
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  statChip: {
    padding: spacing.sm,
    borderRadius: 8,
    marginRight: spacing.sm,
  },
  statIconWrap: {
    padding: spacing.sm,
    borderRadius: 8,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 14,
  },
  resultMeta: {
    marginBottom: spacing.md,
  },
  resultText: {
    fontSize: 14,
    color: colors.muted,
  },
  // ── empty
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 12 },
  emptySubText: { fontSize: 13, color: colors.muted, marginTop: 4 },

  // ── guest card
  guestCard: {
    marginBottom: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  guestName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  guestDesignation: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },

  // ── info grid
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  infoChipText: {
    fontSize: 11,
    color: colors.text,
    fontWeight: '500',
    maxWidth: 140,
  },

  // ── card actions
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  actionBtnLabel: {
    fontSize: 12,
    fontWeight: '600',
  },

  // ── pagination
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xl,
    marginTop: spacing.md,
  },
  pageText: { fontSize: 13, fontWeight: '600', color: colors.text },

  // ── modal section cards
  sectionCard: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: 14,
    overflow: 'visible',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: spacing.md,
  },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },

  // ── detail rows
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: { fontSize: 12, color: colors.muted, fontWeight: '500' },
  detailValue: { fontSize: 12, fontWeight: '600', color: colors.text, flex: 1, textAlign: 'right', marginLeft: 10 },

  // ── form
  row: { flexDirection: 'row', gap: spacing.sm },
  driverToggle: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
    marginBottom: spacing.md,
    alignSelf: 'flex-end',
  },
  driverToggleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryBg,
  },
  driverToggleLabel: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: '600',
  },

  // ── designation dropdown
  dropdown: {
    position: 'absolute',
    top: 65,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    zIndex: 1000,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownItemText: { fontSize: 13, color: colors.text },
});
