import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography } from '@/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!', headerShown: true }} />
      <View style={styles.container}>
        <View style={styles.content}>
            <View style={styles.iconCircle}>
                <Ionicons name="alert-circle-outline" size={60} color={colors.error} />
            </View>
            <Text style={styles.title}>Route Resolution Error</Text>
            <Text style={styles.message}>
                The requested page could not be found or failed to load. 
                This usually happens when a route is missing an index file or there is a file conflict.
            </Text>
            <Link href="/" asChild>
                <Link href="/" style={styles.link}>
                    <Text style={styles.linkText}>Return to Home</Text>
                </Link>
            </Link>
        </View>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  iconCircle: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: colors.error + '10',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.body,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  link: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 12,
  },
  linkText: {
    color: colors.white,
    ...typography.label,
    fontWeight: '700',
  },
});
