import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { generateSectionReport } from '@/api/reportsPkg.api';
import { colors, spacing } from '@/theme';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { SectionCard, DetailRow, PageContainer } from '@/components/ui/Premium';
import Header from '@/components/Header';

type Section = 'guest' | 'room' | 'vehicle' | 'driver-duty' | 'food' | 'network';
const SECTIONS: { value: Section; label: string; icon: string; color: string }[] = [
  { value: 'guest', label: 'Guest Summary', icon: 'people-outline', color: '#3B82F6' },
  { value: 'room', label: 'Room Occupancy', icon: 'bed-outline', color: '#8B5CF6' },
  { value: 'vehicle', label: 'Vehicle Usage', icon: 'car-outline', color: '#22C55E' },
  { value: 'driver-duty', label: 'Driver Duty', icon: 'calendar-outline', color: '#F59E0B' },
  { value: 'food', label: 'Food Service', icon: 'restaurant-outline', color: '#F97316' },
  { value: 'network', label: 'Network Logs', icon: 'wifi-outline', color: '#6D28D9' },
];

const RANGES = ['Today', 'This Week', 'This Month', 'Last Month', 'Custom Range'];
const FORMAT_ICONS: Record<string, string> = { PDF: 'document-outline', EXCEL: 'grid-outline', VIEW: 'eye-outline' };

export default function ReportScreen() {
  const [section, setSection] = useState<Section>('guest');
  const [range, setRange] = useState('Today');
  const [format, setFormat] = useState<'PDF' | 'EXCEL' | 'VIEW'>('PDF');
  const [generating, setGenerating] = useState(false);
  const [viewData, setViewData] = useState<any>(null);
  const [form, setForm] = useState({ startDate: '', endDate: '', language: 'en' as 'en' | 'mr' });

  const handleGenerate = async () => {
    if (range === 'Custom Range' && (!form.startDate || !form.endDate)) {
      Alert.alert('Validation', 'Provide start and end dates');
      return;
    }
    setGenerating(true);
    try {
      const res = await generateSectionReport({
        section, rangeType: range, format,
        startDate: range === 'Custom Range' ? form.startDate : undefined,
        endDate: range === 'Custom Range' ? form.endDate : undefined,
        language: form.language,
      });
      if (format === 'VIEW') { setViewData(res); }
      else { Alert.alert('Success', `${format} report generated.`); setViewData(null); }
    } catch { Alert.alert('Error', 'Failed to generate report'); }
    finally { setGenerating(false); }
  };

  const activeSec = SECTIONS.find(s => s.value === section)!;

  return (
    <PageContainer>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}>
        <Header title="Reports & Analytics" subtitle="Generate PDFs and Excel exports" fallback="/(drawer)/report" />

        {/* ── Section Selection (same card pattern as Room/Food) ── */}
        <View style={st.sectionGrid}>
          {SECTIONS.map(item => {
            const active = section === item.value;
            return (
              <TouchableOpacity
                key={item.value}
                onPress={() => setSection(item.value)}
                activeOpacity={0.7}
                style={[st.sectionCard, active && { backgroundColor: item.color, borderColor: item.color }]}
              >
                <View style={[st.sectionIconWrap, { backgroundColor: active ? 'rgba(255,255,255,0.25)' : item.color + '18' }]}>
                  <Ionicons name={item.icon as any} size={20} color={active ? '#fff' : item.color} />
                </View>
                <Text style={[st.sectionText, active && { color: '#fff' }]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Timeline (range chips — matches Food filter pills) ── */}
        <SectionCard title="Timeline" icon="time-outline">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={st.chipRow}>
              {RANGES.map(r => {
                const active = range === r;
                return (
                  <TouchableOpacity
                    key={r}
                    onPress={() => setRange(r)}
                    activeOpacity={0.7}
                    style={[st.filterPill, active && { backgroundColor: activeSec.color, borderColor: activeSec.color }]}
                  >
                    <Text style={[st.filterPillText, active && { color: '#fff' }]}>{r}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
          {range === 'Custom Range' && (
            <View style={st.dateRow}>
              <Input label="Start (YYYY-MM-DD)" value={form.startDate}
                onChangeText={v => setForm({ ...form, startDate: v })} containerStyle={{ flex: 1 }} />
              <Input label="End (YYYY-MM-DD)" value={form.endDate}
                onChangeText={v => setForm({ ...form, endDate: v })} containerStyle={{ flex: 1 }} />
            </View>
          )}
        </SectionCard>

        {/* ── Export Options ── */}
        <SectionCard title="Export Options" icon="download-outline">
          {/* Format toggle */}
          <Text style={st.optionLabel}>Format</Text>
          <View style={st.toggleRow}>
            {(['PDF', 'EXCEL', 'VIEW'] as const).map(f => {
              const active = format === f;
              return (
                <TouchableOpacity
                  key={f}
                  onPress={() => setFormat(f)}
                  activeOpacity={0.7}
                  style={[st.toggleChip, active && { backgroundColor: activeSec.color, borderColor: activeSec.color }]}
                >
                  <Ionicons name={(FORMAT_ICONS[f] || 'document-outline') as any} size={14} color={active ? '#fff' : activeSec.color} />
                  <Text style={[st.toggleChipText, active && { color: '#fff' }]}>{f}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Language toggle */}
          <Text style={st.optionLabel}>Language</Text>
          <View style={st.toggleRow}>
            {[{ key: 'en', label: 'English', icon: 'language-outline' }, { key: 'mr', label: 'मराठी', icon: 'text-outline' }].map(l => {
              const active = form.language === l.key;
              return (
                <TouchableOpacity
                  key={l.key}
                  onPress={() => setForm({ ...form, language: l.key as any })}
                  activeOpacity={0.7}
                  style={[st.toggleChip, active && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                >
                  <Ionicons name={l.icon as any} size={14} color={active ? '#fff' : colors.primary} />
                  <Text style={[st.toggleChipText, active && { color: '#fff' }]}>{l.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Generate button */}
          <TouchableOpacity
            style={[st.generateBtn, { backgroundColor: activeSec.color }]}
            onPress={handleGenerate}
            activeOpacity={0.8}
            disabled={generating}
          >
            <Ionicons name="download-outline" size={18} color="#fff" />
            <Text style={st.generateBtnText}>
              {generating ? 'Generating...' : 'Generate & Export'}
            </Text>
          </TouchableOpacity>
        </SectionCard>

        {/* ── Live Preview ── */}
        {viewData && (
          <SectionCard title={`Results (${viewData.totalRecords || 0})`} icon="analytics-outline">
            {viewData.rows?.map((row: any, i: number) => (
              <Card key={i} style={st.dataCard}>
                {Object.entries(row).map(([k, v]) => (
                  <DetailRow key={k} label={k.replace(/_/g, ' ')} value={String(v ?? '—')} />
                ))}
              </Card>
            ))}
            {(!viewData.rows || viewData.rows.length === 0) && (
              <View style={st.emptyPreview}>
                <Ionicons name="file-tray-outline" size={32} color={colors.muted} />
                <Text style={st.emptyPreviewText}>No records for this range</Text>
              </View>
            )}
          </SectionCard>
        )}
      </ScrollView>
    </PageContainer>
  );
}

// ─── Styles (fully aligned with Guest / Room / Food / Transport) ────────────
const st = StyleSheet.create({
  // ── Section selection grid (same as room/food card pattern)
  sectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: spacing.lg,
  },
  sectionCard: {
    width: '47%',
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionIconWrap: {
    width: 42,          // same 42px as food/room icon circles
    height: 42,
    borderRadius: 12,   // same 12 as food mealIconCircle
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },

  // ── Filter pills (identical to Food meal-filter chips)
  chipRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  dateRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },

  // ── Toggle chips (same pill pattern, matches action buttons)
  optionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.muted,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 4,
    letterSpacing: 0.5,
  },
  toggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.md,
  },
  toggleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,       // same 20 as food/guest/transport filter pills
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: '#fff',
  },
  toggleChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },

  // ── Generate button (matches addBtn in Guest/Food toolbar)
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: spacing.sm,
  },
  generateBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },

  // ── Preview cards
  dataCard: {
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 14,      // same 14 as all cards
  },

  // ── Empty preview
  emptyPreview: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyPreviewText: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 8,
  },
});
