import {useEffect, useState} from 'react';
import {Alert, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View,} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useLocalSearchParams, useRouter} from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Animated, {FadeIn, FadeInUp} from 'react-native-reanimated';
import {useAuth} from '@/hooks/useAuth';
import {savingsService} from '@/services/savingsService';
import {borderRadius, darkColors, fontSizes, lightColors, shadows, spacing} from '@/constants/theme';
import {hapticPatterns} from '@/utils/haptics';
import {Cell} from '@/components/Cell';
import {AnimatedProgressBar} from '@/components/AnimatedProgressBar';
import {BottomSheet} from '@/components/BottomSheet';
import {Celebration} from '@/components/Celebration';
import {useColorScheme} from '@/components/useColorScheme';
import type {CellState, PlanDetail} from '@/types';

const MILESTONES = [25, 50, 75, 100];

const OVERDUE_ENCOURAGEMENTS = [
    '迟到不等于缺席，每一步都算数！',
    '慢慢来，比停下来好 💪',
    '重要的不是速度，而是方向 🌟',
    '每多存一格，离目标就近一步！',
    '坚持就是最大的胜利 🏆',
    '不是赛跑，是旅程，继续前行 ✨',
];

// Deadline info helper
function getDeadlineInfo(deadline: string | null | undefined): {
    isOverdue: boolean;
    daysLeft: number | null;
    label: string
} {
    if (!deadline) return {isOverdue: false, daysLeft: null, label: ''};
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const deadlineDate = new Date(deadline);
    deadlineDate.setHours(0, 0, 0, 0);
    const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return {isOverdue: true, daysLeft: diffDays, label: `已逾期 ${Math.abs(diffDays)} 天`};
    if (diffDays === 0) return {isOverdue: false, daysLeft: 0, label: '今天是截止日'};
    return {isOverdue: false, daysLeft: diffDays, label: `还剩 ${diffDays} 天`};
}

export default function PlanDetailScreen() {
    const {id} = useLocalSearchParams<{ id: string }>();
    const {user} = useAuth();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = colorScheme === 'dark' ? darkColors : lightColors;
    const insets = useSafeAreaInsets();

    const [plan, setPlan] = useState<PlanDetail | null>(null);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [showPledgeModal, setShowPledgeModal] = useState(false);
    const [selectedCell, setSelectedCell] = useState<CellState | null>(null);
    const [pledgeContent, setPledgeContent] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Celebration state
    const [showCelebration, setShowCelebration] = useState(false);
    const [celebrationMilestone, setCelebrationMilestone] = useState<number | undefined>();

    useEffect(() => {
        loadPlan();
    }, [id]);

    const loadPlan = async () => {
        if (!id) return;
        try {
            const data = await savingsService.getPlan(Number(id));
            setPlan(data);
        } catch (error) {
            console.error(error);
            Alert.alert('错误', '加载计划失败');
        } finally {
            setLoading(false);
        }
    };

    const handleCellPress = (cell: CellState) => {
        if (plan?.status === 'archived') return;

        if (cell.status === 'empty') {
            hapticPatterns.cellTap();
            setSelectedCell(cell);
            setShowPledgeModal(true);
        } else {
            // Show cell detail with haptic feedback
            hapticPatterns.medium();
            Alert.alert(
                '格子详情',
                `${cell.pledge_content || '无承诺内容'}\n\n${
                    cell.status === 'unfill_pending' ? '待撤销确认' : ''
                }`,
                [
                    {text: '关闭', style: 'cancel'},
                    ...(cell.status === 'unfill_pending' &&
                    cell.unfill_requested_by !== user?.id
                        ? [
                            {
                                text: '批准撤销',
                                onPress: async () => {
                                    if (!plan) return;
                                    try {
                                        await savingsService.approveUnfill(plan.id, cell.index);
                                        hapticPatterns.success();
                                        loadPlan();
                                    } catch (error: any) {
                                        hapticPatterns.errorShake();
                                        Alert.alert('错误', error.message);
                                    }
                                },
                            },
                        ]
                        : []),
                    ...(cell.status === 'filled' && cell.filled_by === user?.id
                        ? [
                            {
                                text: '申请撤销',
                                onPress: async () => {
                                    if (!plan) return;
                                    try {
                                        await savingsService.requestUnfill(plan.id, cell.index);
                                        hapticPatterns.success();
                                        loadPlan();
                                    } catch (error: any) {
                                        hapticPatterns.errorShake();
                                        Alert.alert('错误', error.message);
                                    }
                                },
                            },
                        ]
                        : []),
                ]
            );
        }
    };

    const handleSubmitPledge = async () => {
        if (!plan || !selectedCell || !pledgeContent.trim()) {
            hapticPatterns.errorShake();
            Alert.alert('提示', '请输入承诺内容');
            return;
        }

        setSubmitting(true);
        try {
            const result = await savingsService.fillCell(plan.id, selectedCell.index, {
                pledge_content: pledgeContent.trim(),
            });

            setShowPledgeModal(false);
            setPledgeContent('');
            setSelectedCell(null);
            loadPlan();

            // Trigger celebration
            hapticPatterns.cellFill();

            if (result.completed) {
                setCelebrationMilestone(100);
                setShowCelebration(true);
            } else if (result.hit_milestone) {
                setCelebrationMilestone(result.hit_milestone);
                setShowCelebration(true);
            }
        } catch (error: any) {
            hapticPatterns.errorShake();
            Alert.alert('错误', error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const renderCell = ({item, index}: { item: CellState; index: number }) => {
        const isMine = item.filled_by === user?.id;
        const status = item.status === 'empty' ? 'empty' : item.status === 'unfill_pending' ? 'pending' : 'filled';

        return (
            <Cell
                index={item.index}
                status={status}
                isMine={isMine}
                onPress={() => handleCellPress(item)}
            />
        );
    };

    if (!plan) {
        return (
            <View style={[styles.container, {backgroundColor: colors.surfaceDark, paddingTop: insets.top}]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={[styles.backButton, {color: colors.gold}]}>← 返回</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.loadingContainer}>
                    <Text style={[styles.errorText, {color: colors.txtMuted}]}>计划不存在</Text>
                </View>
            </View>
        );
    }

    const {stats} = plan;
    const progressPercent = stats.progress_percent;
    const deadlineInfo = getDeadlineInfo(plan.deadline);
    const hasPartner = !!plan.partner_id;

    // Archived memorial view
    if (plan.status === 'archived') {
        return (
            <View style={[styles.container, {backgroundColor: colors.surfaceDark, paddingTop: insets.top}]}>
                <Animated.View entering={FadeIn.duration(200)} style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
                        <Text style={[styles.backButton, {color: colors.gold}]}>← 返回</Text>
                    </TouchableOpacity>
                </Animated.View>

                <Animated.View entering={FadeInUp.delay(100).duration(300)} style={styles.memorialCard}>
                    <View style={styles.memorialIcon}>
                        <FontAwesome name="certificate" size={32} color="#A78BFA"/>
                    </View>
                    <Text style={[styles.memorialTitle, {color: colors.txtPrimary}]}>纪念证书</Text>
                    <Text style={[styles.memorialPlanName, {color: colors.txtMuted}]}>「{plan.name}」</Text>

                    <View style={styles.memorialStats}>
                        <Text style={[styles.memorialTarget, {color: colors.gold}]}>
                            目标 ¥{plan.target_amount.toLocaleString()}
                        </Text>
                        <Text style={[styles.memorialDetail, {color: colors.txtSecondary}]}>
                            已存入 ¥{stats.filled_amount.toLocaleString()}（{stats.filled_cells}/{stats.total_cells} 格）
                        </Text>
                        <Text style={[styles.memorialPercent, {color: colors.txtMuted}]}>
                            完成 {stats.progress_percent}%
                        </Text>
                    </View>

                    {hasPartner && (
                        <Text style={[styles.memorialPartner, {color: colors.mate}]}>
                            {plan.creator_nickname || '我'} & {plan.partner_nickname || '伴侣'} 一起走过
                        </Text>
                    )}

                    <Text style={styles.memorialOrnament}>◆ ◇ ◆</Text>

                    <Text style={[styles.memorialDate, {color: colors.txtMuted}]}>
                        归档于 {plan.archived_at ? new Date(plan.archived_at).toLocaleDateString('zh-CN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    }) : ''}
                    </Text>
                </Animated.View>
            </View>
        );
    }

    return (
        <View style={[styles.container, {backgroundColor: colors.surfaceDark, paddingTop: insets.top}]}>
            {/* Header */}
            <Animated.View entering={FadeIn.duration(200)} style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
                    <Text style={[styles.backButton, {color: colors.gold}]}>← 返回</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={async () => {
                        if (plan.created_by !== user?.id) return;
                        hapticPatterns.medium();
                        Alert.alert('操作', '选择操作', [
                            {
                                text: '归档',
                                onPress: async () => {
                                    try {
                                        await savingsService.archivePlan(plan.id);
                                        hapticPatterns.success();
                                        loadPlan();
                                    } catch (error: any) {
                                        hapticPatterns.errorShake();
                                        Alert.alert('错误', error.message);
                                    }
                                },
                            },
                            {
                                text: '删除',
                                style: 'destructive',
                                onPress: async () => {
                                    try {
                                        await savingsService.deletePlan(plan.id);
                                        hapticPatterns.success();
                                        router.back();
                                    } catch (error: any) {
                                        hapticPatterns.errorShake();
                                        Alert.alert('错误', error.message);
                                    }
                                },
                            },
                            {text: '取消', style: 'cancel'},
                        ]);
                    }}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.menuButton, {color: colors.txtMuted}]}>⋯</Text>
                </TouchableOpacity>
            </Animated.View>

            {/* Info Card */}
            <Animated.View entering={FadeInUp.delay(100).duration(300)}
                           style={[styles.card, {backgroundColor: colors.surface, borderColor: colors.line}]}>
                <View style={styles.cardHeader}>
                    <View style={{flex: 1}}>
                        <View style={styles.titleRow}>
                            <Text style={[styles.planName, {color: colors.txtPrimary}]}>{plan.name}</Text>
                            <View style={[
                                styles.statusBadge,
                                plan.status === 'completed'
                                    ? {backgroundColor: 'rgba(22, 148, 68, 0.1)'}
                                    : {backgroundColor: 'rgba(168, 120, 36, 0.1)'}
                            ]}>
                                <Text
                                    style={[styles.statusText, {color: plan.status === 'completed' ? colors.success : colors.gold}]}>
                                    {plan.status === 'completed' ? '已完成' : '进行中'}
                                </Text>
                            </View>
                        </View>
                        <Text style={[styles.cellAmount, {color: colors.txtMuted}]}>
                            ¥{plan.cell_amount} / 格
                        </Text>

                        {/* Partner info */}
                        <View style={styles.partnerRow}>
                            {hasPartner ? (
                                <Text style={[styles.partnerText, {color: colors.mate}]}>
                                    <Text>{plan.partner_avatar || '👫'}</Text>
                                    {' '}和 {plan.partner_nickname || '伴侣'} 一起存
                                </Text>
                            ) : (
                                <Text style={[styles.partnerText, {color: colors.txtMuted}]}>个人计划</Text>
                            )}
                        </View>

                        {/* Streak */}
                        {plan.streak?.current_streak > 0 && (
                            <View style={styles.streakRow}>
                                <FontAwesome name="fire" size={12} color="#F59E0B"/>
                                <Text style={[styles.streakText, {color: colors.gold}]}>
                                    {' '}连续 {plan.streak.current_streak} 天
                                </Text>
                                {plan.streak.longest_streak > plan.streak.current_streak && (
                                    <Text style={[styles.streakLongest, {color: colors.txtMuted}]}>
                                        {' '}(最长 {plan.streak.longest_streak} 天)
                                    </Text>
                                )}
                            </View>
                        )}

                        {/* Deadline */}
                        {deadlineInfo.label && (
                            <View style={styles.deadlineRow}>
                                <FontAwesome
                                    name={deadlineInfo.isOverdue ? 'exclamation-circle' : 'calendar'}
                                    size={12}
                                    color={deadlineInfo.isOverdue ? '#F59E0B' : deadlineInfo.daysLeft !== null && deadlineInfo.daysLeft <= 7 ? '#FB923C' : colors.txtMuted}
                                />
                                <Text style={[
                                    styles.deadlineText,
                                    {color: deadlineInfo.isOverdue ? '#F59E0B' : deadlineInfo.daysLeft !== null && deadlineInfo.daysLeft <= 7 ? '#FB923C' : colors.txtMuted}
                                ]}>
                                    {' '}{deadlineInfo.label}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Overdue Encouragement */}
                {deadlineInfo.isOverdue && plan.status !== 'completed' && (
                    <View style={[styles.encouragement, {
                        backgroundColor: 'rgba(245, 158, 11, 0.08)',
                        borderColor: 'rgba(245, 158, 11, 0.15)'
                    }]}>
                        <Text style={[styles.encouragementText, {color: '#B45309'}]}>
                            💛 {OVERDUE_ENCOURAGEMENTS[Math.floor(Math.random() * OVERDUE_ENCOURAGEMENTS.length)]}
                        </Text>
                    </View>
                )}

                <View style={styles.progressSection}>
                    <View style={styles.progressRow}>
                        <Text style={[styles.amount, {color: colors.txtPrimary}]}>
                            ¥{stats.filled_amount.toLocaleString()}
                        </Text>
                        <Text style={[styles.amountTarget, {color: colors.txtMuted}]}>
                            / ¥{stats.total_amount.toLocaleString()}
                        </Text>
                    </View>
                    <Text style={[styles.percent, {color: colors.gold}]}>{progressPercent}%</Text>
                </View>

                <AnimatedProgressBar progress={progressPercent} showMilestones/>

                {/* Partner Comparison Bar */}
                {hasPartner && stats.my_filled + stats.partner_filled > 0 && (
                    <View style={styles.comparisonSection}>
                        <View style={styles.comparisonBar}>
                            <View
                                style={[styles.comparisonMe, {
                                    width: `${(stats.my_filled / (stats.my_filled + stats.partner_filled)) * 100}%`,
                                    backgroundColor: colors.gold
                                }]}
                            >
                                <Text style={styles.comparisonCount}>{stats.my_filled}</Text>
                            </View>
                            <View
                                style={[styles.comparisonPartner, {
                                    width: `${(stats.partner_filled / (stats.my_filled + stats.partner_filled)) * 100}%`,
                                    backgroundColor: colors.mate
                                }]}
                            >
                                <Text style={styles.comparisonCount}>{stats.partner_filled}</Text>
                            </View>
                        </View>
                        <View style={styles.comparisonLabels}>
                            <Text style={[styles.comparisonLabel, {color: colors.txtMuted}]}>
                                <View style={[styles.comparisonDot, {backgroundColor: colors.gold}]}/>
                                我 {stats.my_filled} 格
                            </Text>
                            <Text style={[styles.comparisonLabel, {color: colors.txtMuted}]}>
                                <View style={[styles.comparisonDot, {backgroundColor: colors.mate}]}/>
                                伴侣 {stats.partner_filled} 格
                            </Text>
                        </View>
                    </View>
                )}

                {/* Milestone Dots */}
                <View style={styles.milestoneRow}>
                    {MILESTONES.map(m => (
                        <View key={m} style={styles.milestoneItem}>
                            <View style={[
                                styles.milestoneDot,
                                {backgroundColor: progressPercent >= m ? colors.gold : colors.lineFaint}
                            ]}/>
                            <Text style={[
                                styles.milestoneLabel,
                                {color: progressPercent >= m ? colors.gold : colors.txtMuted}
                            ]}>
                                {m}%
                            </Text>
                        </View>
                    ))}
                </View>
            </Animated.View>

            {/* Grid */}
            <Animated.View entering={FadeInUp.delay(200).duration(300)} style={styles.gridContainer}>
                <FlatList
                    data={plan.cells}
                    keyExtractor={(item) => item.index.toString()}
                    numColumns={8}
                    contentContainerStyle={styles.grid}
                    columnWrapperStyle={{gap: 6}}
                    renderItem={renderCell}
                    scrollEnabled={false}
                />
            </Animated.View>

            {/* Pledge Modal */}
            <BottomSheet visible={showPledgeModal} onClose={() => setShowPledgeModal(false)} snapHeight={320}>
                <View style={styles.modalContent}>
                    <Text style={[styles.modalTitle, {color: colors.txtPrimary}]}>
                        存入 ¥{plan.cell_amount}
                    </Text>
                    <Text style={[styles.modalSubtitle, {color: colors.txtMuted}]}>
                        写下你的承诺
                    </Text>

                    <TextInput
                        style={[
                            styles.pledgeInput,
                            {backgroundColor: colors.surfaceDark, borderColor: colors.line, color: colors.txtPrimary},
                        ]}
                        placeholder="承诺内容..."
                        placeholderTextColor={colors.txtMuted}
                        value={pledgeContent}
                        onChangeText={setPledgeContent}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                    />

                    <View style={styles.modalButtons}>
                        <TouchableOpacity
                            style={[styles.modalButton, {backgroundColor: colors.surfaceElevated}]}
                            onPress={() => {
                                setShowPledgeModal(false);
                                setPledgeContent('');
                                setSelectedCell(null);
                            }}
                            activeOpacity={0.7}
                        >
                            <Text style={[styles.modalButtonText, {color: colors.txtSecondary}]}>取消</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.modalButton, {backgroundColor: colors.gold}, submitting && styles.modalButtonDisabled]}
                            onPress={handleSubmitPledge}
                            disabled={submitting}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.modalButtonText, {color: colors.onGold}]}>
                                {submitting ? '提交中...' : '确认存入'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </BottomSheet>

            {/* Celebration */}
            <Celebration
                trigger={showCelebration}
                type={celebrationMilestone === 100 ? 'complete' : 'milestone'}
                milestone={celebrationMilestone}
                onComplete={() => setShowCelebration(false)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: spacing.lg,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    backButton: {
        fontSize: fontSizes.md,
        fontWeight: '500',
    },
    menuButton: {
        fontSize: 20,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        borderRadius: borderRadius['2xl'],
        borderWidth: 1,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        ...shadows.card,
    },
    cardHeader: {
        marginBottom: spacing.md,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    planName: {
        fontSize: fontSizes.xl,
        fontWeight: '600',
    },
    statusBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: 6,
    },
    statusText: {
        fontSize: fontSizes.xs,
        fontWeight: '500',
    },
    cellAmount: {
        fontSize: fontSizes.sm,
        marginTop: 2,
    },
    partnerRow: {
        marginTop: spacing.sm,
    },
    partnerText: {
        fontSize: fontSizes.xs,
    },
    streakRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.sm,
        backgroundColor: 'rgba(245, 158, 11, 0.08)',
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.sm,
        paddingVertical: 4,
        borderRadius: 8,
    },
    streakText: {
        fontSize: fontSizes.xs,
        fontWeight: '500',
    },
    streakLongest: {
        fontSize: 10,
    },
    deadlineRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.xs,
    },
    deadlineText: {
        fontSize: fontSizes.xs,
    },
    encouragement: {
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: 10,
        borderWidth: 1,
        marginBottom: spacing.md,
    },
    encouragementText: {
        fontSize: fontSizes.xs,
    },
    progressSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        marginTop: spacing.md,
        marginBottom: spacing.md,
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    amount: {
        fontSize: 20,
        fontWeight: '700',
    },
    amountTarget: {
        fontSize: fontSizes.md,
        marginLeft: 4,
    },
    percent: {
        fontSize: 18,
        fontWeight: '600',
    },
    comparisonSection: {
        marginTop: spacing.md,
    },
    comparisonBar: {
        flexDirection: 'row',
        height: 20,
        borderRadius: 6,
        overflow: 'hidden',
    },
    comparisonMe: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    comparisonPartner: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    comparisonCount: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '600',
    },
    comparisonLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing.xs,
    },
    comparisonLabel: {
        fontSize: fontSizes.xs,
        flexDirection: 'row',
        alignItems: 'center',
    },
    comparisonDot: {
        width: 8,
        height: 8,
        borderRadius: 2,
        marginRight: 4,
    },
    milestoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginTop: spacing.md,
    },
    milestoneItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    milestoneDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    milestoneLabel: {
        fontSize: 10,
    },
    gridContainer: {
        flex: 1,
    },
    grid: {
        padding: spacing.sm,
    },
    errorText: {
        fontSize: fontSizes.md,
        textAlign: 'center',
    },
    // Memorial styles
    memorialCard: {
        flex: 1,
        alignItems: 'center',
        paddingTop: spacing.xxl,
        paddingHorizontal: spacing.xl,
    },
    memorialIcon: {
        width: 64,
        height: 64,
        borderRadius: 20,
        backgroundColor: 'rgba(167, 139, 250, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
    },
    memorialTitle: {
        fontSize: 22,
        fontWeight: '600',
        marginBottom: spacing.sm,
    },
    memorialPlanName: {
        fontSize: fontSizes.md,
        marginBottom: spacing.xl,
    },
    memorialStats: {
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    memorialTarget: {
        fontSize: fontSizes.lg,
        fontWeight: '600',
    },
    memorialDetail: {
        fontSize: fontSizes.sm,
    },
    memorialPercent: {
        fontSize: fontSizes.xs,
    },
    memorialPartner: {
        fontSize: fontSizes.xs,
        marginTop: spacing.md,
    },
    memorialOrnament: {
        fontSize: 16,
        color: '#A78BFA',
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
    },
    memorialDate: {
        fontSize: 10,
        marginTop: spacing.sm,
    },
    modalContent: {
        padding: spacing.xl,
    },
    modalTitle: {
        fontSize: fontSizes.xl,
        fontWeight: '600',
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: fontSizes.sm,
        textAlign: 'center',
        marginTop: spacing.xs,
        marginBottom: spacing.lg,
    },
    pledgeInput: {
        width: '100%',
        minHeight: 100,
        padding: spacing.md,
        borderRadius: 12,
        borderWidth: 1,
        fontSize: fontSizes.md,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: spacing.md,
        marginTop: spacing.lg,
    },
    modalButton: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalButtonDisabled: {
        opacity: 0.5,
    },
    modalButtonText: {
        fontSize: fontSizes.md,
        fontWeight: '600',
    },
});
