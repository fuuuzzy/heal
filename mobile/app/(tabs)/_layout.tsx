import React from 'react';
import {StyleSheet, View} from 'react-native';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import {Tabs} from 'expo-router';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {BlurView} from 'expo-blur';
import {useColorScheme} from '@/components/useColorScheme';
import {darkColors, lightColors} from '@/constants/theme';
import {hapticPatterns} from '@/utils/haptics';

function TabBarIcon(props: {
    name: React.ComponentProps<typeof FontAwesome>['name'];
    color: string;
    focused: boolean;
}) {
    return (
        <View style={[styles.iconContainer, props.focused && styles.iconContainerFocused]}>
            <FontAwesome
                size={props.focused ? 24 : 22}
                name={props.name}
                color={props.color}
            />
        </View>
    );
}

export default function TabLayout() {
    const colorScheme = useColorScheme();
    const colors = colorScheme === 'dark' ? darkColors : lightColors;
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={{
                tabBarActiveTintColor: colors.gold,
                tabBarInactiveTintColor: colors.txtMuted,
                headerShown: false,
                tabBarStyle: {
                    position: 'absolute',
                    backgroundColor: 'transparent',
                    borderTopWidth: 0,
                    elevation: 0,
                    height: 72 + insets.bottom,
                    paddingBottom: insets.bottom,
                    paddingTop: 8,
                },
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '600',
                    marginTop: 4,
                },
                tabBarItemStyle: {
                    paddingVertical: 4,
                },
                tabBarBackground: () => (
                    <View style={styles.tabBarContainer}>
                        <BlurView
                            style={styles.tabBarBlur}
                            intensity={colorScheme === 'dark' ? 30 : 70}
                            tint={colorScheme === 'dark' ? 'dark' : 'light'}
                        />
                        <View style={[styles.tabBarBorder, {backgroundColor: colors.line + '30'}]}/>
                    </View>
                ),
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: '计划',
                    tabBarIcon: ({color, focused}) => (
                        <TabBarIcon name="leaf" color={color} focused={focused}/>
                    ),
                }}
                listeners={{
                    tabPress: () => hapticPatterns.tabSwitch(),
                }}
            />
            <Tabs.Screen
                name="partner"
                options={{
                    title: '伴侣',
                    tabBarIcon: ({color, focused}) => (
                        <TabBarIcon name="heart" color={color} focused={focused}/>
                    ),
                }}
                listeners={{
                    tabPress: () => hapticPatterns.tabSwitch(),
                }}
            />
            <Tabs.Screen
                name="archive"
                options={{
                    title: '归档',
                    tabBarIcon: ({color, focused}) => (
                        <TabBarIcon name="archive" color={color} focused={focused}/>
                    ),
                }}
                listeners={{
                    tabPress: () => hapticPatterns.tabSwitch(),
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBarContainer: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
    },
    tabBarBlur: {
        ...StyleSheet.absoluteFillObject,
    },
    tabBarBorder: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 0.5,
    },
    iconContainer: {
        width: 48,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 14,
    },
    iconContainerFocused: {
        backgroundColor: 'rgba(168, 120, 36, 0.12)',
        transform: [{scale: 1.05}],
    },
});
