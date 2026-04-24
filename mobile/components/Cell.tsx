/**
 * Animated Cell Component
 * 带动画效果的储蓄格子组件
 */
import React, {useEffect} from 'react';
import {StyleSheet, Text, TouchableOpacity, View, ViewStyle} from 'react-native';
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
    size?: number;
    testID?: string;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function Cell({index, status, isMine, onPress, onLongPress, size = 38, testID}: CellProps) {
    const colorScheme = useColorScheme();
    const colors = colorScheme === 'dark' ? darkColors : lightColors;

    const scale = useSharedValue(1);
    const opacity = useSharedValue(status === 'empty' ? 0.5 : 1);
    const pulseScale = useSharedValue(1);

    // Breathing for empty cells
    useEffect(() => {
        if (status === 'empty') {
            opacity.value = withRepeat(
                withSequence(
                    withTiming(0.75, {duration: cellAnimations.breathe.duration / 2}),
                    withTiming(0.45, {duration: cellAnimations.breathe.duration / 2})
                ),
                -1,
                false
            );
        }
    }, [status]);

    // Pulse for pending cells
    useEffect(() => {
        if (status === 'pending') {
            pulseScale.value = withRepeat(
                withSequence(
                    withTiming(1.06, {duration: 800, easing: Easing.inOut(Easing.ease)}),
                    withTiming(1, {duration: 800, easing: Easing.inOut(Easing.ease)})
                ),
                -1,
                false
            );
        }
    }, [status]);

    const animatedStyle = useAnimatedStyle(() => {
        const result: ViewStyle = {
            transform: [{scale: scale.value * (status === 'pending' ? pulseScale.value : 1)}],
        };
        if (status === 'empty') {
            result.opacity = opacity.value;
        }
        return result;
    });

    const handlePressIn = () => {
        scale.value = withSpring(0.92, {damping: 20, stiffness: 400});
    };

    const handlePressOut = () => {
        scale.value = withSpring(1, {damping: 20, stiffness: 400});
    };

    const handlePress = () => {
        hapticPatterns.cellTap();
        onPress();
    };

    const getCellStyle = (): ViewStyle => {
        const base: ViewStyle = {
            width: size,
            height: size,
            borderRadius: borderRadius.lg,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
        };

        switch (status) {
            case 'empty':
                return {
                    ...base,
                    borderWidth: 1.5,
                    borderStyle: 'dashed',
                    borderColor: colors.lineLight,
                    backgroundColor: 'transparent',
                };
            case 'filled':
                return {
                    ...base,
                    ...shadows.sm,
                    borderWidth: 0,
                    backgroundColor: isMine ? colors.cellMineBg : colors.cellMateBg,
                };
            case 'pending':
                return {
                    ...base,
                    borderWidth: 1.5,
                    borderColor: 'rgba(245, 158, 11, 0.4)',
                    backgroundColor: 'rgba(245, 158, 11, 0.05)',
                };
            default:
                return base;
        }
    };

    const renderContent = () => {
        switch (status) {
            case 'empty':
                return (
                    <View style={styles.emptyInner}>
                        <View style={[styles.plusH, {backgroundColor: colors.lineLight}]}/>
                        <View style={[styles.plusV, {backgroundColor: colors.lineLight}]}/>
                    </View>
                );
            case 'filled':
                return (
                    <View style={[
                        styles.filledInner,
                        {
                            backgroundColor: isMine
                                ? 'rgba(168, 120, 36, 0.18)'
                                : 'rgba(79, 79, 200, 0.18)',
                        }
                    ]}>
                        <View style={[
                            styles.filledDot,
                            {backgroundColor: isMine ? colors.gold : colors.mate}
                        ]}/>
                    </View>
                );
            case 'pending':
                return (
                    <View style={styles.pendingInner}>
                        <Text style={[styles.pendingText, {color: '#F59E0B'}]}>~</Text>
                    </View>
                );
            default:
                return null;
        }
    };

    return (
        <AnimatedTouchable
            style={[getCellStyle(), animatedStyle]}
            onPress={handlePress}
            onLongPress={onLongPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.9}
            testID={testID}
        >
            {renderContent()}
        </AnimatedTouchable>
    );
}

const styles = StyleSheet.create({
    // Empty cell: subtle plus icon
    emptyInner: {
        width: 14,
        height: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    plusH: {
        position: 'absolute',
        width: 12,
        height: 1.5,
        borderRadius: 1,
    },
    plusV: {
        position: 'absolute',
        width: 1.5,
        height: 12,
        borderRadius: 1,
    },
    // Filled cell: glowing dot
    filledInner: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filledDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    // Pending cell
    pendingInner: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    pendingText: {
        fontSize: 18,
        fontWeight: '700',
    },
});
