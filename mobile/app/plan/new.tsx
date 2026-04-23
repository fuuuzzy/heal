import {useState} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useRouter} from 'expo-router';
import Animated, {FadeInUp, ZoomIn} from 'react-native-reanimated';
import {savingsService} from '@/services/savingsService';
import {borderRadius, darkColors, fontSizes, lightColors, shadows, spacing} from '@/constants/theme';
import {hapticPatterns} from '@/utils/haptics';
import {Celebration} from '@/components/Celebration';
import {useColorScheme} from '@/components/useColorScheme';

const CELL_COUNT_OPTIONS = [12, 24, 36, 48, 60, 100];

const CELL_THEMES = [
    {id: 'default', label: '经典金', color: '#A87824'},
    {id: 'sakura', label: '樱花粉', color: '#F472B6'},
    {id: 'ocean', label: '海洋蓝', color: '#60A5FA'},
    {id: 'forest', label: '森林绿', color: '#34D399'},
];

export default function NewPlanScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = colorScheme === 'dark' ? darkColors : lightColors;
    const insets = useSafeAreaInsets();

    const [name, setName] = useState('');
    const [targetAmount, setTargetAmount] = useState('');
    const [cellCount, setCellCount] = useState(24);
    const [cellTheme, setCellTheme] = useState('default');
    const [deadline, setDeadline] = useState('');
    const [loading, setLoading] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);

    const cellAmount = targetAmount ? Math.ceil(Number(targetAmount) / cellCount) : 0;

    const handleCreate = async () => {
        if (!name.trim()) {
            hapticPatterns.errorShake();
            Alert.alert('提示', '请输入计划名称');
            return;
        }
        if (!targetAmount || Number(targetAmount) <= 0) {
            hapticPatterns.errorShake();
            Alert.alert('提示', '请输入有效的目标金额');
            return;
        }

        setLoading(true);
        try {
            await savingsService.createPlan({
                name: name.trim(),
                target_amount: Number(targetAmount),
                cell_count: cellCount,
                cell_theme: cellTheme !== 'default' ? cellTheme : undefined,
                deadline: deadline || undefined,
            });
            hapticPatterns.milestone();
            setShowCelebration(true);
        } catch (error: any) {
            hapticPatterns.errorShake();
            Alert.alert('错误', error.message || '创建失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
            style={[styles.container, {backgroundColor: colors.surfaceDark}]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={[styles.scrollContent, {paddingTop: insets.top}]}>
                <Animated.View entering={FadeInUp.duration(300)} style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
                        <Text style={[styles.backButton, {color: colors.gold}]}>取消</Text>
                    </TouchableOpacity>
                    <Text style={[styles.title, {color: colors.txtPrimary}]}>创建计划</Text>
                    <View style={{width: 40}}/>
                </Animated.View>

                <View style={styles.form}>
                    <Animated.View entering={FadeInUp.delay(100).duration(300)} style={styles.field}>
                        <Text style={[styles.label, {color: colors.txtSecondary}]}>计划名称</Text>
                        <TextInput
                            style={[
                                styles.input,
                                {backgroundColor: colors.surface, borderColor: colors.line, color: colors.txtPrimary},
                            ]}
                            placeholder="例如：旅行基金"
                            placeholderTextColor={colors.txtMuted}
                            value={name}
                            onChangeText={setName}
                        />
                    </Animated.View>

                    <Animated.View entering={FadeInUp.delay(150).duration(300)} style={styles.field}>
                        <Text style={[styles.label, {color: colors.txtSecondary}]}>目标金额 (元)</Text>
                        <TextInput
                            style={[
                                styles.input,
                                {backgroundColor: colors.surface, borderColor: colors.line, color: colors.txtPrimary},
                            ]}
                            placeholder="例如：10000"
                            placeholderTextColor={colors.txtMuted}
                            value={targetAmount}
                            onChangeText={setTargetAmount}
                            keyboardType="numeric"
                        />
                    </Animated.View>

                    <Animated.View entering={FadeInUp.delay(200).duration(300)} style={styles.field}>
                        <Text style={[styles.label, {color: colors.txtSecondary}]}>格子数量</Text>
                        <View style={styles.optionsRow}>
                            {CELL_COUNT_OPTIONS.map((count, index) => (
                                <Animated.View key={count} entering={ZoomIn.delay(250 + index * 30).duration(200)}>
                                    <TouchableOpacity
                                        style={[
                                            styles.optionButton,
                                            cellCount === count && {
                                                backgroundColor: colors.gold,
                                                borderColor: colors.gold
                                            },
                                            {
                                                backgroundColor: cellCount === count ? colors.gold : colors.surface,
                                                borderColor: cellCount === count ? colors.gold : colors.line
                                            },
                                        ]}
                                        onPress={() => {
                                            hapticPatterns.selection();
                                            setCellCount(count);
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <Text
                                            style={[
                                                styles.optionText,
                                                {color: cellCount === count ? colors.onGold : colors.txtSecondary},
                                            ]}
                                        >
                                            {count}
                                        </Text>
                                    </TouchableOpacity>
                                </Animated.View>
                            ))}
                        </View>
                    </Animated.View>

                    <Animated.View entering={FadeInUp.delay(350).duration(300)} style={styles.field}>
                        <Text style={[styles.label, {color: colors.txtSecondary}]}>格子配色</Text>
                        <View style={styles.optionsRow}>
                            {CELL_THEMES.map((theme, index) => (
                                <Animated.View key={theme.id} entering={ZoomIn.delay(400 + index * 30).duration(200)}>
                                    <TouchableOpacity
                                        style={[
                                            styles.themeButton,
                                            {
                                                backgroundColor: cellTheme === theme.id ? colors.surfaceElevated : colors.surface,
                                                borderColor: cellTheme === theme.id ? colors.gold : colors.line
                                            },
                                            cellTheme === theme.id && {borderWidth: 1.5},
                                        ]}
                                        onPress={() => {
                                            hapticPatterns.selection();
                                            setCellTheme(theme.id);
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <View style={[styles.themeDot, {backgroundColor: theme.color}]}/>
                                        <Text
                                            style={[styles.themeText, {color: cellTheme === theme.id ? colors.gold : colors.txtSecondary}]}>
                                            {theme.label}
                                        </Text>
                                    </TouchableOpacity>
                                </Animated.View>
                            ))}
                        </View>
                    </Animated.View>

                    <Animated.View entering={FadeInUp.delay(450).duration(300)} style={styles.field}>
                        <Text style={[styles.label, {color: colors.txtSecondary}]}>截止日期（可选）</Text>
                        <TextInput
                            style={[
                                styles.input,
                                {backgroundColor: colors.surface, borderColor: colors.line, color: colors.txtPrimary},
                            ]}
                            placeholder="YYYY-MM-DD"
                            placeholderTextColor={colors.txtMuted}
                            value={deadline}
                            onChangeText={setDeadline}
                        />
                    </Animated.View>

                    {cellAmount > 0 && (
                        <Animated.View entering={ZoomIn.duration(300)} style={[styles.preview, {
                            backgroundColor: colors.surface,
                            borderColor: colors.line
                        }]}>
                            <Text style={[styles.previewLabel, {color: colors.txtMuted}]}>预览</Text>
                            <View style={styles.previewRow}>
                                <Text style={[styles.previewValue, {color: colors.gold}]}>
                                    ¥{cellAmount.toLocaleString()}
                                </Text>
                                <Text style={[styles.previewText, {color: colors.txtMuted}]}>/ 格</Text>
                            </View>
                            <View style={styles.previewDetails}>
                                <View style={styles.previewDetailRow}>
                                    <Text style={[styles.previewDetailLabel, {color: colors.txtMuted}]}>目标金额</Text>
                                    <Text
                                        style={[styles.previewDetailValue, {color: colors.txtPrimary}]}>¥{Number(targetAmount).toLocaleString()}</Text>
                                </View>
                                <View style={styles.previewDetailRow}>
                                    <Text style={[styles.previewDetailLabel, {color: colors.txtMuted}]}>格子数量</Text>
                                    <Text
                                        style={[styles.previewDetailValue, {color: colors.txtPrimary}]}>{cellCount} 格</Text>
                                </View>
                                <View style={styles.previewDetailRow}>
                                    <Text style={[styles.previewDetailLabel, {color: colors.txtMuted}]}>配色</Text>
                                    <View style={styles.previewThemeRow}>
                                        <View
                                            style={[styles.previewThemeDot, {backgroundColor: CELL_THEMES.find(t => t.id === cellTheme)?.color}]}/>
                                        <Text style={[styles.previewDetailValue, {color: colors.txtPrimary}]}>
                                            {CELL_THEMES.find(t => t.id === cellTheme)?.label}
                                        </Text>
                                    </View>
                                </View>
                            </View>

                            {/* Mini grid preview */}
                            <View style={styles.miniGrid}>
                                {Array.from({length: Math.min(cellCount, 24)}).map((_, i) => (
                                    <View
                                        key={i}
                                        style={[
                                            styles.miniCell,
                                            {
                                                backgroundColor: CELL_THEMES.find(t => t.id === cellTheme)?.color + '20',
                                                borderColor: CELL_THEMES.find(t => t.id === cellTheme)?.color + '40'
                                            },
                                        ]}
                                    />
                                ))}
                                {cellCount > 24 && (
                                    <Text style={[styles.moreCells, {color: colors.txtMuted}]}>
                                        +{cellCount - 24}
                                    </Text>
                                )}
                            </View>
                        </Animated.View>
                    )}

                    <Animated.View entering={FadeInUp.delay(550).duration(300)}>
                        <TouchableOpacity
                            style={[
                                styles.submitButton,
                                {backgroundColor: colors.gold},
                                loading && styles.submitButtonDisabled,
                            ]}
                            onPress={handleCreate}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.submitButtonText, {color: colors.onGold}]}>
                                {loading ? '创建中...' : '创建计划'}
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </ScrollView>

            <Celebration
                trigger={showCelebration}
                type="complete"
                milestone={100}
                onComplete={() => {
                    setShowCelebration(false);
                    router.back();
                }}
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: spacing.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.lg,
    },
    backButton: {
        fontSize: fontSizes.md,
        fontWeight: '500',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
    },
    form: {
        gap: spacing.lg,
    },
    field: {
        gap: spacing.sm,
    },
    label: {
        fontSize: fontSizes.sm,
        fontWeight: '500',
    },
    input: {
        width: '100%',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md + 2,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        fontSize: fontSizes.lg,
    },
    optionsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
    },
    optionButton: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm + 2,
        borderRadius: 10,
        borderWidth: 1,
        minWidth: 50,
        alignItems: 'center',
    },
    optionText: {
        fontSize: fontSizes.md,
        fontWeight: '500',
    },
    themeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm + 2,
        borderRadius: 10,
        borderWidth: 1,
    },
    themeDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    themeText: {
        fontSize: fontSizes.sm,
        fontWeight: '500',
    },
    preview: {
        padding: spacing.lg,
        borderRadius: borderRadius['2xl'],
        borderWidth: 1,
        alignItems: 'center',
        ...shadows.card,
    },
    previewLabel: {
        fontSize: fontSizes.xs,
        marginBottom: spacing.sm,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    previewRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    previewValue: {
        fontSize: 28,
        fontWeight: '700',
    },
    previewText: {
        fontSize: fontSizes.md,
        marginLeft: 4,
    },
    previewDetails: {
        width: '100%',
        marginTop: spacing.md,
        gap: spacing.xs,
    },
    previewDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: spacing.xs,
    },
    previewDetailLabel: {
        fontSize: fontSizes.sm,
    },
    previewDetailValue: {
        fontSize: fontSizes.sm,
        fontWeight: '500',
    },
    previewThemeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs,
    },
    previewThemeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    miniGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        marginTop: spacing.lg,
        gap: 4,
        maxWidth: 200,
    },
    miniCell: {
        width: 12,
        height: 12,
        borderRadius: 3,
        borderWidth: 0.5,
    },
    moreCells: {
        fontSize: 10,
        marginLeft: 4,
    },
    submitButton: {
        paddingVertical: spacing.md + 2,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: spacing.md,
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        fontSize: fontSizes.lg,
        fontWeight: '600',
    },
});
