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
  getGuestFoodTable, 
  getFoodDashboard, 
  updateGuestFood 
} from '@/api/guestFood.api';
import { colors, spacing, typography } from '@/theme';
import { 
  Card, 
  Button, 
  Input, 
  Badge, 
  Modal, 
  Table 
} from '@/components/ui';
import { formatDate } from '@/utils/dateTime';

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

    useEffect(() => {
        loadFood();
        loadDashboard();
    }, [page, search, mealFilter]);

    const loadFood = async () => {
        setLoading(true);
        try {
            const res = await getGuestFoodTable({
                page,
                limit: 10,
                search: search || undefined,
                mealType: mealFilter !== 'All' ? mealFilter as any : undefined,
                sortBy: 'plan_date' as any,
                sortOrder: 'desc'
            });
            setRecords(res.data || []);
        } catch (error) {
            console.error('Failed to load food service', error);
            Alert.alert('Error', 'Could not load food data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const loadDashboard = async () => {
        try {
            const d = await getFoodDashboard();
            setDashboard(d);
        } catch (err) {
            console.error('Failed to load food dashboard', err);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadFood();
        loadDashboard();
    }, []);

    const updateStage = async (stage: string) => {
        if (!selectedRecord) return;
        setLoading(true);
        try {
            await updateGuestFood(selectedRecord.guest_food_id, { food_stage: stage as any });
            setShowStatusModal(false);
            loadFood();
            loadDashboard();
        } catch (err) {
            Alert.alert('Error', 'Failed to update food status');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        {
            key: 'guest_name',
            title: 'Guest',
            width: 140,
            render: (r: any) => (
                <View>
                    <Text style={styles.cellMainText}>{r.guest_name}</Text>
                    <Text style={styles.cellSubText}>Room {r.room_no || '—'}</Text>
                </View>
            ),
        },
        {
            key: 'meal',
            title: 'Meal',
            width: 100,
            render: (r: any) => (
                <Badge 
                    label={r.meal_type} 
                    variant={r.meal_type === 'Breakfast' ? 'warning' : r.meal_type === 'Lunch' ? 'success' : 'info'} 
                />
            ),
        },
        {
            key: 'status',
            title: 'Status',
            width: 100,
            render: (r: any) => {
                const variant = r.food_stage === 'DELIVERED' || r.food_stage === 'SERVED' ? 'success' : 
                               r.food_stage === 'CANCELLED' ? 'error' : 'warning';
                return <Badge label={r.food_stage} variant={variant as any} />;
            },
        },
        {
            key: 'actions',
            title: 'Actions',
            width: 80,
            render: (r: any) => (
                <View style={styles.actionRow}>
                    <TouchableOpacity onPress={() => { setSelectedRecord(r); setShowViewModal(true); }} style={styles.actionIcon}>
                        <Ionicons name="eye-outline" size={20} color={colors.info} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setSelectedRecord(r); setShowStatusModal(true); }} style={styles.actionIcon}>
                        <Ionicons name="checkmark-circle-outline" size={20} color={colors.success} />
                    </TouchableOpacity>
                </View>
            ),
        },
    ];

    return (
        <View style={styles.container}>
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Food Service</Text>
                    <Text style={styles.subtitle}>Coordinate meal planning and delivery</Text>
                </View>

                {/* Dashboard Stats */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
                    <Card style={styles.statBox}>
                        <Text style={[styles.statNum, { color: colors.warning }]}>{dashboard?.breakfastCount || 0}</Text>
                        <Text style={styles.statLabel}>Breakfasts</Text>
                    </Card>
                    <Card style={styles.statBox}>
                        <Text style={[styles.statNum, { color: colors.success }]}>{dashboard?.lunchCount || 0}</Text>
                        <Text style={styles.statLabel}>Lunches</Text>
                    </Card>
                    <Card style={styles.statBox}>
                        <Text style={[styles.statNum, { color: colors.info }]}>{dashboard?.highTeaCount || 0}</Text>
                        <Text style={styles.statLabel}>High Teas</Text>
                    </Card>
                    <Card style={styles.statBox}>
                        <Text style={[styles.statNum, { color: colors.primary }]}>{dashboard?.dinnerCount || 0}</Text>
                        <Text style={styles.statLabel}>Dinners</Text>
                    </Card>
                </ScrollView>

                <View style={styles.actionBar}>
                    <View style={styles.searchBox}>
                        <Ionicons name="search-outline" size={20} color={colors.muted} style={styles.searchIcon} />
                        <Input 
                            placeholder="Guest name..." 
                            value={search}
                            onChangeText={setSearch}
                            containerStyle={{ marginBottom: 0, flex: 1 }}
                            inputStyle={{ borderWidth: 0, height: 40, fontSize: 14 }}
                        />
                    </View>
                </View>

                {/* Meal Filter Chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow}>
                    {['All', 'Breakfast', 'Lunch', 'High Tea', 'Dinner'].map(m => (
                        <TouchableOpacity 
                            key={m} 
                            style={[styles.filterChip, mealFilter === m && styles.filterChipActive]}
                            onPress={() => setMealFilter(m)}
                        >
                            <Text style={[styles.filterChipText, mealFilter === m && styles.filterChipTextActive]}>{m}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <Table 
                    columns={columns} 
                    data={records} 
                    keyExtractor={(item) => item.guest_food_id?.toString()}
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
                        disabled={records.length < 10} 
                        onPress={() => setPage(page + 1)} 
                    />
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* View Modal */}
            <Modal
                visible={showViewModal}
                onClose={() => setShowViewModal(false)}
                title="Meal Assignment"
                footer={<Button title="Close" variant="outline" onPress={() => setShowViewModal(false)} />}
            >
                {selectedRecord && (
                    <View>
                        <DetailRow label="Guest" value={selectedRecord.guest_name} />
                        <DetailRow label="Room" value={selectedRecord.room_no} />
                        <DetailRow label="Meal Type" value={selectedRecord.meal_type} />
                        <DetailRow label="Plan Date" value={formatDate(selectedRecord.plan_date)} />
                        <DetailRow label="Status" value={selectedRecord.food_stage} />
                        <DetailRow label="Butler" value={selectedRecord.butler_name} />
                        <View style={styles.remarksBox}>
                            <Text style={styles.remarksLabel}>Remarks:</Text>
                            <Text style={styles.remarksText}>{selectedRecord.remarks || 'No special instructions'}</Text>
                        </View>
                    </View>
                )}
            </Modal>

            {/* Status Modal */}
            <Modal
                visible={showStatusModal}
                onClose={() => setShowStatusModal(false)}
                title="Update Food Stage"
            >
                <View style={styles.statusGrid}>
                    {['PLANNED', 'ORDERED', 'DELIVERED', 'CANCELLED'].map(st => (
                        <TouchableOpacity 
                            key={st} 
                            style={[styles.statusOption, selectedRecord?.food_stage === st && styles.statusOptionActive]}
                            onPress={() => updateStage(st)}
                        >
                            <Text style={[styles.statusOptionText, selectedRecord?.food_stage === st && styles.statusOptionTextActive]}>
                                {st}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
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
    statsScroll: { flexDirection: 'row', marginBottom: spacing.lg },
    statBox: { 
        width: 100, 
        alignItems: 'center', 
        padding: spacing.md, 
        marginRight: spacing.sm 
    },
    statNum: { fontSize: 20, fontWeight: '700' },
    statLabel: { fontSize: 10, color: colors.muted, marginTop: 2, textAlign: 'center' },
    actionBar: { marginBottom: spacing.md },
    searchBox: { 
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
    filtersRow: { flexDirection: 'row', marginBottom: spacing.md },
    filterChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: 16,
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.border,
        marginRight: spacing.sm,
    },
    filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    filterChipText: { fontSize: 12, color: colors.text },
    filterChipTextActive: { color: colors.white, fontWeight: '600' },
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
    detailRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: colors.border 
    },
    detailLabel: { ...typography.small, color: colors.muted },
    detailValue: { ...typography.small, fontWeight: '600', color: colors.text },
    remarksBox: { marginTop: spacing.md, padding: spacing.sm, backgroundColor: colors.background, borderRadius: 8 },
    remarksLabel: { ...typography.small, fontWeight: '700', color: colors.muted, marginBottom: 4 },
    remarksText: { ...typography.body, fontStyle: 'italic' },
    statusGrid: { gap: spacing.sm, paddingVertical: spacing.md },
    statusOption: { 
        padding: spacing.md, 
        borderRadius: 8, 
        borderWidth: 1, 
        borderColor: colors.border,
        backgroundColor: colors.white
    },
    statusOptionActive: { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
    statusOptionText: { ...typography.body, textAlign: 'center', fontWeight: '600' },
    statusOptionTextActive: { color: colors.primary },
});
