/**
 * Bottom Sheet Component
 * 底部抽屉组件 - 用于存入承诺等操作
 * 使用 iOS 26+ 液态玻璃效果
 */
import React, { useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { lightColors, darkColors, borderRadius, shadows } from '@/constants/theme';
import { timing } from '@/constants/animations';
import { useColorScheme } from '@/components/useColorScheme';
import { LiquidGlass } from './LiquidGlass';

const { height: screenHeight } = Dimensions.get('window');

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapHeight?: number; // Height of the sheet
  showHandle?: boolean;
}

export function BottomSheet({
  visible,
  onClose,
  children,
  snapHeight = 400,
  showHandle = true,
}: BottomSheetProps) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const insets = useSafeAreaInsets();

  const translateY = useSharedValue(screenHeight);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      backdropOpacity.value = withTiming(0.5, { duration: timing.normal });
    } else {
      translateY.value = withTiming(screenHeight, { duration: timing.fast });
      backdropOpacity.value = withTiming(0, { duration: timing.fast });
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const gesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 100 || event.velocityY > 500) {
        translateY.value = withTiming(screenHeight, { duration: timing.fast });
        backdropOpacity.value = withTiming(0, { duration: timing.fast }, () => {
          runOnJS(handleClose)();
        });
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!visible) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdropPressable} onPress={handleClose}>
        <Animated.View style={[styles.backdrop, backdropStyle]} />
      </Pressable>

      <GestureDetector gesture={gesture}>
        <Animated.View
          style={[
            styles.sheet,
            {
              paddingBottom: insets.bottom + 16,
            },
            sheetStyle,
          ]}
        >
          <LiquidGlass
            style={StyleSheet.absoluteFill}
            intensity={colorScheme === 'dark' ? 40 : 90}
            tint={colorScheme === 'dark' ? 'dark' : 'light'}
          />

          {showHandle && (
            <View style={styles.handleContainer}>
              <View style={[styles.handle, { backgroundColor: colors.line }]} />
            </View>
          )}

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.content}
          >
            {children}
          </KeyboardAvoidingView>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
  },
  backdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    ...shadows.lg,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  content: {
    flex: 0,
  },
});
