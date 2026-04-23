import {useEffect, useState} from 'react';
import {Alert, StyleSheet, Text, TextInput, TouchableOpacity, View,} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Animated, {FadeInUp, ZoomIn} from 'react-native-reanimated';
import {useAuth} from '@/hooks/useAuth';
import {partnerService} from '@/services/partnerService';
import {borderRadius, darkColors, fontSizes, lightColors, shadows, spacing} from '@/constants/theme';
import {hapticPatterns} from '@/utils/haptics';
import {useColorScheme} from '@/components/useColorScheme';
import type {User} from '@/types';

export default function PartnerScreen() {
    const {user} = useAuth();
    const colorScheme = useColorScheme();
    const colors = colorScheme === 'dark' ? darkColors : lightColors;
    const insets = useSafeAreaInsets();

    const [partner, setPartner] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [inviteCode, setInviteCode] = useState<string | null>(null);
    const [inputCode, setInputCode] = useState('');

    useEffect(() => {
        loadPartner();
    }, []);

    const loadPartner = async () => {
        try {
            const partnerData = await partnerService.getPartner();
            setPartner(partnerData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateCode = async () => {
        try {
            hapticPatterns.buttonPress();
            const result = await partnerService.generateInviteCode();
            setInviteCode(result.code);
        } catch (error: any) {
            hapticPatterns.errorShake();
            Alert.alert('错误', error.message || '生成邀请码失败');
        }
    };

    const handleBindPartner = async () => {
        if (!inputCode.trim()) {
            hapticPatterns.errorShake();
            Alert.alert('提示', '请输入邀请码');
            return;
        }

        try {
            hapticPatterns.buttonPress();
            await partnerService.bindPartner(inputCode.trim());
            hapticPatterns.milestone();
            Alert.alert('成功', '伴侣绑定成功！');
            loadPartner();
        } catch (error: any) {
            hapticPatterns.errorShake();
            Alert.alert('错误', error.message || '绑定失败');
        }
    };

    const handleUnbind = () => {
        hapticPatterns.medium();
        Alert.alert(
            '确认解绑',
            '解绑后将无法再一起储蓄，确定要解绑吗？',
            [
                {text: '取消', style: 'cancel'},
                {
                    text: '确定',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await partnerService.unbindPartner();
                            hapticPatterns.success();
                            setPartner(null);
                            Alert.alert('成功', '已解绑');
                        } catch (error: any) {
                            hapticPatterns.errorShake();
                            Alert.alert('错误', error.message || '解绑失败');
                        }
                    },
                },
            ]
        );
    };

    return (
        <View style={[styles.container, {backgroundColor: colors.surfaceDark, paddingTop: spacing.xl + insets.top}]}>
            <Animated.Text entering={FadeInUp.duration(300)} style={[styles.title, {color: colors.txtPrimary}]}>
                伴侣
            </Animated.Text>

            {partner ? (
                <Animated.View entering={ZoomIn.delay(100).duration(400)}
                               style={[styles.card, {backgroundColor: colors.surface, borderColor: colors.line}]}>
                    {/* Bound Partner Display */}
                    <View style={styles.boundHeader}>
                        <View style={styles.userPairContainer}>
                            {/* Current User */}
                            <View style={styles.userDisplay}>
                                <View style={[styles.avatarCircle, {backgroundColor: colors.gold + '15'}]}>
                                    <Text style={styles.avatarEmoji}>{user?.avatar_emoji || '😊'}</Text>
                                </View>
                                <Text style={[styles.userName, {color: colors.txtSecondary}]}>{user?.nickname}</Text>
                            </View>

                            {/* Connection */}
                            <View style={styles.connectionContainer}>
                                <View style={[styles.connectionLine, {backgroundColor: colors.line}]}/>
                                <View style={[styles.connectionHeart, {backgroundColor: colors.gold + '10'}]}>
                                    <Text style={styles.heartEmoji}>💕</Text>
                                </View>
                                <View style={[styles.connectionLine, {backgroundColor: colors.line}]}/>
                            </View>

                            {/* Partner */}
                            <View style={styles.userDisplay}>
                                <View style={[styles.avatarCircle, {backgroundColor: colors.mate + '15'}]}>
                                    <Text style={styles.avatarEmoji}>{partner.avatar_emoji || '😊'}</Text>
                                </View>
                                <Text style={[styles.userName, {color: colors.txtSecondary}]}>{partner.nickname}</Text>
                            </View>
                        </View>
                    </View>

                    <Text style={[styles.boundMessage, {color: colors.txtMuted}]}>
                        你们已绑定，可以一起存钱了
                    </Text>

                    <TouchableOpacity
                        style={[styles.unbindButton, {borderColor: colors.danger}]}
                        onPress={handleUnbind}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.unbindText, {color: colors.danger}]}>解除绑定</Text>
                    </TouchableOpacity>
                </Animated.View>
            ) : (
                <View style={styles.bindSection}>
                    {/* Invite Section */}
                    <Animated.View entering={FadeInUp.delay(100).duration(300)} style={[styles.inviteCard, {
                        backgroundColor: colors.surface,
                        borderColor: colors.line
                    }]}>
                        <Text style={[styles.cardTitle, {color: colors.txtPrimary}]}>邀请伴侣</Text>
                        <Text style={[styles.cardDesc, {color: colors.txtMuted}]}>
                            将邀请码分享给你的伴侣
                        </Text>

                        {!inviteCode ? (
                            <TouchableOpacity
                                style={[styles.generateButton, {backgroundColor: colors.gold}]}
                                onPress={handleGenerateCode}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.generateButtonText, {color: colors.onGold}]}>
                                    生成邀请码
                                </Text>
                            </TouchableOpacity>
                        ) : (
                            <Animated.View entering={ZoomIn.duration(300)}
                                           style={[styles.codeDisplay, {backgroundColor: colors.surfaceDark}]}>
                                <Text style={[styles.codeLabel, {color: colors.txtMuted}]}>你的邀请码</Text>
                                <Text style={[styles.code, {color: colors.gold}]}>{inviteCode}</Text>
                                <Text style={[styles.codeHint, {color: colors.txtMuted}]}>邀请码有效期至对方绑定</Text>
                            </Animated.View>
                        )}
                    </Animated.View>

                    {/* Divider */}
                    <Animated.View entering={FadeInUp.delay(200).duration(300)} style={styles.divider}>
                        <View style={[styles.dividerLine, {backgroundColor: colors.line}]}/>
                        <Text style={[styles.dividerText, {color: colors.txtMuted}]}>或</Text>
                        <View style={[styles.dividerLine, {backgroundColor: colors.line}]}/>
                    </Animated.View>

                    {/* Input Section */}
                    <Animated.View entering={FadeInUp.delay(300).duration(300)} style={[styles.inputCard, {
                        backgroundColor: colors.surface,
                        borderColor: colors.line
                    }]}>
                        <Text style={[styles.cardTitle, {color: colors.txtPrimary}]}>输入邀请码</Text>
                        <Text style={[styles.cardDesc, {color: colors.txtMuted}]}>
                            输入伴侣分享的邀请码完成绑定
                        </Text>

                        <TextInput
                            style={[styles.input, {
                                backgroundColor: colors.surfaceDark,
                                borderColor: colors.line,
                                color: colors.txtPrimary
                            }]}
                            placeholder="输入6位邀请码"
                            placeholderTextColor={colors.txtMuted}
                            value={inputCode}
                            onChangeText={setInputCode}
                            maxLength={6}
                            autoCapitalize="characters"
                        />

                        <TouchableOpacity
                            style={[
                                styles.bindButton,
                                {backgroundColor: inputCode.length === 6 ? colors.gold : colors.surfaceElevated},
                                inputCode.length !== 6 && styles.bindButtonDisabled,
                            ]}
                            onPress={handleBindPartner}
                            activeOpacity={0.8}
                        >
                            <Text style={[
                                styles.bindButtonText,
                                {color: inputCode.length === 6 ? colors.onGold : colors.txtMuted}
                            ]}>
                                绑定
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: spacing.lg,
    },
    title: {
        fontSize: 22,
        fontWeight: '600',
        marginBottom: spacing.xl,
    },
    card: {
        borderRadius: borderRadius['2xl'],
        borderWidth: 1,
        padding: spacing.xl,
        alignItems: 'center',
        ...shadows.card,
    },
    boundHeader: {
        width: '100%',
        marginBottom: spacing.lg,
    },
    userPairContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    userDisplay: {
        alignItems: 'center',
    },
    avatarCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarEmoji: {
        fontSize: 28,
    },
    userName: {
        fontSize: fontSizes.sm,
        marginTop: spacing.sm,
    },
    connectionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: spacing.md,
    },
    connectionLine: {
        width: 24,
        height: 1,
    },
    connectionHeart: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: spacing.xs,
    },
    heartEmoji: {
        fontSize: 14,
    },
    boundMessage: {
        fontSize: fontSizes.sm,
        marginBottom: spacing.lg,
    },
    unbindButton: {
        paddingVertical: spacing.sm + 2,
        paddingHorizontal: spacing.xl,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
    },
    unbindText: {
        fontSize: fontSizes.md,
        fontWeight: '500',
    },
    bindSection: {
        gap: spacing.md,
    },
    inviteCard: {
        borderRadius: borderRadius['2xl'],
        borderWidth: 1,
        padding: spacing.lg,
        ...shadows.card,
    },
    inputCard: {
        borderRadius: borderRadius['2xl'],
        borderWidth: 1,
        padding: spacing.lg,
        gap: spacing.md,
        ...shadows.card,
    },
    cardTitle: {
        fontSize: fontSizes.md,
        fontWeight: '600',
        marginBottom: spacing.xs,
    },
    cardDesc: {
        fontSize: fontSizes.sm,
        marginBottom: spacing.md,
    },
    generateButton: {
        paddingVertical: spacing.md,
        borderRadius: 12,
        alignItems: 'center',
    },
    generateButtonText: {
        fontSize: fontSizes.md,
        fontWeight: '600',
    },
    codeDisplay: {
        padding: spacing.lg,
        borderRadius: 12,
        alignItems: 'center',
    },
    codeLabel: {
        fontSize: fontSizes.sm,
        marginBottom: spacing.sm,
    },
    code: {
        fontSize: 32,
        fontWeight: '700',
        letterSpacing: 6,
    },
    codeHint: {
        fontSize: fontSizes.xs,
        marginTop: spacing.sm,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: spacing.sm,
    },
    dividerLine: {
        flex: 1,
        height: 1,
    },
    dividerText: {
        marginHorizontal: spacing.md,
        fontSize: fontSizes.sm,
    },
    input: {
        width: '100%',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        fontSize: fontSizes.lg,
        textAlign: 'center',
        letterSpacing: 4,
    },
    bindButton: {
        paddingVertical: spacing.md,
        borderRadius: 12,
        alignItems: 'center',
    },
    bindButtonDisabled: {
        opacity: 0.6,
    },
    bindButtonText: {
        fontSize: fontSizes.md,
        fontWeight: '600',
    },
});
