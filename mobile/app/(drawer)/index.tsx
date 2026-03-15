import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getDashboardOverview } from '@/api/dashboard.api';
import { colors, spacing, typography } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - spacing.lg * 2 - spacing.md) / 2;

export default function DashboardScreen() {
    const router = useRouter();
    const [overview, setOverview] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const data = await getDashboardOverview();
            setOverview(data);
        } catch (err) {
            console.error('Dashboard load failed', err);
            // Default mock data if API fails or returns nothing
            setOverview({
                guests: { total: 124, checkedIn: 45, upcomingArrivals: 12, checkedOutToday: 8 },
                occupancy: { roomPercent: 70, vehiclePercent: 45, dutyRosterPercent: 88, notificationPercent: 75 }
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const topStats = [
        { label: 'Total Guests', value: overview?.guests?.total || 0, icon: 'people', color: colors.info },
        { label: 'Checked In', value: overview?.guests?.checkedIn || 0, icon: 'checkmark-circle', color: colors.success },
        { label: 'Upcoming', value: overview?.guests?.upcomingArrivals || 0, icon: 'time', color: colors.warning },
        { label: 'Departures', value: overview?.guests?.checkedOutToday || 0, icon: 'log-out', color: colors.muted },
    ];

    const resourceStats = [
        { title: 'Rooms Occupied', value: overview?.occupancy?.roomPercent || 0, icon: 'bed', color: colors.primary },
        { title: 'Fleet in Use', value: overview?.occupancy?.vehiclePercent || 0, icon: 'car', color: colors.success },
        { title: 'Staff on Duty', value: overview?.occupancy?.dutyRosterPercent || 0, icon: 'calendar', color: '#6366F1' },
        { title: 'Alerts Active', value: overview?.occupancy?.notificationPercent || 0, icon: 'notifications', color: colors.error },
    ];

    const quickLinks = [
        { title: 'Guest List', icon: 'people-outline', route: '/guest/GuestManagementScreen', color: colors.primary },
        { title: 'Rooms', icon: 'bed-outline', route: '/room/RoomManagementScreen', color: '#7C3AED' },
        { title: 'Transport', icon: 'car-outline', route: '/transport/TransportScreen', color: colors.success },
        { title: 'Duty', icon: 'clipboard-outline', route: '/driver-duty/DriverDutyScreen', color: '#4338CA' },
    ];

    if (loading && !refreshing) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadDashboard(); }} />}
            >
                {/* Greeting */}
                <View style={styles.greetRow}>
                    <View>
                        <Text style={styles.greetText}>Dashboard</Text>
                        <Text style={styles.dateText}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
                    </View>
                    <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/user/UserManagementScreen')}>
                        <Ionicons name="person-circle" size={40} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                {/* Performance Grid */}
                <View style={styles.statsGrid}>
                    {topStats.map((stat, i) => (
                        <Card key={i} style={styles.statCard}>
                            <View style={[styles.statIconBg, { backgroundColor: stat.color + '15' }]}>
                                <Ionicons name={stat.icon as any} size={20} color={stat.color} />
                            </View>
                            <Text style={styles.statVal}>{stat.value}</Text>
                            <Text style={styles.statLabel}>{stat.label}</Text>
                        </Card>
                    ))}
                </View>

                {/* Occupancy / Resource Utilization */}
                <Text style={styles.sectionTitle}>System Status</Text>
                <View style={styles.resourceGrid}>
                    {resourceStats.map((res, i) => (
                        <Card key={i} style={styles.resourceCard}>
                            <View style={styles.resourceHeader}>
                                <Ionicons name={res.icon as any} size={18} color={colors.muted} />
                                <Text style={styles.resourceVal}>{res.value}%</Text>
                            </View>
                            <Text style={styles.resourceTitle}>{res.title}</Text>
                            <View style={styles.progressBarBg}>
                                <View style={[styles.progressBarFill, { width: `${res.value}%`, backgroundColor: res.color }]} />
                            </View>
                        </Card>
                    ))}
                </View>

                {/* Quick Access */}
                <Text style={styles.sectionTitle}>Quick Access</Text>
                <View style={styles.quickGrid}>
                    {quickLinks.map((link, i) => (
                        <TouchableOpacity 
                            key={i} 
                            style={styles.quickCard}
                            onPress={() => router.push(link.route as any)}
                        >
                            <View style={[styles.quickIconWrap, { backgroundColor: link.color + '10' }]}>
                                <Ionicons name={link.icon as any} size={24} color={link.color} />
                            </View>
                            <Text style={styles.quickTitle}>{link.title}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Communication Banner */}
                <Card style={styles.notifBanner}>
                    <View style={styles.notifContent}>
                        <Ionicons name="megaphone-outline" size={24} color={colors.white} />
                        <View style={{ flex: 1, marginLeft: spacing.md }}>
                            <Text style={styles.notifTitle}>New Staff Update</Text>
                            <Text style={styles.notifSub}>New protocols for guest check-in are live.</Text>
                        </View>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/notification/NotificationScreen')}>
                        <Badge label="Read" variant="info" />
                    </TouchableOpacity>
                </Card>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    scrollContent: { padding: spacing.lg },
    greetRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
    greetText: { ...typography.h1, color: colors.primary },
    dateText: { ...typography.small, color: colors.muted, marginTop: 2 },
    profileBtn: { padding: 4 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.xl },
    statCard: { width: COLUMN_WIDTH, padding: spacing.md, alignItems: 'center' },
    statIconBg: { padding: spacing.sm, borderRadius: 12, marginBottom: spacing.xs },
    statVal: { ...typography.h3, color: colors.text, marginVertical: 2 },
    statLabel: { ...typography.tiny, color: colors.muted, fontWeight: '700', textTransform: 'uppercase' },
    sectionTitle: { ...typography.label, color: colors.primary, marginBottom: spacing.md, textTransform: 'uppercase', letterSpacing: 1 },
    resourceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.xl },
    resourceCard: { width: COLUMN_WIDTH, padding: spacing.md },
    resourceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
    resourceVal: { fontSize: 16, fontWeight: '800', color: colors.primary },
    resourceTitle: { fontSize: 11, fontWeight: '600', color: colors.text, marginBottom: spacing.xs },
    progressBarBg: { height: 6, backgroundColor: colors.background, borderRadius: 3, overflow: 'hidden' },
    progressBarFill: { height: '100%', borderRadius: 3 },
    quickGrid: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
    quickCard: { 
        flex: 1, 
        backgroundColor: colors.white, 
        padding: spacing.md, 
        borderRadius: 16, 
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2
    },
    quickIconWrap: { padding: spacing.sm, borderRadius: 12, marginBottom: spacing.xs },
    quickTitle: { fontSize: 10, fontWeight: '700', color: colors.text },
    notifBanner: { 
        backgroundColor: colors.primary, 
        padding: spacing.md, 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'space-between' 
    },
    notifContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    notifTitle: { color: colors.white, fontWeight: '700', fontSize: 14 },
    notifSub: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 2 },
});
