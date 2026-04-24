import {useCallback, useState} from 'react';
import {FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect, useRouter} from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import Animated, {FadeIn, FadeInUp} from 'react-native-reanimated';
import {useAuth} from '@/hooks/useAuth';
import {savingsService} from '@/services/savingsService';
import {borderRadius, darkColors, fontSizes, lightColors, shadows, spacing} from '@/constants/theme';
import {staggerConfig} from '@/constants/animations';
import {hapticPatterns} from '@/utils/haptics';
import {DashboardStatsSkeleton, PlanCardSkeleton} from '@/components/Skeleton';
import {AnimatedProgressBar} from '@/components/AnimatedProgressBar';
import type {Activity, DashboardData, SavingsPlan} from '@/types';
import {useColorScheme} from '@/components/useColorScheme';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

// 截止日期信息
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

// 时间格式化
function getTimeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}天前`;
    return new Date(dateStr).toLocaleDateString('zh-CN');
}

const ACTION_LABELS: Record<string, string> = {
    create_plan: '创建了计划',
    fill_cell: '存入了',
    unfill_request: '申请撤销',
    unfill_approve: '批准撤销',
    complete_plan: '完成了计划',
    archive_plan: '归档了计划',
    react: '对',
};

const OVERDUE_ENCOURAGEMENTS = [
    '迟到不等于缺席，每一步都算数！',
    '慢慢来，比停下来好 💪',
    '重要的不是速度，而是方向 🌟',
    '坚持就是最大的胜利 🏆',
];

type TabKey = 'overview' | 'plans';

export default function DashboardScreen() {
    const {user} = useAuth();
    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = colorScheme === 'dark' ? darkColors : lightColors;
    const insets = useSafeAreaInsets();

    const [plans, setPlans] = useState<SavingsPlan[]>([]);
    const [dashboard, setDashboard] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<TabKey>('overview');

    const loadData = async () => {
        try {
            const [plansData, dashData] = await Promise.all([
                savingsService.getPlans(),
                savingsService.getDashboard(),
            ]);
            setPlans(plansData);
            setDashboard(dashData);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, []),
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const activePlans = plans.filter((p) => p.status !== 'archived');

    if (loading) {
        return (
            <View style={[styles.container, {backgroundColor: colors.surfaceDark}]}>
                <View style={[styles.header, {paddingTop: spacing.xl + insets.top}]}>
                    <View style={styles.avatarSection}>
                        <View style={[styles.avatar, {backgroundColor: colors.gold + '15'}]}>
                            <Text style={styles.avatarEmoji}>{user?.avatar_emoji || '😊'}</Text>
                        </View>
                        <View style={styles.greetingSection}>
                            <View style={{width: 100, height: 20, backgroundColor: colors.lineFaint, borderRadius: 4}}/>
                            <View style={{
                                width: 140,
                                height: 14,
                                backgroundColor: colors.lineFaint,
                                borderRadius: 4,
                                marginTop: 6
                            }}/>
                        </View>
                    </View>
                </View>
                {/* Tab skeleton */}
                <View style={[styles.tabBar, {backgroundColor: colors.surfaceElevated}]}>
                    <View style={{flex: 1, height: 32, backgroundColor: colors.lineFaint, borderRadius: 10}}/>
                </View>
                <DashboardStatsSkeleton/>
                <View style={styles.listContent}>
                    <PlanCardSkeleton/>
                    <PlanCardSkeleton/>
                </View>
            </View>
        );
    }

    const maxStreak = Math.max(...(dashboard?.streaks.map((s) => s.current_streak) || [0]), 0);

    return (
        <View style={[styles.container, {backgroundColor: colors.surfaceDark}]}>
            {/* Header */}
            <Animated.View
                entering={FadeIn.delay(100).duration(300)}
                style={[styles.header, {paddingTop: spacing.xl + insets.top}]}
            >
                <TouchableOpacity
                    style={styles.avatarSection}
                    onPress={() => {
                        hapticPatterns.buttonPress();
                        router.push('/profile');
                    }}
                    activeOpacity={0.7}
                >
                    <View style={[styles.avatar, {backgroundColor: colors.gold + '15'}]}>
                        <Text style={styles.avatarEmoji}>{user?.avatar_emoji || '😊'}</Text>
                    </View>
                    <View style={styles.greetingSection}>
                        <Text style={[styles.greeting, {color: colors.txtPrimary}]}>
                            {user?.nickname || '用户'}
                        </Text>
                        <Text style={[styles.subtitle, {color: colors.txtMuted}]}>
                            管理你的储蓄目标
                        </Text>
                    </View>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.addButton, {backgroundColor: colors.gold}]}
                    onPress={() => {
                        hapticPatterns.buttonPress();
                        router.push('/plan/new');
                    }}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.addButtonText, {color: colors.onGold}]}>新建</Text>
                </TouchableOpacity>
            </Animated.View>

            {/* Tab Bar */}
            <Animated.View entering={FadeInUp.delay(150).duration(300)} style={styles.tabBar}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'overview' && {backgroundColor: colors.gold}]}
                    onPress={() => {
                        hapticPatterns.selection();
                        setActiveTab('overview');
                    }}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.tabText, {color: activeTab === 'overview' ? colors.onGold : colors.txtMuted}]}>
                        概览
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'plans' && {backgroundColor: colors.gold}]}
                    onPress={() => {
                        hapticPatterns.selection();
                        setActiveTab('plans');
                    }}
                    activeOpacity={0.8}
                >
                    <Text style={[styles.tabText, {color: activeTab === 'plans' ? colors.onGold : colors.txtMuted}]}>
                        我的计划
                    </Text>
                </TouchableOpacity>
            </Animated.View>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <>
                    {/* Stats */}
                    <Animated.View entering={FadeInUp.delay(200).duration(300)} style={styles.statsRow}>
                        <View style={[styles.statCard, {backgroundColor: colors.surface, borderColor: colors.line}]}>
                            <Text style={[styles.statValue, {color: colors.gold}]}>
                                ¥{dashboard?.total_saved.toLocaleString() || 0}
                            </Text>
                            <Text style={[styles.statLabel, {color: colors.txtMuted}]}>已存入</Text>
                        </View>
                        <View style={[styles.statCard, {backgroundColor: colors.surface, borderColor: colors.line}]}>
                            <Text style={[styles.statValue, {color: colors.txtPrimary}]}>
                                {dashboard?.active_plans || 0}
                            </Text>
                            <Text style={[styles.statLabel, {color: colors.txtMuted}]}>活跃计划</Text>
                        </View>
                        <View style={[styles.statCard, {backgroundColor: colors.surface, borderColor: colors.line}]}>
                            <Text style={[styles.statValue, {color: colors.txtPrimary}]}>
                                ¥{dashboard?.month_deposits?.toLocaleString() || 0}
                            </Text>
                            <Text style={[styles.statLabel, {color: colors.txtMuted}]}>本月存入</Text>
                        </View>
                        <View style={[styles.statCard, {backgroundColor: colors.surface, borderColor: colors.line}]}>
                            <View style={styles.streakRow}>
                                <Text style={[styles.statValue, {color: colors.txtPrimary}]}>{maxStreak}</Text>
                                {maxStreak > 0 && (
                                    <FontAwesome name="fire" size={14} color="#F59E0B"/>
                                )}
                            </View>
                            <Text style={[styles.statLabel, {color: colors.txtMuted}]}>最长连续</Text>
                        </View>
                    </Animated.View>

                    {/* Activity Feed */}
                    {dashboard?.activities && dashboard.activities.length > 0 && (
                        <Animated.View entering={FadeInUp.delay(300).duration(300)} style={[styles.activityCard, {
                            backgroundColor: colors.surface,
                            borderColor: colors.line
                        }]}>
                            <Text style={[styles.activityTitle, {color: colors.txtSecondary}]}>最近动态</Text>
                            {dashboard.activities.slice(0, 5).map((a: Activity) => {
                                const isMe = a.user_id === user?.id;
                                const label = ACTION_LABELS[a.action] || a.action;
                                return (
                                    <View key={a.id} style={styles.activityItem}>
                                        <View
                                            style={[styles.activityDot, {backgroundColor: isMe ? colors.gold : colors.mate}]}/>
                                        <View style={styles.activityContent}>
                                            <Text style={[styles.activityText, {color: colors.txtPrimary}]}>
                                                <Text style={{
                                                    fontWeight: '600',
                                                    color: isMe ? colors.gold : colors.mate
                                                }}>
                                                    {isMe ? '我' : a.nickname}
                                                </Text>
                                                {' '}{label}
                                                {a.detail &&
                                                    <Text style={{color: colors.txtSecondary}}> {a.detail}</Text>}
                                                {a.action === 'react' &&
                                                    <Text style={{color: colors.txtSecondary}}> 发送了表情</Text>}
                                            </Text>
                                            <Text style={[styles.activityTime, {color: colors.txtMuted}]}>
                                                {getTimeAgo(a.created_at)}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })}
                        </Animated.View>
                    )}
                </>
            )}

            {/* Plans Tab */}
            {activeTab === 'plans' && (
                activePlans.length === 0 ? (
                    <Animated.View entering={FadeInUp.delay(300).duration(300)} style={styles.emptyState}>
                        <View style={[styles.emptyIcon, {backgroundColor: colors.surfaceElevated}]}>
                            <FontAwesome name="plus" size={24} color={colors.txtMuted}/>
                        </View>
                        <Text style={[styles.emptyTitle, {color: colors.txtPrimary}]}>
                            还没有储蓄计划
                        </Text>
                        <Text style={[styles.emptySubtitle, {color: colors.txtMuted}]}>
                            创建第一个计划，开始你的储蓄之旅
                        </Text>
                        <TouchableOpacity
                            style={[styles.createButton, {backgroundColor: colors.gold}]}
                            onPress={() => {
                                hapticPatterns.buttonPress();
                                router.push('/plan/new');
                            }}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.createButtonText, {color: colors.onGold}]}>
                                创建计划
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                ) : (
                    <FlatList
                        data={activePlans}
                        keyExtractor={(item) => item.id.toString()}
                        contentContainerStyle={styles.listContent}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor={colors.gold}
                            />
                        }
                        renderItem={({item, index}) => {
                            const filledCells = (item as any).filled_cells || 0;
                            const progress = Math.min((filledCells / item.cell_count) * 100, 100);
                            const dlInfo = getDeadlineInfo(item.deadline);
                            const isOverdue = dlInfo.isOverdue && item.status !== 'completed';
                            const hasPartner = !!(item as any).partner_nickname;

                            return (
                                <AnimatedTouchableOpacity
                                    entering={FadeInUp.delay(staggerConfig.initialDelay + index * staggerConfig.itemDelay).duration(300)}
                                    style={[styles.planCard, {
                                        backgroundColor: colors.surface,
                                        borderColor: colors.line
                                    }]}
                                    onPress={() => {
                                        hapticPatterns.buttonPress();
                                        router.push(`/plan/${item.id}`);
                                    }}
                                    activeOpacity={0.8}
                                >
                                    <View style={styles.planHeader}>
                                        <View style={{flex: 1}}>
                                            <Text style={[styles.planName, {color: colors.txtPrimary}]}>
                                                {item.name}
                                            </Text>
                                            <Text style={[styles.planTarget, {color: colors.txtMuted}]}>
                                                目标 ¥{item.target_amount.toLocaleString()}
                                            </Text>
                                            {/* Partner info */}
                                            <Text style={[styles.planMeta, {color: colors.txtMuted}]}>
                                                {hasPartner ? (
                                                    <Text style={{color: colors.mate}}>
                                                        {(item as any).partner_avatar || '👫'} 和 {(item as any).partner_nickname} 一起存
                                                    </Text>
                                                ) : (
                                                    '个人计划'
                                                )}
                                            </Text>
                                            {/* Deadline */}
                                            {dlInfo.label && (
                                                <Text style={[
                                                    styles.deadlineText,
                                                    {color: isOverdue ? '#F59E0B' : dlInfo.daysLeft !== null && dlInfo.daysLeft <= 7 ? '#FB923C' : colors.txtMuted}
                                                ]}>
                                                    <FontAwesome name={isOverdue ? 'exclamation-circle' : 'calendar'}
                                                                 size={10}/> {dlInfo.label}
                                                </Text>
                                            )}
                                        </View>
                                        <View
                                            style={[
                                                styles.statusBadge,
                                                item.status === 'completed'
                                                    ? {backgroundColor: 'rgba(22, 148, 68, 0.1)'}
                                                    : isOverdue
                                                        ? {backgroundColor: 'rgba(245, 158, 11, 0.1)'}
                                                        : {backgroundColor: 'rgba(168, 120, 36, 0.1)'},
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.statusText,
                                                    item.status === 'completed'
                                                        ? {color: colors.success}
                                                        : isOverdue
                                                            ? {color: '#F59E0B'}
                                                            : {color: colors.gold},
                                                ]}
                                            >
                                                {item.status === 'completed' ? '已完成' : isOverdue ? '已逾期' : '进行中'}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Overdue Encouragement */}
                                    {isOverdue && (
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
                                        <AnimatedProgressBar progress={progress}/>
                                        <View style={styles.progressLabels}>
                                            <Text style={[styles.progressText, {color: colors.txtMuted}]}>
                                                ¥{item.cell_amount}/格
                                            </Text>
                                            <Text style={[styles.progressText, {color: colors.txtMuted}]}>
                                                {filledCells}/{item.cell_count} 格
                                            </Text>
                                        </View>
                                    </View>
                                </AnimatedTouchableOpacity>
                            );
                        }}
                    />
                )
            )}
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
        paddingBottom: spacing.md,
    },
    avatarSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    avatarEmoji: {
        fontSize: 24,
    },
    greetingSection: {
        flex: 1,
    },
    greeting: {
        fontSize: 18,
        fontWeight: '600',
    },
    subtitle: {
        fontSize: fontSizes.sm,
        marginTop: 2,
    },
    addButton: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm + 2,
        borderRadius: 12,
    },
    addButtonText: {
        fontSize: fontSizes.md,
        fontWeight: '600',
    },
    tabBar: {
        flexDirection: 'row',
        marginHorizontal: spacing.lg,
        marginBottom: spacing.lg,
        padding: 4,
        borderRadius: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.03)',
    },
    tab: {
        flex: 1,
        paddingVertical: spacing.sm,
        borderRadius: 10,
        alignItems: 'center',
    },
    tabText: {
        fontSize: fontSizes.sm,
        fontWeight: '600',
    },
    statsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    statCard: {
        flex: 1,
        minWidth: '45%',
        borderRadius: borderRadius['2xl'],
        borderWidth: 1,
        padding: spacing.md,
        alignItems: 'center',
        ...shadows.card,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
    },
    statLabel: {
        fontSize: fontSizes.xs,
        marginTop: 4,
    },
    streakRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    activityCard: {
        marginHorizontal: spacing.lg,
        marginBottom: spacing.lg,
        borderRadius: borderRadius['2xl'],
        borderWidth: 1,
        padding: spacing.lg,
        ...shadows.card,
    },
    activityTitle: {
        fontSize: fontSizes.sm,
        fontWeight: '500',
        marginBottom: spacing.md,
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: spacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    },
    activityDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginTop: 5,
        marginRight: spacing.sm,
    },
    activityContent: {
        flex: 1,
    },
    activityText: {
        fontSize: fontSizes.sm,
        lineHeight: 20,
    },
    activityTime: {
        fontSize: 10,
        marginTop: 2,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
    },
    emptyIcon: {
        width: 64,
        height: 64,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: spacing.sm,
    },
    emptySubtitle: {
        fontSize: fontSizes.md,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    createButton: {
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.md,
        borderRadius: 12,
    },
    createButtonText: {
        fontSize: fontSizes.md,
        fontWeight: '600',
    },
    listContent: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xxl,
    },
    planCard: {
        borderRadius: borderRadius['2xl'],
        borderWidth: 1,
        padding: spacing.lg,
        marginBottom: spacing.md,
        ...shadows.card,
    },
    planHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
    },
    planName: {
        fontSize: fontSizes.lg,
        fontWeight: '600',
    },
    planTarget: {
        fontSize: fontSizes.sm,
        marginTop: 2,
    },
    planMeta: {
        fontSize: fontSizes.xs,
        marginTop: 4,
    },
    deadlineText: {
        fontSize: fontSizes.xs,
        marginTop: 4,
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
    statusBadge: {
        paddingHorizontal: spacing.sm + 2,
        paddingVertical: spacing.xs + 2,
        borderRadius: 8,
    },
    statusText: {
        fontSize: fontSizes.xs,
        fontWeight: '500',
    },
    progressSection: {
        gap: spacing.sm,
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    progressText: {
        fontSize: fontSizes.xs,
    },
});
