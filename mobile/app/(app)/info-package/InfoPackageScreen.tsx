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
  getInfoPackageGuests, 
  sendInfoPackageWhatsapp 
} from '@/api/info-package.api';
import { colors, spacing, typography } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
import { formatDate } from '@/utils/dateTime';

export default function InfoPackageScreen() {
    const [guests, setGuests] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');

    useEffect(() => {
        loadGuests();
    }, [page, search]);

    const loadGuests = async () => {
        setLoading(true);
        try {
            const res = await getInfoPackageGuests({
                page,
                limit: 10,
                search: search || undefined
            });
            setGuests(Array.isArray(res?.data) ? res.data : []);
        } catch (error) {
            console.error('Failed to load info package guests', error);
            Alert.alert('Error', 'Could not load guest list');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleSendWhatsApp = (g: any) => {
        Alert.alert(
            'WhatsApp Delivery',
            `Send automated info package to ${g.guest_name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Send Now', 
                    onPress: async () => {
                        try {
                            await sendInfoPackageWhatsapp(g.guest_id);
                            Alert.alert('Success', 'Info package sent successfully');
                        } catch (error) {
                            Alert.alert('Error', 'Failed to send WhatsApp message');
                        }
                    } 
                }
            ]
        );
    };

    const columns = [
        {
            key: 'guest_name',
            title: 'Guest',
            width: 150,
            render: (g: any) => (
                <View>
                    <Text style={styles.cellMainText}>{g.guest_name}</Text>
                    <Text style={styles.cellSubText}>{g.designation_name || '—'}</Text>
                </View>
            ),
        },
        {
            key: 'stay',
            title: 'Stay Period',
            width: 120,
            render: (g: any) => (
                <View>
                    <Text style={styles.cellSubText}>In: {formatDate(g.arrival_date)}</Text>
                    <Text style={styles.cellSubText}>Out: {formatDate(g.departure_date)}</Text>
                </View>
            ),
        },
        {
            key: 'actions',
            title: 'Actions',
            width: 100,
            render: (g: any) => (
                <View style={styles.actionRow}>
                    <TouchableOpacity 
                        onPress={() => handleSendWhatsApp(g)}
                        style={[styles.actionIcon, { backgroundColor: colors.success + '15' }]}
                    >
                        <Ionicons name="logo-whatsapp" size={18} color={colors.success} />
                    </TouchableOpacity>
                    <TouchableOpacity 
                        onPress={() => Alert.alert('PDF', 'PDF download available on web dashboard.')}
                        style={[styles.actionIcon, { backgroundColor: colors.info + '15' }]}
                    >
                        <Ionicons name="document-text-outline" size={18} color={colors.info} />
                    </TouchableOpacity>
                </View>
            ),
        },
    ];

    return (
        <View style={styles.container}>
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadGuests(); }} />}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Info Package</Text>
                    <Text style={styles.subtitle}>Automated Arrival/Departure kits for guests</Text>
                </View>

                <View style={styles.actionBar}>
                    <View style={styles.searchBox}>
                        <Ionicons name="search-outline" size={20} color={colors.muted} style={styles.searchIcon} />
                        <Input 
                            placeholder="Guest name or designation..." 
                            value={search}
                            onChangeText={setSearch}
                            containerStyle={{ marginBottom: 0, flex: 1 }}
                            inputStyle={{ borderWidth: 0, height: 40, fontSize: 14 }}
                        />
                    </View>
                </View>

                <Table 
                    columns={columns} 
                    data={guests} 
                    keyExtractor={(item) => item.guest_id}
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
                        disabled={guests.length < 10} 
                        onPress={() => setPage(page + 1)} 
                    />
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { padding: spacing.lg },
    header: { marginBottom: spacing.lg },
    title: { ...typography.h2, color: colors.primary },
    subtitle: { ...typography.small, color: colors.muted },
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
    table: { marginBottom: spacing.md },
    cellMainText: { fontSize: 13, fontWeight: '600', color: colors.text },
    cellSubText: { fontSize: 11, color: colors.muted, marginTop: 2 },
    actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    actionIcon: { 
        width: 32, 
        height: 32, 
        borderRadius: 16, 
        alignItems: 'center', 
        justifyContent: 'center' 
    },
    pagination: { 
        flexDirection: 'row', 
        justifyContent: 'center', 
        alignItems: 'center', 
        gap: spacing.xl,
        marginTop: spacing.md 
    },
    pageText: { ...typography.body, fontWeight: '600' },
});
