import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { colors, spacing } from '@/theme';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'error' | 'warning' | 'info' | 'muted' | 'primary';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'muted', style, textStyle }) => {
  return (
    <View style={[styles.badge, styles[variant], style]}>
      <Text style={[styles.text, styles[`text_${variant}`], textStyle]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  success: {
    backgroundColor: colors.successBg,
  },
  text_success: {
    color: colors.success,
  },
  error: {
    backgroundColor: colors.errorBg,
  },
  text_error: {
    color: colors.error,
  },
  warning: {
    backgroundColor: colors.warningBg,
  },
  text_warning: {
    color: colors.warning,
  },
  info: {
    backgroundColor: colors.infoBg,
  },
  text_info: {
    color: colors.info,
  },
  muted: {
    backgroundColor: '#F3F4F6',
  },
  text_muted: {
    color: colors.muted,
  },
  primary: {
    backgroundColor: colors.primaryBg,
  },
  text_primary: {
    color: colors.primary,
  },
});
