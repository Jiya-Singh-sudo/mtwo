import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  StatChipRow, ActionButton, InfoChip, SectionCard, SearchBox, AddButton, EmptyState, PageContainer,
} from '@/components/ui/Premium';
import Header from '@/components/Header';

type RosterItem = { department: string; officer: string; duty: string; time: string; status: 'Active' | 'Pending'; approval: 'Approved' | 'Pending' };
type FilterType = 'ALL' | 'ACTIVE' | 'PENDING';

const DEPTS: Record<string, string[]> = {
  Housekeeping: ['Ramesh Kumar', 'Suresh Yadav'],
  Security: ['Vijay Singh', 'Anil Verma'],
  Kitchen: ['Sita Devi', 'Pooja Sharma'],
  'Front Desk': ['Amit Sharma', 'Neha Gupta'],
  Maintenance: ['Rohit Meena'],
};
const TIMES = ['00:00 - 08:00', '08:00 - 16:00', '16:00 - 00:00'];
const deptIcon: Record<string, string> = { Housekeeping: 'bed-outline', Security: 'shield-outline', Kitchen: 'restaurant-outline', 'Front Desk': 'desktop-outline', Maintenance: 'construct-outline' };
const deptColor: Record<string, string> = { Housekeeping: '#8B5CF6', Security: '#EF4444', Kitchen: '#F59E0B', 'Front Desk': '#3B82F6', Maintenance: '#22C55E' };

export default function DutyRosterScreen() {
  const [roster, setRoster] = useState<RosterItem[]>([
    { department: 'Housekeeping', officer: 'Ramesh Kumar', duty: 'Room Cleaning - Floor 1', time: '08:00 - 16:00', status: 'Active', approval: 'Approved' },
    { department: 'Security', officer: 'Vijay Singh', duty: 'Main Gate Security', time: '00:00 - 08:00', status: 'Active', approval: 'Approved' },
    { department: 'Kitchen', officer: 'Sita Devi', duty: 'Meal Preparation', time: '06:00 - 14:00', status: 'Active', approval: 'Approved' },
    { department: 'Front Desk', officer: 'Amit Sharma', duty: 'Guest Reception', time: '08:00 - 20:00', status: 'Pending', approval: 'Pending' },
  ]);
  const [filter, setFilter] = useState<FilterType>('ALL');
  const [search, setSearch] = useState('');
  const [showFormModal, setShowFormModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<RosterItem | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [form, setForm] = useState({ department: '', officer: '', time: '' });

  const filtered = roster
    .filter(r => { if (filter === 'ACTIVE') return r.status === 'Active'; if (filter === 'PENDING') return r.approval === 'Pending'; return true; })
    .filter(r => r.officer.toLowerCase().includes(search.toLowerCase()));

  const handleSave = () => {
    if (!form.department || !form.officer || !form.time) { Alert.alert('Validation', 'Please fill all fields'); return; }
    if (isEdit && selectedItem) {
      setRoster(roster.map(r => r === selectedItem ? { ...r, department: form.department, officer: form.officer, time: form.time, duty: `${form.department} Duty` } : r));
    } else {
      setRoster([...roster, { department: form.department, officer: form.officer, duty: `${form.department} Duty`, time: form.time, status: 'Pending', approval: 'Pending' }]);
    }
    setShowFormModal(false);
  };

  const handleDelete = (item: RosterItem) => {
    Alert.alert('Delete Duty', `Remove ${item.officer}?`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => setRoster(roster.filter(r => r !== item)) }]);
  };

  const filterChips = [
    { key: 'ALL', label: 'All', icon: 'grid-outline', color: colors.primary, value: roster.length },
    { key: 'ACTIVE', label: 'Active', icon: 'checkmark-circle-outline', color: '#22C55E', value: roster.filter(r => r.status === 'Active').length },
    { key: 'PENDING', label: 'Pending', icon: 'time-outline', color: '#F59E0B', value: roster.filter(r => r.approval === 'Pending').length },
  ];

  return (
    <PageContainer>
      <FlatList
        data={filtered}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item: r }) => {
          const color = deptColor[r.department] || colors.muted;
          const icon = deptIcon[r.department] || 'briefcase-outline';
          return (
            <Card style={s.card}>
              <View style={s.cardHeader}>
                <View style={[s.cardIcon, { backgroundColor: color + '18' }]}>
                  <Ionicons name={icon as any} size={20} color={color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle} numberOfLines={1}>{r.officer}</Text>
                  <Text style={s.cardSub}>{r.department} · {r.time}</Text>
                </View>
                <Badge label={r.status} variant={r.status === 'Active' ? 'success' : 'warning'} />
              </View>
              <View style={s.infoGrid}>
                <InfoChip icon="briefcase-outline" label={r.duty} />
                <InfoChip icon="time-outline" label={r.time} />
                <View style={[s.approvalChip, { backgroundColor: r.approval === 'Approved' ? '#22C55E18' : '#F59E0B18' }]}>
                  <Ionicons name={r.approval === 'Approved' ? 'checkmark-circle' : 'time-outline'} size={12} color={r.approval === 'Approved' ? '#22C55E' : '#F59E0B'} />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: r.approval === 'Approved' ? '#22C55E' : '#F59E0B', marginLeft: 3 }}>{r.approval}</Text>
                </View>
              </View>
              <View style={s.cardActions}>
                <ActionButton icon="create-outline" color="#22C55E" label="Edit" onPress={() => { setSelectedItem(r); setIsEdit(true); setForm({ department: r.department, officer: r.officer, time: r.time }); setShowFormModal(true); }} />
                <ActionButton icon="trash-outline" color="#EF4444" label="Delete" onPress={() => handleDelete(r)} />
              </View>
            </Card>
          );
        }}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}
        ListHeaderComponent={
          <>
            <Header title="Duty Roster" subtitle="Departmental shift planning and approvals" fallback="/(drawer)/duty" />
            <StatChipRow chips={filterChips} activeKey={filter} onSelect={(key) => setFilter(key as FilterType)} />
            <View style={s.toolbar}>
              <SearchBox>
                <Input placeholder="Find officer..." value={search} onChangeText={setSearch}
                  containerStyle={{ marginBottom: 0, flex: 1 }} inputStyle={{ borderWidth: 0, height: 40, fontSize: 14, paddingHorizontal: 0 }} />
              </SearchBox>
              <AddButton label="Add" onPress={() => { setIsEdit(false); setForm({ department: '', officer: '', time: '' }); setShowFormModal(true); }} />
            </View>
          </>
        }
        ListEmptyComponent={<EmptyState icon="briefcase-outline" title="No duties found" />}
      />

      {/* ── Form Modal ── */}
      <Modal visible={showFormModal} onClose={() => setShowFormModal(false)} title={isEdit ? 'Modify Assignment' : 'New Duty Assignment'}
        footer={<View style={{ flexDirection: 'row', gap: spacing.md }}><Button title="Cancel" variant="outline" onPress={() => setShowFormModal(false)} /><Button title="Assign" onPress={handleSave} /></View>}>
        <ScrollView>
          <SectionCard title="Department" icon="business-outline">
            <View style={s.chipGrid}>
              {Object.keys(DEPTS).map(d => {
                const active = form.department === d; const c = deptColor[d] || colors.muted;
                return (
                  <TouchableOpacity key={d} onPress={() => setForm({ ...form, department: d, officer: '' })}
                    style={[s.selectItem, active && { borderColor: c, backgroundColor: c + '10' }]}>
                    <Ionicons name={(deptIcon[d] || 'briefcase-outline') as any} size={14} color={active ? c : colors.muted} />
                    <Text style={[s.selectText, active && { color: c, fontWeight: '700' }]}>{d}</Text>
                    {active && <Ionicons name="checkmark-circle" size={14} color={c} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </SectionCard>

          {form.department ? (
            <SectionCard title="Officer" icon="person-outline">
              {DEPTS[form.department].map(o => {
                const active = form.officer === o;
                return (
                  <TouchableOpacity key={o} onPress={() => setForm({ ...form, officer: o })} style={[s.listItem, active && s.listItemActive]}>
                    <View style={[s.listAvatar, active && { backgroundColor: colors.primary }]}>
                      <Ionicons name="person-outline" size={14} color={active ? '#fff' : colors.primary} />
                    </View>
                    <Text style={[s.listName, active && { color: colors.primary, fontWeight: '700' }]}>{o}</Text>
                    {active && <Ionicons name="checkmark-circle" size={16} color={colors.primary} style={{ marginLeft: 'auto' }} />}
                  </TouchableOpacity>
                );
              })}
            </SectionCard>
          ) : null}

          <SectionCard title="Shift Time" icon="time-outline">
            <View style={s.chipGrid}>
              {TIMES.map(t => {
                const active = form.time === t;
                return (
                  <TouchableOpacity key={t} onPress={() => setForm({ ...form, time: t })} style={[s.timeChip, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                    <Ionicons name="time-outline" size={12} color={active ? '#fff' : colors.muted} />
                    <Text style={[s.timeChipText, active && { color: '#fff' }]}>{t}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
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
  approvalChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10 },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  selectItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: colors.border, marginBottom: 4 },
  selectText: { fontSize: 13, color: colors.text },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', borderRadius: 8 },
  listItemActive: { backgroundColor: colors.primary + '08' },
  listAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center' },
  listName: { fontSize: 13, color: colors.text },
  timeChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff' },
  timeChipText: { fontSize: 12, fontWeight: '600', color: colors.text },
});
