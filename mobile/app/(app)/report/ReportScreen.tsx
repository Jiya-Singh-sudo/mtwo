import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  generateSectionReport 
} from '@/api/reportsPkg.api';
import { colors, spacing, typography } from '@/theme';
import { 
  Card, 
  Button, 
  Input, 
} from '@/components/ui';

type Section = 'guest' | 'room' | 'vehicle' | 'driver-duty' | 'food' | 'network';

const SECTIONS: { value: Section; label: string; icon: string }[] = [
    { value: 'guest', label: 'Guest Summary', icon: 'people-outline' },
    { value: 'room', label: 'Room Occupancy', icon: 'bed-outline' },
    { value: 'vehicle', label: 'Vehicle Usage', icon: 'car-outline' },
    { value: 'driver-duty', label: 'Driver Duty', icon: 'calendar-outline' },
    { value: 'food', label: 'Food Service', icon: 'restaurant-outline' },
    { value: 'network', label: 'Network Logs', icon: 'wifi-outline' },
];

export default function ReportScreen() {
    const [section, setSection] = useState<Section>('guest');
    const [range, setRange] = useState('Today');
    const [format, setFormat] = useState<'PDF' | 'EXCEL' | 'VIEW'>('PDF');
    const [generating, setGenerating] = useState(false);
    const [viewData, setViewData] = useState<any>(null);

    const [form, setForm] = useState({
        startDate: '',
        endDate: '',
        language: 'en' as 'en' | 'mr'
    });

    const handleGenerate = async () => {
        if (range === 'Custom Range' && (!form.startDate || !form.endDate)) {
            Alert.alert('Validation', 'Please provide start and end dates.');
            return;
        }

        setGenerating(true);
        try {
            const res = await generateSectionReport({
                section,
                rangeType: range,
                format,
                startDate: range === 'Custom Range' ? form.startDate : undefined,
                endDate: range === 'Custom Range' ? form.endDate : undefined,
                language: form.language,
            });

            if (format === 'VIEW') {
                setViewData(res);
            } else {
                Alert.alert('Success', `Report ${format} generated. Check downloads on your account dashboard or email.`);
                setViewData(null);
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to generate report package');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>Reports & Analytics</Text>
                    <Text style={styles.subtitle}>Generate status PDFs and usage Excel sheets</Text>
                </View>

                {/* Section Selection */}
                <Text style={styles.groupLabel}>Report Content</Text>
                <View style={styles.sectionGrid}>
                    {SECTIONS.map(item => (
                        <TouchableOpacity 
                            key={item.value} 
                            style={[styles.sectionCard, section === item.value && styles.sectionCardActive]}
                            onPress={() => setSection(item.value)}
                        >
                            <Ionicons 
                                name={item.icon as any} 
                                size={24} 
                                color={section === item.value ? colors.white : colors.primary} 
                            />
                            <Text style={[styles.sectionText, section === item.value && styles.sectionTextActive]}>
                                {item.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Range Selection */}
                <Card style={styles.configCard}>
                    <Text style={styles.modalLabel}>Select Timeline</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
                        {['Today', 'This Week', 'This Month', 'Last Month', 'Custom Range'].map(r => (
                            <TouchableOpacity 
                                key={r} 
                                style={[styles.rangeChip, range === r && styles.rangeChipActive]}
                                onPress={() => setRange(r)}
                            >
                                <Text style={[styles.rangeChipText, range === r && styles.rangeChipTextActive]}>{r}</Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {range === 'Custom Range' && (
                        <View style={styles.dateRow}>
                            <Input 
                                label="Start (YYYY-MM-DD)" 
                                value={form.startDate} 
                                onChangeText={v => setForm({...form, startDate: v})}
                                containerStyle={{ flex: 1 }}
                            />
                            <Input 
                                label="End (YYYY-MM-DD)" 
                                value={form.endDate} 
                                onChangeText={v => setForm({...form, endDate: v})}
                                containerStyle={{ flex: 1 }}
                            />
                        </View>
                    )}

                    <View style={styles.divider} />

                    <Text style={styles.modalLabel}>Export Format & Language</Text>
                    <View style={styles.formatRow}>
                        <View style={styles.toggleGroup}>
                            {['PDF', 'EXCEL', 'VIEW'].map(f => (
                                <TouchableOpacity 
                                    key={f} 
                                    style={[styles.toggleBtn, format === f && styles.toggleBtnActive]}
                                    onPress={() => setFormat(f as any)}
                                >
                                    <Text style={[styles.toggleText, format === f && styles.toggleTextActive]}>{f}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <View style={styles.toggleGroup}>
                            {[
                                { key: 'en', label: 'EN' },
                                { key: 'mr', label: 'MR' }
                            ].map(l => (
                                <TouchableOpacity 
                                    key={l.key} 
                                    style={[styles.toggleBtn, form.language === l.key && styles.toggleBtnActive]}
                                    onPress={() => setForm({...form, language: l.key as any})}
                                >
                                    <Text style={[styles.toggleText, form.language === l.key && styles.toggleTextActive]}>{l.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <Button 
                        title={generating ? "Generating..." : "Generate & Export"} 
                        onPress={handleGenerate} 
                        style={{ marginTop: spacing.md }}
                        loading={generating}
                    />
                </Card>

                {/* Preview Section */}
                {viewData && (
                    <View style={styles.previewContainer}>
                        <Text style={styles.groupLabel}>Live Preview ({viewData.totalRecords || 0})</Text>
                        {viewData.rows?.map((row: any, i: number) => (
                            <Card key={i} style={styles.dataCard}>
                                {Object.entries(row).map(([k, v]) => (
                                    <View key={k} style={styles.dataRow}>
                                        <Text style={styles.dataKey}>{k.replace(/_/g, ' ')}</Text>
                                        <Text style={styles.dataVal}>{String(v ?? '—')}</Text>
                                    </View>
                                ))}
                            </Card>
                        ))}
                    </View>
                )}

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
    groupLabel: { ...typography.label, color: colors.primary, marginBottom: spacing.md },
    sectionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.xl },
    sectionCard: { 
        width: '47.5%', 
        backgroundColor: colors.white, 
        padding: spacing.md, 
        borderRadius: 12, 
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    sectionCardActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    sectionText: { fontSize: 12, fontWeight: '700', color: colors.text, marginTop: spacing.xs, textAlign: 'center' },
    sectionTextActive: { color: colors.white },
    configCard: { padding: spacing.md },
    modalLabel: { fontSize: 12, fontWeight: '700', color: colors.muted, marginBottom: spacing.sm, textTransform: 'uppercase' },
    chipRow: { flexDirection: 'row', marginBottom: spacing.md },
    rangeChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: 16,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        marginRight: spacing.sm,
    },
    rangeChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
    rangeChipText: { fontSize: 11, color: colors.text },
    rangeChipTextActive: { color: colors.primary, fontWeight: '700' },
    dateRow: { flexDirection: 'row', gap: spacing.md },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
    formatRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
    toggleGroup: { flexDirection: 'row', backgroundColor: colors.background, borderRadius: 8, padding: 2 },
    toggleBtn: { paddingHorizontal: spacing.md, paddingVertical: 6, borderRadius: 6 },
    toggleBtnActive: { backgroundColor: colors.white, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
    toggleText: { fontSize: 10, fontWeight: '700', color: colors.muted },
    toggleTextActive: { color: colors.primary },
    previewContainer: { marginTop: spacing.xl },
    dataCard: { padding: spacing.md, marginBottom: spacing.sm },
    dataRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 2 },
    dataKey: { fontSize: 10, color: colors.muted, textTransform: 'capitalize' },
    dataVal: { fontSize: 11, fontWeight: '600', color: colors.text, flex: 1, textAlign: 'right', marginLeft: 10 },
});
