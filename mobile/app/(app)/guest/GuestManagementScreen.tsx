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
} from '@/api/guest.api';
import { colors, spacing, typography } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { formatDate, formatTime } from '@/utils/dateTime';

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
      guest_email: '',
      designation: '',
      organization: '',
      department: '',
      purpose: '',
  });

  useEffect(() => {
    loadGuests();
  }, [page, status, search]);

  const loadGuests = async () => {
    setLoading(true);
    try {
      const res = await getActiveGuests({
        page,
        limit: 10,
        status: status !== 'All' ? status : undefined,
        search: search || undefined,
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
                guest_email: form.guest_email,
                organization: form.organization,
                department: form.department,
            },
            designation: {
                designation_name: form.designation,
            },
            inout: {
                purpose_of_visit: form.purpose,
            }
        };

        if (isEdit && selectedGuest) {
            await updateGuest(selectedGuest.guest_id, payload.guest);
            Alert.alert('Success', 'Guest profile updated');
        } else {
            await createGuest(payload);
            Alert.alert('Success', 'Guest registered successfully');
        }
        setShowFormModal(false);
        loadGuests();
    } catch (err) {
        Alert.alert('Error', 'Operation failed');
    } finally {
        setLoading(false);
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
              guest_name: g.guest_name,
              guest_name_local: g.guest_name_local_language || '',
              guest_mobile: g.guest_mobile || '',
              guest_email: g.guest_email || '',
              designation: g.designation_name || '',
              organization: g.organization || '',
              department: g.department || '',
              purpose: g.purpose_of_visit || '',
          });
      } else {
          setIsEdit(false);
          setForm({
              guest_name: '',
              guest_name_local: '',
              guest_mobile: '',
              guest_email: '',
              designation: '',
              organization: '',
              department: '',
              purpose: '',
          });
      }
      setShowFormModal(true);
  };

  const columns = [
    {
      key: 'guest_name',
      title: 'Guest',
      width: 150,
      render: (g: any) => (
        <View>
          <Text style={styles.cellMainText}>{g.guest_name}</Text>
          <Text style={styles.cellSubText}>{g.guest_name_local_language}</Text>
        </View>
      ),
    },
    {
      key: 'inout_status',
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
      width: 120,
      render: (g: any) => (
        <View style={styles.actionRow}>
          <TouchableOpacity onPress={() => { setSelectedGuest(g); setShowViewModal(true); }} style={styles.actionIcon}>
            <Ionicons name="eye-outline" size={20} color={colors.info} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openForm(g)} style={styles.actionIcon}>
            <Ionicons name="create-outline" size={20} color={colors.success} />
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
    { label: 'Inside', key: 'Inside', icon: 'home-outline', color: colors.success, bg: colors.successBg },
    { label: 'Upcoming', key: 'Scheduled', icon: 'time-outline', color: colors.warning, bg: colors.warningBg },
    { label: 'Exited', key: 'Exited', icon: 'exit-outline', color: colors.info, bg: colors.infoBg },
  ];

  return (
    <View style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Guest Management</Text>
          <Text style={styles.subtitle}>Administrative control for all visitor credentials</Text>
        </View>

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
            <View>
                <DetailRow label="Primary Name" value={selectedGuest.guest_name} />
                <DetailRow label="Local Language" value={selectedGuest.guest_name_local_language} />
                <DetailRow label="Mobile" value={selectedGuest.guest_mobile} />
                <DetailRow label="Email" value={selectedGuest.guest_email} />
                <View style={styles.divider} />
                <DetailRow label="Designation" value={selectedGuest.designation_name} />
                <DetailRow label="Department" value={selectedGuest.department} />
                <DetailRow label="Organization" value={selectedGuest.organization} />
                <View style={styles.divider} />
                <DetailRow label="Visit Status" value={selectedGuest.inout_status} />
                <DetailRow label="Entry Record" value={`${formatDate(selectedGuest.entry_date)} ${formatTime(selectedGuest.entry_time)}`} />
                <DetailRow label="Purpose" value={selectedGuest.purpose_of_visit} />
            </View>
        )}
      </Modal>

      {/* Form Modal */}
      <Modal
        visible={showFormModal}
        onClose={() => setShowFormModal(false)}
        title={isEdit ? 'Update Guest' : 'Register New Guest'}
        footer={
            <View style={{ flexDirection: 'row', gap: spacing.md, width: '100%' }}>
                <Button title="Cancel" variant="outline" style={{ flex: 1 }} onPress={() => setShowFormModal(false)} />
                <Button title="Confirm" style={{ flex: 1 }} onPress={handleSave} loading={loading} />
            </View>
        }
      >
        <ScrollView style={{ maxHeight: 500 }}>
            <Input 
                label="Full Name *" 
                value={form.guest_name} 
                onChangeText={v => setForm({...form, guest_name: v})}
            />
            <Input 
                label="Local Language Name" 
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
                    label="Work Email" 
                    keyboardType="email-address"
                    value={form.guest_email} 
                    onChangeText={v => setForm({...form, guest_email: v})}
                    containerStyle={{ flex: 1 }}
                />
            </View>
            <Input 
                label="Designation / Title" 
                value={form.designation} 
                onChangeText={v => setForm({...form, designation: v})}
            />
            <Input 
                label="Organization / Office" 
                value={form.organization} 
                onChangeText={v => setForm({...form, organization: v})}
            />
            <Input 
                label="Department" 
                value={form.department} 
                onChangeText={v => setForm({...form, department: v})}
            />
            <Input 
                label="Purpose of Visit" 
                multiline
                numberOfLines={2}
                value={form.purpose} 
                onChangeText={v => setForm({...form, purpose: v})}
            />
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
});
