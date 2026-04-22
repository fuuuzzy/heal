import React from 'react';
import { View, StyleSheet, Platform, TouchableOpacity, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';
import { useColorScheme } from '@/components/useColorScheme';
import { lightColors, darkColors, fontSizes } from '@/constants/theme';
import { hapticPatterns } from '@/utils/haptics';

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
          height: 80,
          paddingBottom: Platform.OS === 'ios' ? 20 : 12,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarBackground: () => (
          <BlurView
            intensity={colorScheme === 'dark' ? 40 : 80}
            tint={colorScheme === 'dark' ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
        ),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: '计划',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="leaf" color={color} focused={focused} />
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
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="heart" color={color} focused={focused} />
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
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name="book" color={color} focused={focused} />
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
  iconContainer: {
    width: 44,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  iconContainerFocused: {
    backgroundColor: 'rgba(168, 120, 36, 0.1)',
  },
});
