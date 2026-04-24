import FontAwesome from '@expo/vector-icons/FontAwesome';
import {DarkTheme, DefaultTheme, ThemeProvider} from '@react-navigation/native';
import {useFonts} from 'expo-font';
import {Stack, useRouter, useSegments} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import {useEffect} from 'react';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import 'react-native-reanimated';

import {useColorScheme} from '@/components/useColorScheme';
import {AuthProvider, useAuth} from '@/hooks/useAuth';

export {
    ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
    initialRouteName: '(auth)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const [loaded, error] = useFonts({
        SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
        ...FontAwesome.font,
    });

    useEffect(() => {
        if (error) throw error;
    }, [error]);

    useEffect(() => {
        if (loaded) {
            SplashScreen.hideAsync();
        }
    }, [loaded]);

    if (!loaded) {
        return null;
    }

    return <RootLayoutNav/>;
}

function AuthGate({children}: { children: React.ReactNode }) {
    const {user, loading} = useAuth();
    const segments = useSegments();
    const router = useRouter();

    useEffect(() => {
        if (loading) return;

        const inAuthGroup = segments[0] === '(auth)';

        if (!user && !inAuthGroup) {
            router.replace('/(auth)/login');
        } else if (user && inAuthGroup) {
            router.replace('/(tabs)');
        }
    }, [user, loading, segments]);

    if (loading) return null;

    return <>{children}</>;
}

function RootLayoutNav() {
    const colorScheme = useColorScheme();

    return (
        <GestureHandlerRootView style={{flex: 1}}>
            <SafeAreaProvider>
                <AuthProvider>
                    <AuthGate>
                        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                            <Stack>
                                <Stack.Screen name="(tabs)" options={{headerShown: false}}/>
                                <Stack.Screen name="(auth)" options={{headerShown: false}}/>
                                <Stack.Screen
                                    name="profile"
                                    options={{headerShown: false, animation: 'slide_from_right'}}
                                />
                                <Stack.Screen
                                    name="plan/[id]"
                                    options={{headerShown: false, animation: 'slide_from_right'}}
                                />
                                <Stack.Screen
                                    name="plan/new"
                                    options={{headerShown: false, animation: 'slide_from_bottom'}}
                                />
                            </Stack>
                        </ThemeProvider>
                    </AuthGate>
                </AuthProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
