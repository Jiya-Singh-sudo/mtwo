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
  getRoomManagementOverview, 
  getAssignableGuests 
} from '@/api/roomManagement.api';
import { 
  getActiveHousekeeping,
  softDeleteHousekeeping
} from '@/api/housekeeping.api';
import { colors, spacing, typography } from '@/theme';
import { 
  Card, 
  Button, 
  Input, 
  Badge, 
  Modal, 
  Table 
} from '@/components/ui';

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
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    if (activeTab === 'rooms') {
        loadRooms();
    } else {
        loadRoomBoys();
    }
  }, [activeTab, roomPage, boyPage, roomSearch, boySearch, statusFilter]);

  const loadRooms = async () => {
    setLoading(true);
    try {
      const res = await getRoomManagementOverview({
        page: roomPage,
        limit: 10,
        search: roomSearch || undefined,
        status: statusFilter === 'Available' || statusFilter === 'Occupied' ? (statusFilter as any) : undefined,
        sortBy: 'room_no',
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
  }, [activeTab]);

  const roomColumns = [
    {
      key: 'roomNo',
      title: 'Room No',
      width: 80,
      render: (r: any) => <Text style={styles.cellMainText}>{r.roomNo}</Text>,
    },
    {
      key: 'status',
      title: 'Status',
      width: 100,
      render: (r: any) => (
        <Badge 
          label={r.status} 
          variant={r.status === 'Available' ? 'success' : 'error'} 
        />
      ),
    },
    {
      key: 'guest',
      title: 'Occupant',
      width: 150,
      render: (r: any) => (
        <View>
          <Text style={styles.cellMainText}>{r.guest?.guestName || '—'}</Text>
          <Text style={styles.cellSubText}>{r.housekeeping?.hkName ? `HK: ${r.housekeeping.hkName}` : 'No HK assigned'}</Text>
        </View>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      width: 100,
      render: (r: any) => (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionIcon}>
            <Ionicons name="eye-outline" size={18} color={colors.info} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon}>
            <Ionicons name="key-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>
      ),
    },
  ];

  const boyColumns = [
    {
      key: 'hk_name',
      title: 'Name',
      width: 150,
      render: (b: any) => (
        <View>
          <Text style={styles.cellMainText}>{b.hk_name}</Text>
          <Text style={styles.cellSubText}>{b.hk_contact}</Text>
        </View>
      ),
    },
    {
      key: 'actions',
      title: 'Actions',
      width: 100,
      render: (b: any) => (
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionIcon}>
            <Ionicons name="create-outline" size={18} color={colors.success} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon}>
            <Ionicons name="trash-outline" size={18} color={colors.error} />
          </TouchableOpacity>
        </View>
      ),
    },
  ];

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

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {activeTab === 'rooms' ? (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Room Overview</Text>
              <Text style={styles.subtitle}>Track room availability and occupancy</Text>
            </View>

            {/* Stats */}
            <View style={styles.statsGrid}>
                <Card style={styles.statBox}>
                    <Text style={[styles.statNum, { color: colors.primary }]}>{roomStats.total || 0}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                </Card>
                <Card style={styles.statBox}>
                    <Text style={[styles.statNum, { color: colors.success }]}>{roomStats.available || 0}</Text>
                    <Text style={styles.statLabel}>Available</Text>
                </Card>
                <Card style={styles.statBox}>
                    <Text style={[styles.statNum, { color: colors.error }]}>{roomStats.occupied || 0}</Text>
                    <Text style={styles.statLabel}>Occupied</Text>
                </Card>
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
                <Button title="+ Add" size="sm" style={{ paddingVertical: 8 }} />
            </View>

            <Table 
              columns={roomColumns} 
              data={rooms} 
              keyExtractor={(item) => item.roomId}
              containerStyle={styles.table}
            />
          </>
        ) : (
          <>
            <View style={styles.header}>
              <Text style={styles.title}>Housekeeping Team</Text>
              <Text style={styles.subtitle}>Manage room boys and assignments</Text>
            </View>

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
                <Button title="+ Team Member" variant="primary" size="sm" style={{ paddingVertical: 8 }} />
            </View>

            <Table 
              columns={boyColumns} 
              data={roomBoys} 
              keyExtractor={(item) => item.hk_id}
              containerStyle={styles.table}
            />
          </>
        )}
        
        <View style={{ height: 40 }} />
      </ScrollView>
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
  scrollContent: { padding: spacing.lg },
  header: { marginBottom: spacing.lg },
  title: { ...typography.h2, color: colors.primary },
  subtitle: { ...typography.small, color: colors.muted },
  statsGrid: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: spacing.xl,
    gap: spacing.sm
  },
  statBox: { flex: 1, alignItems: 'center', padding: spacing.md },
  statNum: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 10, color: colors.muted, marginTop: 2 },
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
  table: { marginBottom: spacing.md },
  cellMainText: { fontSize: 13, fontWeight: '600', color: colors.text },
  cellSubText: { fontSize: 11, color: colors.muted, marginTop: 2 },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  actionIcon: { padding: 4 },
});
