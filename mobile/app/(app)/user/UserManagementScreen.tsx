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
  getActiveUsers, 
  createUser, 
  updateUser, 
  softDeleteUser, 
  getActiveRoles 
} from '@/api/authentication/users.api';
import { colors, spacing, typography } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';

interface User { 
    id: string; 
    username: string; 
    fullName: string; 
    role_id: string; 
    primary_mobile?: string; 
    alternate_mobile?: string; 
    email?: string; 
    address?: string; 
}

interface Role { 
    role_id: string; 
    role_name: string; 
}

export default function UserManagementScreen() {
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');

    // Modals
    const [showFormModal, setShowFormModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isEdit, setIsEdit] = useState(false);

    // Form State
    const [form, setForm] = useState({
        username: '',
        fullName: '',
        role_id: '',
        primary_mobile: '',
        alternate_mobile: '',
        email: '',
        password: '',
        address: ''
    });

    useEffect(() => {
        loadUsers();
        loadRoles();
    }, [search]);

    const loadUsers = async () => {
        setLoading(true);
        try {
            const res = await getActiveUsers({ 
                page: 1, 
                limit: 50, 
                search: search || undefined, 
                sortBy: 'username', 
                sortOrder: 'asc' 
            });
            const rows = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
            setUsers(rows.map((u: any) => ({
                id: u.user_id,
                username: u.username,
                fullName: u.full_name ?? '',
                role_id: u.role_id,
                primary_mobile: u.primary_mobile ?? '',
                alternate_mobile: u.alternate_mobile ?? '',
                email: u.email ?? '',
                address: u.address ?? ''
            })));
        } catch (error) {
            console.error('Failed to load users', error);
            setUsers([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const loadRoles = async () => {
        try {
            const data = await getActiveRoles();
            setRoles(data);
        } catch (err) {}
    };

    const handleSave = async () => {
        if (!form.username || !form.fullName || !form.role_id) {
            Alert.alert('Validation', 'Username, Full Name, and Role are required.');
            return;
        }

        setLoading(true);
        try {
            if (isEdit && selectedUser) {
                await updateUser(selectedUser.username, {
                    username: form.username,
                    full_name: form.fullName,
                    role_id: form.role_id,
                    email: form.email,
                    user_mobile: form.primary_mobile ? Number(form.primary_mobile) : undefined,
                    user_alternate_mobile: form.alternate_mobile ? Number(form.alternate_mobile) : undefined,
                    address: form.address || undefined
                } as any);
            } else {
                await createUser({
                    username: form.username,
                    full_name: form.fullName,
                    role_id: form.role_id,
                    password: form.password,
                    email: form.email,
                    user_mobile: form.primary_mobile ? Number(form.primary_mobile) : undefined,
                    user_alternate_mobile: form.alternate_mobile ? Number(form.alternate_mobile) : undefined,
                    address: form.address || undefined
                } as any);
            }
            setShowFormModal(false);
            loadUsers();
        } catch (err: any) {
            Alert.alert('Error', err?.message || 'Transaction failed');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (u: User) => {
        Alert.alert('Delete User', `Are you sure you want to delete @${u.username}?`, [
            { text: 'Cancel', style: 'cancel' },
            { 
                text: 'Delete', 
                style: 'destructive', 
                onPress: async () => {
                    try {
                        await softDeleteUser(u.username);
                        loadUsers();
                    } catch (err) {
                        Alert.alert('Error', 'Deactivation failed');
                    }
                }
            }
        ]);
    };

    const openForm = (u?: User) => {
        if (u) {
            setIsEdit(true);
            setSelectedUser(u);
            setForm({
                username: u.username,
                fullName: u.fullName,
                role_id: u.role_id,
                primary_mobile: u.primary_mobile ? String(u.primary_mobile) : '',
                alternate_mobile: u.alternate_mobile ? String(u.alternate_mobile) : '',
                email: u.email || '',
                password: '',
                address: u.address || ''
            });
        } else {
            setIsEdit(false);
            setForm({
                username: '',
                fullName: '',
                role_id: '',
                primary_mobile: '',
                alternate_mobile: '',
                email: '',
                password: '',
                address: ''
            });
        }
        setShowFormModal(true);
    };

    const columns = [
        {
            key: 'user',
            title: 'User',
            width: 150,
            render: (u: User) => (
                <View>
                    <Text style={styles.cellMainText}>{u.fullName}</Text>
                    <Text style={styles.cellSubText}>@{u.username}</Text>
                </View>
            ),
        },
        {
            key: 'role',
            title: 'Role',
            width: 100,
            render: (u: User) => (
                <Badge 
                    label={roles.find(r => r.role_id === u.role_id)?.role_name || 'Staff'} 
                    variant="info" 
                />
            ),
        },
        {
            key: 'actions',
            title: 'Actions',
            width: 100,
            render: (u: User) => (
                <View style={styles.actionRow}>
                    <TouchableOpacity onPress={() => { setSelectedUser(u); setShowViewModal(true); }} style={styles.actionIcon}>
                        <Ionicons name="eye-outline" size={20} color={colors.info} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openForm(u)} style={styles.actionIcon}>
                        <Ionicons name="create-outline" size={20} color={colors.success} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(u)} style={styles.actionIcon}>
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
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadUsers(); }} />}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>User Management</Text>
                    <Text style={styles.subtitle}>Control access and administrative roles</Text>
                </View>

                <View style={styles.actionBar}>
                    <View style={styles.searchBox}>
                        <Ionicons name="search-outline" size={20} color={colors.muted} style={styles.searchIcon} />
                        <Input 
                            placeholder="Find user..." 
                            value={search}
                            onChangeText={setSearch}
                            containerStyle={{ marginBottom: 0, flex: 1 }}
                            inputStyle={{ borderWidth: 0, height: 40, fontSize: 14 }}
                        />
                    </View>
                    <Button title="New User" size="sm" onPress={() => openForm()} />
                </View>

                <Table 
                    columns={columns} 
                    data={users} 
                    keyExtractor={(item) => item.username}
                    containerStyle={styles.table}
                />

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Form Modal */}
            <Modal
                visible={showFormModal}
                onClose={() => setShowFormModal(false)}
                title={isEdit ? 'Update Profile' : 'Create User Account'}
                footer={
                    <View style={{ flexDirection: 'row', gap: spacing.md }}>
                        <Button title="Cancel" variant="outline" onPress={() => setShowFormModal(false)} />
                        <Button title="Confirm" onPress={handleSave} loading={loading} />
                    </View>
                }
            >
                <ScrollView keyboardShouldPersistTaps="handled">
                    <Input 
                        label="Username (Login ID)" 
                        value={form.username} 
                        onChangeText={v => setForm({...form, username: v})}
                        editable={!isEdit}
                    />
                    <Input 
                        label="Full Display Name" 
                        value={form.fullName} 
                        onChangeText={v => setForm({...form, fullName: v})}
                    />
                    
                    <Text style={styles.modalLabel}>System Role</Text>
                    <View style={styles.chipGrid}>
                        {roles.map(r => (
                            <TouchableOpacity 
                                key={r.role_id} 
                                style={[styles.roleChip, form.role_id === r.role_id && styles.roleChipActive]}
                                onPress={() => setForm({...form, role_id: r.role_id})}
                            >
                                <Text style={[styles.roleChipText, form.role_id === r.role_id && styles.roleChipTextActive]}>
                                    {r.role_name}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Input 
                        label="Work Email" 
                        keyboardType="email-address"
                        value={form.email} 
                        onChangeText={v => setForm({...form, email: v})}
                    />
                    
                    {!isEdit && (
                        <Input 
                            label="Initial Password" 
                            secureTextEntry
                            value={form.password} 
                            onChangeText={v => setForm({...form, password: v})}
                        />
                    )}

                    <Input 
                        label="Mobile Number" 
                        keyboardType="phone-pad"
                        value={form.primary_mobile} 
                        onChangeText={v => setForm({...form, primary_mobile: v})}
                    />
                    <Input 
                        label="Official Address" 
                        multiline
                        numberOfLines={2}
                        value={form.address} 
                        onChangeText={v => setForm({...form, address: v})}
                    />
                </ScrollView>
            </Modal>

            {/* View Modal */}
            <Modal
                visible={showViewModal}
                onClose={() => setShowViewModal(false)}
                title="User Profile Details"
                footer={<Button title="Close" variant="outline" onPress={() => setShowViewModal(false)} />}
            >
                {selectedUser && (
                    <View>
                        <DetailRow label="Display Name" value={selectedUser.fullName} />
                        <DetailRow label="Username" value={`@${selectedUser.username}`} />
                        <DetailRow label="Role" value={roles.find(r => r.role_id === selectedUser.role_id)?.role_name || 'Staff'} />
                        <DetailRow label="Email" value={selectedUser.email || '—'} />
                        <DetailRow label="Mobile" value={selectedUser.primary_mobile || '—'} />
                        <DetailRow label="Address" value={selectedUser.address || '—'} />
                    </View>
                )}
            </Modal>
        </View>
    );
}

const DetailRow = ({ label, value }: { label: string, value: string }) => (
    <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
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
    table: { marginBottom: spacing.md },
    cellMainText: { fontSize: 13, fontWeight: '600', color: colors.text },
    cellSubText: { fontSize: 11, color: colors.muted, marginTop: 2 },
    actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    actionIcon: { padding: 4 },
    modalLabel: { ...typography.small, fontWeight: '700', color: colors.muted, marginBottom: spacing.sm },
    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
    roleChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.white
    },
    roleChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
    roleChipText: { fontSize: 12, color: colors.text },
    roleChipTextActive: { color: colors.primary, fontWeight: '600' },
    detailRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border 
    },
    detailLabel: { ...typography.small, color: colors.muted },
    detailValue: { ...typography.small, fontWeight: '600', color: colors.text, flex: 1, textAlign: 'right', marginLeft: 10 },
});
