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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getGuestFoodTable,
  getFoodDashboard,
  updateGuestFood,
} from '@/api/guestFood.api';
import { colors, spacing, typography } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { formatDate } from '@/utils/dateTime';
import Header from '@/components/Header';

// ─── helpers ──────────────────────────────────────────────────────────────────
const mealIcon: Record<string, string> = {
  Breakfast: 'sunny-outline',
  Lunch: 'restaurant-outline',
  'High Tea': 'cafe-outline',
  Dinner: 'moon-outline',
};
const mealColor: Record<string, string> = {
  Breakfast: '#F59E0B',
  Lunch: '#22C55E',
  'High Tea': '#3B82F6',
  Dinner: '#8B5CF6',
};
const stageColor: Record<string, string> = {
  PLANNED: '#F59E0B',
  ORDERED: '#3B82F6',
  DELIVERED: '#22C55E',
  SERVED: '#22C55E',
  CANCELLED: '#EF4444',
};
const stageVariant = (s: string): any => {
  if (s === 'DELIVERED' || s === 'SERVED') return 'success';
  if (s === 'CANCELLED') return 'error';
  return 'warning';
};
const stageIcon: Record<string, string> = {
  PLANNED: 'time-outline',
  ORDERED: 'cart-outline',
  DELIVERED: 'checkmark-circle-outline',
  SERVED: 'checkmark-done-outline',
  CANCELLED: 'close-circle-outline',
};

// ─── main component ───────────────────────────────────────────────────────────
export default function FoodServiceScreen() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [mealFilter, setMealFilter] = useState('All');

  // Modals
  const [showViewModal, setShowViewModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  useEffect(() => { loadFood(); }, [page, search, mealFilter]);
  useEffect(() => { loadDashboard(); }, []);

  const loadFood = async () => {
    setLoading(true);
    try {
      const res = await getGuestFoodTable({
        page, limit: 10,
        search: search || undefined,
        mealType: mealFilter !== 'All' ? mealFilter as any : undefined,
        sortBy: 'plan_date' as any, sortOrder: 'desc',
      });
      setRecords(res.data || []);
    } catch (error) {
      console.error('Failed to load food service', error);
      Alert.alert('Error', 'Could not load food data');
    } finally { setLoading(false); setRefreshing(false); }
  };

  const loadDashboard = async () => {
    try { const d = await getFoodDashboard(); setDashboard(d); }
    catch (err) { console.error('Failed to load food dashboard', err); }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true); loadFood(); loadDashboard();
  }, []);

  const updateStage = async (stage: string) => {
    if (!selectedRecord) return;
    setLoading(true);
    try {
      await updateGuestFood(selectedRecord.guest_food_id, { food_stage: stage as any });
      setShowStatusModal(false);
      loadFood(); loadDashboard();
    } catch { Alert.alert('Error', 'Failed to update food status'); }
    finally { setLoading(false); }
  };

  // ─── stat chips ──────────────────────────────────────────────────────────────
  const statChips = [
    { label: 'Breakfasts', icon: 'sunny-outline', color: '#F59E0B', value: dashboard?.breakfastCount || 0 },
    { label: 'Lunches', icon: 'restaurant-outline', color: '#22C55E', value: dashboard?.lunchCount || 0 },
    { label: 'High Teas', icon: 'cafe-outline', color: '#3B82F6', value: dashboard?.highTeaCount || 0 },
    { label: 'Dinners', icon: 'moon-outline', color: '#8B5CF6', value: dashboard?.dinnerCount || 0 },
  ];

  // ─── meal filter pills ──────────────────────────────────────────────────────
  const mealFilters = [
    { key: 'All', icon: 'grid-outline', color: colors.primary },
    { key: 'Breakfast', icon: 'sunny-outline', color: '#F59E0B' },
    { key: 'Lunch', icon: 'restaurant-outline', color: '#22C55E' },
    { key: 'High Tea', icon: 'cafe-outline', color: '#3B82F6' },
    { key: 'Dinner', icon: 'moon-outline', color: '#8B5CF6' },
  ];

  // ─── render ──────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <FlatList
        data={records}
        keyExtractor={(item) => item.guest_food_id?.toString()}
        renderItem={({ item: r }) => (
          <FoodCard
            record={r}
            onView={() => { setSelectedRecord(r); setShowViewModal(true); }}
            onUpdateStatus={() => { setSelectedRecord(r); setShowStatusModal(true); }}
          />
        )}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListHeaderComponent={
          <>
            <Header
              title="Food Service"
              subtitle="Coordinate meal planning and delivery"
              fallback="/(drawer)/food"
            />

            {/* ── Stat chips ── */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsRow}>
              {statChips.map((chip) => (
                <View key={chip.label} style={styles.statChip}>
                  <View style={[styles.statIconWrap, { backgroundColor: chip.color + '18' }]}>
                    <Ionicons name={chip.icon as any} size={16} color={chip.color} />
                  </View>
                  <Text style={[styles.statValue, { color: chip.color }]}>{chip.value}</Text>
                  <Text style={styles.statLabel}>{chip.label}</Text>
                </View>
              ))}
            </ScrollView>

            {/* ── Toolbar ── */}
            <View style={styles.toolbar}>
              <View style={styles.searchBox}>
                <Ionicons name="search-outline" size={16} color={colors.muted} style={{ marginRight: 6 }} />
                <Input
                  placeholder="Search guest name..."
                  value={search}
                  onChangeText={setSearch}
                  containerStyle={{ marginBottom: 0, flex: 1 }}
                  inputStyle={{ borderWidth: 0, height: 40, fontSize: 14, paddingHorizontal: 0 }}
                />
              </View>
            </View>

            {/* ── Meal filter pills ── */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mealFiltersRow}>
              {mealFilters.map((f) => {
                const active = mealFilter === f.key;
                return (
                  <TouchableOpacity
                    key={f.key}
                    onPress={() => setMealFilter(f.key)}
                    activeOpacity={0.8}
                    style={[styles.mealPill, active && { backgroundColor: f.color }]}
                  >
                    <Ionicons
                      name={f.icon as any}
                      size={14}
                      color={active ? '#fff' : f.color}
                      style={{ marginRight: 5 }}
                    />
                    <Text style={[styles.mealPillText, active && { color: '#fff' }]}>{f.key}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* ── Count meta ── */}
            <View style={styles.metaRow}>
              <Text style={styles.metaText}>
                {loading ? 'Loading...' : `${records.length} records`}
              </Text>
            </View>
          </>
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="restaurant-outline" size={48} color={colors.muted} />
              <Text style={styles.emptyText}>No meal records found</Text>
              <Text style={styles.emptySubText}>Try adjusting your filters</Text>
            </View>
          ) : null
        }
        ListFooterComponent={
          records.length > 0 ? (
            <View style={styles.pagination}>
              <Button title="← Prev" variant="outline" size="sm" disabled={page === 1} onPress={() => setPage(page - 1)} />
              <Text style={styles.pageText}>Page {page}</Text>
              <Button title="Next →" variant="outline" size="sm" disabled={records.length < 10} onPress={() => setPage(page + 1)} />
            </View>
          ) : null
        }
      />

      {loading && !refreshing && records.length === 0 && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {/* ══════════════════════ VIEW MODAL ══════════════════════ */}
      <Modal
        visible={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Meal Assignment"
        footer={<Button title="Close" variant="outline" onPress={() => setShowViewModal(false)} />}
      >
        {selectedRecord && (
          <ScrollView style={{ maxHeight: Dimensions.get('window').height * 0.65 }}>
            <SectionCard title="Guest Details" icon="person-outline">
              <DetailRow label="Guest" value={selectedRecord.guest_name} highlight />
              <DetailRow label="Room" value={selectedRecord.room_no} />
            </SectionCard>

            <SectionCard title="Meal Info" icon="restaurant-outline">
              <DetailRow label="Meal Type" value={selectedRecord.meal_type} />
              <DetailRow label="Plan Date" value={formatDate(selectedRecord.plan_date)} />
              <DetailRow label="Status" value={selectedRecord.food_stage} />
              <DetailRow label="Butler" value={selectedRecord.butler_name} />
            </SectionCard>

            {selectedRecord.remarks ? (
              <SectionCard title="Remarks" icon="chatbubble-outline">
                <Text style={styles.remarksText}>{selectedRecord.remarks}</Text>
              </SectionCard>
            ) : null}
          </ScrollView>
        )}
      </Modal>

      {/* ══════════════════════ STATUS MODAL ══════════════════════ */}
      <Modal
        visible={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Update Food Stage"
      >
        <View style={styles.statusGrid}>
          {['PLANNED', 'ORDERED', 'DELIVERED', 'CANCELLED'].map((st) => {
            const active = selectedRecord?.food_stage === st;
            const color = stageColor[st] || colors.muted;
            return (
              <TouchableOpacity
                key={st}
                style={[styles.stageOption, active && { borderColor: color, backgroundColor: color + '12' }]}
                onPress={() => updateStage(st)}
              >
                <View style={[styles.stageIconWrap, { backgroundColor: color + '18' }]}>
                  <Ionicons name={(stageIcon[st] || 'help-outline') as any} size={20} color={color} />
                </View>
                <Text style={[styles.stageLabel, active && { color, fontWeight: '700' }]}>{st}</Text>
                {active && <Ionicons name="checkmark-circle" size={18} color={color} style={{ marginLeft: 'auto' }} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </Modal>
    </View>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function FoodCard({ record: r, onView, onUpdateStatus }: { record: any; onView: () => void; onUpdateStatus: () => void }) {
  const meal = r.meal_type || 'Unknown';
  const color = mealColor[meal] || colors.muted;
  const icon = mealIcon[meal] || 'restaurant-outline';
  const stage = r.food_stage || 'PLANNED';

  return (
    <Card style={styles.foodCard}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={[styles.mealIconCircle, { backgroundColor: color + '18' }]}>
          <Ionicons name={icon as any} size={20} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.guestName} numberOfLines={1}>{r.guest_name}</Text>
          <Text style={styles.guestSub} numberOfLines={1}>
            {r.room_no ? `Room ${r.room_no}` : '—'}
            {r.butler_name ? ` · ${r.butler_name}` : ''}
          </Text>
        </View>
        <Badge label={meal} variant={meal === 'Breakfast' ? 'warning' : meal === 'Lunch' ? 'success' : 'info'} />
      </View>

      {/* Info chips */}
      <View style={styles.infoGrid}>
        <InfoChip icon="calendar-outline" label={formatDate(r.plan_date)} />
        <View style={[styles.stageChip, { backgroundColor: (stageColor[stage] || '#9CA3AF') + '18' }]}>
          <Ionicons name={(stageIcon[stage] || 'help-outline') as any} size={12} color={stageColor[stage] || '#9CA3AF'} style={{ marginRight: 3 }} />
          <Text style={[styles.stageChipText, { color: stageColor[stage] || '#9CA3AF' }]}>{stage}</Text>
        </View>
        {r.remarks ? <InfoChip icon="chatbubble-ellipses-outline" label={r.remarks} /> : null}
      </View>

      {/* Actions */}
      <View style={styles.cardActions}>
        <ActionButton icon="eye-outline" color="#3B82F6" label="View" onPress={onView} />
        <ActionButton icon="swap-horizontal-outline" color="#22C55E" label="Update Status" onPress={onUpdateStatus} />
      </View>
    </Card>
  );
}

function InfoChip({ icon, label }: { icon: any; label: string }) {
  return (
    <View style={styles.infoChip}>
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

  // ── toolbar
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md },
  searchBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: 12, borderWidth: 1,
    borderColor: colors.border, paddingLeft: spacing.sm, height: 44,
  },

  // ── stat chips
  statsRow: { marginBottom: spacing.md },
  statChip: {
    alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 14, marginRight: 8, backgroundColor: '#fff',
    borderWidth: 1, borderColor: colors.border, minWidth: 88,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  statIconWrap: { width: 32, height: 32, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: '800' },
  statLabel: { fontSize: 9, color: colors.muted, fontWeight: '600', marginTop: 1 },

  // ── meal filter pills
  mealFiltersRow: { marginBottom: spacing.md },
  mealPill: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, marginRight: 8,
    backgroundColor: '#fff', borderWidth: 1, borderColor: colors.border,
  },
  mealPillText: { fontSize: 12, fontWeight: '600', color: colors.text },

  // ── meta
  metaRow: { marginBottom: spacing.sm },
  metaText: { fontSize: 12, color: colors.muted, fontWeight: '500' },

  // ── food card
  foodCard: {
    marginBottom: 12, padding: 14, borderRadius: 14,
    backgroundColor: '#fff', shadowColor: '#000',
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  mealIconCircle: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  guestName: { fontSize: 15, fontWeight: '700', color: colors.text },
  guestSub: { fontSize: 12, color: colors.muted, marginTop: 1 },

  // ── info grid
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  infoChip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  infoChipText: { fontSize: 11, color: colors.text, fontWeight: '500', maxWidth: 140 },
  stageChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8,
  },
  stageChipText: { fontSize: 11, fontWeight: '700' },

  // ── card actions
  cardActions: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6,
    borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10,
  },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
  },
  actionBtnLabel: { fontSize: 12, fontWeight: '600' },

  // ── pagination
  pagination: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  pageText: { fontSize: 13, fontWeight: '600', color: colors.text },

  // ── empty state
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 12 },
  emptySubText: { fontSize: 13, color: colors.muted, marginTop: 4 },

  // ── loading overlay
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center', alignItems: 'center', zIndex: 999,
  },

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

  // ── remarks
  remarksText: { fontSize: 13, color: colors.text, fontStyle: 'italic', lineHeight: 20 },

  // ── status grid
  statusGrid: { gap: spacing.sm, paddingVertical: spacing.md },
  stageOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 12, borderWidth: 1.5,
    borderColor: colors.border, backgroundColor: '#fff',
  },
  stageIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  stageLabel: { fontSize: 14, fontWeight: '600', color: colors.text },
});
