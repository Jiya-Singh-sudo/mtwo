import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Alert, FlatList, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getInfoPackageGuests, sendInfoPackageWhatsapp } from '@/api/info-package.api';
import { colors, spacing } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  ActionButton, InfoChip, SearchBox, EmptyState, PageContainer,
} from '@/components/ui/Premium';
import { formatDate } from '@/utils/dateTime';
import Header from '@/components/Header';

export default function InfoPackageScreen() {
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  useEffect(() => { loadGuests(); }, [page, search]);

  const loadGuests = async () => {
    setLoading(true);
    try { const res = await getInfoPackageGuests({ page, limit: 10, search: search || undefined }); setGuests(Array.isArray(res?.data) ? res.data : []); }
    catch { Alert.alert('Error', 'Could not load guest list'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const handleSendWhatsApp = (g: any) => {
    Alert.alert('WhatsApp Delivery', `Send info package to ${g.guest_name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Send Now', onPress: async () => { try { await sendInfoPackageWhatsapp(g.guest_id); Alert.alert('Success', 'Info package sent'); } catch { Alert.alert('Error', 'Failed to send'); } } },
    ]);
  };

  return (
    <PageContainer>
      <FlatList
        data={guests}
        keyExtractor={(item) => item.guest_id}
        renderItem={({ item: g }) => (
          <Card style={s.card}>
            <View style={s.cardHeader}>
              <View style={s.cardIcon}>
                <Ionicons name="document-text-outline" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.cardTitle} numberOfLines={1}>{g.guest_name}</Text>
                <Text style={s.cardSub}>{g.designation_name || '—'}</Text>
              </View>
              <Badge label="Guest" variant="info" />
            </View>
            <View style={s.infoGrid}>
              <InfoChip icon="log-in-outline" label={`In: ${formatDate(g.arrival_date)}`} />
              <InfoChip icon="log-out-outline" label={`Out: ${formatDate(g.departure_date)}`} />
            </View>
            <View style={s.cardActions}>
              <ActionButton icon="logo-whatsapp" color="#25D366" label="WhatsApp" onPress={() => handleSendWhatsApp(g)} />
              <ActionButton icon="document-text-outline" color="#3B82F6" label="PDF" onPress={() => Alert.alert('PDF', 'Available on web dashboard.')} />
            </View>
          </Card>
        )}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}
        refreshing={refreshing}
        onRefresh={() => { setRefreshing(true); loadGuests(); }}
        ListHeaderComponent={
          <>
            <Header title="Info Package" subtitle="Automated arrival/departure kits" fallback="/(drawer)/info-package" />
            <View style={s.toolbar}>
              <SearchBox>
                <Input placeholder="Guest name or designation..." value={search} onChangeText={setSearch}
                  containerStyle={{ marginBottom: 0, flex: 1 }} inputStyle={{ borderWidth: 0, height: 40, fontSize: 14, paddingHorizontal: 0 }} />
              </SearchBox>
            </View>
          </>
        }
        ListEmptyComponent={!loading ? <EmptyState icon="document-text-outline" title="No guests found" /> : null}
        ListFooterComponent={guests.length > 0 ? (
          <View style={s.pagination}>
            <Button title="← Prev" variant="outline" size="sm" disabled={page === 1} onPress={() => setPage(page - 1)} />
            <Text style={s.pageText}>Page {page}</Text>
            <Button title="Next →" variant="outline" size="sm" disabled={guests.length < 10} onPress={() => setPage(page + 1)} />
          </View>
        ) : null}
      />
    </PageContainer>
  );
}

const s = StyleSheet.create({
  card: { marginBottom: 12, padding: 14, borderRadius: 14, backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 8, elevation: 3 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  cardIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text },
  cardSub: { fontSize: 12, color: colors.muted, marginTop: 1 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  cardActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10 },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  pageText: { fontSize: 13, fontWeight: '600', color: colors.text },
});
