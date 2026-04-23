/**
 * Animated Cell Component
 * 带动画效果的储蓄格子组件
 */
import React, {useEffect} from 'react';
import {StyleSheet, Text, TouchableOpacity, ViewStyle} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {borderRadius, darkColors, lightColors, shadows} from '@/constants/theme';
import {cellAnimations} from '@/constants/animations';
import {hapticPatterns} from '@/utils/haptics';
import {useColorScheme} from '@/components/useColorScheme';

type CellStatus = 'empty' | 'filled' | 'pending';

interface CellProps {
    index: number;
    status: CellStatus;
    isMine: boolean;
    onPress: () => void;
    onLongPress?: () => void;
    testID?: string;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export function Cell({index, status, isMine, onPress, onLongPress, testID}: CellProps) {
    const colorScheme = useColorScheme();
    const colors = colorScheme === 'dark' ? darkColors : lightColors;

    // Animation values
    const scale = useSharedValue(1);
    const opacity = useSharedValue(status === 'empty' ? 0.6 : 1);
    const shimmerPosition = useSharedValue(-1);

    // Breathing animation for empty cells
    useEffect(() => {
        if (status === 'empty') {
            opacity.value = withRepeat(
                withSequence(
                    withTiming(0.85, {duration: cellAnimations.breathe.duration / 2}),
                    withTiming(0.6, {duration: cellAnimations.breathe.duration / 2})
                ),
                -1, // infinite
                false
            );
        }
    }, [status]);

    // Shimmer animation for filled cells
    useEffect(() => {
        if (status === 'filled') {
            shimmerPosition.value = withRepeat(
                withTiming(1, {duration: cellAnimations.shimmer.duration, easing: Easing.inOut(Easing.ease)}),
                -1,
                false
            );
        }
    }, [status]);

    const animatedStyle = useAnimatedStyle(() => {
        const result: ViewStyle = {
            transform: [{scale: scale.value}],
        };

        if (status === 'empty') {
            result.opacity = opacity.value;
        }

        return result;
    });

    const handlePressIn = () => {
        scale.value = withSpring(cellAnimations.press.scaleDown, {damping: 20, stiffness: 400});
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, {damping: 20, stiffness: 400});
    };

    const handlePress = () => {
        hapticPatterns.cellTap();
        onPress();
    };

    // Get cell style based on status
    const getCellStyle = (): ViewStyle => {
        const baseStyle: ViewStyle = {
            width: 38,
            height: 38,
            borderRadius: borderRadius.lg,
            alignItems: 'center',
            justifyContent: 'center',
        };

        switch (status) {
            case 'empty':
                return {
                    ...baseStyle,
                    borderWidth: 1,
                    borderStyle: 'dashed',
                    borderColor: colors.lineLight,
                    backgroundColor: 'transparent',
                };
            case 'filled':
                return {
                    ...baseStyle,
                    ...shadows.sm,
                    borderWidth: 1.5,
                    borderColor: isMine
                        ? 'rgba(168, 120, 36, 0.35)'
                        : 'rgba(79, 79, 200, 0.35)',
                    backgroundColor: isMine ? colors.cellMineBg : colors.cellMateBg,
                };
            case 'pending':
                return {
                    ...baseStyle,
                    borderWidth: 1,
                    borderColor: 'rgba(245, 158, 11, 0.5)',
                    backgroundColor: 'rgba(245, 158, 11, 0.06)',
                };
            default:
                return baseStyle;
        }
    };

    // Get text content and color
    const getTextContent = (): string => {
        switch (status) {
            case 'empty':
                return String(index + 1);
            case 'filled':
                return '◆';
            case 'pending':
                return '?';
            default:
                return String(index + 1);
        }
    };

    const getTextColor = (): string => {
        switch (status) {
            case 'empty':
                return colors.txtMuted;
            case 'filled':
                return isMine ? colors.gold : colors.mate;
            case 'pending':
                return '#F59E0B';
            default:
                return colors.txtMuted;
        }
    };

    return (
        <AnimatedTouchableOpacity
            style={[getCellStyle(), animatedStyle]}
            onPress={handlePress}
            onLongPress={onLongPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.9}
            testID={testID}
        >
            <Text style={[styles.cellText, {color: getTextColor()}]}>
                {getTextContent()}
            </Text>
        </AnimatedTouchableOpacity>
    );
}

const styles = StyleSheet.create({
    cellText: {
        fontSize: 12,
        fontWeight: '600',
    },
});
