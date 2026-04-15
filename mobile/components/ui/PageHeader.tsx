import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors, spacing } from '@/theme';

type Props = {
  title: string;
  subtitle?: string;
  fallback?: any; // ✅ fix TS error
};

export default function PageHeader({ title, subtitle }: Props) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}
// export default function PageHeader({ title, subtitle, fallback }: Props) {
//   const router = useRouter();

//   return (
//     <View style={styles.wrapper}>
//       <View style={styles.container}>
        
//         {/* Back Row */}
//         <TouchableOpacity
//           style={styles.backRow}
//           onPress={() => {
//             if (router.canGoBack()) router.back();
//             else if (fallback) router.replace(fallback);
//           }}
//         >
//           <Ionicons name="arrow-back" size={18} color={colors.primary} />
//           <Text style={styles.backText}>Back</Text>
//         </TouchableOpacity>

//         {/* Title */}
//         <Text style={styles.title}>{title}</Text>

//         {/* Subtitle */}
//         {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
//       </View>
//     </View>
//   );
// }

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
    marginTop: spacing.md,
  },
  container: {
    backgroundColor: '#fff',
    padding: spacing.lg,
    borderRadius: 18,

    // ✅ THIS is what you were missing (card effect)
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  backText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  title: {
    fontSize: 22,            // ✅ bigger like vehicle screen
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 4,
  },
});