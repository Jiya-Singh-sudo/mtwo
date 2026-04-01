import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getNetworkTable, createNetwork, updateNetwork, softDeleteNetwork } from '@/api/network.api';
import { NetworkProvider, CreateNetworkPayload } from '@/types/network';
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

const NET_ICON: Record<string, string> = { WiFi: 'wifi-outline', Broadband: 'globe-outline', Hotspot: 'phone-portrait-outline', 'Leased-Line': 'git-network-outline' };
const NET_COLOR: Record<string, string> = { WiFi: '#3B82F6', Broadband: '#8B5CF6', Hotspot: '#F59E0B', 'Leased-Line': '#22C55E' };

export default function NetworkScreen() {
  const [providers, setProviders] = useState<NetworkProvider[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const [showFormModal, setShowFormModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedProv, setSelectedProv] = useState<NetworkProvider | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [form, setForm] = useState({ provider_name: '', provider_name_local_language: '', network_type: 'WiFi' as NetworkProvider['network_type'], username: '', password: '', address: '', is_active: true });

  useEffect(() => { loadProviders(); }, [page, search]);

  const loadProviders = async () => {
    setLoading(true);
    try { const res = await getNetworkTable({ page, limit: 10, search: search || undefined, sortBy: 'provider_name', sortOrder: 'asc' }); setProviders(res.data || []); }
    catch { Alert.alert('Error', 'Could not load network data'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const handleSave = async () => {
    if (!form.provider_name) { Alert.alert('Validation', 'Provider name required'); return; }
    setLoading(true);
    try {
      const payload: CreateNetworkPayload = { provider_name: form.provider_name, provider_name_local_language: form.provider_name_local_language || undefined, network_type: form.network_type, username: form.username || undefined, password: form.password || undefined, address: form.address || undefined };
      if (isEdit && selectedProv) { await updateNetwork(selectedProv.provider_id, { ...payload, is_active: form.is_active }); Alert.alert('Success', 'Provider updated'); }
      else { await createNetwork(payload); Alert.alert('Success', 'Provider added'); }
      setShowFormModal(false); loadProviders();
    } catch (err: any) { Alert.alert('Error', err?.message || 'Failed to save'); }
    finally { setLoading(false); }
  };

  const handleDelete = (p: NetworkProvider) => {
    Alert.alert('Delete', `Delete ${p.provider_name}?`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => { try { await softDeleteNetwork(p.provider_id); loadProviders(); } catch { Alert.alert('Error', 'Delete failed'); } } }]);
  };

  const openForm = (p?: NetworkProvider) => {
    if (p) { setIsEdit(true); setSelectedProv(p); setForm({ provider_name: p.provider_name || '', provider_name_local_language: p.provider_name_local_language || '', network_type: p.network_type || 'WiFi', username: p.username || '', password: '', address: p.address || '', is_active: p.is_active }); }
    else { setIsEdit(false); setForm({ provider_name: '', provider_name_local_language: '', network_type: 'WiFi', username: '', password: '', address: '', is_active: true }); }
    setShowFormModal(true);
  };

  return (
    <PageContainer>
      <FlatList
        data={providers}
        keyExtractor={(item) => item.provider_id}
        renderItem={({ item: p }) => {
          const ic = NET_ICON[p.network_type] || 'globe-outline';
          const c = NET_COLOR[p.network_type] || colors.primary;
          return (
            <Card style={s.card}>
              <View style={s.cardHeader}>
                <View style={[s.cardIcon, { backgroundColor: c + '18' }]}>
                  <Ionicons name={ic as any} size={20} color={c} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardTitle} numberOfLines={1}>{p.provider_name}</Text>
                  <Text style={s.cardSub}>{p.network_type}{p.username ? ` · ${p.username}` : ''}</Text>
                </View>
                <Badge label={p.is_active ? 'Active' : 'Inactive'} variant={p.is_active ? 'success' : 'error'} />
              </View>
              <View style={s.infoGrid}>
                <InfoChip icon={(ic as any)} label={p.network_type} />
                {p.address ? <InfoChip icon="location-outline" label={p.address} /> : null}
              </View>
              <View style={s.cardActions}>
                <ActionButton icon="eye-outline" color="#3B82F6" label="View" onPress={() => { setSelectedProv(p); setShowViewModal(true); }} />
                <ActionButton icon="create-outline" color="#22C55E" label="Edit" onPress={() => openForm(p)} />
                <ActionButton icon="trash-outline" color="#EF4444" label="Delete" onPress={() => handleDelete(p)} />
              </View>
            </Card>
          );
        }}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}
        refreshing={refreshing}
        onRefresh={() => { setRefreshing(true); loadProviders(); }}
        ListHeaderComponent={
          <>
            <Header title="Network Management" subtitle="Manage ISP and connectivity" fallback="/(drawer)/network" />
            <View style={s.toolbar}>
              <SearchBox>
                <Input placeholder="ISP or type..." value={search} onChangeText={setSearch}
                  containerStyle={{ marginBottom: 0, flex: 1 }} inputStyle={{ borderWidth: 0, height: 40, fontSize: 14, paddingHorizontal: 0 }} />
              </SearchBox>
              <AddButton label="Add ISP" onPress={() => openForm()} />
            </View>
          </>
        }
        ListEmptyComponent={!loading ? <EmptyState icon="wifi-outline" title="No networks found" /> : null}
        ListFooterComponent={providers.length > 0 ? (
          <View style={s.pagination}>
            <Button title="← Prev" variant="outline" size="sm" disabled={page === 1} onPress={() => setPage(page - 1)} />
            <Text style={s.pageText}>Page {page}</Text>
            <Button title="Next →" variant="outline" size="sm" disabled={providers.length < 10} onPress={() => setPage(page + 1)} />
          </View>
        ) : null}
      />

      {/* ── Form Modal ── */}
      <Modal visible={showFormModal} onClose={() => setShowFormModal(false)} title={isEdit ? 'Update Provider' : 'New Network Provider'}
        footer={<View style={{ flexDirection: 'row', gap: spacing.md }}><Button title="Cancel" variant="outline" onPress={() => setShowFormModal(false)} /><Button title="Save" onPress={handleSave} loading={loading} /></View>}>
        <ScrollView keyboardShouldPersistTaps="handled">
          <SectionCard title="Provider Info" icon="globe-outline">
            <Input label="Provider Name" value={form.provider_name} onChangeText={v => setForm({ ...form, provider_name: v })} />
            <Input label="Local Language Name" value={form.provider_name_local_language} onChangeText={v => setForm({ ...form, provider_name_local_language: v })} />
          </SectionCard>
          <SectionCard title="Network Type" icon="wifi-outline">
            <View style={s.chipGrid}>
              {(['WiFi', 'Broadband', 'Hotspot', 'Leased-Line'] as const).map(t => {
                const active = form.network_type === t; const tc = NET_COLOR[t] || colors.primary;
                return (
                  <TouchableOpacity key={t} onPress={() => setForm({ ...form, network_type: t as any })}
                    style={[s.techChip, active && { backgroundColor: tc, borderColor: tc }]}>
                    <Ionicons name={(NET_ICON[t] || 'globe-outline') as any} size={14} color={active ? '#fff' : tc} />
                    <Text style={[s.techChipText, active && { color: '#fff' }]}>{t}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </SectionCard>
          <SectionCard title="Credentials" icon="key-outline">
            <Input label="Username / SSID" value={form.username} onChangeText={v => setForm({ ...form, username: v })} />
            <Input label="Password / Key" secureTextEntry value={form.password} onChangeText={v => setForm({ ...form, password: v })} placeholder={isEdit ? 'Leave blank to keep' : ''} />
          </SectionCard>
          <SectionCard title="Location" icon="location-outline">
            <Input label="Address" multiline numberOfLines={2} value={form.address} onChangeText={v => setForm({ ...form, address: v })} />
          </SectionCard>
          {isEdit && (
            <SectionCard title="Status" icon="toggle-outline">
              <TouchableOpacity style={s.activeRow} onPress={() => setForm({ ...form, is_active: !form.is_active })}>
                <View style={[s.checkbox, form.is_active && s.checkboxActive]}>
                  {form.is_active && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={s.activeLabel}>Provider is Active</Text>
              </TouchableOpacity>
            </SectionCard>
          )}
        </ScrollView>
      </Modal>

      {/* ── View Modal ── */}
      <Modal visible={showViewModal} onClose={() => setShowViewModal(false)} title="ISP Details"
        footer={<Button title="Close" variant="outline" onPress={() => setShowViewModal(false)} />}>
        {selectedProv && (
          <SectionCard title="Connection Info" icon="wifi-outline">
            <DetailRow label="ISP Name" value={selectedProv.provider_name} highlight />
            <DetailRow label="Display Name" value={selectedProv.provider_name_local_language || '—'} />
            <DetailRow label="Technology" value={selectedProv.network_type} />
            <DetailRow label="Username" value={selectedProv.username || '—'} />
            <DetailRow label="Location" value={selectedProv.address || '—'} />
            <DetailRow label="Status" value={selectedProv.is_active ? 'Active' : 'Disconnected'} />
          </SectionCard>
        )}
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
  cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10 },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  pageText: { fontSize: 13, fontWeight: '600', color: colors.text },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  techChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: '#fff' },
  techChipText: { fontSize: 12, fontWeight: '600', color: colors.text },
  activeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  activeLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
});
