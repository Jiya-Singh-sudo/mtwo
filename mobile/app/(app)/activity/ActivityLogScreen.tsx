import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fetchActivityLogs } from '@/api/activityLog.api';
import { colors, spacing, typography } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { formatDate, formatTime } from '@/utils/dateTime';

import { ActivityLog } from '@/types/activity-log';

function ActivityLogScreen() {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
    const pageSize = 20;

    useEffect(() => {
        loadLogs();
    }, [page]);

    const loadLogs = async () => {
        if (page === 1) setLoading(true);
        try {
            const res = await fetchActivityLogs({ page, limit: pageSize });
            if (page === 1) {
                setLogs(res.data);
            } else {
                setLogs(prev => [...prev, ...res.data]);
            }
            setTotal(res.meta.total);
        } catch (err) {
            console.error('Failed to load activity logs', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        setPage(1);
        loadLogs();
    };

    const getModuleColor = (mod: string) => {
        const map: Record<string, string> = {
            Guest: colors.primary,
            Room: '#7C3AED',
            Vehicle: colors.success,
            Transport: colors.warning,
            User: '#6D28D9',
            Auth: colors.error,
        };
        return map[mod] || colors.muted;
    };

    const renderLogItem = ({ item }: { item: ActivityLog }) => (
        <TouchableOpacity activeOpacity={0.7} onPress={() => setSelectedLog(item)}>
            <Card style={styles.logCard}>
                <View style={styles.logHeader}>
                    <Badge 
                        label={item.module} 
                        style={{ backgroundColor: getModuleColor(item.module) + '20' }}
                        textStyle={{ color: getModuleColor(item.module) }}
                    />
                    <Text style={styles.timestamp}>
                        {formatDate(item.inserted_at)} • {formatTime(item.inserted_at)}
                    </Text>
                </View>
                <Text style={styles.actionText}>{item.action}</Text>
                <Text style={styles.messageText} numberOfLines={2}>{item.message}</Text>
                <View style={styles.logFooter}>
                    <View style={styles.footerInfo}>
                        <Ionicons name="person-outline" size={12} color={colors.muted} />
                        <Text style={styles.footerText}>{item.performed_by || 'System'}</Text>
                    </View>
                    <View style={styles.footerInfo}>
                        <Ionicons name="globe-outline" size={12} color={colors.muted} />
                        <Text style={styles.footerText}>{item.inserted_ip || 'Internal'}</Text>
                    </View>
                </View>
            </Card>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>System Activity</Text>
                <Text style={styles.subtitle}>Audit trail of all administrative actions</Text>
            </View>

            <FlatList
                data={logs}
                keyExtractor={(item) => item.activity_id}
                renderItem={renderLogItem}
                contentContainerStyle={styles.listContent}
                ListFooterComponent={loading && page > 1 ? <ActivityIndicator size="small" color={colors.primary} /> : <View style={{ height: 40 }} />}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                onEndReached={() => { if (logs.length < total && !loading) setPage(p => p + 1); }}
                onEndReachedThreshold={0.5}
                ListEmptyComponent={!loading ? <Text style={styles.emptyText}>No activities logged yet.</Text> : null}
            />

            <Modal
                visible={!!selectedLog}
                onClose={() => setSelectedLog(null)}
                title="Activity Details"
                footer={<Button title="Close" variant="outline" onPress={() => setSelectedLog(null)} />}
            >
                {selectedLog && (
                    <View>
                        <DetailRow label="Module" value={selectedLog.module} />
                        <DetailRow label="Action" value={selectedLog.action} />
                        <DetailRow label="Date" value={formatDate(selectedLog.inserted_at)} />
                        <DetailRow label="Time" value={formatTime(selectedLog.inserted_at)} />
                        <DetailRow label="User" value={selectedLog.performed_by || 'System'} />
                        <DetailRow label="Terminal IP" value={selectedLog.inserted_ip || 'Local'} />
                        <View style={styles.divider} />
                        <Text style={styles.modalLabel}>Payload/Message</Text>
                        <View style={styles.messageBox}>
                            <Text style={styles.fullMessage}>{selectedLog.message}</Text>
                        </View>
                    </View>
                )}
            </Modal>
        </View>
    );
}
export default ActivityLogScreen;
const DetailRow = ({ label, value }: { label: string, value: string }) => (
    <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { padding: spacing.lg, paddingBottom: spacing.md },
    title: { ...typography.h2, color: colors.primary },
    subtitle: { ...typography.small, color: colors.muted, marginTop: 2 },
    listContent: { paddingHorizontal: spacing.lg },
    logCard: { padding: spacing.md, marginBottom: spacing.md },
    logHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
    timestamp: { fontSize: 10, color: colors.muted, fontWeight: '600' },
    actionText: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 2 },
    messageText: { fontSize: 12, color: colors.muted, lineHeight: 18 },
    logFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm, paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: colors.border },
    footerInfo: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    footerText: { fontSize: 10, color: colors.muted, fontWeight: '500' },
    emptyText: { textAlign: 'center', marginTop: 40, ...typography.body, color: colors.muted },
    detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
    detailLabel: { ...typography.small, color: colors.muted },
    detailValue: { ...typography.small, fontWeight: '600', color: colors.text },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
    modalLabel: { fontSize: 11, fontWeight: '700', color: colors.muted, marginBottom: spacing.xs, textTransform: 'uppercase' },
    messageBox: { backgroundColor: colors.background, padding: spacing.md, borderRadius: 8 },
    fullMessage: { fontSize: 12, color: colors.text, lineHeight: 18, fontStyle: 'italic' },
});
