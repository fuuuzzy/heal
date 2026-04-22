/**
 * Animated Progress Bar
 * 带动画的进度条组件
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { lightColors, darkColors } from '@/constants/theme';
import { progressAnimations } from '@/constants/animations';
import { useColorScheme } from '@/components/useColorScheme';

interface AnimatedProgressBarProps {
  progress: number; // 0-100
  height?: number;
  backgroundColor?: string;
  fillColor?: string;
  showMilestones?: boolean;
  animated?: boolean;
  style?: ViewStyle;
}

export function AnimatedProgressBar({
  progress,
  height = 6,
  backgroundColor,
  fillColor,
  showMilestones = false,
  animated = true,
  style,
}: AnimatedProgressBarProps) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;

  const width = useSharedValue(0);

  useEffect(() => {
    if (animated) {
      width.value = withTiming(Math.min(progress, 100), {
        duration: progressAnimations.fillDuration,
        easing: Easing.out(Easing.cubic),
      });
    } else {
      width.value = Math.min(progress, 100);
    }
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  const bgColor = backgroundColor || colors.lineFaint;
  const fgColor = fillColor || colors.gold;

  return (
    <View style={[styles.container, { height, backgroundColor: bgColor, borderRadius: height / 2 }, style]}>
      <Animated.View
        style={[
          styles.fill,
          {
            backgroundColor: fgColor,
            borderRadius: height / 2,
          },
          animatedStyle,
        ]}
      />
      {showMilestones && (
        <>
          <View style={[styles.milestone, { left: '25%' }]} />
          <View style={[styles.milestone, { left: '50%' }]} />
          <View style={[styles.milestone, { left: '75%' }]} />
        </>
      )}
    </View>
  );
}

// Gradient Progress Bar with milestone markers
export function GradientProgressBar({
  progress,
  height = 6,
  showMilestones = false,
  style,
}: Omit<AnimatedProgressBarProps, 'backgroundColor' | 'fillColor'>) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;

  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(Math.min(progress, 100), {
      duration: progressAnimations.fillDuration,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${width.value}%`,
  }));

  return (
    <View style={[styles.container, { height, backgroundColor: colors.lineFaint, borderRadius: height / 2 }, style]}>
      <Animated.View
        style={[
          styles.gradientFill,
          { borderRadius: height / 2 },
          animatedStyle,
        ]}
      />
      {showMilestones && (
        <>
          <View style={[styles.milestone, { left: '25%' }]} />
          <View style={[styles.milestone, { left: '50%' }]} />
          <View style={[styles.milestone, { left: '75%' }]} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  fill: {
    height: '100%',
  },
  gradientFill: {
    height: '100%',
    // Gradient effect would need react-native-linear-gradient
    // For now, use solid gold color
    backgroundColor: '#A87824',
  },
  milestone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
});
