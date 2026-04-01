import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, FlatList, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getActiveUsers, createUser, updateUser, softDeleteUser, getActiveRoles } from '@/api/authentication/users.api';
import { colors, spacing } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  ActionButton, InfoChip, SectionCard, DetailRow, SearchBox, AddButton, EmptyState, PageContainer,
} from '@/components/ui/Premium';
import Header from '@/components/Header';

interface User { id: string; username: string; fullName: string; role_id: string; primary_mobile?: string; alternate_mobile?: string; email?: string; address?: string; }
interface Role { role_id: string; role_name: string; }

const ROLE_COLORS: Record<string, string> = { Admin: '#EF4444', Manager: '#F59E0B', Staff: '#22C55E', Operator: '#3B82F6' };

export default function UserManagementScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [form, setForm] = useState({ username: '', fullName: '', role_id: '', primary_mobile: '', alternate_mobile: '', email: '', password: '', address: '' });

  useEffect(() => { loadUsers(); loadRoles(); }, [search]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await getActiveUsers({ page: 1, limit: 50, search: search || undefined, sortBy: 'username', sortOrder: 'asc' });
      const rows = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setUsers(rows.map((u: any) => ({ id: u.user_id, username: u.username, fullName: u.full_name ?? '', role_id: u.role_id, primary_mobile: u.primary_mobile ?? '', alternate_mobile: u.alternate_mobile ?? '', email: u.email ?? '', address: u.address ?? '' })));
    } catch { setUsers([]); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const loadRoles = async () => { try { setRoles(await getActiveRoles()); } catch {} };

  const handleSave = async () => {
    if (!form.username || !form.fullName || !form.role_id) { Alert.alert('Validation', 'Username, Name, Role required'); return; }
    setLoading(true);
    try {
      if (isEdit && selectedUser) {
        await updateUser(selectedUser.username, { username: form.username, full_name: form.fullName, role_id: form.role_id, email: form.email, user_mobile: form.primary_mobile ? Number(form.primary_mobile) : undefined, user_alternate_mobile: form.alternate_mobile ? Number(form.alternate_mobile) : undefined, address: form.address || undefined } as any);
      } else {
        await createUser({ username: form.username, full_name: form.fullName, role_id: form.role_id, password: form.password, email: form.email, user_mobile: form.primary_mobile ? Number(form.primary_mobile) : undefined, user_alternate_mobile: form.alternate_mobile ? Number(form.alternate_mobile) : undefined, address: form.address || undefined } as any);
      }
      setShowFormModal(false); loadUsers();
    } catch (err: any) { Alert.alert('Error', err?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  const handleDelete = (u: User) => {
    Alert.alert('Delete User', `Delete @${u.username}?`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => { try { await softDeleteUser(u.username); loadUsers(); } catch { Alert.alert('Error', 'Failed'); } } }]);
  };

  const openForm = (u?: User) => {
    if (u) { setIsEdit(true); setSelectedUser(u); setForm({ username: u.username, fullName: u.fullName, role_id: u.role_id, primary_mobile: u.primary_mobile ? String(u.primary_mobile) : '', alternate_mobile: u.alternate_mobile ? String(u.alternate_mobile) : '', email: u.email || '', password: '', address: u.address || '' }); }
    else { setIsEdit(false); setForm({ username: '', fullName: '', role_id: '', primary_mobile: '', alternate_mobile: '', email: '', password: '', address: '' }); }
    setShowFormModal(true);
  };

  const getRoleName = (rid: string) => roles.find(r => r.role_id === rid)?.role_name || 'Staff';
  const getRoleColor = (rid: string) => ROLE_COLORS[getRoleName(rid)] || colors.primary;

  return (
    <PageContainer>
      <FlatList
        data={users}
        keyExtractor={(item) => item.username}
        renderItem={({ item: u }) => {
          const roleName = getRoleName(u.role_id);
          const roleCol = getRoleColor(u.role_id);
          return (
            <Card style={s.card}>
              <View style={s.cardHeader}>
                <View style={[s.cardAvatar, { backgroundColor: roleCol + '18' }]}>
                  <Text style={[s.avatarText, { color: roleCol }]}>{u.fullName.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle} numberOfLines={1}>{u.fullName}</Text>
                  <Text style={s.cardSub}>@{u.username}</Text>
                </View>
                <Badge label={roleName} style={{ backgroundColor: roleCol + '20' }} textStyle={{ color: roleCol }} />
              </View>
              <View style={s.infoGrid}>
                {u.email ? <InfoChip icon="mail-outline" label={u.email} /> : null}
                {u.primary_mobile ? <InfoChip icon="call-outline" label={u.primary_mobile} /> : null}
              </View>
              <View style={s.cardActions}>
                <ActionButton icon="eye-outline" color="#3B82F6" label="View" onPress={() => { setSelectedUser(u); setShowViewModal(true); }} />
                <ActionButton icon="create-outline" color="#22C55E" label="Edit" onPress={() => openForm(u)} />
                <ActionButton icon="trash-outline" color="#EF4444" label="Delete" onPress={() => handleDelete(u)} />
              </View>
            </Card>
          );
        }}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}
        refreshing={refreshing}
        onRefresh={() => { setRefreshing(true); loadUsers(); }}
        ListHeaderComponent={
          <>
            <Header title="User Management" subtitle="Control access and roles" fallback="/(drawer)/user" />
            <View style={s.toolbar}>
              <SearchBox>
                <Input placeholder="Find user..." value={search} onChangeText={setSearch}
                  containerStyle={{ marginBottom: 0, flex: 1 }} inputStyle={{ borderWidth: 0, height: 40, fontSize: 14, paddingHorizontal: 0 }} />
              </SearchBox>
              <AddButton label="New User" onPress={() => openForm()} />
            </View>
          </>
        }
        ListEmptyComponent={!loading ? <EmptyState icon="people-outline" title="No users found" /> : null}
      />

      {/* ── Form Modal ── */}
      <Modal visible={showFormModal} onClose={() => setShowFormModal(false)} title={isEdit ? 'Update Profile' : 'Create Account'}
        footer={<View style={{ flexDirection: 'row', gap: spacing.md }}><Button title="Cancel" variant="outline" onPress={() => setShowFormModal(false)} /><Button title="Save" onPress={handleSave} loading={loading} /></View>}>
        <ScrollView keyboardShouldPersistTaps="handled">
          <SectionCard title="Account" icon="person-outline">
            <Input label="Username" value={form.username} onChangeText={v => setForm({ ...form, username: v })} editable={!isEdit} />
            <Input label="Full Name" value={form.fullName} onChangeText={v => setForm({ ...form, fullName: v })} />
            {!isEdit && <Input label="Password" secureTextEntry value={form.password} onChangeText={v => setForm({ ...form, password: v })} />}
          </SectionCard>
          <SectionCard title="Role" icon="shield-outline">
            <View style={s.roleGrid}>
              {roles.map(r => {
                const active = form.role_id === r.role_id; const rc = ROLE_COLORS[r.role_name] || colors.primary;
                return (
                  <TouchableOpacity key={r.role_id} onPress={() => setForm({ ...form, role_id: r.role_id })}
                    style={[s.roleChip, active && { backgroundColor: rc, borderColor: rc }]}>
                    <Ionicons name="shield-checkmark-outline" size={14} color={active ? '#fff' : rc} />
                    <Text style={[s.roleText, active && { color: '#fff' }]}>{r.role_name}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </SectionCard>
          <SectionCard title="Contact" icon="call-outline">
            <Input label="Email" keyboardType="email-address" value={form.email} onChangeText={v => setForm({ ...form, email: v })} />
            <Input label="Mobile" keyboardType="phone-pad" value={form.primary_mobile} onChangeText={v => setForm({ ...form, primary_mobile: v })} />
            <Input label="Address" multiline numberOfLines={2} value={form.address} onChangeText={v => setForm({ ...form, address: v })} />
          </SectionCard>
        </ScrollView>
      </Modal>

      {/* ── View Modal ── */}
      <Modal visible={showViewModal} onClose={() => setShowViewModal(false)} title="User Profile"
        footer={<Button title="Close" variant="outline" onPress={() => setShowViewModal(false)} />}>
        {selectedUser && (
          <SectionCard title="Profile" icon="person-outline">
            <DetailRow label="Full Name" value={selectedUser.fullName} highlight />
            <DetailRow label="Username" value={`@${selectedUser.username}`} />
            <DetailRow label="Role" value={getRoleName(selectedUser.role_id)} />
            <DetailRow label="Email" value={selectedUser.email || '—'} />
            <DetailRow label="Mobile" value={selectedUser.primary_mobile || '—'} />
            <DetailRow label="Address" value={selectedUser.address || '—'} />
          </SectionCard>
        )}
      </Modal>
    </PageContainer>
  );
}

const s = StyleSheet.create({
  card: { marginBottom: 12, padding: 14, borderRadius: 14, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  cardAvatar: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  cardSub: { fontSize: 12, color: colors.muted, marginTop: 1 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10 },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  roleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  roleChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff' },
  roleText: { fontSize: 12, fontWeight: '600', color: colors.text },
});
