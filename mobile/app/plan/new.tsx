import {useCallback, useRef, useState} from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useRouter} from 'expo-router';
import Animated, {FadeInUp, useAnimatedStyle, useSharedValue, withTiming, ZoomIn} from 'react-native-reanimated';
import DateTimePicker, {DateTimePickerEvent} from '@react-native-community/datetimepicker';
import {savingsService} from '@/services/savingsService';
import {borderRadius, darkColors, fontSizes, lightColors, shadows, spacing} from '@/constants/theme';
import {hapticPatterns} from '@/utils/haptics';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import {Celebration} from '@/components/Celebration';
import {useColorScheme} from '@/components/useColorScheme';

const CELL_COUNT_OPTIONS = [50, 100, 200];

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
    const [customCellCount, setCustomCellCount] = useState('');
    const [isCustomCellCount, setIsCustomCellCount] = useState(false);
    const [cellTheme, setCellTheme] = useState('default');
    const [deadline, setDeadline] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);

    const nameFocused = useSharedValue(0);
    const amountFocused = useSharedValue(0);
    const customInputRef = useRef<TextInput>(null);

    const effectiveCellCount = isCustomCellCount ? (Number(customCellCount) || 0) : cellCount;
    const cellAmount = targetAmount && effectiveCellCount > 0
        ? Math.ceil(Number(targetAmount) / effectiveCellCount)
        : 0;

    const nameInputStyle = useAnimatedStyle(() => ({
        borderColor: withTiming(nameFocused.value ? '#A87824' : colors.line, {duration: 200}),
        borderWidth: withTiming(nameFocused.value ? 1.5 : 1, {duration: 200}),
    }));

    const amountInputStyle = useAnimatedStyle(() => ({
        borderColor: withTiming(amountFocused.value ? '#A87824' : colors.line, {duration: 200}),
        borderWidth: withTiming(amountFocused.value ? 1.5 : 1, {duration: 200}),
    }));

    const handleSelectCellCount = useCallback((count: number) => {
        hapticPatterns.selection();
        setIsCustomCellCount(false);
        setCellCount(count);
    }, []);

    const handleSelectCustomCellCount = useCallback(() => {
        hapticPatterns.selection();
        setIsCustomCellCount(true);
        setTimeout(() => customInputRef.current?.focus(), 100);
    }, []);

    const handleDateChange = useCallback((_event: DateTimePickerEvent, selectedDate?: Date) => {
        if (Platform.OS === 'android') {
            setShowDatePicker(false);
        }
        if (selectedDate) {
            setDeadline(selectedDate);
        }
    }, []);

    const formatDate = (date: Date | null): string => {
        if (!date) return '';
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };

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
        if (effectiveCellCount <= 0) {
            hapticPatterns.errorShake();
            Alert.alert('提示', '请输入有效的格子数量');
            return;
        }

        setLoading(true);
        try {
            await savingsService.createPlan({
                name: name.trim(),
                target_amount: Number(targetAmount),
                cell_count: effectiveCellCount,
                cell_theme: cellTheme !== 'default' ? cellTheme : undefined,
                deadline: deadline ? formatDate(deadline) : undefined,
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
                    {/* 计划名称 */}
                    <Animated.View entering={FadeInUp.delay(100).duration(300)} style={styles.field}>
                        <Text style={[styles.label, {color: colors.txtSecondary}]}>计划名称</Text>
                        <Animated.View style={[
                            styles.inputWrapper,
                            {backgroundColor: colors.surface},
                            nameInputStyle,
                        ]}>
                            <TextInput
                                style={[styles.input, {color: colors.txtPrimary}]}
                                placeholder="例如：旅行基金"
                                placeholderTextColor={colors.txtMuted}
                                value={name}
                                onChangeText={setName}
                                onFocus={() => { nameFocused.value = 1; }}
                                onBlur={() => { nameFocused.value = 0; }}
                            />
                        </Animated.View>
                    </Animated.View>

                    {/* 目标金额 */}
                    <Animated.View entering={FadeInUp.delay(150).duration(300)} style={styles.field}>
                        <Text style={[styles.label, {color: colors.txtSecondary}]}>目标金额 (元)</Text>
                        <Animated.View style={[
                            styles.inputWrapper,
                            {backgroundColor: colors.surface},
                            amountInputStyle,
                        ]}>
                            <TextInput
                                style={[styles.input, {color: colors.txtPrimary}]}
                                placeholder="例如：10000"
                                placeholderTextColor={colors.txtMuted}
                                value={targetAmount}
                                onChangeText={setTargetAmount}
                                keyboardType="numeric"
                                onFocus={() => { amountFocused.value = 1; }}
                                onBlur={() => { amountFocused.value = 0; }}
                            />
                        </Animated.View>
                    </Animated.View>

                    {/* 格子数量 */}
                    <Animated.View entering={FadeInUp.delay(200).duration(300)} style={styles.field}>
                        <Text style={[styles.label, {color: colors.txtSecondary}]}>格子数量</Text>
                        <View style={styles.cellCountRow}>
                            {CELL_COUNT_OPTIONS.map((count, index) => (
                                <Animated.View key={count} entering={ZoomIn.delay(250 + index * 30).duration(200)} style={styles.cellCountItem}>
                                    <TouchableOpacity
                                        style={[
                                            styles.cellCountButton,
                                            {
                                                backgroundColor: (!isCustomCellCount && cellCount === count) ? colors.gold : colors.surface,
                                                borderColor: (!isCustomCellCount && cellCount === count) ? colors.gold : colors.line,
                                            },
                                        ]}
                                        onPress={() => handleSelectCellCount(count)}
                                        activeOpacity={0.7}
                                    >
                                        <Text
                                            style={[
                                                styles.optionText,
                                                {color: (!isCustomCellCount && cellCount === count) ? colors.onGold : colors.txtSecondary},
                                            ]}
                                        >
                                            {count}
                                        </Text>
                                    </TouchableOpacity>
                                </Animated.View>
                            ))}
                            <Animated.View entering={ZoomIn.delay(250 + CELL_COUNT_OPTIONS.length * 30).duration(200)} style={styles.cellCountItem}>
                                <TouchableOpacity
                                    style={[
                                        styles.cellCountButton,
                                        {
                                            backgroundColor: isCustomCellCount ? colors.gold : colors.surface,
                                            borderColor: isCustomCellCount ? colors.gold : colors.line,
                                        },
                                    ]}
                                    onPress={handleSelectCustomCellCount}
                                    activeOpacity={0.7}
                                >
                                    <Text
                                        style={[
                                            styles.optionText,
                                            {color: isCustomCellCount ? colors.onGold : colors.txtSecondary},
                                        ]}
                                    >
                                        自定义
                                    </Text>
                                </TouchableOpacity>
                            </Animated.View>
                        </View>
                        {isCustomCellCount && (
                            <Animated.View entering={FadeInUp.duration(200)} style={styles.customInputRow}>
                                <TextInput
                                    ref={customInputRef}
                                    style={[
                                        styles.customInput,
                                        {backgroundColor: colors.surface, borderColor: colors.gold, color: colors.txtPrimary},
                                    ]}
                                    placeholder="输入数量"
                                    placeholderTextColor={colors.txtMuted}
                                    value={customCellCount}
                                    onChangeText={(text) => setCustomCellCount(text.replace(/[^0-9]/g, ''))}
                                    keyboardType="numeric"
                                    maxLength={4}
                                />
                                <Text style={[styles.customInputLabel, {color: colors.txtMuted}]}>格</Text>
                            </Animated.View>
                        )}
                    </Animated.View>

                    {/* 格子配色 */}
                    <Animated.View entering={FadeInUp.delay(350).duration(300)} style={styles.field}>
                        <Text style={[styles.label, {color: colors.txtSecondary}]}>格子配色</Text>
                        <View style={styles.themeGrid}>
                            {CELL_THEMES.map((theme, index) => (
                                <Animated.View key={theme.id} entering={ZoomIn.delay(400 + index * 30).duration(200)} style={styles.themeGridItem}>
                                    <TouchableOpacity
                                        style={[
                                            styles.themeButton,
                                            {
                                                backgroundColor: cellTheme === theme.id ? colors.surfaceElevated : colors.surface,
                                                borderColor: cellTheme === theme.id ? colors.gold : colors.line,
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

                    {/* 截止日期 */}
                    <Animated.View entering={FadeInUp.delay(450).duration(300)} style={styles.field}>
                        <Text style={[styles.label, {color: colors.txtSecondary}]}>截止日期（可选）</Text>
                        <TouchableOpacity
                            style={[
                                styles.datePickerButton,
                                {backgroundColor: colors.surface, borderColor: colors.line},
                            ]}
                            onPress={() => {
                                hapticPatterns.selection();
                                setShowDatePicker(true);
                            }}
                            activeOpacity={0.7}
                        >
                            <Text style={[
                                styles.datePickerText,
                                {color: deadline ? colors.txtPrimary : colors.txtMuted},
                            ]}>
                                {deadline ? formatDate(deadline) : '选择截止日期'}
                            </Text>
                            {deadline ? (
                                <TouchableOpacity onPress={() => setDeadline(null)} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                                    <FontAwesome name="times-circle" size={18} color={colors.txtMuted}/>
                                </TouchableOpacity>
                            ) : (
                                <FontAwesome name="calendar" size={18} color={colors.txtMuted}/>
                            )}
                        </TouchableOpacity>
                    </Animated.View>

                    {/* 预览 */}
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
                                        style={[styles.previewDetailValue, {color: colors.txtPrimary}]}>{effectiveCellCount} 格</Text>
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
                                {deadline && (
                                    <View style={styles.previewDetailRow}>
                                        <Text style={[styles.previewDetailLabel, {color: colors.txtMuted}]}>截止日期</Text>
                                        <Text style={[styles.previewDetailValue, {color: colors.txtPrimary}]}>
                                            {formatDate(deadline)}
                                        </Text>
                                    </View>
                                )}
                            </View>

                            {/* Mini grid preview */}
                            <View style={styles.miniGrid}>
                                {Array.from({length: Math.min(effectiveCellCount, 24)}).map((_, i) => (
                                    <View
                                        key={i}
                                        style={[
                                            styles.miniCell,
                                            {
                                                backgroundColor: CELL_THEMES.find(t => t.id === cellTheme)?.color + '20',
                                                borderColor: CELL_THEMES.find(t => t.id === cellTheme)?.color + '40',
                                            },
                                        ]}
                                    />
                                ))}
                                {effectiveCellCount > 24 && (
                                    <Text style={[styles.moreCells, {color: colors.txtMuted}]}>
                                        +{effectiveCellCount - 24}
                                    </Text>
                                )}
                            </View>
                        </Animated.View>
                    )}

                    {/* 提交按钮 */}
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

            {/* 日期选择弹窗 */}
            <Modal
                visible={showDatePicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDatePicker(false)}
            >
                <TouchableWithoutFeedback onPress={() => setShowDatePicker(false)}>
                    <View style={styles.dateModalOverlay}>
                        <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                            <View style={[styles.dateModalCard, {backgroundColor: colors.surface}]}>
                                <Text style={[styles.dateModalTitle, {color: colors.txtPrimary}]}>选择截止日期</Text>
                                <DateTimePicker
                                    value={deadline || new Date()}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'inline' : 'spinner'}
                                    onChange={handleDateChange}
                                    minimumDate={new Date()}
                                    style={styles.dateModalPicker}
                                />
                                <View style={styles.dateModalActions}>
                                    <TouchableOpacity
                                        style={[styles.dateModalButton, {borderColor: colors.line}]}
                                        onPress={() => {
                                            setDeadline(null);
                                            setShowDatePicker(false);
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.dateModalButtonText, {color: colors.txtSecondary}]}>清除</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.dateModalButton, styles.dateModalButtonPrimary, {backgroundColor: colors.gold}]}
                                        onPress={() => setShowDatePicker(false)}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={[styles.dateModalButtonText, {color: colors.onGold}]}>确定</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
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
    inputWrapper: {
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        overflow: 'hidden',
    },
    input: {
        width: '100%',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md + 2,
        fontSize: fontSizes.lg,
    },
    cellCountRow: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    cellCountItem: {
        flex: 1,
    },
    cellCountButton: {
        paddingVertical: spacing.sm + 2,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
    },
    optionText: {
        fontSize: fontSizes.md,
        fontWeight: '500',
    },
    customInputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    customInput: {
        flex: 1,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.xl,
        borderWidth: 1.5,
        fontSize: fontSizes.lg,
    },
    customInputLabel: {
        fontSize: fontSizes.md,
        fontWeight: '500',
    },
    themeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: spacing.sm,
    },
    themeGridItem: {
        width: '48%',
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
    datePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md + 2,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
    },
    datePickerText: {
        fontSize: fontSizes.lg,
    },
    dateModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
    },
    dateModalCard: {
        width: '100%',
        borderRadius: borderRadius['2xl'],
        padding: spacing.lg,
        ...shadows.card,
    },
    dateModalTitle: {
        fontSize: fontSizes.lg,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    dateModalPicker: {
        alignSelf: 'center',
    },
    dateModalActions: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.lg,
    },
    dateModalButton: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
    },
    dateModalButtonPrimary: {
        borderWidth: 0,
    },
    dateModalButtonText: {
        fontSize: fontSizes.md,
        fontWeight: '600',
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
