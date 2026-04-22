/**
 * Skeleton Loading Components
 * 骨架屏组件，用于加载状态
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';
import { lightColors, darkColors, borderRadius } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

interface SkeletonProps {
  width?: number;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = 100, height = 16, borderRadius: radius = 8, style }: SkeletonProps) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;

  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const shimmerColor = interpolateColor(
      progress.value,
      [0, 0.5, 1],
      [
        colorScheme === 'dark' ? colors.surfaceElevated : colors.lineFaint,
        colorScheme === 'dark' ? colors.surfaceHover : colors.surfaceElevated,
        colorScheme === 'dark' ? colors.surfaceElevated : colors.lineFaint,
      ]
    );

    return {
      backgroundColor: shimmerColor,
    };
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

// Dashboard Stats Skeleton
export function DashboardStatsSkeleton() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;

  return (
    <View style={styles.statsRow}>
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.line }]}
        >
          <Skeleton width={60} height={24} borderRadius={4} style={{ marginBottom: 8 }} />
          <Skeleton width={40} height={12} borderRadius={4} />
        </View>
      ))}
    </View>
  );
}

// Plan Card Skeleton
export function PlanCardSkeleton() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;

  return (
    <View style={[styles.planCard, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      <View style={styles.planHeader}>
        <View style={{ flex: 1 }}>
          <Skeleton width={120} height={18} borderRadius={4} style={{ marginBottom: 6 }} />
          <Skeleton width={80} height={12} borderRadius={4} />
        </View>
        <Skeleton width={50} height={24} borderRadius={8} />
      </View>
      <View style={styles.progressSection}>
        <View style={{ height: 6, flex: 1 }}>
          <Skeleton width={300} height={6} borderRadius={3} />
        </View>
      </View>
    </View>
  );
}

// Grid Skeleton
export function GridSkeleton({ columns = 8, rows = 6 }: { columns?: number; rows?: number }) {
  return (
    <View style={styles.gridContainer}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <View key={rowIndex} style={styles.gridRow}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={colIndex}
              width={38}
              height={38}
              borderRadius={borderRadius.lg}
              style={{ marginRight: 6, marginBottom: 6 }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    alignItems: 'center',
  },
  planCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressSection: {
    gap: 8,
  },
  gridContainer: {
    padding: 12,
  },
  gridRow: {
    flexDirection: 'row',
  },
});
