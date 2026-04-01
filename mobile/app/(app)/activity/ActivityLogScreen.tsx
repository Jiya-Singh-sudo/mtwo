import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchActivityLogs } from '@/api/activityLog.api';
import { colors, spacing } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { SectionCard, DetailRow, EmptyState, PageContainer } from '@/components/ui/Premium';
import { formatDate, formatTime } from '@/utils/dateTime';
import { ActivityLog } from '@/types/activity-log';
import Header from '@/components/Header';

const MODULE_META: Record<string, { color: string; icon: string }> = {
  Guest: { color: '#3B82F6', icon: 'people-outline' },
  Room: { color: '#8B5CF6', icon: 'bed-outline' },
  Vehicle: { color: '#22C55E', icon: 'car-sport-outline' },
  Transport: { color: '#F59E0B', icon: 'bus-outline' },
  User: { color: '#6D28D9', icon: 'person-circle-outline' },
  Auth: { color: '#EF4444', icon: 'lock-closed-outline' },
  Food: { color: '#F97316', icon: 'restaurant-outline' },
};

export default function ActivityLogScreen() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const pageSize = 20;

  useEffect(() => { loadLogs(); }, [page]);

  const loadLogs = async () => {
    if (page === 1) setLoading(true);
    try {
      const res = await fetchActivityLogs({ page, limit: pageSize });
      setLogs(page === 1 ? res.data : prev => [...prev, ...res.data]);
      setTotal(res.meta.total);
    } catch (err) { console.error('Failed to load activity logs', err); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const onRefresh = () => { setRefreshing(true); setPage(1); loadLogs(); };

  const getMeta = (mod: string) => MODULE_META[mod] || { color: colors.muted, icon: 'ellipsis-horizontal-outline' };

  return (
    <PageContainer>
      <FlatList
        data={logs}
        keyExtractor={(item) => item.activity_id}
        renderItem={({ item }) => {
          const meta = getMeta(item.module);
          return (
            <TouchableOpacity activeOpacity={0.7} onPress={() => setSelectedLog(item)}>
              <Card style={s.logCard}>
                <View style={s.logHeader}>
                  <View style={[s.moduleIcon, { backgroundColor: meta.color + '18' }]}>
                    <Ionicons name={meta.icon as any} size={16} color={meta.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.actionText} numberOfLines={1}>{item.action}</Text>
                    <Text style={s.timestamp}>{formatDate(item.inserted_at)} · {formatTime(item.inserted_at)}</Text>
                  </View>
                  <Badge label={item.module} style={{ backgroundColor: meta.color + '20' }} textStyle={{ color: meta.color }} />
                </View>
                <Text style={s.messageText} numberOfLines={2}>{item.message}</Text>
                <View style={s.logFooter}>
                  <View style={s.footerInfo}>
                    <Ionicons name="person-outline" size={11} color={colors.muted} />
                    <Text style={s.footerText}>{item.performed_by || 'System'}</Text>
                  </View>
                  <View style={s.footerInfo}>
                    <Ionicons name="globe-outline" size={11} color={colors.muted} />
                    <Text style={s.footerText}>{item.inserted_ip || 'Internal'}</Text>
                  </View>
                </View>
              </Card>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReached={() => { if (logs.length < total && !loading) setPage(p => p + 1); }}
        onEndReachedThreshold={0.5}
        ListHeaderComponent={<Header title="System Activity" subtitle="Audit trail of all administrative actions" fallback="/(drawer)/activity" />}
        ListFooterComponent={loading && page > 1 ? <ActivityIndicator size="small" color={colors.primary} /> : null}
        ListEmptyComponent={!loading ? <EmptyState icon="clipboard-outline" title="No activities logged" subtitle="Actions will appear here" /> : null}
      />

      <Modal visible={!!selectedLog} onClose={() => setSelectedLog(null)} title="Activity Details"
        footer={<Button title="Close" variant="outline" onPress={() => setSelectedLog(null)} />}>
        {selectedLog && (
          <>
            <SectionCard title="Event Info" icon="information-circle-outline">
              <DetailRow label="Module" value={selectedLog.module} highlight />
              <DetailRow label="Action" value={selectedLog.action} />
              <DetailRow label="Date" value={formatDate(selectedLog.inserted_at)} />
              <DetailRow label="Time" value={formatTime(selectedLog.inserted_at)} />
              <DetailRow label="User" value={selectedLog.performed_by || 'System'} />
              <DetailRow label="IP Address" value={selectedLog.inserted_ip || 'Local'} />
            </SectionCard>
            <SectionCard title="Message / Payload" icon="document-text-outline">
              <Text style={s.fullMessage}>{selectedLog.message}</Text>
            </SectionCard>
          </>
        )}
      </Modal>
    </PageContainer>
  );
}

const s = StyleSheet.create({
  logCard: { padding: 14, marginBottom: 10, borderRadius: 14 },
  logHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 },
  moduleIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionText: { fontSize: 14, fontWeight: '700', color: colors.text },
  timestamp: { fontSize: 10, color: colors.muted, fontWeight: '500', marginTop: 1 },
  messageText: { fontSize: 12, color: colors.muted, lineHeight: 18, marginBottom: 8 },
  logFooter: { flexDirection: 'row', justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  footerInfo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 10, color: colors.muted, fontWeight: '500' },
  fullMessage: { fontSize: 13, color: colors.text, lineHeight: 20, fontStyle: 'italic' },
});
