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
  getNetworkTable, 
  createNetwork, 
  updateNetwork, 
  softDeleteNetwork 
} from '@/api/network.api';
import { NetworkProvider, CreateNetworkPayload } from '@/types/network';
import { colors, spacing, typography } from '@/theme';
import { 
  Card, 
  Button, 
  Input, 
  Badge, 
  Modal, 
  Table 
} from '@/components/ui';

export default function NetworkScreen() {
    const [providers, setProviders] = useState<NetworkProvider[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');

    // Modals
    const [showFormModal, setShowFormModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [selectedProv, setSelectedProv] = useState<NetworkProvider | null>(null);
    const [isEdit, setIsEdit] = useState(false);

    // Form State
    const [form, setForm] = useState({
        provider_name: '',
        provider_name_local_language: '',
        network_type: 'WiFi' as NetworkProvider['network_type'],
        username: '',
        password: '',
        address: '',
        is_active: true
    });

    useEffect(() => {
        loadProviders();
    }, [page, search]);

    const loadProviders = async () => {
        setLoading(true);
        try {
            const res = await getNetworkTable({
                page,
                limit: 10,
                search: search || undefined,
                sortBy: 'provider_name',
                sortOrder: 'asc'
            });
            setProviders(res.data || []);
        } catch (error) {
            console.error('Failed to load network providers', error);
            Alert.alert('Error', 'Could not load network data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleSave = async () => {
        if (!form.provider_name) {
            Alert.alert('Validation', 'Provider name is required');
            return;
        }
        setLoading(true);
        try {
            const payload: CreateNetworkPayload = {
                provider_name: form.provider_name,
                provider_name_local_language: form.provider_name_local_language || undefined,
                network_type: form.network_type,
                username: form.username || undefined,
                password: form.password || undefined,
                address: form.address || undefined,
            };

            if (isEdit && selectedProv) {
                await updateNetwork(selectedProv.provider_id, {
                    ...payload,
                    is_active: form.is_active
                });
                Alert.alert('Success', 'Network provider updated');
            } else {
                await createNetwork(payload);
                Alert.alert('Success', 'Network provider added');
            }
            setShowFormModal(false);
            loadProviders();
        } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to save');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (p: NetworkProvider) => {
        Alert.alert('Delete', `Delete provider ${p.provider_name}?`, [
            { text: 'Cancel', style: 'cancel' },
            { 
                text: 'Delete', 
                style: 'destructive', 
                onPress: async () => {
                    try {
                        await softDeleteNetwork(p.provider_id);
                        loadProviders();
                    } catch (err) {
                        Alert.alert('Error', 'Delete failed');
                    }
                }
            }
        ]);
    };

    const openForm = (p?: NetworkProvider) => {
        if (p) {
            setIsEdit(true);
            setSelectedProv(p);
            setForm({
                provider_name: p.provider_name || '',
                provider_name_local_language: p.provider_name_local_language || '',
                network_type: p.network_type || 'WiFi',
                username: p.username || '',
                password: '',
                address: p.address || '',
                is_active: p.is_active
            });
        } else {
            setIsEdit(false);
            setForm({
                provider_name: '',
                provider_name_local_language: '',
                network_type: 'WiFi',
                username: '',
                password: '',
                address: '',
                is_active: true
            });
        }
        setShowFormModal(true);
    };

    const columns = [
        {
            key: 'provider',
            title: 'Provider',
            width: 140,
            render: (p: NetworkProvider) => (
                <View>
                    <Text style={styles.cellMainText}>{p.provider_name}</Text>
                    <Text style={styles.cellSubText}>{p.network_type}</Text>
                </View>
            ),
        },
        {
            key: 'status',
            title: 'Status',
            width: 100,
            render: (p: NetworkProvider) => (
                <Badge 
                    label={p.is_active ? 'ACTIVE' : 'INACTIVE'} 
                    variant={p.is_active ? 'success' : 'error'} 
                />
            ),
        },
        {
            key: 'actions',
            title: 'Actions',
            width: 100,
            render: (p: NetworkProvider) => (
                <View style={styles.actionRow}>
                    <TouchableOpacity onPress={() => { setSelectedProv(p); setShowViewModal(true); }} style={styles.actionIcon}>
                        <Ionicons name="eye-outline" size={20} color={colors.info} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => openForm(p)} style={styles.actionIcon}>
                        <Ionicons name="create-outline" size={20} color={colors.success} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(p)} style={styles.actionIcon}>
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
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadProviders(); }} />}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Network Management</Text>
                    <Text style={styles.subtitle}>Manage internet and connectivity logs</Text>
                </View>

                <View style={styles.actionBar}>
                    <View style={styles.searchBox}>
                        <Ionicons name="search-outline" size={20} color={colors.muted} style={styles.searchIcon} />
                        <Input 
                            placeholder="ISP or type..." 
                            value={search}
                            onChangeText={setSearch}
                            containerStyle={{ marginBottom: 0, flex: 1 }}
                            inputStyle={{ borderWidth: 0, height: 40, fontSize: 14 }}
                        />
                    </View>
                    <Button title="Add ISP" size="sm" onPress={() => openForm()} />
                </View>

                <Table 
                    columns={columns} 
                    data={providers} 
                    keyExtractor={(item) => item.provider_id}
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
                        disabled={providers.length < 10} 
                        onPress={() => setPage(page + 1)} 
                    />
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Form Modal */}
            <Modal
                visible={showFormModal}
                onClose={() => setShowFormModal(false)}
                title={isEdit ? 'Update Provider' : 'New Network Provider'}
                footer={
                    <View style={{ flexDirection: 'row', gap: spacing.md }}>
                        <Button title="Cancel" variant="outline" onPress={() => setShowFormModal(false)} />
                        <Button title="Save ISP" onPress={handleSave} loading={loading} />
                    </View>
                }
            >
                <ScrollView keyboardShouldPersistTaps="handled">
                    <Input 
                        label="Provider Name" 
                        value={form.provider_name} 
                        onChangeText={v => setForm({...form, provider_name: v})}
                    />
                    <Input 
                        label="Local Language Name" 
                        value={form.provider_name_local_language} 
                        onChangeText={v => setForm({...form, provider_name_local_language: v})}
                    />
                    
                    <Text style={styles.modalLabel}>Network Technology</Text>
                    <View style={styles.chipGrid}>
                        {['WiFi', 'Broadband', 'Hotspot', 'Leased-Line'].map(t => (
                            <TouchableOpacity 
                                key={t} 
                                style={[styles.techChip, form.network_type === t && styles.techChipActive]}
                                onPress={() => setForm({...form, network_type: t as any})}
                            >
                                <Text style={[styles.techChipText, form.network_type === t && styles.techChipTextActive]}>{t}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Input 
                        label="Username / SSID" 
                        value={form.username} 
                        onChangeText={v => setForm({...form, username: v})}
                    />
                    <Input 
                        label="Password / Key" 
                        secureTextEntry
                        value={form.password} 
                        onChangeText={v => setForm({...form, password: v})}
                        placeholder={isEdit ? 'Leave blank to keep current' : ''}
                    />
                    <Input 
                        label="Installation Address" 
                        multiline
                        numberOfLines={2}
                        value={form.address} 
                        onChangeText={v => setForm({...form, address: v})}
                    />

                    {isEdit && (
                        <TouchableOpacity 
                            style={styles.activeRow} 
                            onPress={() => setForm({...form, is_active: !form.is_active})}
                        >
                            <View style={[styles.checkbox, form.is_active && styles.checkboxActive]}>
                                {form.is_active && <Ionicons name="checkmark" size={14} color={colors.white} />}
                            </View>
                            <Text style={styles.activeLabel}>Provider is Active</Text>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </Modal>

            {/* View Modal */}
            <Modal
                visible={showViewModal}
                onClose={() => setShowViewModal(false)}
                title="ISP Connection Details"
                footer={<Button title="Close" variant="outline" onPress={() => setShowViewModal(false)} />}
            >
                {selectedProv && (
                    <View>
                        <DetailRow label="ISP Name" value={selectedProv.provider_name} />
                        <DetailRow label="Display Name" value={selectedProv.provider_name_local_language || '—'} />
                        <DetailRow label="Technology" value={selectedProv.network_type} />
                        <DetailRow label="Username/SSID" value={selectedProv.username || '—'} />
                        <DetailRow label="Location" value={selectedProv.address || '—'} />
                        <DetailRow label="Status" value={selectedProv.is_active ? 'Active' : 'Disconnected'} />
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
    pagination: { 
        flexDirection: 'row', 
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: spacing.xl,
        marginTop: spacing.md 
    },
    pageText: { ...typography.body, fontWeight: '600' },
    modalLabel: { ...typography.small, fontWeight: '700', color: colors.muted, marginBottom: spacing.sm },
    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
    techChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    techChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
    techChipText: { fontSize: 12, color: colors.text },
    techChipTextActive: { color: colors.primary, fontWeight: '600' },
    detailRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border 
    },
    detailLabel: { ...typography.small, color: colors.muted },
    detailValue: { ...typography.small, fontWeight: '600', color: colors.text, flex: 1, textAlign: 'right', marginLeft: 10 },
    activeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
    checkbox: { 
        width: 20, height: 20, 
        borderRadius: 4, borderWidth: 2, 
        borderColor: colors.border, alignItems: 'center', justifyContent: 'center' 
    },
    checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    activeLabel: { ...typography.body, fontWeight: '600' },
});
