/**
 * Liquid Glass Component
 * 液态玻璃组件 - 使用 BlurView 实现毛玻璃效果
 * iOS 26+ 原生液态玻璃需要真机支持
 */
import React from 'react';
import {StyleProp, StyleSheet, ViewStyle} from 'react-native';
import {BlurView} from 'expo-blur';

interface LiquidGlassProps {
    style?: StyleProp<ViewStyle>;
    intensity?: number;
    tint?: 'light' | 'dark' | 'default';
    children?: React.ReactNode;
}

export function LiquidGlass({
                                style,
                                intensity = 80,
                                tint = 'light',
                                children,
                            }: LiquidGlassProps) {
    return (
        <BlurView
            style={style}
            intensity={intensity}
            tint={tint}
        >
            {children}
        </BlurView>
    );
}

// Tab Bar specific glass background
interface TabBarGlassProps {
    colorScheme: 'light' | 'dark';
}

export function TabBarGlass({colorScheme}: TabBarGlassProps) {
    return (
        <BlurView
            style={StyleSheet.absoluteFill}
            intensity={colorScheme === 'dark' ? 40 : 80}
            tint={colorScheme === 'dark' ? 'dark' : 'light'}
        />
    );
}
