import {useEffect, useState} from 'react';
import {ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View,} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useRouter} from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import {useAuth} from '@/hooks/useAuth';
import {savingsService} from '@/services/savingsService';
import {darkColors, fontSizes, lightColors, spacing} from '@/constants/theme';
import type {DashboardData, SavingsPlan} from '@/types';
import {useColorScheme} from '@/components/useColorScheme';

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

    useEffect(() => {
        loadData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadData();
    };

    const activePlans = plans.filter((p) => p.status !== 'archived');

    if (loading) {
        return (
            <View style={[styles.container, {backgroundColor: colors.surfaceDark}]}>
                <ActivityIndicator size="large" color={colors.gold}/>
            </View>
        );
    }

    const maxStreak = Math.max(...(dashboard?.streaks.map((s) => s.current_streak) || [0]), 0);

    return (
        <View style={[styles.container, {backgroundColor: colors.surfaceDark}]}>
            <View style={[styles.header, {paddingTop: spacing.xl + insets.top}]}>
                <TouchableOpacity
                    style={styles.avatarSection}
                    onPress={() => router.push('/profile')}
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
                    onPress={() => router.push('/plan/new')}
                >
                    <Text style={[styles.addButtonText, {color: colors.onGold}]}>
                        新建
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
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
                    <View style={styles.streakRow}>
                        <Text style={[styles.statValue, {color: colors.txtPrimary}]}>{maxStreak}</Text>
                        {maxStreak > 0 && (
                            <FontAwesome name="fire" size={14} color="#F59E0B"/>
                        )}
                    </View>
                    <Text style={[styles.statLabel, {color: colors.txtMuted}]}>最长连续</Text>
                </View>
            </View>

            {/* Plans List */}
            {activePlans.length === 0 ? (
                <View style={styles.emptyState}>
                    <Text style={[styles.emptyTitle, {color: colors.txtPrimary}]}>
                        还没有储蓄计划
                    </Text>
                    <Text style={[styles.emptySubtitle, {color: colors.txtMuted}]}>
                        创建第一个计划，开始你的储蓄之旅
                    </Text>
                    <TouchableOpacity
                        style={[styles.createButton, {backgroundColor: colors.gold}]}
                        onPress={() => router.push('/plan/new')}
                    >
                        <Text style={[styles.createButtonText, {color: colors.onGold}]}>
                            创建计划
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={activePlans}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh}/>
                    }
                    renderItem={({item}) => {
                        const filledCells = (item as any).filled_cells || 0;
                        const progress = Math.min((filledCells / item.cell_count) * 100, 100);

                        return (
                            <TouchableOpacity
                                style={[styles.planCard, {backgroundColor: colors.surface, borderColor: colors.line}]}
                                onPress={() => router.push(`/plan/${item.id}`)}
                            >
                                <View style={styles.planHeader}>
                                    <View style={{flex: 1}}>
                                        <Text style={[styles.planName, {color: colors.txtPrimary}]}>
                                            {item.name}
                                        </Text>
                                        <Text style={[styles.planTarget, {color: colors.txtMuted}]}>
                                            目标 ¥{item.target_amount.toLocaleString()}
                                        </Text>
                                    </View>
                                    <View
                                        style={[
                                            styles.statusBadge,
                                            item.status === 'completed'
                                                ? {backgroundColor: 'rgba(22, 148, 68, 0.1)'}
                                                : {backgroundColor: 'rgba(168, 120, 36, 0.1)'},
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.statusText,
                                                item.status === 'completed'
                                                    ? {color: colors.success}
                                                    : {color: colors.gold},
                                            ]}
                                        >
                                            {item.status === 'completed' ? '已完成' : '进行中'}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.progressSection}>
                                    <View style={[styles.progressBar, {backgroundColor: colors.lineFaint}]}>
                                        <View
                                            style={[
                                                styles.progressFill,
                                                {backgroundColor: colors.gold, width: `${progress}%`},
                                            ]}
                                        />
                                    </View>
                                    <View style={styles.progressLabels}>
                                        <Text style={[styles.progressText, {color: colors.txtMuted}]}>
                                            ¥{item.cell_amount}/格
                                        </Text>
                                        <Text style={[styles.progressText, {color: colors.txtMuted}]}>
                                            {filledCells}/{item.cell_count} 格
                                        </Text>
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                />
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
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.md,
    },
    avatarEmoji: {
        fontSize: 22,
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
        borderRadius: 10,
    },
    addButtonText: {
        fontSize: fontSizes.md,
        fontWeight: '600',
    },
    statsRow: {
        flexDirection: 'row',
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    statCard: {
        flex: 1,
        borderRadius: 16,
        borderWidth: 1,
        padding: spacing.md,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
    },
    statLabel: {
        fontSize: fontSizes.xs,
        marginTop: 2,
    },
    streakRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
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
        borderRadius: 16,
        borderWidth: 1,
        padding: spacing.lg,
        marginBottom: spacing.md,
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
    progressBar: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    progressText: {
        fontSize: fontSizes.xs,
    },
});
