import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getDashboardOverview } from '@/api/dashboard.api';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

type ModuleItem = {
  title: string;
  subtitle: string;
  route: string;
  icon: string;
  color: string;
  bgColor: string;
};

const MODULES: ModuleItem[] = [
  { title: 'Guest Management', subtitle: 'अतिथि प्रबंधन', route: '/guest/GuestManagementScreen', icon: '👥', color: '#00247D', bgColor: '#EBF0FF' },
  { title: 'Room Management', subtitle: 'कक्ष प्रबंधन', route: '/room/RoomManagementScreen', icon: '🏨', color: '#7C3AED', bgColor: '#F3E8FF' },
  { title: 'Transport', subtitle: 'परिवहन प्रबंधन', route: '/transport/TransportScreen', icon: '🚗', color: '#059669', bgColor: '#ECFDF5' },
  { title: 'Food Service', subtitle: 'भोजन सेवा', route: '/food/FoodServiceScreen', icon: '🍽️', color: '#D97706', bgColor: '#FEF3C7' },
  { title: 'Vehicle Mgmt', subtitle: 'वाहन प्रबंधन', route: '/vehicle/VehicleScreen', icon: '🚙', color: '#0891B2', bgColor: '#E0F2FE' },
  { title: 'Driver Duty', subtitle: 'चालक ड्यूटी', route: '/driver-duty/DriverDutyScreen', icon: '📋', color: '#4338CA', bgColor: '#E0E7FF' },
  { title: 'Duty Roster', subtitle: 'ड्यूटी रोस्टर', route: '/duty/DutyRosterScreen', icon: '📅', color: '#B45309', bgColor: '#FEF3C7' },
  { title: 'Network Mgmt', subtitle: 'नेटवर्क प्रबंधन', route: '/network/NetworkScreen', icon: '📶', color: '#0D9488', bgColor: '#CCFBF1' },
  { title: 'User Management', subtitle: 'उपयोगकर्ता', route: '/user/UserManagementScreen', icon: '👤', color: '#6D28D9', bgColor: '#EDE9FE' },
  { title: 'Reports', subtitle: 'रिपोर्ट', route: '/report/ReportScreen', icon: '📊', color: '#DC2626', bgColor: '#FEE2E2' },
  { title: 'Info Package', subtitle: 'सूचना पैकेज', route: '/info-package/InfoPackageScreen', icon: '📦', color: '#2563EB', bgColor: '#DBEAFE' },
  { title: 'Notifications', subtitle: 'सूचनाएं', route: '/notification/NotificationScreen', icon: '🔔', color: '#EA580C', bgColor: '#FFF7ED' },
  { title: 'Activity Log', subtitle: 'गतिविधि लॉग', route: '/activity/ActivityLogScreen', icon: '📝', color: '#374151', bgColor: '#F3F4F6' },
  { title: 'Settings', subtitle: 'सेटिंग्स', route: '/settings/SystemSettingsScreen', icon: '⚙️', color: '#6B7280', bgColor: '#F9FAFB' },
];

export default function DashboardScreen() {
  const router = useRouter();
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const data = await getDashboardOverview();
      setOverview(data);
    } catch (err) {
      console.error('Dashboard load failed', err);
    } finally {
      setLoading(false);
    }
  }

  const stats = [
    { label: 'Total Guests', labelHi: 'कुल अतिथि', value: overview?.guests?.total ?? 0, color: '#2563EB', bg: '#DBEAFE' },
    { label: 'Checked In', labelHi: 'चेक-इन', value: overview?.guests?.checkedIn ?? 0, color: '#059669', bg: '#D1FAE5' },
    { label: 'Upcoming', labelHi: 'आगामी', value: overview?.guests?.upcomingArrivals ?? 0, color: '#D97706', bg: '#FEF3C7' },
    { label: 'Checked Out', labelHi: 'चेक-आउट', value: overview?.guests?.checkedOutToday ?? 0, color: '#6B7280', bg: '#F3F4F6' },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <Text style={styles.headerSubtitle}>
            Real-time statistics | वास्तविक समय के आंकड़े
          </Text>
        </View>

        {/* Stats Row */}
        {loading ? (
          <ActivityIndicator size="large" color="#00247D" style={{ marginVertical: 24 }} />
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsRow}>
            {stats.map((stat) => (
              <View key={stat.label} style={[styles.statCard, { borderColor: stat.color + '40' }]}>
                <View style={[styles.statIcon, { backgroundColor: stat.bg }]}>
                  <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
                </View>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={styles.statLabelHi}>{stat.labelHi}</Text>
              </View>
            ))}
          </ScrollView>
        )}

        {/* Modules Grid */}
        <Text style={styles.sectionTitle}>Modules</Text>
        <View style={styles.modulesGrid}>
          {MODULES.map((mod) => (
            <TouchableOpacity
              key={mod.route}
              style={[styles.moduleCard, { backgroundColor: mod.bgColor }]}
              activeOpacity={0.7}
              onPress={() => router.push(mod.route as any)}
            >
              <View style={[styles.moduleIconWrap, { backgroundColor: mod.color + '18' }]}>
                <Text style={styles.moduleIcon}>{mod.icon}</Text>
              </View>
              <Text style={[styles.moduleTitle, { color: mod.color }]}>{mod.title}</Text>
              <Text style={styles.moduleSubtitle}>{mod.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { flex: 1, paddingHorizontal: 16 },
  header: { paddingTop: 16, paddingBottom: 8 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#00247D' },
  headerSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  statsRow: { marginVertical: 16 },
  statCard: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderRadius: 14,
    padding: 16,
    marginRight: 12,
    minWidth: 130,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 12, fontWeight: '600', color: '#374151', textAlign: 'center' },
  statLabelHi: { fontSize: 10, color: '#9CA3AF', textAlign: 'center', marginTop: 2 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#00247D', marginBottom: 12, marginTop: 8 },
  modulesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  moduleCard: {
    width: CARD_WIDTH,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  moduleIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  moduleIcon: { fontSize: 22 },
  moduleTitle: { fontSize: 13, fontWeight: '700' },
  moduleSubtitle: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
});
