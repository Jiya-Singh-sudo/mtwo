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
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getRoomManagementOverview,
  getAssignableGuests,
  updateFullRoom,
} from '@/api/roomManagement.api';
import {
  getActiveHousekeeping,
  createHousekeeping,
  updateHousekeeping,
  softDeleteHousekeeping,
} from '@/api/housekeeping.api';
import { createGuestRoom, updateGuestRoom } from '@/api/guestRoom.api';
import { assignRoomBoyToRoom, unassignRoomBoy } from '@/api/guestHousekeeping.api';
import { createRoom } from '@/api/rooms.api';
import { colors, spacing, typography } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import Header from '@/components/Header';

const { width } = Dimensions.get('window');

// ─── main component ───────────────────────────────────────────────────────────
export default function RoomManagementScreen() {
  const [activeTab, setActiveTab] = useState<'rooms' | 'boys'>('rooms');
  const [rooms, setRooms] = useState<any[]>([]);
  const [roomBoys, setRoomBoys] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [roomStats, setRoomStats] = useState<any>({});

  // Pagination/Filters
  const [roomPage, setRoomPage] = useState(1);
  const [boyPage, setBoyPage] = useState(1);
  const [roomSearch, setRoomSearch] = useState('');
  const [boySearch, setBoySearch] = useState('');
  const [activeCard, setActiveCard] = useState('ALL');

  // Modals
  const [showViewRoom, setShowViewRoom] = useState(false);
  const [showEditRoom, setShowEditRoom] = useState(false);
  const [showAddRoom, setShowAddRoom] = useState(false);
  const [showAssignGuest, setShowAssignGuest] = useState(false);
  const [showAssignBoy, setShowAssignBoy] = useState(false);
  const [showAddBoy, setShowAddBoy] = useState(false);
  const [showEditBoy, setShowEditBoy] = useState(false);

  // Selected Data
  const [selectedRoom, setSelectedRoom] = useState<any>(null);
  const [selectedBoy, setSelectedBoy] = useState<any>(null);
  const [assignableGuests, setAssignableGuests] = useState<any[]>([]);
  const [boyOptions, setBoyOptions] = useState<any[]>([]);

  // Room Form
  const [roomForm, setRoomForm] = useState({
    room_no: '', room_name: '', residence_type: '', building_name: '',
    room_type: '', room_capacity: 1, room_category: '', status: 'Available',
  });

  // Assignment states
  const [selectedGuestId, setSelectedGuestId] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [selectedBoyId, setSelectedBoyId] = useState('');
  const [assignmentRemarks, setAssignmentRemarks] = useState('');

  // Boy Form
  const [boyForm, setBoyForm] = useState({
    hk_name: '', hk_contact: '', hk_alternate_contact: '', address: '',
  });

  // ─── data loading ────────────────────────────────────────────────────────────
  useEffect(() => { loadInitialData(); }, []);

  const loadInitialData = async () => {
    try {
      const [guests, boys] = await Promise.all([
        getAssignableGuests(),
        getActiveHousekeeping({ page: 1, limit: 100 }),
      ]);
      setAssignableGuests(guests || []);
      setBoyOptions(boys?.data || []);
    } catch (err) { console.error('Failed to load options', err); }
  };

  const loadRooms = async () => {
    setLoading(true);
    try {
      const res = await getRoomManagementOverview({
        page: roomPage, limit: 10,
        search: roomSearch || undefined,
        status: activeCard === 'AVAILABLE' ? 'Available' : activeCard === 'OCCUPIED' ? 'Occupied' : undefined,
        sortBy: activeCard === 'WITH_GUEST' ? 'guest_name' : activeCard === 'WITH_HOUSEKEEPING' ? 'hk_name' : 'room_no',
        sortOrder: 'asc',
      });
      setRooms(res.data || []);
      setRoomStats(res.stats || {});
    } catch (error) {
      console.error('Failed to load rooms', error);
      Alert.alert('Error', 'Could not load room data');
    } finally { setLoading(false); setRefreshing(false); }
  };

  const loadRoomBoys = async () => {
    setLoading(true);
    try {
      const res = await getActiveHousekeeping({ page: boyPage, limit: 10, search: boySearch || undefined });
      setRoomBoys(res.data || []);
    } catch (error) {
      console.error('Failed to load room boys', error);
      Alert.alert('Error', 'Could not load housekeeping data');
    } finally { setLoading(false); setRefreshing(false); }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (activeTab === 'rooms') loadRooms(); else loadRoomBoys();
    loadInitialData();
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'rooms') loadRooms(); else loadRoomBoys();
  }, [activeTab, roomPage, boyPage, roomSearch, boySearch, activeCard]);

  // ─── handlers ────────────────────────────────────────────────────────────────
  const handleSaveRoom = async () => {
    setLoading(true);
    try {
      if (selectedRoom) {
        await updateFullRoom(selectedRoom.roomId, {
          ...roomForm,
          guest_id: selectedRoom.guest?.guestId || null,
          hk_id: selectedRoom.housekeeping?.hkId || null,
        } as any);
        Alert.alert('Success', 'Room updated');
      } else {
        await createRoom(roomForm as any);
        Alert.alert('Success', 'Room created');
      }
      setShowAddRoom(false); setShowEditRoom(false); loadRooms();
    } catch { Alert.alert('Error', 'Failed to save room'); }
    finally { setLoading(false); }
  };

  const handleSaveBoy = async () => {
    setLoading(true);
    try {
      const payload = {
        hk_name: boyForm.hk_name, 
        hk_contact: boyForm.hk_contact, hk_alternate_contact: boyForm.hk_alternate_contact,
        address: boyForm.address,
      };
      if (selectedBoy) { await updateHousekeeping(selectedBoy.hk_id, payload); Alert.alert('Success', 'Member updated'); }
      else { await createHousekeeping(payload); Alert.alert('Success', 'Member added'); }
      setShowAddBoy(false); setShowEditBoy(false); loadRoomBoys(); loadInitialData();
    } catch (err: any) {
      console.log(err?.response?.data);
      const msg = err?.response?.data?.message;
      Alert.alert(
        'Error',
        Array.isArray(msg) ? msg.join(', ') : msg || 'Operation failed'
      );
    } finally { setLoading(false); }
  };

  const handleDeleteBoy = async (id: string) => {
    try { await softDeleteHousekeeping(id); Alert.alert('Success', 'Member removed'); loadRoomBoys(); loadInitialData(); }
    catch { Alert.alert('Error', 'Deletion failed'); }
  };

  const handleAssignGuest = async () => {
    if (!selectedGuestId || !selectedRoom) return;
    setLoading(true);
    try {
      await createGuestRoom({
        guest_id: selectedGuestId, room_id: selectedRoom.roomId,
        check_in_date: checkInDate || new Date().toISOString().split('T')[0],
        check_out_date: checkOutDate || undefined,
        action_type: 'Room-Allocated', action_description: 'Assigned from mobile',
      });
      Alert.alert('Success', 'Guest assigned');
      setShowAssignGuest(false); loadRooms();
      getAssignableGuests().then(setAssignableGuests);
    } catch { Alert.alert('Error', 'Assignment failed'); }
    finally { setLoading(false); }
  };

  const vacateGuest = async (guestRoomId: string) => {
    Alert.alert('Vacate Guest', 'Release this room?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Vacate', style: 'destructive', onPress: async () => {
        try {
          await updateGuestRoom(guestRoomId, { is_active: false, action_type: 'Room-Released' });
          Alert.alert('Success', 'Guest vacated'); loadRooms();
          getAssignableGuests().then(setAssignableGuests);
        } catch { Alert.alert('Error', 'Failed to vacate'); }
      }},
    ]);
  };

  const handleAssignBoy = async () => {
    if (!selectedBoyId || !selectedRoom) return;
    setLoading(true);
    try {
      await assignRoomBoyToRoom({ room_id: selectedRoom.roomId, hk_id: selectedBoyId, remarks: assignmentRemarks });
      Alert.alert('Success', 'Housekeeping assigned');
      setShowAssignBoy(false); loadRooms();
    } catch { Alert.alert('Error', 'Assignment failed'); }
    finally { setLoading(false); }
  };

  const handleUnassignBoy = async (guestHkId: string) => {
    Alert.alert('Unassign', 'Remove housekeeping from this room?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Unassign', style: 'destructive', onPress: async () => {
        try { await unassignRoomBoy(guestHkId); Alert.alert('Success', 'Unassigned'); loadRooms(); }
        catch { Alert.alert('Error', 'Failed to unassign'); }
      }},
    ]);
  };

  const openEditRoomForm = (r: any) => {
    setSelectedRoom(r);
    setRoomForm({
      room_no: r.roomNo, room_name: r.roomName || '', residence_type: r.residenceType || '',
      building_name: r.buildingName || '', room_type: r.roomType || '',
      room_capacity: r.roomCapacity || 1, room_category: r.roomCategory || '', status: r.status,
    });
    setShowEditRoom(true);
  };

  const openAddRoomForm = () => {
    setSelectedRoom(null);
    setRoomForm({ room_no: '', room_name: '', residence_type: '', building_name: '', room_type: '', room_capacity: 1, room_category: '', status: 'Available' });
    setShowAddRoom(true);
  };

  const openEditBoyForm = (b: any) => {
    setSelectedBoy(b);
    setBoyForm({ hk_name: b.hk_name, hk_contact: b.hk_contact, hk_alternate_contact: b.hk_alternate_contact || '', address: b.address || '' });
    setShowEditBoy(true);
  };

  const openAddBoyForm = () => {
    setSelectedBoy(null);
    setBoyForm({ hk_name: '', hk_contact: '', hk_alternate_contact: '', address: '' });
    setShowAddBoy(true);
  };

  // ─── stat chips ──────────────────────────────────────────────────────────────
  const statChips = [
    { key: 'ALL', label: 'Total', icon: 'grid-outline', color: colors.primary, value: roomStats.total || 0 },
    { key: 'AVAILABLE', label: 'Available', icon: 'checkmark-circle-outline', color: '#22C55E', value: roomStats.available || 0 },
    { key: 'OCCUPIED', label: 'Occupied', icon: 'close-circle-outline', color: '#EF4444', value: roomStats.occupied || 0 },
    { key: 'WITH_GUEST', label: 'With Guest', icon: 'person-outline', color: '#3B82F6', value: roomStats.withGuest || 0 },
    { key: 'WITH_HOUSEKEEPING', label: 'HK', icon: 'people-outline', color: '#9333EA', value: roomStats.withHousekeeping || 0 },
  ];

  // ─── render ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* ── Premium Tab Switcher ── */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'rooms' && styles.tabItemActive]}
          onPress={() => setActiveTab('rooms')}
        >
          <Ionicons name="bed-outline" size={16} color={activeTab === 'rooms' ? colors.primary : colors.muted} />
          <Text style={[styles.tabText, activeTab === 'rooms' && styles.tabTextActive]}>Rooms</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabItem, activeTab === 'boys' && styles.tabItemActive]}
          onPress={() => setActiveTab('boys')}
        >
          <Ionicons name="people-outline" size={16} color={activeTab === 'boys' ? colors.primary : colors.muted} />
          <Text style={[styles.tabText, activeTab === 'boys' && styles.tabTextActive]}>Room Boys</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'rooms' ? (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item.roomId}
          renderItem={({ item: r }) => (
            <RoomCard
              room={r}
              onView={() => { setSelectedRoom(r); setShowViewRoom(true); }}
              onEdit={() => openEditRoomForm(r)}
              onAssignGuest={() => { setSelectedRoom(r); setSelectedGuestId(''); setCheckInDate(''); setCheckOutDate(''); setShowAssignGuest(true); }}
              onVacateGuest={() => vacateGuest(r.guest.guestRoomId)}
              onAssignBoy={() => { setSelectedRoom(r); setSelectedBoyId(''); setAssignmentRemarks(''); setShowAssignBoy(true); }}
              onUnassignBoy={() => handleUnassignBoy(r.housekeeping.guestHkId)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListHeaderComponent={
            <>
              <Header title="Room Overview" subtitle="Track room availability and occupancy" fallback="/(drawer)/room" />

              {/* ── Stat chips ── */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsRow}>
                {statChips.map((chip) => {
                  const active = activeCard === chip.key;
                  return (
                    <TouchableOpacity
                      key={chip.key}
                      onPress={() => setActiveCard(chip.key)}
                      activeOpacity={0.8}
                      style={[styles.statChip, active && { backgroundColor: chip.color }]}
                    >
                      <View style={[styles.statIconWrap, { backgroundColor: active ? 'rgba(255,255,255,0.25)' : chip.color + '18' }]}>
                        <Ionicons name={chip.icon as any} size={16} color={active ? '#fff' : chip.color} />
                      </View>
                      <Text style={[styles.statValue, active && { color: '#fff' }]}>{chip.value}</Text>
                      <Text style={[styles.statLabel, active && { color: 'rgba(255,255,255,0.85)' }]}>{chip.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* ── Toolbar ── */}
              <View style={styles.toolbar}>
                <View style={styles.searchBox}>
                  <Ionicons name="search-outline" size={16} color={colors.muted} style={{ marginRight: 6 }} />
                  <Input
                    placeholder="Search rooms..."
                    value={roomSearch}
                    onChangeText={setRoomSearch}
                    containerStyle={{ marginBottom: 0, flex: 1 }}
                    inputStyle={{ borderWidth: 0, height: 40, fontSize: 14, paddingHorizontal: 0 }}
                  />
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={openAddRoomForm}>
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={styles.addBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </>
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyState}>
                <Ionicons name="bed-outline" size={48} color={colors.muted} />
                <Text style={styles.emptyText}>No rooms found</Text>
                <Text style={styles.emptySubText}>Try adjusting your filters</Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            rooms.length > 0 ? (
              <View style={styles.pagination}>
                <Button title="← Prev" variant="outline" size="sm" disabled={roomPage === 1} onPress={() => setRoomPage(roomPage - 1)} />
                <Text style={styles.pageText}>Page {roomPage}</Text>
                <Button title="Next →" variant="outline" size="sm" disabled={rooms.length < 10} onPress={() => setRoomPage(roomPage + 1)} />
              </View>
            ) : null
          }
        />
      ) : (
        <FlatList
          data={roomBoys}
          keyExtractor={(item) => item.hk_id}
          renderItem={({ item: b }) => (
            <BoyCard
              boy={b}
              onEdit={() => openEditBoyForm(b)}
              onDelete={() => Alert.alert('Remove', `Remove ${b.hk_name}?`, [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: () => handleDeleteBoy(b.hk_id) },
              ])}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListHeaderComponent={
            <>
              <Header title="Housekeeping Team" subtitle="Manage room boys and assignments" fallback="/(drawer)/room" />
              <View style={styles.toolbar}>
                <View style={styles.searchBox}>
                  <Ionicons name="search-outline" size={16} color={colors.muted} style={{ marginRight: 6 }} />
                  <Input
                    placeholder="Search by name..."
                    value={boySearch}
                    onChangeText={setBoySearch}
                    containerStyle={{ marginBottom: 0, flex: 1 }}
                    inputStyle={{ borderWidth: 0, height: 40, fontSize: 14, paddingHorizontal: 0 }}
                  />
                </View>
                <TouchableOpacity style={styles.addBtn} onPress={openAddBoyForm}>
                  <Ionicons name="add" size={18} color="#fff" />
                  <Text style={styles.addBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </>
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyState}>
                <Ionicons name="people-outline" size={48} color={colors.muted} />
                <Text style={styles.emptyText}>No team members</Text>
                <Text style={styles.emptySubText}>Add your first housekeeping member</Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            roomBoys.length > 0 ? (
              <View style={styles.pagination}>
                <Button title="← Prev" variant="outline" size="sm" disabled={boyPage === 1} onPress={() => setBoyPage(boyPage - 1)} />
                <Text style={styles.pageText}>Page {boyPage}</Text>
                <Button title="Next →" variant="outline" size="sm" disabled={roomBoys.length < 10} onPress={() => setBoyPage(boyPage + 1)} />
              </View>
            ) : null
          }
        />
      )}

      {loading && !refreshing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {/* ══════════════════════ MODALS ══════════════════════ */}

      {/* ── View Room ── */}
      <Modal visible={showViewRoom} onClose={() => setShowViewRoom(false)} title="Room Details"
        footer={<Button title="Close" variant="outline" onPress={() => setShowViewRoom(false)} />}
      >
        {selectedRoom && (
          <ScrollView style={{ maxHeight: Dimensions.get('window').height * 0.65 }}>
            <SectionCard title="Room Info" icon="bed-outline">
              <DetailRow label="Room No" value={selectedRoom.roomNo} highlight />
              <DetailRow label="Residence" value={selectedRoom.roomName} />
              <DetailRow label="Type" value={selectedRoom.roomType} />
              <DetailRow label="Category" value={selectedRoom.roomCategory} />
              <DetailRow label="Building" value={selectedRoom.buildingName} />
              <DetailRow label="Capacity" value={String(selectedRoom.roomCapacity || '—')} />
              <DetailRow label="Status" value={selectedRoom.status} />
            </SectionCard>

            <SectionCard title="Occupancy" icon="person-outline">
              <DetailRow label="Guest" value={selectedRoom.guest?.guestName || 'None'} />
              <DetailRow label="Housekeeping" value={selectedRoom.housekeeping?.hkName || 'None'} />
            </SectionCard>
          </ScrollView>
        )}
      </Modal>

      {/* ── Add / Edit Room ── */}
      <Modal
        visible={showAddRoom || showEditRoom}
        onClose={() => { setShowAddRoom(false); setShowEditRoom(false); }}
        title={showAddRoom ? 'Add Room' : 'Edit Room'}
        footer={
          <View style={{ flexDirection: 'row', gap: spacing.md, width: '100%' }}>
            <Button title="Cancel" variant="outline" style={{ flex: 1 }} onPress={() => { setShowAddRoom(false); setShowEditRoom(false); }} />
            <Button title="Save Room" style={{ flex: 1 }} onPress={handleSaveRoom} loading={loading} />
          </View>
        }
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView style={{ maxHeight: Dimensions.get('window').height * 0.6 }} keyboardShouldPersistTaps="handled">
            <SectionCard title="Room Info" icon="bed-outline">
              <View style={styles.formRow}>
                <Input label="Room No *" value={roomForm.room_no} onChangeText={v => setRoomForm({ ...roomForm, room_no: v })} containerStyle={{ flex: 1 }} />
                <Input label="Capacity" value={String(roomForm.room_capacity)} keyboardType="numeric" onChangeText={v => setRoomForm({ ...roomForm, room_capacity: parseInt(v) || 0 })} containerStyle={{ flex: 1 }} />
              </View>
              <Input label="Residence Name" value={roomForm.room_name} onChangeText={v => setRoomForm({ ...roomForm, room_name: v })} />
              <Input label="Residence Type" value={roomForm.residence_type} onChangeText={v => setRoomForm({ ...roomForm, residence_type: v })} />
            </SectionCard>

            <SectionCard title="Building Details" icon="business-outline">
              <View style={styles.formRow}>
                <Input label="Building" value={roomForm.building_name} onChangeText={v => setRoomForm({ ...roomForm, building_name: v })} containerStyle={{ flex: 1 }} />
                <Input label="Room Type" value={roomForm.room_type} onChangeText={v => setRoomForm({ ...roomForm, room_type: v })} containerStyle={{ flex: 1 }} />
              </View>
            </SectionCard>
            <View style={{ height: 60 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Assign Guest ── */}
      <Modal
        visible={showAssignGuest}
        onClose={() => setShowAssignGuest(false)}
        title="Assign Guest"
        footer={
          <View style={{ flexDirection: 'row', gap: spacing.md, width: '100%' }}>
            <Button title="Cancel" variant="outline" style={{ flex: 1 }} onPress={() => setShowAssignGuest(false)} />
            <Button title="Assign" style={{ flex: 1 }} onPress={handleAssignGuest} loading={loading} />
          </View>
        }
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView style={{ maxHeight: Dimensions.get('window').height * 0.6 }} keyboardShouldPersistTaps="handled">
            <SectionCard title="Select Guest" icon="person-add-outline">
              <View style={styles.selectList}>
                {assignableGuests.length === 0 && (
                  <Text style={styles.emptySelectText}>No assignable guests found</Text>
                )}
                {assignableGuests.map((g: any) => (
                  <TouchableOpacity
                    key={g.guest_id}
                    onPress={() => setSelectedGuestId(g.guest_id)}
                    style={[styles.selectItem, selectedGuestId === g.guest_id && styles.selectItemActive]}
                  >
                    <View style={styles.selectItemLeft}>
                      <View style={[styles.selectAvatar, selectedGuestId === g.guest_id && { backgroundColor: colors.primary }]}>
                        <Text style={[styles.selectAvatarText, selectedGuestId === g.guest_id && { color: '#fff' }]}>
                          {(g.guest_name || '?').charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View>
                        <Text style={[styles.selectName, selectedGuestId === g.guest_id && { color: colors.primary, fontWeight: '700' }]}>{g.guest_name}</Text>
                        <Text style={styles.selectSub}>{g.guest_mobile}</Text>
                      </View>
                    </View>
                    {selectedGuestId === g.guest_id && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                  </TouchableOpacity>
                ))}
              </View>
            </SectionCard>

            <SectionCard title="Stay Dates" icon="calendar-outline">
              <View style={styles.formRow}>
                <Input label="Check-in" placeholder="YYYY-MM-DD" value={checkInDate} onChangeText={setCheckInDate} containerStyle={{ flex: 1 }} />
                <Input label="Check-out" placeholder="YYYY-MM-DD" value={checkOutDate} onChangeText={setCheckOutDate} containerStyle={{ flex: 1 }} />
              </View>
            </SectionCard>
            <View style={{ height: 60 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Assign Housekeeping ── */}
      <Modal
        visible={showAssignBoy}
        onClose={() => setShowAssignBoy(false)}
        title="Assign Housekeeping"
        footer={
          <View style={{ flexDirection: 'row', gap: spacing.md, width: '100%' }}>
            <Button title="Cancel" variant="outline" style={{ flex: 1 }} onPress={() => setShowAssignBoy(false)} />
            <Button title="Assign" style={{ flex: 1 }} onPress={handleAssignBoy} loading={loading} />
          </View>
        }
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView style={{ maxHeight: Dimensions.get('window').height * 0.6 }} keyboardShouldPersistTaps="handled">
            <SectionCard title="Select Room Boy" icon="people-outline">
              <View style={styles.selectList}>
                {boyOptions.map((b: any) => (
                  <TouchableOpacity
                    key={b.hk_id}
                    onPress={() => setSelectedBoyId(b.hk_id)}
                    style={[styles.selectItem, selectedBoyId === b.hk_id && styles.selectItemActive]}
                  >
                    <View style={styles.selectItemLeft}>
                      <View style={[styles.selectAvatar, selectedBoyId === b.hk_id && { backgroundColor: '#9333EA' }]}>
                        <Ionicons name="person-outline" size={16} color={selectedBoyId === b.hk_id ? '#fff' : '#9333EA'} />
                      </View>
                      <Text style={[styles.selectName, selectedBoyId === b.hk_id && { color: '#9333EA', fontWeight: '700' }]}>{b.hk_name}</Text>
                    </View>
                    {selectedBoyId === b.hk_id && <Ionicons name="checkmark-circle" size={20} color="#9333EA" />}
                  </TouchableOpacity>
                ))}
              </View>
              <Input label="Remarks" value={assignmentRemarks} onChangeText={setAssignmentRemarks} multiline numberOfLines={3} />
            </SectionCard>
            <View style={{ height: 60 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Add / Edit Boy ── */}
      <Modal
        visible={showAddBoy || showEditBoy}
        onClose={() => { setShowAddBoy(false); setShowEditBoy(false); }}
        title={showAddBoy ? 'Add Room Boy' : 'Edit Room Boy'}
        footer={
          <View style={{ flexDirection: 'row', gap: spacing.md, width: '100%' }}>
            <Button title="Cancel" variant="outline" style={{ flex: 1 }} onPress={() => { setShowAddBoy(false); setShowEditBoy(false); }} />
            <Button title="Save" style={{ flex: 1 }} onPress={handleSaveBoy} loading={loading} />
          </View>
        }
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView style={{ maxHeight: Dimensions.get('window').height * 0.45 }} keyboardShouldPersistTaps="handled">
            <SectionCard title="Personal Info" icon="person-outline">
              <Input label="Full Name *" value={boyForm.hk_name} onChangeText={v => setBoyForm({ ...boyForm, hk_name: v })} />
              {/* <Input label="Local Name" value={boyForm.hk_name_local} onChangeText={v => setBoyForm({ ...boyForm, hk_name_local: v })} /> */}
            </SectionCard>

            <SectionCard title="Contact" icon="call-outline">
              <View style={styles.formRow}>
                <Input label="Contact *" keyboardType="phone-pad" value={boyForm.hk_contact} onChangeText={v => setBoyForm({ ...boyForm, hk_contact: v })} containerStyle={{ flex: 1 }} />
                <Input label="Alt Contact" keyboardType="phone-pad" value={boyForm.hk_alternate_contact} onChangeText={v => setBoyForm({ ...boyForm, hk_alternate_contact: v })} containerStyle={{ flex: 1 }} />
              </View>
              <Input label="Address" value={boyForm.address} onChangeText={v => setBoyForm({ ...boyForm, address: v })} multiline />
            </SectionCard>
            <View style={{ height: 60 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function RoomCard({ room: r, onView, onEdit, onAssignGuest, onVacateGuest, onAssignBoy, onUnassignBoy }: any) {
  const isAvailable = r.status === 'Available';
  return (
    <Card style={styles.roomCard}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={[styles.roomIcon, { backgroundColor: isAvailable ? '#22C55E18' : '#EF444418' }]}>
          <Ionicons name="bed-outline" size={20} color={isAvailable ? '#22C55E' : '#EF4444'} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.roomNo}>{r.roomNo}</Text>
          <Text style={styles.roomName} numberOfLines={1}>{r.roomName || '—'}</Text>
        </View>
        <Badge label={r.status} variant={isAvailable ? 'success' : 'error'} />
      </View>

      {/* Info chips */}
      <View style={styles.infoGrid}>
        <InfoChip icon="person-outline" label={r.guest?.guestName || 'No guest'} muted={!r.guest} />
        <InfoChip icon="people-outline" label={r.housekeeping?.hkName || 'No HK'} muted={!r.housekeeping} />
        {r.buildingName ? <InfoChip icon="business-outline" label={r.buildingName} /> : null}
        {r.roomType ? <InfoChip icon="pricetag-outline" label={r.roomType} /> : null}
      </View>

      {/* Actions */}
      <View style={styles.cardActions}>
        <ActionButton icon="eye-outline" color="#3B82F6" label="View" onPress={onView} />
        <ActionButton icon="create-outline" color="#22C55E" label="Edit" onPress={onEdit} />
        {!r.guest
          ? <ActionButton icon="person-add-outline" color={colors.primary} label="Guest" onPress={onAssignGuest} />
          : <ActionButton icon="close-circle-outline" color="#F97316" label="Vacate" onPress={onVacateGuest} />
        }
        {!r.housekeeping
          ? <ActionButton icon="people-outline" color="#9333EA" label="HK" onPress={onAssignBoy} />
          : <ActionButton icon="person-remove-outline" color="#EF4444" label="Unassign" onPress={onUnassignBoy} />
        }
      </View>
    </Card>
  );
}

function BoyCard({ boy: b, onEdit, onDelete }: any) {
  return (
    <Card style={styles.roomCard}>
      <View style={styles.cardHeader}>
        <View style={[styles.roomIcon, { backgroundColor: '#9333EA18' }]}>
          <Ionicons name="person-outline" size={20} color="#9333EA" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.roomNo}>{b.hk_name}</Text>
          <Text style={styles.roomName} numberOfLines={1}>{b.hk_name_local_language || '—'}</Text>
        </View>
      </View>

      <View style={styles.infoGrid}>
        <InfoChip icon="call-outline" label={b.hk_contact || '—'} />
        {b.hk_alternate_contact ? <InfoChip icon="call-outline" label={b.hk_alternate_contact} /> : null}
        {b.address ? <InfoChip icon="location-outline" label={b.address} /> : null}
      </View>

      <View style={styles.cardActions}>
        <ActionButton icon="create-outline" color="#22C55E" label="Edit" onPress={onEdit} />
        <ActionButton icon="trash-outline" color="#EF4444" label="Remove" onPress={onDelete} />
      </View>
    </Card>
  );
}

function InfoChip({ icon, label, muted }: { icon: any; label: string; muted?: boolean }) {
  return (
    <View style={[styles.infoChip, muted && { opacity: 0.5 }]}>
      <Ionicons name={icon} size={12} color={colors.muted} style={{ marginRight: 4 }} />
      <Text style={styles.infoChipText} numberOfLines={1}>{label}</Text>
    </View>
  );
}

function ActionButton({ icon, color, label, onPress }: { icon: any; color: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.actionBtn, { backgroundColor: color + '15' }]} onPress={onPress}>
      <Ionicons name={icon} size={15} color={color} />
      <Text style={[styles.actionBtnLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <Card style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconWrap}>
          <Ionicons name={icon} size={15} color={colors.primary} />
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
      <Text style={[styles.detailValue, highlight && { color: colors.primary, fontWeight: '700' }]}>{value || '—'}</Text>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6FA' },
  listContent: { padding: spacing.lg, paddingBottom: 120 },

  // ── tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'transparent',
  },
  tabItemActive: {
    backgroundColor: colors.primary + '12',
  },
  tabText: { fontSize: 13, fontWeight: '600', color: colors.muted },
  tabTextActive: { color: colors.primary },

  // ── toolbar
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1,
    borderColor: colors.border, paddingLeft: spacing.sm, height: 44,
  },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12,
  },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // ── stat chips
  statsRow: { marginBottom: spacing.md },
  statChip: {
    alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 14, marginRight: 8, backgroundColor: '#fff',
    borderWidth: 1, borderColor: colors.border, minWidth: 80,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statIconWrap: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statValue: { fontSize: 17, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 9, color: colors.muted, fontWeight: '600', marginTop: 1 },

  // ── room card
  roomCard: {
    marginBottom: 12, padding: 14, borderRadius: 14,
    backgroundColor: '#fff', shadowColor: '#000',
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  roomIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  roomNo: { fontSize: 15, fontWeight: '700', color: colors.text },
  roomName: { fontSize: 12, color: colors.muted, marginTop: 1 },

  // ── info grid
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  infoChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  infoChipText: { fontSize: 11, color: colors.text, fontWeight: '500', maxWidth: 120 },

  // ── card actions
  cardActions: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10,
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8,
  },
  actionBtnLabel: { fontSize: 11, fontWeight: '600' },

  // ── pagination
  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  pageText: { fontSize: 13, fontWeight: '600', color: colors.text },

  // ── empty state
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 12 },
  emptySubText: { fontSize: 13, color: colors.muted, marginTop: 4 },

  // ── modal sections
  sectionCard: { marginBottom: spacing.md, padding: spacing.md, borderRadius: 14 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md },
  sectionIconWrap: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center',
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.primary },

  // ── detail rows
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
  },
  detailLabel: { fontSize: 12, color: colors.muted, fontWeight: '500' },
  detailValue: { fontSize: 12, fontWeight: '600', color: colors.text, flex: 1, textAlign: 'right', marginLeft: 10 },

  // ── form
  formRow: { flexDirection: 'row', gap: spacing.sm },

  // ── select list (assign modals)
  selectList: { maxHeight: 200, marginBottom: spacing.md },
  selectItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', borderRadius: 8,
  },
  selectItemActive: { backgroundColor: colors.primary + '08' },
  selectItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  selectAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.primary + '18', alignItems: 'center', justifyContent: 'center',
  },
  selectAvatarText: { fontSize: 14, fontWeight: '700', color: colors.primary },
  selectName: { fontSize: 13, color: colors.text },
  selectSub: { fontSize: 11, color: colors.muted, marginTop: 1 },
  emptySelectText: { textAlign: 'center', padding: 20, color: colors.muted, fontSize: 12 },

  // ── loading overlay
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center', alignItems: 'center', zIndex: 999,
  },
});
