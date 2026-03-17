import React from "react";
import { View, Text, StyleSheet } from "react-native";
import BackButton from "./BackButton";
import { colors, spacing, typography } from "@/theme";

type Props = {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  fallback?: string;
};

export default function Header({ title, subtitle, showBack = true, fallback = "/(drawer)" }: Props) {
  return (
    <View style={styles.container}>
      {showBack && <BackButton fallback={fallback} />}
      
      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleContainer: {
    marginTop: spacing.sm,
  },
  title: {
    ...typography.h2,
    color: colors.primary,
  },
  subtitle: {
    ...typography.small,
    color: colors.muted,
    marginTop: 2,
  },
});
