/**
 * 个人资料页面
 */
import {useState} from 'react';
import {Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,} from 'react-native';
import {useRouter} from 'expo-router';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {FadeInUp, ZoomIn} from 'react-native-reanimated';
import {useAuth} from '@/hooks/useAuth';
import {authService} from '@/services/authService';
import {darkColors, fontSizes, lightColors, spacing} from '@/constants/theme';
import {hapticPatterns} from '@/utils/haptics';
import {useColorScheme} from '@/components/useColorScheme';

const EMOJI_OPTIONS = ['😊', '🥰', '😎', '🤩', '😄', '🥳', '🤗', '😇', '🌟', '💝', '💖'];

export default function ProfileScreen() {
    const {user, refreshUser, logout} = useAuth();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = colorScheme === 'dark' ? darkColors : lightColors;
    const insets = useSafeAreaInsets();

    const [nickname, setNickname] = useState(user?.nickname || '');
    const [selectedEmoji, setSelectedEmoji] = useState(user?.avatar_emoji || '😊');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        if (!nickname.trim()) {
            hapticPatterns.errorShake();
            Alert.alert('提示', '请输入昵称');
            return;
        }

        try {
            setSaving(true);
            hapticPatterns.buttonPress();
            await authService.updateProfile({
                nickname: nickname.trim(),
                avatar_emoji: selectedEmoji,
            });
            await refreshUser();
            hapticPatterns.success();
            Alert.alert('成功', '个人资料已更新');
            router.back();
        } catch (error: any) {
            hapticPatterns.errorShake();
            Alert.alert('错误', error.message || '保存失败');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = () => {
        hapticPatterns.medium();
        Alert.alert(
            '退出登录',
            '确定要退出登录吗？',
            [
                {text: '取消', style: 'cancel'},
                {
                    text: '确定',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await logout();
                            hapticPatterns.success();
                        } catch (error: any) {
                            Alert.alert('错误', error.message || '退出失败');
                        }
                    },
                },
            ]
        );
    };

    return (
        <View style={[styles.container, {backgroundColor: colors.surfaceDark, paddingTop: insets.top}]}>
            {/* Header */}
            <Animated.View entering={FadeInUp.duration(300)} style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
                    <Text style={[styles.backButton, {color: colors.gold}]}>返回</Text>
                </TouchableOpacity>
                <Text style={[styles.title, {color: colors.txtPrimary}]}>个人资料</Text>
                <View style={{width: 40}}/>
            </Animated.View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Avatar Preview */}
                <Animated.View entering={ZoomIn.delay(100).duration(400)} style={styles.avatarPreview}>
                    <View style={[styles.avatarLarge, {backgroundColor: colors.gold + '15'}]}>
                        <Text style={styles.avatarEmojiLarge}>{selectedEmoji}</Text>
                    </View>
                </Animated.View>

                {/* Emoji Selector */}
                <Animated.View entering={FadeInUp.delay(200).duration(300)}>
                    <Text style={[styles.label, {color: colors.txtSecondary}]}>选择头像</Text>
                    <View style={styles.emojiGrid}>
                        {EMOJI_OPTIONS.map((emoji, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[
                                    styles.emojiOption,
                                    selectedEmoji === emoji && {
                                        backgroundColor: colors.gold + '20',
                                        borderColor: colors.gold
                                    },
                                ]}
                                onPress={() => {
                                    hapticPatterns.light();
                                    setSelectedEmoji(emoji);
                                }}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.emojiText}>{emoji}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </Animated.View>

                {/* Nickname Input */}
                <Animated.View entering={FadeInUp.delay(300).duration(300)} style={styles.inputSection}>
                    <Text style={[styles.label, {color: colors.txtSecondary}]}>昵称</Text>
                    <TextInput
                        style={[styles.input, {
                            backgroundColor: colors.surface,
                            borderColor: colors.line,
                            color: colors.txtPrimary
                        }]}
                        placeholder="输入昵称"
                        placeholderTextColor={colors.txtMuted}
                        value={nickname}
                        onChangeText={setNickname}
                        maxLength={20}
                    />
                </Animated.View>

                {/* Username (Read-only) */}
                <Animated.View entering={FadeInUp.delay(350).duration(300)} style={styles.inputSection}>
                    <Text style={[styles.label, {color: colors.txtSecondary}]}>用户名</Text>
                    <View style={[styles.readOnlyField, {backgroundColor: colors.surface, borderColor: colors.line}]}>
                        <Text style={[styles.readOnlyText, {color: colors.txtMuted}]}>{user?.username}</Text>
                    </View>
                </Animated.View>

                {/* Save Button */}
                <Animated.View entering={FadeInUp.delay(400).duration(300)}>
                    <TouchableOpacity
                        style={[styles.saveButton, {backgroundColor: colors.gold}]}
                        onPress={handleSave}
                        disabled={saving}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.saveButtonText, {color: colors.onGold}]}>
                            {saving ? '保存中...' : '保存'}
                        </Text>
                    </TouchableOpacity>
                </Animated.View>

                {/* Logout Button */}
                <Animated.View entering={FadeInUp.delay(450).duration(300)}>
                    <TouchableOpacity
                        style={[styles.logoutButton, {borderColor: colors.danger}]}
                        onPress={handleLogout}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.logoutText, {color: colors.danger}]}>退出登录</Text>
                    </TouchableOpacity>
                </Animated.View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
    },
    backButton: {
        fontSize: fontSizes.md,
        fontWeight: '500',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        paddingHorizontal: spacing.lg,
    },
    avatarPreview: {
        alignItems: 'center',
        paddingVertical: spacing.xl,
    },
    avatarLarge: {
        width: 100,
        height: 100,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarEmojiLarge: {
        fontSize: 50,
    },
    label: {
        fontSize: fontSizes.sm,
        fontWeight: '500',
        marginBottom: spacing.sm,
    },
    emojiGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    emojiOption: {
        width: 52,
        height: 52,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emojiText: {
        fontSize: 28,
    },
    inputSection: {
        marginBottom: spacing.lg,
    },
    input: {
        width: '100%',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        fontSize: fontSizes.md,
    },
    readOnlyField: {
        width: '100%',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: 12,
        borderWidth: 1,
    },
    readOnlyText: {
        fontSize: fontSizes.md,
    },
    saveButton: {
        paddingVertical: spacing.md + 2,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: spacing.md,
    },
    saveButtonText: {
        fontSize: fontSizes.md,
        fontWeight: '600',
    },
    logoutButton: {
        paddingVertical: spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        marginTop: spacing.lg,
        marginBottom: spacing.xxl,
    },
    logoutText: {
        fontSize: fontSizes.md,
        fontWeight: '500',
    },
});
