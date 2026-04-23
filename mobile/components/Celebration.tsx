/**
 * Celebration Component
 * 庆祝动画组件 - 用于里程碑和完成庆祝
 */
import React, {useEffect, useRef} from 'react';
import {Dimensions, StyleSheet, View} from 'react-native';
import ConfettiCannon from 'react-native-confetti-cannon';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {celebrationAnimations} from '@/constants/animations';

const {width, height} = Dimensions.get('window');

interface CelebrationProps {
    trigger: boolean;
    type?: 'milestone' | 'complete';
    milestone?: number; // 25, 50, 75, 100
    onComplete?: () => void;
}

export function Celebration({trigger, type = 'complete', milestone, onComplete}: CelebrationProps) {
    const confettiRef = useRef<ConfettiCannon>(null);
    const scale = useSharedValue(0);
    const opacity = useSharedValue(0);

    useEffect(() => {
        if (trigger) {
            // Fire confetti
            confettiRef.current?.start();

            // Pop animation for milestone badge
            scale.value = withSequence(
                withSpring(1.15, {damping: 8, stiffness: 200}),
                withTiming(1, {duration: 200})
            );
            opacity.value = withTiming(1, {duration: 300});

            // Auto hide after animation
            const timer = setTimeout(() => {
                opacity.value = withTiming(0, {duration: 300});
                scale.value = withTiming(0, {duration: 300});
                if (onComplete) {
                    onComplete();
                }
            }, celebrationAnimations.confetti.duration);

            return () => clearTimeout(timer);
        }
    }, [trigger]);

    const badgeStyle = useAnimatedStyle(() => ({
        transform: [{scale: scale.value}],
        opacity: opacity.value,
    }));

    return (
        <View style={styles.container} pointerEvents="none">
            <ConfettiCannon
                ref={confettiRef}
                count={celebrationAnimations.confetti.count}
                origin={{x: width / 2, y: height}}
                fadeOut
                autoStart={false}
                colors={['#A87824', '#C9963B', '#DBA94E', '#F59E0B', '#6E6EDE', '#6366F1']}
            />

            {milestone && (
                <Animated.View style={[styles.badgeContainer, badgeStyle]}>
                    <View style={styles.badge}>
                        {milestone === 100 ? (
                            <Animated.Text style={styles.badgeText}>🎉 完成！</Animated.Text>
                        ) : (
                            <Animated.Text style={styles.badgeText}>🎯 {milestone}%</Animated.Text>
                        )}
                    </View>
                </Animated.View>
            )}
        </View>
    );
}

// Simple particle explosion for smaller celebrations
export function ParticleExplosion({trigger, x = width / 2, y = height / 2}: {
    trigger: boolean;
    x?: number;
    y?: number
}) {
    const confettiRef = useRef<ConfettiCannon>(null);

    useEffect(() => {
        if (trigger) {
            confettiRef.current?.start();
        }
    }, [trigger]);

    return (
        <ConfettiCannon
            ref={confettiRef}
            count={20}
            origin={{x, y}}
            fadeOut
            autoStart={false}
            explosionSpeed={300}
            fallSpeed={3000}
            colors={['#A87824', '#C9963B']}
        />
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 1000,
    },
    badgeContainer: {
        position: 'absolute',
        top: '30%',
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    badge: {
        backgroundColor: '#A87824',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
        shadowColor: '#A87824',
        shadowOffset: {width: 0, height: 4},
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
    },
});
