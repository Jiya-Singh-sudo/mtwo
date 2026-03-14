import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  FlatList, 
  ViewStyle, 
  TextStyle 
} from 'react-native';
import { colors, spacing } from '@/theme';

interface Column<T = any> {
  key: string;
  title: string;
  width?: number;
  render?: (item: T, index: number) => React.ReactNode;
}

interface TableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  containerStyle?: ViewStyle;
}

export const Table = <T extends any>({ 
  columns, 
  data, 
  keyExtractor, 
  containerStyle 
}: TableProps<T>) => {
  const renderHeader = () => (
    <View style={styles.headerRow}>
      {columns.map((col) => (
        <View key={col.key} style={[styles.headerCell, col.width ? { width: col.width } : { flex: 1 }]}>
          <Text style={styles.headerText}>{col.title}</Text>
        </View>
      ))}
    </View>
  );

  const renderItem = ({ item, index }: { item: T, index: number }) => (
    <View style={styles.row}>
      {columns.map((col) => (
        <View key={col.key} style={[styles.cell, col.width ? { width: col.width } : { flex: 1 }]}>
          {col.render ? (
            col.render(item, index)
          ) : (
            <Text style={styles.cellText}>{(item as any)[col.key] || '—'}</Text>
          )}
        </View>
      ))}
    </View>
  );

  return (
    <View style={[styles.container, containerStyle]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {renderHeader()}
          <FlatList
            data={data}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            scrollEnabled={false} // Nested inside vertical ScrollView usually
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No data found</Text>
              </View>
            }
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 12,
  },
  headerCell: {
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.muted,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 12,
    backgroundColor: colors.white,
  },
  cell: {
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 14,
    color: colors.text,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
  },
});
