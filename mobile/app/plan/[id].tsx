import {useCallback, useEffect, useState} from 'react';
import {Alert, Dimensions, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,} from 'react-native';
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
import {Celebration} from '@/components/Celebration';
import {useColorScheme} from '@/components/useColorScheme';
import type {CellState, PlanDetail} from '@/types';

const {width: screenWidth} = Dimensions.get('window');
const GRID_COLUMNS = 8;
const GRID_GAP = 6;
const CELL_SIZE = Math.floor((screenWidth - spacing.lg * 2 - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS);
const INITIAL_VISIBLE_ROWS = 10;
const INITIAL_VISIBLE_CELLS = GRID_COLUMNS * INITIAL_VISIBLE_ROWS;
const LOAD_MORE_CELLS = GRID_COLUMNS * 10; // 80 cells per batch

const MILESTONES = [25, 50, 75, 100];

const OVERDUE_ENCOURAGEMENTS = [
    '迟到不等于缺席，每一步都算数！',
    '慢慢来，比停下来好 💪',
    '重要的不是速度，而是方向 🌟',
    '每多存一格，离目标就近一步！',
    '坚持就是最大的胜利 🏆',
    '不是赛跑，是旅程，继续前行 ✨',
];

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

function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('zh-CN', {month: 'long', day: 'numeric'});
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

    // Overlay card state
    const [selectedCell, setSelectedCell] = useState<CellState | null>(null);
    const [panelType, setPanelType] = useState<'pledge' | 'detail' | null>(null);
    const [pledgeContent, setPledgeContent] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Pagination
    const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_CELLS);
    const [loadingMore, setLoadingMore] = useState(false);

    // Celebration
    const [showCelebration, setShowCelebration] = useState(false);
    const [celebrationMilestone, setCelebrationMilestone] = useState<number | undefined>();

    const overdueRef = useState(() =>
        OVERDUE_ENCOURAGEMENTS[Math.floor(Math.random() * OVERDUE_ENCOURAGEMENTS.length)]
    )[0];

    useEffect(() => {
        loadPlan();
    }, [id]);

    const loadPlan = async () => {
        if (!id) return;
        try {
            const data = await savingsService.getPlan(Number(id));
            setPlan(data);
            // Auto-expand to show latest filled cell
            const lastFilledIndex = data.cells.reduce((max, c, i) => c.status !== 'empty' ? i : max, -1);
            const neededCount = Math.max(INITIAL_VISIBLE_CELLS, lastFilledIndex + 1);
            const roundedUp = Math.ceil(neededCount / GRID_COLUMNS) * GRID_COLUMNS;
            setVisibleCount(Math.min(roundedUp, data.cells.length));
        } catch (error) {
            console.error(error);
            Alert.alert('错误', '加载计划失败');
        } finally {
            setLoading(false);
        }
    };

    const closePanel = useCallback(() => {
        setSelectedCell(null);
        setPanelType(null);
        setPledgeContent('');
    }, []);

    const handleCellPress = useCallback((cell: CellState) => {
        if (plan?.status === 'archived') return;

        if (cell.status === 'empty') {
            hapticPatterns.cellTap();
            setSelectedCell(cell);
            setPanelType('pledge');
            setPledgeContent('');
        } else {
            hapticPatterns.medium();
            setSelectedCell(cell);
            setPanelType('detail');
        }
    }, [plan?.status]);

    const handleApproveUnfill = async () => {
        if (!plan || !selectedCell) return;
        try {
            await savingsService.approveUnfill(plan.id, selectedCell.index);
            hapticPatterns.success();
            closePanel();
            loadPlan();
        } catch (error: any) {
            hapticPatterns.errorShake();
            Alert.alert('错误', error.message);
        }
    };

    const handleRequestUnfill = async () => {
        if (!plan || !selectedCell) return;
        try {
            await savingsService.requestUnfill(plan.id, selectedCell.index);
            hapticPatterns.success();
            closePanel();
            loadPlan();
        } catch (error: any) {
            hapticPatterns.errorShake();
            Alert.alert('错误', error.message);
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

            closePanel();
            loadPlan();

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

    const handleLoadMore = useCallback(() => {
        if (!plan) return;
        setLoadingMore(true);
        setTimeout(() => {
            setVisibleCount(prev => Math.min(prev + LOAD_MORE_CELLS, plan.cells.length));
            setLoadingMore(false);
        }, 300);
    }, [plan]);

    // --- Cell Detail Content (used inside overlay card) ---
    const renderCellDetailContent = () => {
        if (!selectedCell || !plan) return null;

        const isMine = selectedCell.filled_by === user?.id;
        const isPending = selectedCell.status === 'unfill_pending';
        const isUnfillRequestedByMe = selectedCell.unfill_requested_by === user?.id;
        const statusColor = isPending ? '#F59E0B' : (isMine ? colors.gold : colors.mate);

        return (
            <View>
                {/* Cell preview */}
                <View style={styles.detailPreview}>
                    <View style={[styles.detailPreviewCell, {
                        backgroundColor: isPending
                            ? 'rgba(245, 158, 11, 0.08)'
                            : isMine
                                ? colors.cellMineBg
                                : colors.cellMateBg,
                        borderColor: statusColor + '30',
                    }]}>
                        <View style={[styles.detailPreviewDot, {backgroundColor: statusColor}]}/>
                    </View>
                    <View style={styles.detailPreviewInfo}>
                        <Text style={[styles.detailPreviewIndex, {color: colors.txtPrimary}]}>
                            #{selectedCell.index + 1}
                        </Text>
                        <View style={[styles.detailPreviewBadge, {backgroundColor: statusColor + '15'}]}>
                            <Text style={[styles.detailPreviewBadgeText, {color: statusColor}]}>
                                {isPending ? '待撤销' : '已存入'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Divider */}
                <View style={[styles.overlayDivider, {backgroundColor: colors.line}]}/>

                {/* Pledge card */}
                {selectedCell.pledge_content ? (
                    <View style={[styles.detailPledgeCard, {backgroundColor: colors.surfaceDark, borderColor: colors.line}]}>
                        <Text style={[styles.detailPledgeQuote, {color: colors.txtMuted}]}>承诺</Text>
                        <Text style={[styles.detailPledgeText, {color: colors.txtSecondary}]}>
                            {selectedCell.pledge_content}
                        </Text>
                    </View>
                ) : (
                    <View style={[styles.detailPledgeCard, {backgroundColor: colors.surfaceDark, borderColor: colors.line}]}>
                        <Text style={[styles.detailPledgeText, {color: colors.txtMuted, fontStyle: 'italic'}]}>
                            无承诺内容
                        </Text>
                    </View>
                )}

                {/* Filler info */}
                {selectedCell.filled_at && (
                    <View style={styles.detailMeta}>
                        <View style={[styles.detailMetaDot, {backgroundColor: isMine ? colors.gold : colors.mate}]}/>
                        <Text style={[styles.detailMetaText, {color: colors.txtMuted}]}>
                            {isMine ? '我' : (plan.partner_nickname || '伴侣')} · {formatDate(selectedCell.filled_at)}
                        </Text>
                    </View>
                )}

                {/* Actions */}
                {plan.status !== 'archived' && (
                    <View style={styles.detailActions}>
                        {isPending && !isUnfillRequestedByMe && (
                            <TouchableOpacity
                                style={[styles.detailActionButton, {backgroundColor: '#F59E0B'}]}
                                onPress={handleApproveUnfill}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.detailActionButtonText}>批准撤销</Text>
                            </TouchableOpacity>
                        )}
                        {selectedCell.status === 'filled' && isMine && (
                            <TouchableOpacity
                                style={[styles.detailActionButton, {backgroundColor: 'transparent', borderColor: colors.danger, borderWidth: 1}]}
                                onPress={handleRequestUnfill}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.detailActionButtonText, {color: colors.danger}]}>申请撤销</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>
        );
    };

    // --- Centered Overlay Card ---
    const renderOverlay = () => {
        if (!selectedCell || !panelType || !plan) return null;

        const cardBase = [styles.overlayCard, {backgroundColor: colors.surface, borderColor: colors.line}];

        if (panelType === 'pledge') {
            return (
                <View style={styles.overlay}>
                    {/* Backdrop - press to close */}
                    <TouchableOpacity
                        style={styles.overlayBackdrop}
                        activeOpacity={1}
                        onPress={closePanel}
                    >
                        <View style={styles.overlayBackdropDim}/>
                    </TouchableOpacity>

                    {/* Centered card */}
                    <View style={styles.overlayCenter}>
                        <Animated.View entering={FadeInUp.duration(220)} style={cardBase}>
                            <KeyboardAvoidingView
                                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                            >
                                {/* Close */}
                                <TouchableOpacity
                                    style={styles.overlayClose}
                                    onPress={closePanel}
                                    activeOpacity={0.7}
                                >
                                    <FontAwesome name="times" size={14} color={colors.txtMuted}/>
                                </TouchableOpacity>

                                {/* Header */}
                                <View style={styles.overlayHeader}>
                                    <Text style={[styles.overlayAmount, {color: colors.txtPrimary}]}>
                                        ¥{plan.cell_amount}
                                    </Text>
                                    <View style={[styles.overlayBadge, {backgroundColor: colors.gold + '15'}]}>
                                        <Text style={[styles.overlayBadgeText, {color: colors.gold}]}>
                                            格子 #{selectedCell.index + 1}
                                        </Text>
                                    </View>
                                </View>

                                <View style={[styles.overlayDivider, {backgroundColor: colors.line}]}/>

                                {/* Pledge input */}
                                <Text style={[styles.overlayLabel, {color: colors.txtSecondary}]}>写下你的承诺</Text>
                                <TextInput
                                    style={[
                                        styles.overlayInput,
                                        {backgroundColor: colors.surfaceDark, borderColor: colors.line, color: colors.txtPrimary},
                                    ]}
                                    placeholder="例如：为我们的旅行基金存入..."
                                    placeholderTextColor={colors.txtMuted}
                                    value={pledgeContent}
                                    onChangeText={setPledgeContent}
                                    multiline
                                    numberOfLines={3}
                                    textAlignVertical="top"
                                />

                                {/* Quick suggestions */}
                                <View style={styles.overlaySuggestions}>
                                    {['日常节省', '为旅行存入', '节日红包', '额外收入'].map((s) => (
                                        <TouchableOpacity
                                            key={s}
                                            style={[styles.overlayChip, {
                                                backgroundColor: pledgeContent === s ? colors.gold + '18' : colors.surfaceDark,
                                                borderColor: pledgeContent === s ? colors.gold : colors.line,
                                            }]}
                                            onPress={() => setPledgeContent(s)}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={[styles.overlayChipText, {
                                                color: pledgeContent === s ? colors.gold : colors.txtMuted
                                            }]}>
                                                {s}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>

                                {/* Buttons */}
                                <View style={styles.overlayButtons}>
                                    <TouchableOpacity
                                        style={[styles.overlayButton, {backgroundColor: colors.surfaceElevated}]}
                                        onPress={closePanel}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={[styles.overlayButtonText, {color: colors.txtSecondary}]}>取消</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.overlayButton, {backgroundColor: colors.gold}, submitting && {opacity: 0.5}]}
                                        onPress={handleSubmitPledge}
                                        disabled={submitting}
                                        activeOpacity={0.8}
                                    >
                                        <Text style={[styles.overlayButtonText, {color: colors.onGold}]}>
                                            {submitting ? '提交中...' : '确认存入'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </KeyboardAvoidingView>
                        </Animated.View>
                    </View>
                </View>
            );
        }

        // Detail overlay
        return (
            <View style={styles.overlay}>
                <TouchableOpacity
                    style={styles.overlayBackdrop}
                    activeOpacity={1}
                    onPress={closePanel}
                >
                    <View style={styles.overlayBackdropDim}/>
                </TouchableOpacity>

                <View style={styles.overlayCenter}>
                    <Animated.View entering={FadeInUp.duration(220)} style={cardBase}>
                        {/* Close */}
                        <TouchableOpacity
                            style={styles.overlayClose}
                            onPress={closePanel}
                            activeOpacity={0.7}
                        >
                            <FontAwesome name="times" size={14} color={colors.txtMuted}/>
                        </TouchableOpacity>

                        {renderCellDetailContent()}
                    </Animated.View>
                </View>
            </View>
        );
    };

    // --- Loading state ---
    if (loading) {
        return (
            <View style={[styles.container, {backgroundColor: colors.surfaceDark, paddingTop: insets.top}]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
                        <Text style={[styles.backButton, {color: colors.gold}]}>← 返回</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.loadingContainer}>
                    <Text style={[styles.loadingText, {color: colors.txtMuted}]}>加载中...</Text>
                </View>
            </View>
        );
    }

    // --- Not found state ---
    if (!plan) {
        return (
            <View style={[styles.container, {backgroundColor: colors.surfaceDark, paddingTop: insets.top}]}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
                        <Text style={[styles.backButton, {color: colors.gold}]}>← 返回</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.loadingContainer}>
                    <Text style={[styles.loadingText, {color: colors.txtMuted}]}>计划不存在</Text>
                </View>
            </View>
        );
    }

    // --- Archived memorial view ---
    if (plan.status === 'archived') {
        const {stats} = plan;
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

                    {!!plan.partner_id && (
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

    // --- Main view ---
    const {stats} = plan;
    const progressPercent = stats.progress_percent;
    const deadlineInfo = getDeadlineInfo(plan.deadline);
    const hasPartner = !!plan.partner_id;
    const hasFilledCells = stats.my_filled + stats.partner_filled > 0;

    return (
        <View style={[styles.container, {backgroundColor: colors.surfaceDark, paddingTop: insets.top}]}>

            {/* ===== Fixed: Header ===== */}
            <Animated.View entering={FadeIn.duration(200)} style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
                    <Text style={[styles.backButton, {color: colors.gold}]}>← 返回</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    onPress={() => {
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

            {/* ===== Fixed: Plan Info + Stats ===== */}
            <View>
                {/* Hero */}
                <Animated.View entering={FadeInUp.delay(50).duration(300)} style={styles.hero}>
                    <Text style={[styles.planName, {color: colors.txtPrimary}]}>{plan.name}</Text>
                    <View style={styles.heroMeta}>
                        <Text style={[styles.heroMetaText, {color: colors.txtMuted}]}>
                            ¥{plan.cell_amount} / 格
                        </Text>
                        {hasPartner && (
                            <>
                                <Text style={[styles.heroMetaDot, {color: colors.lineLight}]}> · </Text>
                                <Text style={[styles.heroMetaText, {color: colors.mate}]}>
                                    {plan.partner_avatar || '👫'} 和 {plan.partner_nickname || '伴侣'} 一起存
                                </Text>
                            </>
                        )}
                        {!hasPartner && (
                            <>
                                <Text style={[styles.heroMetaDot, {color: colors.lineLight}]}> · </Text>
                                <Text style={[styles.heroMetaText, {color: colors.txtMuted}]}>个人计划</Text>
                            </>
                        )}
                    </View>
                </Animated.View>

                {/* Progress */}
                <Animated.View entering={FadeInUp.delay(100).duration(300)} style={styles.progressSection}>
                    <View style={styles.progressTopRow}>
                        <View style={styles.progressAmountRow}>
                            <Text style={[styles.progressAmount, {color: colors.txtPrimary}]}>
                                ¥{stats.filled_amount.toLocaleString()}
                            </Text>
                            <Text style={[styles.progressAmountTarget, {color: colors.txtMuted}]}>
                                {' '}/ ¥{stats.total_amount.toLocaleString()}
                            </Text>
                        </View>
                        <Text style={[styles.progressPercent, {color: colors.gold}]}>{progressPercent}%</Text>
                    </View>
                    <AnimatedProgressBar progress={progressPercent} height={10} showMilestones/>
                </Animated.View>

                {/* Stats row */}
                <Animated.View entering={FadeInUp.delay(150).duration(300)} style={styles.statsRow}>
                    <View style={[styles.statCard, {backgroundColor: colors.surface, borderColor: colors.line}]}>
                        <Text style={[styles.statValue, {color: colors.txtPrimary}]}>{stats.filled_cells}</Text>
                        <Text style={[styles.statLabel, {color: colors.txtMuted}]}>已存</Text>
                    </View>
                    <View style={[styles.statCard, {backgroundColor: colors.surface, borderColor: colors.line}]}>
                        <Text style={[styles.statValue, {color: colors.gold}]}>{stats.my_filled}</Text>
                        <Text style={[styles.statLabel, {color: colors.txtMuted}]}>我</Text>
                    </View>
                    {hasPartner && (
                        <View style={[styles.statCard, {backgroundColor: colors.surface, borderColor: colors.line}]}>
                            <Text style={[styles.statValue, {color: colors.mate}]}>{stats.partner_filled}</Text>
                            <Text style={[styles.statLabel, {color: colors.txtMuted}]}>伴侣</Text>
                        </View>
                    )}
                    {!hasPartner && (
                        <View style={[styles.statCard, {backgroundColor: colors.surface, borderColor: colors.line}]}>
                            <Text style={[styles.statValue, {color: colors.txtPrimary}]}>
                                {stats.total_cells - stats.filled_cells}
                            </Text>
                            <Text style={[styles.statLabel, {color: colors.txtMuted}]}>剩余</Text>
                        </View>
                    )}
                </Animated.View>

                {/* Streak & Deadline */}
                {(plan.streak?.current_streak > 0 || deadlineInfo.label) && (
                    <Animated.View entering={FadeInUp.delay(200).duration(300)} style={styles.tagsRow}>
                        {plan.streak?.current_streak > 0 && (
                            <View style={[styles.tag, {backgroundColor: 'rgba(245, 158, 11, 0.1)'}]}>
                                <FontAwesome name="fire" size={11} color="#F59E0B"/>
                                <Text style={[styles.tagText, {color: '#F59E0B'}]}>
                                    {' '}连续 {plan.streak.current_streak} 天
                                </Text>
                                {plan.streak.longest_streak > plan.streak.current_streak && (
                                    <Text style={[styles.tagTextSub, {color: '#F59E0B', opacity: 0.6}]}>
                                        {' '}(最长 {plan.streak.longest_streak})
                                    </Text>
                                )}
                            </View>
                        )}
                        {deadlineInfo.label && (
                            <View style={[styles.tag, {
                                backgroundColor: deadlineInfo.isOverdue
                                    ? 'rgba(245, 158, 11, 0.1)'
                                    : deadlineInfo.daysLeft !== null && deadlineInfo.daysLeft <= 7
                                        ? 'rgba(251, 146, 60, 0.1)'
                                        : colors.surfaceDark
                            }]}>
                                <FontAwesome
                                    name={deadlineInfo.isOverdue ? 'exclamation-circle' : 'calendar'}
                                    size={11}
                                    color={deadlineInfo.isOverdue ? '#F59E0B' : deadlineInfo.daysLeft !== null && deadlineInfo.daysLeft <= 7 ? '#FB923C' : colors.txtMuted}
                                />
                                <Text style={[styles.tagText, {
                                    color: deadlineInfo.isOverdue ? '#F59E0B' : deadlineInfo.daysLeft !== null && deadlineInfo.daysLeft <= 7 ? '#FB923C' : colors.txtMuted
                                }]}>
                                    {' '}{deadlineInfo.label}
                                </Text>
                            </View>
                        )}
                    </Animated.View>
                )}

                {/* Overdue encouragement */}
                {deadlineInfo.isOverdue && plan.status !== 'completed' && (
                    <Animated.View entering={FadeIn.delay(250).duration(300)}>
                        <View style={[styles.encouragement, {
                            backgroundColor: 'rgba(245, 158, 11, 0.06)',
                            borderColor: 'rgba(245, 158, 11, 0.12)'
                        }]}>
                            <Text style={[styles.encouragementText, {color: '#B45309'}]}>
                                💛 {overdueRef}
                            </Text>
                        </View>
                    </Animated.View>
                )}

                {/* Partner comparison */}
                {hasPartner && hasFilledCells && (
                    <Animated.View entering={FadeInUp.delay(300).duration(300)} style={styles.comparisonSection}>
                        <View style={styles.comparisonBar}>
                            <View
                                style={[styles.comparisonMe, {
                                    width: `${(stats.my_filled / (stats.my_filled + stats.partner_filled)) * 100}%`,
                                    backgroundColor: colors.gold
                                }]}
                            >
                                {stats.my_filled > 0 && (
                                    <Text style={styles.comparisonCount}>{stats.my_filled}</Text>
                                )}
                            </View>
                            <View
                                style={[styles.comparisonPartner, {
                                    width: `${(stats.partner_filled / (stats.my_filled + stats.partner_filled)) * 100}%`,
                                    backgroundColor: colors.mate
                                }]}
                            >
                                {stats.partner_filled > 0 && (
                                    <Text style={styles.comparisonCount}>{stats.partner_filled}</Text>
                                )}
                            </View>
                        </View>
                    </Animated.View>
                )}

                {/* Grid section header */}
                <Animated.View entering={FadeInUp.delay(350).duration(300)} style={styles.gridHeader}>
                    <Text style={[styles.gridTitle, {color: colors.txtSecondary}]}>
                        储蓄格子
                    </Text>
                    <Text style={[styles.gridSubtitle, {color: colors.txtMuted}]}>
                        {stats.filled_cells}/{stats.total_cells}
                    </Text>
                </Animated.View>
            </View>

            {/* ===== Scrollable: Grid + Milestones ===== */}
            <ScrollView
                style={styles.gridScroll}
                contentContainerStyle={styles.gridScrollContent}
                showsVerticalScrollIndicator={true}
                indicatorStyle={colorScheme === 'dark' ? 'white' : 'black'}
            >
                {/* Grid cells - centered */}
                <View style={styles.gridContainer}>
                    <View style={styles.gridWrap}>
                        {plan.cells.slice(0, visibleCount).map((cell: CellState) => {
                            const isMine = cell.filled_by === user?.id;
                            const status = cell.status === 'empty'
                                ? 'empty'
                                : cell.status === 'unfill_pending'
                                    ? 'pending'
                                    : 'filled';

                            return (
                                <View key={cell.index} style={styles.gridCell}>
                                    <Cell
                                        index={cell.index}
                                        status={status}
                                        isMine={isMine}
                                        size={CELL_SIZE}
                                        onPress={() => handleCellPress(cell)}
                                    />
                                </View>
                            );
                        })}
                    </View>
                </View>

                {/* Load more button */}
                {visibleCount < plan.cells.length && (
                    <TouchableOpacity
                        style={[styles.loadMoreBtn, {borderColor: colors.line, backgroundColor: colors.surface}]}
                        onPress={handleLoadMore}
                        disabled={loadingMore}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.loadMoreText, {color: colors.txtMuted}]}>
                            {loadingMore ? '加载中...' : `加载更多 (${visibleCount}/${plan.cells.length})`}
                        </Text>
                        <FontAwesome name="angle-down" size={14} color={colors.txtMuted} style={{marginLeft: 6}}/>
                    </TouchableOpacity>
                )}

                {/* Milestones */}
                <Animated.View entering={FadeInUp.delay(400).duration(300)} style={styles.milestoneSection}>
                    <View style={styles.milestoneRow}>
                        {MILESTONES.map(m => {
                            const reached = stats.progress_percent >= m;
                            return (
                                <View key={m} style={styles.milestoneItem}>
                                    <View style={[
                                        styles.milestoneDot,
                                        {backgroundColor: reached ? colors.gold : colors.lineFaint}
                                    ]}/>
                                    <Text style={[
                                        styles.milestoneLabel,
                                        {color: reached ? colors.gold : colors.txtMuted}
                                    ]}>
                                        {m}%
                                    </Text>
                                </View>
                            );
                        })}
                    </View>
                </Animated.View>

                {/* Bottom padding */}
                <View style={{height: 80}}/>
            </ScrollView>

            {/* ===== Overlay Card ===== */}
            {renderOverlay()}

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
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.sm,
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
    loadingText: {
        fontSize: fontSizes.md,
    },

    // Hero
    hero: {
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
    },
    planName: {
        fontSize: fontSizes['2xl'],
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    heroMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.xs,
        flexWrap: 'wrap',
    },
    heroMetaText: {
        fontSize: fontSizes.sm,
    },
    heroMetaDot: {
        fontSize: fontSizes.sm,
    },

    // Progress
    progressSection: {
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.lg,
    },
    progressTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: spacing.sm,
    },
    progressAmountRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    progressAmount: {
        fontSize: fontSizes.xl,
        fontWeight: '700',
    },
    progressAmountTarget: {
        fontSize: fontSizes.sm,
    },
    progressPercent: {
        fontSize: fontSizes.xl,
        fontWeight: '700',
    },

    // Stats row
    statsRow: {
        flexDirection: 'row',
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    statCard: {
        flex: 1,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        paddingVertical: spacing.md,
        alignItems: 'center',
        ...shadows.sm,
    },
    statValue: {
        fontSize: fontSizes.lg,
        fontWeight: '700',
    },
    statLabel: {
        fontSize: fontSizes.xs,
        marginTop: 2,
    },

    // Tags (streak & deadline)
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.sm + 2,
        paddingVertical: spacing.xs + 1,
        borderRadius: borderRadius.lg,
    },
    tagText: {
        fontSize: fontSizes.xs,
        fontWeight: '500',
    },
    tagTextSub: {
        fontSize: 10,
    },

    // Encouragement
    encouragement: {
        marginHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.lg,
        borderWidth: 1,
        marginBottom: spacing.md,
    },
    encouragementText: {
        fontSize: fontSizes.xs,
        lineHeight: 18,
    },

    // Comparison
    comparisonSection: {
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.md,
    },
    comparisonBar: {
        flexDirection: 'row',
        height: 16,
        borderRadius: 8,
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

    // Grid section header
    gridHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.sm,
        paddingBottom: spacing.sm,
    },
    gridTitle: {
        fontSize: fontSizes.sm,
        fontWeight: '500',
    },
    gridSubtitle: {
        fontSize: fontSizes.xs,
    },

    // Grid scroll area
    gridScroll: {
        flex: 1,
    },
    gridScrollContent: {
        alignItems: 'center',
        paddingBottom: spacing.md,
    },
    gridContainer: {
        paddingHorizontal: spacing.lg,
        marginRight: -GRID_GAP,
        marginBottom: -GRID_GAP,
    },
    gridWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    gridCell: {
        marginRight: GRID_GAP,
        marginBottom: GRID_GAP,
    },
    loadMoreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        marginTop: spacing.sm,
        marginBottom: spacing.sm,
    },
    loadMoreText: {
        fontSize: fontSizes.xs,
        fontWeight: '500',
    },

    // Milestones
    milestoneSection: {
        paddingTop: spacing.xl,
        paddingBottom: spacing.md,
    },
    milestoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
    },
    milestoneItem: {
        alignItems: 'center',
        gap: 4,
    },
    milestoneDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    milestoneLabel: {
        fontSize: fontSizes.xs,
        fontWeight: '500',
    },

    // ===== Overlay Card =====
    overlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 100,
    },
    overlayBackdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    overlayBackdropDim: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    overlayCenter: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
    },
    overlayCard: {
        width: '100%',
        maxWidth: 380,
        borderRadius: borderRadius['2xl'],
        borderWidth: 1,
        padding: spacing.xl,
        ...shadows.lg,
    },
    overlayClose: {
        position: 'absolute',
        top: spacing.md,
        right: spacing.md,
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    overlayHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    overlayAmount: {
        fontSize: fontSizes['2xl'],
        fontWeight: '700',
    },
    overlayBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
        borderRadius: 8,
    },
    overlayBadgeText: {
        fontSize: fontSizes.xs,
        fontWeight: '600',
    },
    overlayDivider: {
        height: 1,
        marginVertical: spacing.md,
    },
    overlayLabel: {
        fontSize: fontSizes.sm,
        fontWeight: '500',
        marginBottom: spacing.sm,
    },
    overlayInput: {
        width: '100%',
        minHeight: 72,
        padding: spacing.md,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        fontSize: fontSizes.sm,
        lineHeight: 20,
    },
    overlaySuggestions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        marginTop: spacing.md,
        marginBottom: spacing.lg,
    },
    overlayChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
    },
    overlayChipText: {
        fontSize: fontSizes.xs,
        fontWeight: '500',
    },
    overlayButtons: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    overlayButton: {
        flex: 1,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.xl,
        alignItems: 'center',
    },
    overlayButtonText: {
        fontSize: fontSizes.md,
        fontWeight: '600',
    },

    // Cell Detail (inside overlay)
    detailPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    detailPreviewCell: {
        width: 52,
        height: 52,
        borderRadius: 16,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    detailPreviewDot: {
        width: 16,
        height: 16,
        borderRadius: 8,
    },
    detailPreviewInfo: {
        flex: 1,
        gap: spacing.xs,
    },
    detailPreviewIndex: {
        fontSize: fontSizes.xl,
        fontWeight: '700',
    },
    detailPreviewBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: spacing.sm,
        paddingVertical: 3,
        borderRadius: 8,
    },
    detailPreviewBadgeText: {
        fontSize: fontSizes.xs,
        fontWeight: '600',
    },
    detailPledgeCard: {
        padding: spacing.md,
        borderRadius: borderRadius.xl,
        borderWidth: 1,
        marginBottom: spacing.md,
    },
    detailPledgeQuote: {
        fontSize: fontSizes.xs,
        fontWeight: '500',
        marginBottom: spacing.xs,
    },
    detailPledgeText: {
        fontSize: fontSizes.sm,
        lineHeight: 20,
    },
    detailMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    detailMetaDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: spacing.sm,
    },
    detailMetaText: {
        fontSize: fontSizes.xs,
    },
    detailActions: {
        gap: spacing.sm,
    },
    detailActionButton: {
        paddingVertical: spacing.md,
        borderRadius: borderRadius.xl,
        alignItems: 'center',
    },
    detailActionButtonText: {
        color: '#FFFFFF',
        fontSize: fontSizes.md,
        fontWeight: '600',
    },

    // Memorial
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
});
