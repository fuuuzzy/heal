import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {Platform} from 'react-native';

const TOKEN_KEY = 'auth_token';
const THEME_KEY = 'theme_mode';

// iOS: 使用 AsyncStorage（卸载 App 后会被清除）
// Android: 使用 SecureStore（更安全）
const tokenStorage =
    Platform.OS === 'ios'
        ? {
            set: (key: string, value: string) => AsyncStorage.setItem(key, value),
            get: (key: string) => AsyncStorage.getItem(key),
            delete: (key: string) => AsyncStorage.removeItem(key),
        }
        : {
            set: (key: string, value: string) => SecureStore.setItemAsync(key, value),
            get: (key: string) => SecureStore.getItemAsync(key),
            delete: (key: string) => SecureStore.deleteItemAsync(key),
        };

// iOS 一次性迁移：从 Keychain 读取旧 token 并迁移到 AsyncStorage
const migrateTokenFromKeychainIfNeeded = async (): Promise<string | null> => {
    if (Platform.OS !== 'ios') return null;
    try {
        const legacyToken = await SecureStore.getItemAsync(TOKEN_KEY);
        if (legacyToken && legacyToken.trim()) {
            await AsyncStorage.setItem(TOKEN_KEY, legacyToken);
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            return legacyToken;
        }
    } catch (e) {
        console.error('Error migrating token from Keychain', e);
    }
    return null;
};

export const storage = {
    async setToken(token: string) {
        try {
            await tokenStorage.set(TOKEN_KEY, token);
        } catch (e) {
            console.error('Error saving token', e);
        }
    },

    async getToken() {
        try {
            let token = await tokenStorage.get(TOKEN_KEY);
            // 兼容旧版本：iOS 若 AsyncStorage 为空，则尝试从 Keychain 迁移
            if (!token && Platform.OS === 'ios') {
                token = await migrateTokenFromKeychainIfNeeded();
            }
            return token;
        } catch (e) {
            console.error('Error getting token', e);
            return null;
        }
    },

    async clearToken() {
        try {
            await tokenStorage.delete(TOKEN_KEY);
        } catch (e) {
            console.error('Error clearing token', e);
        }
    },

    async setTheme(mode: 'light' | 'dark' | 'auto') {
        try {
            await AsyncStorage.setItem(THEME_KEY, mode);
        } catch (e) {
            console.error('Error saving theme', e);
        }
    },

    async getTheme(): Promise<'light' | 'dark' | 'auto'> {
        try {
            const mode = await AsyncStorage.getItem(THEME_KEY);
            return (mode as 'light' | 'dark' | 'auto') || 'auto';
        } catch (e) {
            console.error('Error getting theme', e);
            return 'auto';
        }
    },

    async clear() {
        try {
            await tokenStorage.delete(TOKEN_KEY);
            await AsyncStorage.removeItem(THEME_KEY);
        } catch (e) {
            console.error('Error clearing storage', e);
        }
    }
};
