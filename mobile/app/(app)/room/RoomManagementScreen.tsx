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
  updateFullRoom
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
import { Table } from '@/components/ui/Table';
import Header from '@/components/Header';

const { width } = Dimensions.get('window');

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

  // Room Form State
  const [roomForm, setRoomForm] = useState({
    room_no: '',
    room_name: '',
    residence_type: '',
    building_name: '',
    room_type: '',
    room_capacity: 1,
    room_category: '',
    status: 'Available',
  });

  // Assignment states
  const [selectedGuestId, setSelectedGuestId] = useState('');
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');
  const [selectedBoyId, setSelectedBoyId] = useState('');
  const [assignmentRemarks, setAssignmentRemarks] = useState('');

  // Boy Form State
  const [boyForm, setBoyForm] = useState({
    hk_name: '',
    hk_name_local: '',
    hk_contact: '',
    hk_alternate_contact: '',
    address: '',
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [guests, boys] = await Promise.all([
        getAssignableGuests(),
        getActiveHousekeeping({ page: 1, limit: 100 })
      ]);
      setAssignableGuests(guests || []);
      setBoyOptions(boys?.data || []);
    } catch (err) {
      console.error('Failed to load options', err);
    }
  };

  const loadRooms = async () => {
    setLoading(true);
    try {
      const res = await getRoomManagementOverview({
        page: roomPage,
        limit: 10,
        search: roomSearch || undefined,
        status: activeCard === 'AVAILABLE' ? 'Available' : 
                activeCard === 'OCCUPIED' ? 'Occupied' : undefined,
        sortBy: activeCard === 'WITH_GUEST' ? 'guest_name' : 
                activeCard === 'WITH_HOUSEKEEPING' ? 'hk_name' : 'room_no',
        sortOrder: 'asc'
      });
      setRooms(res.data || []);
      setRoomStats(res.stats || {});
    } catch (error) {
      console.error('Failed to load rooms', error);
      Alert.alert('Error', 'Could not load room data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadRoomBoys = async () => {
    setLoading(true);
    try {
      const res = await getActiveHousekeeping({
        page: boyPage,
        limit: 10,
        search: boySearch || undefined,
      });
      setRoomBoys(res.data || []);
    } catch (error) {
      console.error('Failed to load room boys', error);
      Alert.alert('Error', 'Could not load housekeeping data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    if (activeTab === 'rooms') loadRooms();
    else loadRoomBoys();
    loadInitialData();
  }, [activeTab]);

  // Handlers
  const handleSaveRoom = async () => {
    setLoading(true);
    try {
      if (selectedRoom) {
        const payload = {
          ...roomForm,
          guest_id: selectedRoom.guest?.guestId || null,
          hk_id: selectedRoom.housekeeping?.hkId || null,
        };
        await updateFullRoom(selectedRoom.roomId, payload as any);
        Alert.alert('Success', 'Room updated');
      } else {
        await createRoom(roomForm as any);
        Alert.alert('Success', 'Room created');
      }
      setShowAddRoom(false);
      setShowEditRoom(false);
      loadRooms();
    } catch (err) {
      Alert.alert('Error', 'Failed to save room');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBoy = async () => {
    setLoading(true);
    try {
      const payload = {
        hk_name: boyForm.hk_name,
        hk_name_local_language: boyForm.hk_name_local,
        hk_contact: boyForm.hk_contact,
        hk_alternate_contact: boyForm.hk_alternate_contact,
        address: boyForm.address,
      };
      if (selectedBoy) {
        await updateHousekeeping(selectedBoy.hk_id, payload);
        Alert.alert('Success', 'Member updated');
      } else {
        await createHousekeeping(payload);
        Alert.alert('Success', 'Member added');
      }
      setShowAddBoy(false);
      setShowEditBoy(false);
      loadRoomBoys();
      loadInitialData(); // Refresh boy options for assignments
    } catch (err) {
      Alert.alert('Error', 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBoy = async (id: string) => {
    try {
      await softDeleteHousekeeping(id);
      Alert.alert('Success', 'Member removed');
      loadRoomBoys();
      loadInitialData();
    } catch (err) {
      Alert.alert('Error', 'Deletion failed');
    }
  };

  const handleAssignGuest = async () => {
    if (!selectedGuestId || !selectedRoom) return;
    setLoading(true);
    try {
      await createGuestRoom({
        guest_id: selectedGuestId,
        room_id: selectedRoom.roomId,
        check_in_date: checkInDate || new Date().toISOString().split('T')[0],
        check_out_date: checkOutDate || undefined,
        action_type: 'Room-Allocated',
        action_description: 'Assigned from mobile',
      });
      Alert.alert('Success', 'Guest assigned');
      setShowAssignGuest(false);
      loadRooms();
      getAssignableGuests().then(setAssignableGuests);
    } catch (err) {
      Alert.alert('Error', 'Assignment failed');
    } finally {
      setLoading(false);
    }
  };

  const vacateGuest = async (guestRoomId: string) => {
    Alert.alert('Vacate Guest', 'Are you sure you want to release this room?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Vacate', style: 'destructive', onPress: async () => {
        try {
          await updateGuestRoom(guestRoomId, { is_active: false, action_type: 'Room-Released' });
          Alert.alert('Success', 'Guest vacated');
          loadRooms();
          getAssignableGuests().then(setAssignableGuests);
        } catch (err) {
          Alert.alert('Error', 'Failed to vacate');
        }
      }}
    ]);
  };

  const handleAssignBoy = async () => {
    if (!selectedBoyId || !selectedRoom) return;
    setLoading(true);
    try {
      await assignRoomBoyToRoom({
        room_id: selectedRoom.roomId,
        hk_id: selectedBoyId,
        remarks: assignmentRemarks,
      });
      Alert.alert('Success', 'Housekeeping assigned');
      setShowAssignBoy(false);
      loadRooms();
    } catch (err) {
      Alert.alert('Error', 'Assignment failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUnassignBoy = async (guestHkId: string) => {
    Alert.alert('Unassign', 'Remove housekeeping from this room?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Unassign', style: 'destructive', onPress: async () => {
        try {
          await unassignRoomBoy(guestHkId);
          Alert.alert('Success', 'Unassigned');
          loadRooms();
        } catch (err) {
          Alert.alert('Error', 'Failed to unassign');
        }
      }}
    ]);
  };

  useEffect(() => {
    if (activeTab === 'rooms') {
      loadRooms();
    } else {
      loadRoomBoys();
    }
  }, [activeTab, roomPage, boyPage, roomSearch, boySearch, activeCard]);

  const renderRoomCard = ({ item: r }: { item: any }) => (
    <Card style={styles.recordCard}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardTitle}>{r.roomNo}</Text>
          <Text style={styles.cardSubtitle}>{r.roomName}</Text>
        </View>
        <Badge
          label={r.status}
          variant={r.status === 'Available' ? 'success' : 'error'}
        />
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Guest:</Text>
          <Text style={styles.cardValue}>{r.guest?.guestName || '—'}</Text>
        </View>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Housekeeping:</Text>
          <Text style={styles.cardValue}>{r.housekeeping?.hkName || 'No HK Assigned'}</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => { setSelectedRoom(r); setShowViewRoom(true); }}>
          <Ionicons name="eye-outline" size={18} color={colors.info} />
          <Text style={[styles.actionBtnText, { color: colors.info }]}>View</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionBtn} onPress={() => { 
          setSelectedRoom(r); 
          setRoomForm({
            room_no: r.roomNo,
            room_name: r.roomName || '',
            residence_type: r.residenceType || '',
            building_name: r.buildingName || '',
            room_type: r.roomType || '',
            room_capacity: r.roomCapacity || 1,
            room_category: r.roomCategory || '',
            status: r.status,
          });
          setShowEditRoom(true); 
        }}>
          <Ionicons name="create-outline" size={18} color={colors.success} />
          <Text style={[styles.actionBtnText, { color: colors.success }]}>Edit</Text>
        </TouchableOpacity>

        {!r.guest ? (
          <TouchableOpacity style={styles.actionBtn} onPress={() => { setSelectedRoom(r); setShowAssignGuest(true); }}>
            <Ionicons name="person-add-outline" size={18} color={colors.primary} />
            <Text style={[styles.actionBtnText, { color: colors.primary }]}>Assign</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.actionBtn} onPress={() => vacateGuest(r.guest.guestRoomId)}>
            <Ionicons name="close-circle-outline" size={18} color={colors.warning} />
            <Text style={[styles.actionBtnText, { color: colors.warning }]}>Vacate</Text>
          </TouchableOpacity>
        )}

        {!r.housekeeping ? (
          <TouchableOpacity style={styles.actionBtn} onPress={() => { setSelectedRoom(r); setShowAssignBoy(true); }}>
            <Ionicons name="people-outline" size={18} color={colors.purple} />
            <Text style={[styles.actionBtnText, { color: colors.purple }]}>HK</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleUnassignBoy(r.housekeeping.guestHkId)}>
            <Ionicons name="person-remove-outline" size={18} color={colors.error} />
            <Text style={[styles.actionBtnText, { color: colors.error }]}>Unassign</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );

  const renderBoyCard = ({ item: b }: { item: any }) => (
    <Card style={styles.recordCard}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardTitle}>{b.hk_name}</Text>
          <Text style={styles.cardSubtitle}>{b.hk_name_local_language || '—'}</Text>
        </View>
        <Ionicons name="person-circle-outline" size={24} color={colors.primary} />
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Contact:</Text>
          <Text style={styles.cardValue}>{b.hk_contact}</Text>
        </View>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Alt Contact:</Text>
          <Text style={styles.cardValue}>{b.hk_alternate_contact || '—'}</Text>
        </View>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Address:</Text>
          <Text style={styles.cardValue} numberOfLines={1}>{b.address || '—'}</Text>
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => { 
          setSelectedBoy(b); 
          setBoyForm({
            hk_name: b.hk_name,
            hk_name_local: b.hk_name_local_language || '',
            hk_contact: b.hk_contact,
            hk_alternate_contact: b.hk_alternate_contact || '',
            address: b.address || '',
          });
          setShowEditBoy(true); 
        }}>
          <Ionicons name="create-outline" size={18} color={colors.success} />
          <Text style={[styles.actionBtnText, { color: colors.success }]}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDeleteBoy(b.hk_id)}>
          <Ionicons name="trash-outline" size={18} color={colors.error} />
          <Text style={[styles.actionBtnText, { color: colors.error }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Tab Switcher */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'rooms' && styles.activeTab]} 
          onPress={() => setActiveTab('rooms')}
        >
          <Text style={[styles.tabText, activeTab === 'rooms' && styles.activeTabText]}>Rooms</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'boys' && styles.activeTab]} 
          onPress={() => setActiveTab('boys')}
        >
          <Text style={[styles.tabText, activeTab === 'boys' && styles.activeTabText]}>Room Boys</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'rooms' ? (
        <FlatList
          data={rooms}
          keyExtractor={(item) => item.roomId}
          renderItem={renderRoomCard}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListHeaderComponent={
            <>
              <Header 
                title="Room Overview" 
                subtitle="Track room availability and occupancy"
                fallback="/(drawer)/room"
              />

              {/* Stats */}
              <View style={styles.statsGrid}>
                  <TouchableOpacity onPress={() => setActiveCard('ALL')} style={styles.statBoxWrapper}>
                    <Card style={[styles.statBox, activeCard === 'ALL' && styles.activeStatCard]}>
                        <Text style={[styles.statNum, { color: colors.primary }]}>{roomStats.total || 0}</Text>
                        <Text style={styles.statLabel}>Total</Text>
                    </Card>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setActiveCard('AVAILABLE')} style={styles.statBoxWrapper}>
                    <Card style={[styles.statBox, activeCard === 'AVAILABLE' && styles.activeStatCard]}>
                        <Text style={[styles.statNum, { color: colors.success }]}>{roomStats.available || 0}</Text>
                        <Text style={styles.statLabel}>Available</Text>
                    </Card>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setActiveCard('OCCUPIED')} style={styles.statBoxWrapper}>
                    <Card style={[styles.statBox, activeCard === 'OCCUPIED' && styles.activeStatCard]}>
                        <Text style={[styles.statNum, { color: colors.error }]}>{roomStats.occupied || 0}</Text>
                        <Text style={styles.statLabel}>Occupied</Text>
                    </Card>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setActiveCard('WITH_GUEST')} style={styles.statBoxWrapper}>
                    <Card style={[styles.statBox, activeCard === 'WITH_GUEST' && styles.activeStatCard]}>
                        <Text style={[styles.statNum, { color: colors.info }]}>{roomStats.withGuest || 0}</Text>
                        <Text style={styles.statLabel}>Guest</Text>
                    </Card>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setActiveCard('WITH_HOUSEKEEPING')} style={styles.statBoxWrapper}>
                    <Card style={[styles.statBox, activeCard === 'WITH_HOUSEKEEPING' && styles.activeStatCard]}>
                        <Text style={[styles.statNum, { color: colors.purple }]}>{roomStats.withHousekeeping || 0}</Text>
                        <Text style={styles.statLabel}>HK</Text>
                    </Card>
                  </TouchableOpacity>
              </View>

              {/* Filters */}
              <View style={styles.actionBar}>
                  <View style={styles.searchBox}>
                      <Ionicons name="search-outline" size={18} color={colors.muted} />
                      <Input 
                        placeholder="Room no..." 
                        value={roomSearch} 
                        onChangeText={setRoomSearch}
                        containerStyle={{ marginBottom: 0, flex: 1 }}
                        inputStyle={{ borderWidth: 0, height: 36, fontSize: 13 }}
                      />
                  </View>
                  <Button 
                    title="+ Add" 
                    size="sm" 
                    style={{ paddingVertical: 8 }} 
                    onPress={() => {
                      setSelectedRoom(null);
                      setRoomForm({
                        room_no: '',
                        room_name: '',
                        residence_type: '',
                        building_name: '',
                        room_type: '',
                        room_capacity: 1,
                        room_category: '',
                        status: 'Available',
                      });
                      setShowAddRoom(true);
                    }}
                  />
              </View>
            </>
          }
        />
      ) : (
        <FlatList
          data={roomBoys}
          keyExtractor={(item) => item.hk_id}
          renderItem={renderBoyCard}
          contentContainerStyle={styles.listContent}
          refreshing={refreshing}
          onRefresh={onRefresh}
          ListHeaderComponent={
            <>
              <Header 
                title="Housekeeping Team" 
                subtitle="Manage room boys and assignments"
                fallback="/(drawer)/room"
              />

              <View style={styles.actionBar}>
                  <View style={styles.searchBox}>
                      <Ionicons name="search-outline" size={18} color={colors.muted} />
                      <Input 
                        placeholder="Boy name..." 
                        value={boySearch} 
                        onChangeText={setBoySearch}
                        containerStyle={{ marginBottom: 0, flex: 1 }}
                        inputStyle={{ borderWidth: 0, height: 36, fontSize: 13 }}
                      />
                  </View>
                  <Button 
                    title="+ Team Member" 
                    variant="primary" 
                    size="sm" 
                    style={{ paddingVertical: 8 }} 
                    onPress={() => {
                      setSelectedBoy(null);
                      setBoyForm({
                        hk_name: '',
                        hk_name_local: '',
                        hk_contact: '',
                        hk_alternate_contact: '',
                        address: '',
                      });
                      setShowAddBoy(true);
                    }}
                  />
              </View>
            </>
          }
        />
      )}

      {loading && !refreshing && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {/* VIEW ROOM MODAL */}
      <Modal visible={showViewRoom} onClose={() => setShowViewRoom(false)} title="Room Details">
        {selectedRoom && (
          <ScrollView>
            <View style={styles.modalContent}>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>Room No:</Text><Text style={styles.detailValue}>{selectedRoom.roomNo}</Text></View>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>Residence:</Text><Text style={styles.detailValue}>{selectedRoom.roomName || '—'}</Text></View>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>Type:</Text><Text style={styles.detailValue}>{selectedRoom.roomType || '—'}</Text></View>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>Capacity:</Text><Text style={styles.detailValue}>{selectedRoom.roomCapacity || '—'}</Text></View>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>Building:</Text><Text style={styles.detailValue}>{selectedRoom.buildingName || '—'}</Text></View>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>Status:</Text><Badge label={selectedRoom.status} variant={selectedRoom.status === 'Available' ? 'success' : 'error'} /></View>
              
              <View style={styles.modalSection}><Text style={styles.modalSectionTitle}>Occupancy</Text></View>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>Guest:</Text><Text style={styles.detailValue}>{selectedRoom.guest?.guestName || 'None'}</Text></View>
              <View style={styles.detailRow}><Text style={styles.detailLabel}>Housekeeping:</Text><Text style={styles.detailValue}>{selectedRoom.housekeeping?.hkName || 'None'}</Text></View>
            </View>
          </ScrollView>
        )}
      </Modal>

      {/* ADD/EDIT ROOM MODAL */}
      <Modal visible={showAddRoom || showEditRoom} onClose={() => { setShowAddRoom(false); setShowEditRoom(false); }} title={showAddRoom ? "Add Room" : "Edit Room"}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
            <View style={styles.modalContent}>
              <Input label="Room No" value={roomForm.room_no} onChangeText={(v) => setRoomForm({...roomForm, room_no: v})} />
              <Input label="Residence Name" value={roomForm.room_name} onChangeText={(v) => setRoomForm({...roomForm, room_name: v})} />
              <Input label="Residence Type" value={roomForm.residence_type} onChangeText={(v) => setRoomForm({...roomForm, residence_type: v})} />
              <View style={styles.row}>
                <Input label="Building" value={roomForm.building_name} onChangeText={(v) => setRoomForm({...roomForm, building_name: v})} containerStyle={{flex:1, marginRight: 8}} />
                <Input label="Capacity" value={roomForm.room_capacity.toString()} keyboardType="numeric" onChangeText={(v) => setRoomForm({...roomForm, room_capacity: parseInt(v) || 0})} containerStyle={{flex:1}} />
              </View>
              <Input label="Room Type" value={roomForm.room_type} onChangeText={(v) => setRoomForm({...roomForm, room_type: v})} />
            </View>
          </ScrollView>
          <View style={styles.modalFooter}>
             <Button title="Save Room" onPress={handleSaveRoom} loading={loading} style={{ flex: 1 }} />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ASSIGN GUEST MODAL */}
      <Modal visible={showAssignGuest} onClose={() => setShowAssignGuest(false)} title="Assign Guest">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
            <View style={styles.modalContent}>
              <Text style={styles.label}>Select Guest</Text>
              <View style={styles.selectContainer}>
                {assignableGuests.map((g: any) => (
                  <TouchableOpacity key={g.guest_id} onPress={() => setSelectedGuestId(g.guest_id)} style={[styles.selectOption, selectedGuestId === g.guest_id && styles.selectedOption]}>
                    <Text style={[styles.selectOptionText, selectedGuestId === g.guest_id && styles.selectedOptionTextActive]}>{g.guest_name}</Text>
                    <Text style={styles.selectOptionSubText}>{g.guest_mobile}</Text>
                  </TouchableOpacity>
                ))}
                {assignableGuests.length === 0 && <Text style={styles.emptyText}>No assignable guests found</Text>}
              </View>
              <Input label="Check-in Date" placeholder="YYYY-MM-DD" value={checkInDate} onChangeText={setCheckInDate} />
              <Input label="Initial Check-out (Optional)" placeholder="YYYY-MM-DD" value={checkOutDate} onChangeText={setCheckOutDate} />
            </View>
          </ScrollView>
          <View style={styles.modalFooter}>
            <Button title="Assign Guest" onPress={handleAssignGuest} loading={loading} style={{ flex: 1 }} />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ASSIGN BOY MODAL */}
      <Modal visible={showAssignBoy} onClose={() => setShowAssignBoy(false)} title="Assign Housekeeping">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
            <View style={styles.modalContent}>
              <Text style={styles.label}>Select Room Boy</Text>
              <View style={styles.selectContainer}>
                {boyOptions.map((b: any) => (
                  <TouchableOpacity key={b.hk_id} onPress={() => setSelectedBoyId(b.hk_id)} style={[styles.selectOption, selectedBoyId === b.hk_id && styles.selectedOption]}>
                    <Text style={[styles.selectOptionText, selectedBoyId === b.hk_id && styles.selectedOptionTextActive]}>{b.hk_name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Input label="Remarks" value={assignmentRemarks} onChangeText={setAssignmentRemarks} multiline numberOfLines={3} style={{ height: 80 }} />
            </View>
          </ScrollView>
          <View style={styles.modalFooter}>
            <Button title="Assign Member" onPress={handleAssignBoy} loading={loading} style={{ flex: 1 }} />
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ADD/EDIT BOY MODAL */}
      <Modal visible={showAddBoy || showEditBoy} onClose={() => { setShowAddBoy(false); setShowEditBoy(false); }} title={showAddBoy ? "Add Team Member" : "Edit Team Member"}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={{ paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
            <View style={styles.modalContent}>
              <Input label="Full Name" value={boyForm.hk_name} onChangeText={(v) => setBoyForm({...boyForm, hk_name: v})} />
              <Input label="Local Name" value={boyForm.hk_name_local} onChangeText={(v) => setBoyForm({...boyForm, hk_name_local: v})} />
              <Input label="Contact Number" value={boyForm.hk_contact} keyboardType="phone-pad" onChangeText={(v) => setBoyForm({...boyForm, hk_contact: v})} />
              <Input label="Alternate Contact" value={boyForm.hk_alternate_contact} keyboardType="phone-pad" onChangeText={(v) => setBoyForm({...boyForm, hk_alternate_contact: v})} />
              <Input label="Address" value={boyForm.address} onChangeText={(v) => setBoyForm({...boyForm, address: v})} multiline numberOfLines={3} style={{ height: 60 }} />
            </View>
          </ScrollView>
          <View style={styles.modalFooter}>
            <Button title="Save Member" onPress={handleSaveBoy} loading={loading} style={{ flex: 1 }} />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabContainer: { 
    flexDirection: 'row', 
    backgroundColor: colors.primary, 
    padding: spacing.xs 
  },
  tab: { 
    flex: 1, 
    paddingVertical: spacing.md, 
    alignItems: 'center',
    borderRadius: 6 
  },
  activeTab: { backgroundColor: colors.accent },
  tabText: { color: colors.white, fontWeight: '600', fontSize: 14 },
  activeTabText: { color: colors.primary },
  listContent: { padding: spacing.lg, paddingBottom: 120 },
  recordCard: { marginBottom: spacing.md, padding: spacing.md, borderWidth: 1, borderColor: colors.border + '60' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.primary },
  cardSubtitle: { fontSize: 12, color: colors.muted },
  cardBody: { marginVertical: spacing.sm, gap: 4 },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { fontSize: 12, color: colors.muted },
  cardValue: { fontSize: 12, fontWeight: '600', color: colors.text },
  cardActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border + '40' },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8, backgroundColor: colors.background, borderRadius: 6, borderWidth: 1, borderColor: colors.border + '80' },
  actionBtnText: { fontSize: 10, fontWeight: '700' },
  statsGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap',
    marginBottom: spacing.xl,
    gap: spacing.sm
  },
  statBoxWrapper: { width: '31%' },
  statBox: { alignItems: 'center', padding: spacing.sm },
  statNum: { fontSize: 18, fontWeight: '700' },
  statLabel: { fontSize: 9, color: colors.muted, marginTop: 2 },
  activeStatCard: { borderColor: colors.primary, borderWidth: 1, backgroundColor: colors.primary + '05' },
  actionBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: spacing.md,
    gap: spacing.sm
  },
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
  modalContent: { padding: spacing.md },
  modalFooter: { padding: spacing.md, borderTopWidth: 1, borderTopColor: colors.border + '40', backgroundColor: colors.white },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.lightGray },
  detailLabel: { fontSize: 13, color: colors.muted, fontWeight: '500' },
  detailValue: { fontSize: 13, color: colors.text, fontWeight: '600' },
  modalSection: { marginTop: 20, marginBottom: 10, paddingBottom: 5, borderBottomWidth: 2, borderBottomColor: colors.primary + '20' },
  modalSectionTitle: { fontSize: 14, fontWeight: '700', color: colors.primary, textTransform: 'uppercase' },
  row: { flexDirection: 'row', gap: spacing.sm },
  label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 8 },
  selectContainer: { maxHeight: 200, borderWidth: 1, borderColor: colors.border, borderRadius: 8, marginBottom: 15, overflow: 'hidden' },
  selectOption: { padding: 12, borderBottomWidth: 1, borderBottomColor: colors.lightGray },
  selectedOption: { backgroundColor: colors.primary + '10' },
  selectOptionText: { fontSize: 14, color: colors.text },
  selectedOptionTextActive: { fontWeight: '700', color: colors.primary },
  selectOptionSubText: { fontSize: 11, color: colors.muted, marginTop: 2 },
  emptyText: { textAlign: 'center', padding: 20, color: colors.muted, fontSize: 12 },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
});
