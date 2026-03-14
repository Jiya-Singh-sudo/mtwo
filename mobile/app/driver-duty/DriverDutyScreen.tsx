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
  getDriverDutiesByRange, 
  updateDriverDuty, 
  createDriverDuty 
} from '@/api/driverDuty.api';
import { colors, spacing, typography } from '@/theme';
import { 
  Card, 
  Button, 
  Input, 
  Modal 
} from '@/components/ui';
import { formatDate } from '@/utils/dateTime';

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

function getDateForDay(weekStart: string, dayIndex: number): string {
    const [y, m, d] = weekStart.split('-').map(Number);
    const base = new Date(Date.UTC(y, m - 1, d));
    base.setUTCDate(base.getUTCDate() + dayIndex);
    return `${base.getUTCFullYear()}-${String(base.getUTCMonth() + 1).padStart(2, '0')}-${String(base.getUTCDate()).padStart(2, '0')}`;
}

function shiftWeek(weekStart: string, days: number) {
    const [y, m, d] = weekStart.split('-').map(Number);
    const base = new Date(Date.UTC(y, m - 1, d));
    base.setUTCDate(base.getUTCDate() + days);
    return `${base.getUTCFullYear()}-${String(base.getUTCMonth() + 1).padStart(2, '0')}-${String(base.getUTCDate()).padStart(2, '0')}`;
}

export default function DriverDutyScreen() {
    const [rosters, setRosters] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [weekStart, setWeekStart] = useState(() => {
        const today = new Date();
        const day = today.getDay() === 0 ? 7 : today.getDay();
        today.setDate(today.getDate() - day + 1);
        return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    });

    const [editForm, setEditForm] = useState<any>(null);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadDuties();
    }, [weekStart]);

    const loadDuties = async () => {
        setLoading(true);
        try {
            const to = getDateForDay(weekStart, 7);
            const duties = await getDriverDutiesByRange(weekStart, to);
            
            const grouped: Record<string, any> = {};
            for (const d of duties) {
                if (!grouped[d.driver_id]) {
                    grouped[d.driver_id] = { driver_id: d.driver_id, driver_name: d.driver_name, duties: {} };
                }
                if (d.duty_date) {
                    grouped[d.driver_id].duties[d.duty_date.slice(0, 10)] = d;
                }
            }
            setRosters(Object.values(grouped));
        } catch (error) {
            console.error('Failed to load duties', error);
            Alert.alert('Error', 'Could not load duty roster');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleSave = async () => {
        if (!editForm) return;
        setSaving(true);
        try {
            if (editForm.duty_id) {
                await updateDriverDuty(editForm.duty_id, {
                    duty_in_time: editForm.duty_in_time,
                    duty_out_time: editForm.duty_out_time,
                    is_week_off: editForm.is_week_off,
                    shift: editForm.shift
                });
            } else {
                await createDriverDuty({
                    driver_id: editForm.driver_id,
                    duty_date: editForm.duty_date,
                    shift: editForm.shift,
                    duty_in_time: editForm.duty_in_time,
                    duty_out_time: editForm.duty_out_time,
                    is_week_off: editForm.is_week_off ?? false,
                    repeat_weekly: false
                });
            }
            setEditForm(null);
            loadDuties();
        } catch (err: any) {
            Alert.alert('Error', err?.response?.data?.message || 'Failed to save duty');
        } finally {
            setSaving(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadDuties();
    }, [weekStart]);

    const filtered = rosters.filter(r => r.driver_name?.toLowerCase().includes(search.toLowerCase()));

    return (
        <View style={styles.container}>
            <View style={styles.weekNavBar}>
                <TouchableOpacity onPress={() => setWeekStart(p => shiftWeek(p, -7))}>
                    <Text style={styles.navText}>Prev</Text>
                </TouchableOpacity>
                <View style={styles.weekLabelContainer}>
                    <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                    <Text style={styles.weekLabel}>Week of {formatDate(weekStart)}</Text>
                </View>
                <TouchableOpacity onPress={() => setWeekStart(p => shiftWeek(p, 7))}>
                    <Text style={styles.navText}>Next</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.searchBar}>
                <Input 
                    placeholder="Search driver by name..." 
                    value={search}
                    onChangeText={setSearch}
                    containerStyle={{ marginBottom: 0 }}
                />
            </View>

            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Driver Duty Roster</Text>
                    <Text style={styles.subtitle}>Manage driver shifts and weekly offs</Text>
                </View>

                {loading && !refreshing ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
                ) : filtered.length === 0 ? (
                    <Text style={styles.emptyText}>No drivers found</Text>
                ) : (
                    filtered.map(row => (
                        <Card key={row.driver_id} style={styles.driverCard}>
                            <Text style={styles.driverName}>{row.driver_name}</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.daysRow}>
                                {WEEK_DAYS.map((day, i) => {
                                    const date = getDateForDay(weekStart, i);
                                    const duty = row.duties[date];
                                    const isToday = date === new Date().toISOString().slice(0, 10);
                                    
                                    return (
                                        <TouchableOpacity 
                                            key={day} 
                                            style={[
                                                styles.dayCell, 
                                                duty?.is_week_off && styles.weekOffCell,
                                                isToday && styles.todayCell
                                            ]}
                                            onPress={() => setEditForm(duty ?? { 
                                                driver_id: row.driver_id, 
                                                duty_date: date, 
                                                shift: 'full-day', 
                                                is_week_off: false 
                                            })}
                                        >
                                            <Text style={styles.dayName}>{day}</Text>
                                            <Text style={styles.dayDate}>{date.slice(8)}</Text>
                                            {duty?.is_week_off ? (
                                                <Text style={styles.offText}>OFF</Text>
                                            ) : duty?.duty_in_time ? (
                                                <Text style={styles.timeText}>
                                                    {duty.duty_in_time.slice(0, 5)}{'\n'}{duty.duty_out_time?.slice(0, 5) || '—'}
                                                </Text>
                                            ) : (
                                                <Text style={styles.emptyCell}>—</Text>
                                            )}
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </Card>
                    ))
                )}
                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Edit Modal */}
            <Modal
                visible={!!editForm}
                onClose={() => setEditForm(null)}
                title="Edit Duty Assignment"
                footer={
                    <View style={{ flexDirection: 'row', gap: spacing.md }}>
                        <Button title="Cancel" variant="outline" onPress={() => setEditForm(null)} />
                        <Button title="Save Duty" onPress={handleSave} loading={saving} />
                    </View>
                }
            >
                {editForm && (
                    <View>
                        <Text style={styles.modalLabel}>Shift Category</Text>
                        <View style={styles.shiftSelector}>
                            {['full-day', 'morning', 'afternoon', 'night'].map(sh => (
                                <TouchableOpacity 
                                    key={sh} 
                                    style={[styles.shiftChip, editForm.shift === sh && styles.shiftChipActive]}
                                    onPress={() => setEditForm({ ...editForm, shift: sh })}
                                >
                                    <Text style={[styles.shiftChipText, editForm.shift === sh && styles.shiftChipTextActive]}>
                                        {sh.charAt(0).toUpperCase() + sh.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity 
                            style={styles.weekOffRow} 
                            onPress={() => setEditForm({ 
                                ...editForm, 
                                is_week_off: !editForm.is_week_off,
                                duty_in_time: !editForm.is_week_off ? null : editForm.duty_in_time,
                                duty_out_time: !editForm.is_week_off ? null : editForm.duty_out_time
                            })}
                        >
                            <View style={[styles.checkbox, editForm.is_week_off && styles.checkboxActive]}>
                                {editForm.is_week_off && <Ionicons name="checkmark" size={14} color={colors.white} />}
                            </View>
                            <Text style={styles.weekOffLabel}>Weekly Off Day</Text>
                        </TouchableOpacity>

                        {!editForm.is_week_off && (
                            <View style={styles.timeInputs}>
                                <Input 
                                    label="In Time (HH:MM)" 
                                    value={editForm.duty_in_time || ''} 
                                    onChangeText={v => setEditForm({...editForm, duty_in_time: v})}
                                    placeholder="09:00"
                                />
                                <Input 
                                    label="Out Time (HH:MM)" 
                                    value={editForm.duty_out_time || ''} 
                                    onChangeText={v => setEditForm({...editForm, duty_out_time: v})}
                                    placeholder="18:00"
                                />
                            </View>
                        )}
                    </View>
                )}
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    weekNavBar: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: spacing.md, 
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.border
    },
    navText: { color: colors.primary, fontWeight: '700' },
    weekLabelContainer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    weekLabel: { fontSize: 13, fontWeight: '600', color: colors.text },
    searchBar: { padding: spacing.md, paddingBottom: 0 },
    scrollContent: { padding: spacing.lg },
    header: { marginBottom: spacing.lg },
    title: { ...typography.h2, color: colors.primary },
    subtitle: { ...typography.small, color: colors.muted },
    driverCard: { padding: spacing.md, marginBottom: spacing.md },
    driverName: { ...typography.label, marginBottom: spacing.sm },
    daysRow: { flexDirection: 'row' },
    dayCell: { 
        width: 60, 
        padding: spacing.sm, 
        alignItems: 'center', 
        borderRadius: 8, 
        backgroundColor: colors.background,
        marginRight: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border
    },
    weekOffCell: { backgroundColor: colors.warningBg, borderColor: colors.warning },
    todayCell: { borderColor: colors.primary, borderWidth: 2 },
    dayName: { fontSize: 10, fontWeight: '700', color: colors.muted },
    dayDate: { fontSize: 11, fontWeight: '600', color: colors.text, marginBottom: 4 },
    offText: { fontSize: 10, fontWeight: '700', color: colors.warning },
    timeText: { fontSize: 9, fontWeight: '600', color: colors.success, textAlign: 'center' },
    emptyCell: { color: colors.border, fontSize: 16 },
    emptyText: { textAlign: 'center', marginTop: 40, color: colors.muted },
    
    // Modal Styles
    modalLabel: { ...typography.small, fontWeight: '700', color: colors.muted, marginBottom: spacing.sm },
    shiftSelector: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
    shiftChip: { 
        paddingHorizontal: spacing.md, 
        paddingVertical: spacing.xs, 
        borderRadius: 16, 
        borderWidth: 1, 
        borderColor: colors.border 
    },
    shiftChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    shiftChipText: { fontSize: 12, color: colors.text },
    shiftChipTextActive: { color: colors.white, fontWeight: '600' },
    weekOffRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
    checkbox: { 
        width: 20, height: 20, 
        borderRadius: 4, borderWidth: 2, 
        borderColor: colors.border, alignItems: 'center', justifyContent: 'center' 
    },
    checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    weekOffLabel: { ...typography.body, fontWeight: '600' },
    timeInputs: { gap: spacing.sm },
});
