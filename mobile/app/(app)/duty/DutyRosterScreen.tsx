import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Table } from '@/components/ui/Table';
type RosterItem = { 
    department: string; 
    officer: string; 
    duty: string; 
    time: string; 
    status: 'Active' | 'Pending'; 
    approval: 'Approved' | 'Pending' 
};

type FilterType = 'ALL' | 'ACTIVE' | 'PENDING';

const DEPTS: Record<string, string[]> = { 
    Housekeeping: ['Ramesh Kumar', 'Suresh Yadav'], 
    Security: ['Vijay Singh', 'Anil Verma'], 
    Kitchen: ['Sita Devi', 'Pooja Sharma'], 
    'Front Desk': ['Amit Sharma', 'Neha Gupta'], 
    Maintenance: ['Rohit Meena'] 
};

const TIMES = ['00:00 - 08:00', '08:00 - 16:00', '16:00 - 00:00'];

export default function DutyRosterScreen() {
    const [roster, setRoster] = useState<RosterItem[]>([
        { department: 'Housekeeping', officer: 'Ramesh Kumar', duty: 'Room Cleaning - Floor 1', time: '08:00 - 16:00', status: 'Active', approval: 'Approved' },
        { department: 'Security', officer: 'Vijay Singh', duty: 'Main Gate Security', time: '00:00 - 08:00', status: 'Active', approval: 'Approved' },
        { department: 'Kitchen', officer: 'Sita Devi', duty: 'Meal Preparation', time: '06:00 - 14:00', status: 'Active', approval: 'Approved' },
        { department: 'Front Desk', officer: 'Amit Sharma', duty: 'Guest Reception', time: '08:00 - 20:00', status: 'Pending', approval: 'Pending' },
    ]);

    const [filter, setFilter] = useState<FilterType>('ALL');
    const [search, setSearch] = useState('');
    const [showFormModal, setShowFormModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<RosterItem | null>(null);
    const [isEdit, setIsEdit] = useState(false);

    const [form, setForm] = useState({
        department: '',
        officer: '',
        time: '',
    });

    const filtered = roster.filter(r => {
        if (filter === 'ACTIVE') return r.status === 'Active';
        if (filter === 'PENDING') return r.approval === 'Pending';
        return true;
    }).filter(r => r.officer.toLowerCase().includes(search.toLowerCase()));

    const handleSave = () => {
        if (!form.department || !form.officer || !form.time) {
            Alert.alert('Validation', 'Please fill all fields');
            return;
        }

        if (isEdit && selectedItem) {
            setRoster(roster.map(r => r === selectedItem ? {
                ...r,
                department: form.department,
                officer: form.officer,
                time: form.time,
                duty: `${form.department} Duty`
            } : r));
        } else {
            setRoster([...roster, {
                department: form.department,
                officer: form.officer,
                duty: `${form.department} Duty`,
                time: form.time,
                status: 'Pending',
                approval: 'Pending'
            }]);
        }
        setShowFormModal(false);
    };

    const handleDelete = (item: RosterItem) => {
        Alert.alert('Delete Duty', `Remove assignment for ${item.officer}?`, [
            { text: 'Cancel', style: 'cancel' },
            { 
                text: 'Delete', 
                style: 'destructive', 
                onPress: () => setRoster(roster.filter(r => r !== item)) 
            }
        ]);
    };

    const columns = [
        {
            key: 'officer',
            title: 'Officer',
            width: 140,
            render: (r: RosterItem) => (
                <View>
                    <Text style={styles.cellMainText}>{r.officer}</Text>
                    <Text style={styles.cellSubText}>{r.department}</Text>
                </View>
            ),
        },
        {
            key: 'status',
            title: 'Status',
            width: 100,
            render: (r: RosterItem) => (
                <Badge 
                    label={r.status} 
                    variant={r.status === 'Active' ? 'success' : 'warning'} 
                />
            ),
        },
        {
            key: 'approval',
            title: 'Approval',
            width: 100,
            render: (r: RosterItem) => (
                <Badge 
                    label={r.approval} 
                    variant={r.approval === 'Approved' ? 'info' : 'warning'} 
                />
            ),
        },
        {
            key: 'actions',
            title: 'Actions',
            width: 100,
            render: (r: RosterItem) => (
                <View style={styles.actionRow}>
                    <TouchableOpacity onPress={() => {
                        setSelectedItem(r);
                        setIsEdit(true);
                        setForm({ department: r.department, officer: r.officer, time: r.time });
                        setShowFormModal(true);
                    }} style={styles.actionIcon}>
                        <Ionicons name="create-outline" size={20} color={colors.success} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(r)} style={styles.actionIcon}>
                        <Ionicons name="trash-outline" size={20} color={colors.error} />
                    </TouchableOpacity>
                </View>
            ),
        },
    ];

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>Duty Roster</Text>
                    <Text style={styles.subtitle}>Departmental shift planning and approvals</Text>
                </View>

                {/* Filter Tabs */}
                <View style={styles.filterTabs}>
                    {(['ALL', 'ACTIVE', 'PENDING'] as FilterType[]).map(f => (
                        <TouchableOpacity 
                            key={f} 
                            style={[styles.filterTab, filter === f && styles.filterTabActive]}
                            onPress={() => setFilter(f)}
                        >
                            <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>
                                {f}
                            </Text>
                            <View style={[styles.countBadge, filter === f && styles.countBadgeActive]}>
                                <Text style={[styles.countText, filter === f && styles.countTextActive]}>
                                    {f === 'ALL' ? roster.length : f === 'ACTIVE' ? roster.filter(r => r.status === 'Active').length : roster.filter(r => r.approval === 'Pending').length}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.actionBar}>
                    <View style={styles.searchBox}>
                        <Ionicons name="search-outline" size={18} color={colors.muted} style={styles.searchIcon} />
                        <Input 
                            placeholder="Find officer..." 
                            value={search}
                            onChangeText={setSearch}
                            containerStyle={{ marginBottom: 0, flex: 1 }}
                            inputStyle={{ borderWidth: 0, height: 40, fontSize: 13 }}
                        />
                    </View>
                    <Button title="+ Add" size="sm" onPress={() => { setIsEdit(false); setForm({ department: '', officer: '', time: '' }); setShowFormModal(true); }} />
                </View>

                <Table 
                    columns={columns} 
                    data={filtered} 
                    keyExtractor={(_, i) => String(i)}
                    containerStyle={styles.table}
                />

                <View style={{ height: 40 }} />
            </ScrollView>

            {/* Form Modal */}
            <Modal
                visible={showFormModal}
                onClose={() => setShowFormModal(false)}
                title={isEdit ? 'Modify Assignment' : 'New Duty Assignment'}
                footer={
                    <View style={{ flexDirection: 'row', gap: spacing.md }}>
                        <Button title="Cancel" variant="outline" onPress={() => setShowFormModal(false)} />
                        <Button title="Assign Duty" onPress={handleSave} />
                    </View>
                }
            >
                <ScrollView>
                    <Text style={styles.modalLabel}>Select Department</Text>
                    <View style={styles.chipGrid}>
                        {Object.keys(DEPTS).map(d => (
                            <TouchableOpacity 
                                key={d} 
                                style={[styles.chip, form.department === d && styles.chipActive]}
                                onPress={() => setForm({...form, department: d, officer: ''})}
                            >
                                <Text style={[styles.chipText, form.department === d && styles.chipTextActive]}>{d}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {form.department ? (
                        <>
                            <Text style={styles.modalLabel}>Available Officers</Text>
                            <View style={styles.chipGrid}>
                                {DEPTS[form.department].map(o => (
                                    <TouchableOpacity 
                                        key={o} 
                                        style={[styles.chip, form.officer === o && styles.chipActive]}
                                        onPress={() => setForm({...form, officer: o})}
                                    >
                                        <Text style={[styles.chipText, form.officer === o && styles.chipTextActive]}>{o}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </>
                    ) : null}

                    <Text style={styles.modalLabel}>Shift Time</Text>
                    <View style={styles.chipGrid}>
                        {TIMES.map(t => (
                            <TouchableOpacity 
                                key={t} 
                                style={[styles.chip, form.time === t && styles.chipActive]}
                                onPress={() => setForm({...form, time: t})}
                            >
                                <Text style={[styles.chipText, form.time === t && styles.chipTextActive]}>{t}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scrollContent: { padding: spacing.lg },
    header: { marginBottom: spacing.lg },
    title: { ...typography.h2, color: colors.primary },
    subtitle: { ...typography.small, color: colors.muted },
    filterTabs: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
    filterTab: { 
        flex: 1, 
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.sm, 
        borderRadius: 8, 
        backgroundColor: colors.white,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 6
    },
    filterTabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    filterTabText: { fontSize: 11, fontWeight: '700', color: colors.muted },
    filterTabTextActive: { color: colors.white },
    countBadge: { 
        backgroundColor: colors.background, 
        paddingHorizontal: 6, 
        paddingVertical: 1, 
        borderRadius: 10 
    },
    countBadgeActive: { backgroundColor: 'rgba(255,255,255,0.2)' },
    countText: { fontSize: 10, fontWeight: '700', color: colors.primary },
    countTextActive: { color: colors.white },
    actionBar: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
    searchBox: { 
        flex: 1,
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
    actionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    actionIcon: { padding: 4 },
    modalLabel: { ...typography.small, fontWeight: '700', color: colors.muted, marginBottom: spacing.sm, marginTop: spacing.md },
    chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.sm },
    chip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.white,
    },
    chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
    chipText: { fontSize: 11, color: colors.text },
    chipTextActive: { color: colors.primary, fontWeight: '700' },
});
