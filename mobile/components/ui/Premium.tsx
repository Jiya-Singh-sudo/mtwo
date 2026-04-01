/**
 * Premium shared UI components
 * Import these in ANY screen for consistent design language.
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radii } from '@/theme';
import { Card } from './Card';

// ─── StatChip ─────────────────────────────────────────────────────────────────
// Horizontal-scrollable stat pill. Use inside a <ScrollView horizontal>.
export interface StatChipData {
  key: string;
  label: string;
  value: number | string;
  icon: string;       // Ionicons name
  color: string;      // accent color when active
}

interface StatChipProps {
  data: StatChipData;
  active?: boolean;
  onPress?: () => void;
}

export function StatChip({ data, active, onPress }: StatChipProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        styles.statChip,
        active && { backgroundColor: data.color },
      ]}
    >
      <View
        style={[
          styles.statIconWrap,
          { backgroundColor: active ? 'rgba(255,255,255,0.25)' : data.color + '18' },
        ]}
      >
        <Ionicons name={data.icon as any} size={16} color={active ? '#fff' : data.color} />
      </View>
      <Text style={[styles.statValue, active && { color: '#fff' }]}>{data.value}</Text>
      <Text style={[styles.statLabel, active && { color: 'rgba(255,255,255,0.85)' }]}>
        {data.label}
      </Text>
    </TouchableOpacity>
  );
}

// ─── StatChipRow ──────────────────────────────────────────────────────────────
// Convenience wrapper: horizontal scrolling row of StatChips.
interface StatChipRowProps {
  chips: StatChipData[];
  activeKey?: string;
  onSelect?: (key: string) => void;
  style?: ViewStyle;
}

export function StatChipRow({ chips, activeKey, onSelect, style }: StatChipRowProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={[{ marginBottom: spacing.md }, style]}
    >
      {chips.map((c) => (
        <StatChip
          key={c.key}
          data={c}
          active={activeKey === c.key}
          onPress={() => onSelect?.(c.key)}
        />
      ))}
    </ScrollView>
  );
}

// ─── ActionButton ─────────────────────────────────────────────────────────────
// Colored pill with icon + label for card action rows.
interface ActionButtonProps {
  icon: string;
  color: string;
  label: string;
  onPress: () => void;
}

export function ActionButton({ icon, color, label, onPress }: ActionButtonProps) {
  return (
    <TouchableOpacity
      style={[styles.actionBtn, { backgroundColor: color + '15' }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons name={icon as any} size={15} color={color} />
      <Text style={[styles.actionBtnLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── IconButton ───────────────────────────────────────────────────────────────
// Standalone icon-only tappable circle/pill.
interface IconButtonProps {
  icon: string;
  color: string;
  size?: number;
  onPress: () => void;
}

export function IconButton({ icon, color, size = 18, onPress }: IconButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.iconBtn, { backgroundColor: color + '15' }]}
    >
      <Ionicons name={icon as any} size={size} color={color} />
    </TouchableOpacity>
  );
}

// ─── InfoChip ─────────────────────────────────────────────────────────────────
// Small metadata chip with icon (date, phone, room, etc).
interface InfoChipProps {
  icon: string;
  label: string;
  muted?: boolean;
}

export function InfoChip({ icon, label, muted }: InfoChipProps) {
  return (
    <View style={[styles.infoChip, muted && { opacity: 0.5 }]}>
      <Ionicons name={icon as any} size={12} color={colors.muted} style={{ marginRight: 4 }} />
      <Text style={styles.infoChipText} numberOfLines={1}>{label}</Text>
    </View>
  );
}

// ─── SectionCard ──────────────────────────────────────────────────────────────
// Grouped card with icon + title header. Use inside modals / forms.
interface SectionCardProps {
  title: string;
  icon: string;
  children: React.ReactNode;
  style?: ViewStyle;
}

export function SectionCard({ title, icon, children, style }: SectionCardProps) {
  return (
    <Card style={[styles.sectionCard, style]}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconWrap}>
          <Ionicons name={icon as any} size={15} color={colors.primary} />
        </View>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {children}
    </Card>
  );
}

// ─── DetailRow ────────────────────────────────────────────────────────────────
// Label / value pair for view modals.
interface DetailRowProps {
  label: string;
  value?: string;
  highlight?: boolean;
}

export function DetailRow({ label, value, highlight }: DetailRowProps) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text
        style={[
          styles.detailValue,
          highlight && { color: colors.primary, fontWeight: '700' },
        ]}
      >
        {value || '—'}
      </Text>
    </View>
  );
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────
// Standard search bar + right-side action slot.
interface ToolbarProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function Toolbar({ children, style }: ToolbarProps) {
  return <View style={[styles.toolbar, style]}>{children}</View>;
}

// ─── SearchBox ────────────────────────────────────────────────────────────────
// Search input with icon, meant to be placed inside a Toolbar.
interface SearchBoxProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function SearchBox({ children, style }: SearchBoxProps) {
  return (
    <View style={[styles.searchBox, style]}>
      <Ionicons name="search-outline" size={16} color={colors.muted} style={{ marginRight: 6 }} />
      {children}
    </View>
  );
}

// ─── AddButton ────────────────────────────────────────────────────────────────
// Primary action FAB-style button for toolbars.
interface AddButtonProps {
  label?: string;
  onPress: () => void;
}

export function AddButton({ label = 'Add', onPress }: AddButtonProps) {
  return (
    <TouchableOpacity style={styles.addBtn} onPress={onPress} activeOpacity={0.8}>
      <Ionicons name="add" size={18} color="#fff" />
      <Text style={styles.addBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?: string;
  title?: string;
  subtitle?: string;
}

export function EmptyState({
  icon = 'file-tray-outline',
  title = 'No data found',
  subtitle = 'Try adjusting your filters',
}: EmptyStateProps) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon as any} size={48} color={colors.muted} />
      <Text style={styles.emptyText}>{title}</Text>
      <Text style={styles.emptySubText}>{subtitle}</Text>
    </View>
  );
}

// ─── PageContainer ────────────────────────────────────────────────────────────
// Outermost wrapper for every screen.
export function PageContainer({ children }: { children: React.ReactNode }) {
  return <View style={styles.pageContainer}>{children}</View>;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // page
  pageContainer: { flex: 1, backgroundColor: '#F5F6FA' },

  // stat chips
  statChip: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.lg,
    marginRight: 8,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 80,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  statValue: { fontSize: 17, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 9, color: colors.muted, fontWeight: '600', marginTop: 1 },

  // action buttons
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.sm,
  },
  actionBtnLabel: { fontSize: 12, fontWeight: '600' },

  // icon button
  iconBtn: {
    padding: 10,
    borderRadius: radii.sm,
  },

  // info chip
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radii.sm,
  },
  infoChipText: { fontSize: 11, color: colors.text, fontWeight: '500', maxWidth: 140 },

  // section card
  sectionCard: { marginBottom: spacing.md, padding: spacing.md, borderRadius: radii.card },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: spacing.md },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    backgroundColor: colors.primaryBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.primary },

  // detail row
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: { fontSize: 12, color: colors.muted, fontWeight: '500' },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    textAlign: 'right',
    marginLeft: 10,
  },

  // toolbar
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingLeft: spacing.sm,
    height: 44,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radii.card,
  },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // empty state
  emptyState: { alignItems: 'center', paddingVertical: 48 },
  emptyText: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 12 },
  emptySubText: { fontSize: 13, color: colors.muted, marginTop: 4 },
});
