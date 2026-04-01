import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getDriverDutiesByRange, updateDriverDuty, createDriverDuty } from '@/api/driverDuty.api';
import { colors, spacing } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SectionCard, SearchBox, EmptyState, PageContainer } from '@/components/ui/Premium';
import { formatDate } from '@/utils/dateTime';
import Header from '@/components/Header';

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

  useEffect(() => { loadDuties(); }, [weekStart]);

  const loadDuties = async () => {
    setLoading(true);
    try {
      const to = getDateForDay(weekStart, 7);
      const duties = await getDriverDutiesByRange(weekStart, to);
      const grouped: Record<string, any> = {};
      for (const d of duties) {
        if (!grouped[d.driver_id]) grouped[d.driver_id] = { driver_id: d.driver_id, driver_name: d.driver_name, duties: {} };
        if (d.duty_date) grouped[d.driver_id].duties[d.duty_date.slice(0, 10)] = d;
      }
      setRosters(Object.values(grouped));
    } catch { Alert.alert('Error', 'Could not load duty roster'); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const handleSave = async () => {
    if (!editForm) return;
    setSaving(true);
    try {
      if (editForm.duty_id) {
        await updateDriverDuty(editForm.duty_id, { duty_in_time: editForm.duty_in_time, duty_out_time: editForm.duty_out_time, is_week_off: editForm.is_week_off, shift: editForm.shift });
      } else {
        await createDriverDuty({ driver_id: editForm.driver_id, duty_date: editForm.duty_date, shift: editForm.shift, duty_in_time: editForm.duty_in_time, duty_out_time: editForm.duty_out_time, is_week_off: editForm.is_week_off ?? false, repeat_weekly: false });
      }
      setEditForm(null); loadDuties();
    } catch (err: any) { Alert.alert('Error', err?.response?.data?.message || 'Failed to save duty'); }
    finally { setSaving(false); }
  };

  const onRefresh = useCallback(() => { setRefreshing(true); loadDuties(); }, [weekStart]);
  const filtered = rosters.filter(r => r.driver_name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <PageContainer>
      {/* ── Week Navigation (toolbar-style, matches app system) ── */}
      <View style={st.weekNavBar}>
        <TouchableOpacity
          style={st.weekNavBtn}
          onPress={() => setWeekStart(p => shiftWeek(p, -7))}
          activeOpacity={0.7}
        >
          <View style={[st.navIconWrap, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="chevron-back" size={16} color={colors.primary} />
          </View>
          <Text style={st.navText}>Prev</Text>
        </TouchableOpacity>

        <View style={st.weekLabelContainer}>
          <View style={st.weekIconWrap}>
            <Ionicons name="calendar-outline" size={14} color={colors.primary} />
          </View>
          <Text style={st.weekLabel}>Week of {formatDate(weekStart)}</Text>
        </View>

        <TouchableOpacity
          style={st.weekNavBtn}
          onPress={() => setWeekStart(p => shiftWeek(p, 7))}
          activeOpacity={0.7}
        >
          <Text style={st.navText}>Next</Text>
          <View style={[st.navIconWrap, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Header title="Driver Duty Roster" subtitle="Manage driver shifts and weekly offs" fallback="/(drawer)/driver-duty" />

        {/* ── Search (same SearchBox as all pages) ── */}
        <View style={st.toolbar}>
          <SearchBox>
            <Input placeholder="Search driver..." value={search} onChangeText={setSearch}
              containerStyle={{ marginBottom: 0, flex: 1 }} inputStyle={{ borderWidth: 0, height: 40, fontSize: 14, paddingHorizontal: 0 }} />
          </SearchBox>
        </View>

        {loading && !refreshing ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : filtered.length === 0 ? (
          <EmptyState icon="people-outline" title="No drivers found" />
        ) : (
          filtered.map(row => (
            <Card key={row.driver_id} style={st.driverCard}>
              {/* ── Driver header (42×42 r12 avatar — same as Food/Guest/Room) ── */}
              <View style={st.driverHeader}>
                <View style={st.driverAvatar}>
                  <Ionicons name="person-outline" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={st.driverName}>{row.driver_name}</Text>
                  <Text style={st.driverSub}>
                    {Object.values(row.duties).filter((d: any) => d.is_week_off).length} offs this week
                  </Text>
                </View>
              </View>

              {/* ── Days row ── */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={st.daysRow}>
                {WEEK_DAYS.map((day, i) => {
                  const date = getDateForDay(weekStart, i);
                  const duty = row.duties[date];
                  const isToday = date === new Date().toISOString().slice(0, 10);
                  return (
                    <TouchableOpacity
                      key={day}
                      activeOpacity={0.7}
                      style={[st.dayCell, duty?.is_week_off && st.weekOffCell, isToday && st.todayCell]}
                      onPress={() => setEditForm(duty ?? { driver_id: row.driver_id, duty_date: date, shift: 'full-day', is_week_off: false })}
                    >
                      <Text style={[st.dayName, isToday && { color: colors.primary }]}>{day}</Text>
                      <Text style={[st.dayDate, isToday && { color: colors.primary }]}>{date.slice(8)}</Text>
                      {duty?.is_week_off ? (
                        <View style={st.offBadge}><Text style={st.offText}>OFF</Text></View>
                      ) : duty?.duty_in_time ? (
                        <Text style={st.timeText}>{duty.duty_in_time.slice(0, 5)}{'\n'}{duty.duty_out_time?.slice(0, 5) || '—'}</Text>
                      ) : (
                        <Text style={st.emptyCell}>—</Text>
                      )}
                      {/* Edit hint icon */}
                      <Ionicons name="create-outline" size={10} color={colors.border} style={{ marginTop: 2 }} />
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </Card>
          ))
        )}
      </ScrollView>

      {/* ── Edit Modal (SectionCard grouped — matches all pages) ── */}
      <Modal visible={!!editForm} onClose={() => setEditForm(null)} title="Edit Duty Assignment"
        footer={
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Button title="Cancel" variant="outline" onPress={() => setEditForm(null)} />
            <Button title="Save" onPress={handleSave} loading={saving} />
          </View>
        }
      >
        {editForm && (
          <ScrollView keyboardShouldPersistTaps="handled">
            <SectionCard title="Shift Category" icon="time-outline">
              <View style={st.shiftSelector}>
                {['full-day', 'morning', 'afternoon', 'night'].map(sh => {
                  const active = editForm.shift === sh;
                  const shiftColor: Record<string, string> = { 'full-day': colors.primary, morning: '#F59E0B', afternoon: '#22C55E', night: '#8B5CF6' };
                  const c = shiftColor[sh] || colors.primary;
                  const shiftIcon: Record<string, string> = { 'full-day': 'sunny-outline', morning: 'partly-sunny-outline', afternoon: 'cloud-outline', night: 'moon-outline' };
                  return (
                    <TouchableOpacity
                      key={sh}
                      onPress={() => setEditForm({ ...editForm, shift: sh })}
                      activeOpacity={0.7}
                      style={[st.shiftChip, active && { backgroundColor: c, borderColor: c }]}
                    >
                      <Ionicons name={(shiftIcon[sh] || 'time-outline') as any} size={14} color={active ? '#fff' : c} />
                      <Text style={[st.shiftChipText, active && { color: '#fff' }]}>
                        {sh.charAt(0).toUpperCase() + sh.slice(1).replace('-', ' ')}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </SectionCard>

            <SectionCard title="Day Off" icon="bed-outline">
              <TouchableOpacity style={st.weekOffRow}
                onPress={() => setEditForm({
                  ...editForm,
                  is_week_off: !editForm.is_week_off,
                  duty_in_time: !editForm.is_week_off ? null : editForm.duty_in_time,
                  duty_out_time: !editForm.is_week_off ? null : editForm.duty_out_time,
                })}
              >
                <View style={[st.checkbox, editForm.is_week_off && st.checkboxActive]}>
                  {editForm.is_week_off && <Ionicons name="checkmark" size={14} color="#fff" />}
                </View>
                <Text style={st.weekOffLabel}>Weekly Off Day</Text>
              </TouchableOpacity>
            </SectionCard>

            {!editForm.is_week_off && (
              <SectionCard title="Duty Times" icon="alarm-outline">
                <Input label="In Time (HH:MM)" value={editForm.duty_in_time || ''} onChangeText={v => setEditForm({ ...editForm, duty_in_time: v })} placeholder="09:00" />
                <Input label="Out Time (HH:MM)" value={editForm.duty_out_time || ''} onChangeText={v => setEditForm({ ...editForm, duty_out_time: v })} placeholder="18:00" />
              </SectionCard>
            )}
          </ScrollView>
        )}
      </Modal>
    </PageContainer>
  );
}

// ─── Styles (aligned with Guest / Room / Food / Transport / Report system) ───
const st = StyleSheet.create({
  // ── Week nav bar (toolbar-style with icon pill buttons)
  weekNavBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  weekNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  weekLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weekIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },

  // ── Toolbar (same as all pages)
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },

  // ── Driver card (radius 14, shadow — matches all cards)
  driverCard: {
    padding: 14,
    marginBottom: 12,
    borderRadius: 14,                    // ← was 16, now 14 like Food/Room/Guest
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  driverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  driverAvatar: {
    width: 42,                           // ← was 36, now 42 like Food/Guest/Room
    height: 42,
    borderRadius: 12,                    // ← was 10, now 12 like Food mealIconCircle
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  driverSub: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 1,
  },

  // ── Day cells
  daysRow: {
    flexDirection: 'row',
  },
  dayCell: {
    width: 58,
    padding: spacing.sm,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F5F6FA',
    marginRight: 6,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  weekOffCell: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  todayCell: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.primaryBg,
  },
  dayName: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.muted,
  },
  dayDate: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  offBadge: {
    backgroundColor: '#F59E0B',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  offText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
  },
  timeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#22C55E',
    textAlign: 'center',
  },
  emptyCell: {
    color: colors.border,
    fontSize: 16,
  },

  // ── Modal shift chips (borderRadius: 20 — matches all filter pills)
  shiftSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  shiftChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,                    // matches Food/Report/Transport pills
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
  },
  shiftChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },

  // ── Checkbox
  weekOffRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  weekOffLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
});
