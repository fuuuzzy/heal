import {useEffect, useState} from 'react';
import {FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View,} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useRouter} from 'expo-router';
import Animated, {FadeIn, FadeInUp} from 'react-native-reanimated';
import {savingsService} from '@/services/savingsService';
import {borderRadius, darkColors, fontSizes, lightColors, shadows, spacing} from '@/constants/theme';
import {hapticPatterns} from '@/utils/haptics';
import {AnimatedProgressBar} from '@/components/AnimatedProgressBar';
import {PlanCardSkeleton} from '@/components/Skeleton';
import {staggerConfig} from '@/constants/animations';
import type {SavingsPlan} from '@/types';
import {useColorScheme} from '@/components/useColorScheme';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function ArchiveScreen() {
    const router = useRouter();
    const colorScheme = useColorScheme();
    const colors = colorScheme === 'dark' ? darkColors : lightColors;
    const insets = useSafeAreaInsets();

    const [plans, setPlans] = useState<SavingsPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadData = async () => {
        try {
            const data = await savingsService.getArchivedPlans();
            setPlans(data);
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

    if (loading) {
        return (
            <View
                style={[styles.container, {backgroundColor: colors.surfaceDark, paddingTop: spacing.xl + insets.top}]}>
                <View style={{
                    width: 100,
                    height: 24,
                    backgroundColor: colors.lineFaint,
                    borderRadius: 4,
                    marginBottom: spacing.xl
                }}/>
                <PlanCardSkeleton/>
                <PlanCardSkeleton/>
            </View>
        );
    }

    return (
        <View style={[styles.container, {backgroundColor: colors.surfaceDark, paddingTop: spacing.xl + insets.top}]}>
            <Animated.Text entering={FadeIn.duration(300)} style={[styles.title, {color: colors.txtPrimary}]}>
                归档计划
            </Animated.Text>

            {plans.length === 0 ? (
                <Animated.View entering={FadeInUp.delay(200).duration(300)} style={styles.emptyState}>
                    <Text style={[styles.emptyTitle, {color: colors.txtPrimary}]}>
                        暂无归档计划
                    </Text>
                    <Text style={[styles.emptySubtitle, {color: colors.txtMuted}]}>
                        完成或归档的计划会显示在这里
                    </Text>
                </Animated.View>
            ) : (
                <FlatList
                    data={plans}
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
                        const isCompleted = item.status === 'completed';

                        return (
                            <AnimatedTouchableOpacity
                                entering={FadeInUp.delay(staggerConfig.initialDelay + index * staggerConfig.itemDelay).duration(300)}
                                style={[styles.planCard, {backgroundColor: colors.surface, borderColor: colors.line}]}
                                onPress={() => {
                                    hapticPatterns.buttonPress();
                                    router.push(`/plan/${item.id}`);
                                }}
                                activeOpacity={0.8}
                            >
                                <View style={styles.planHeader}>
                                    <View style={{flex: 1}}>
                                        <View style={{flexDirection: 'row', alignItems: 'center', gap: spacing.sm}}>
                                            <Text style={[styles.planName, {color: colors.txtPrimary}]}>
                                                {item.name}
                                            </Text>
                                            {isCompleted && (
                                                <View style={styles.badgeContainer}>
                                                    <Text style={styles.badge}>✓</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={[styles.planTarget, {color: colors.txtMuted}]}>
                                            目标 ¥{item.target_amount.toLocaleString()}
                                        </Text>
                                    </View>
                                    <View
                                        style={[
                                            styles.statusBadge,
                                            isCompleted
                                                ? {backgroundColor: 'rgba(22, 148, 68, 0.1)'}
                                                : {backgroundColor: 'rgba(168, 120, 36, 0.1)'},
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.statusText,
                                                isCompleted
                                                    ? {color: colors.success}
                                                    : {color: '#9333EA'},
                                            ]}
                                        >
                                            {isCompleted ? '已完成' : '已归档'}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.progressSection}>
                                    <AnimatedProgressBar progress={progress}/>
                                    <View style={styles.progressLabels}>
                                        <Text style={[styles.progressText, {color: colors.txtMuted}]}>
                                            完成率 {progress.toFixed(0)}%
                                        </Text>
                                        <Text style={[styles.progressText, {color: colors.txtMuted}]}>
                                            {filledCells}/{item.cell_count} 格
                                        </Text>
                                    </View>
                                </View>

                                {item.archived_at && (
                                    <Text style={[styles.archivedDate, {color: colors.txtMuted}]}>
                                        归档于 {new Date(item.archived_at).toLocaleDateString('zh-CN')}
                                    </Text>
                                )}
                            </AnimatedTouchableOpacity>
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
        paddingHorizontal: spacing.lg,
    },
    title: {
        fontSize: 22,
        fontWeight: '600',
        marginBottom: spacing.xl,
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: spacing.sm,
    },
    emptySubtitle: {
        fontSize: fontSizes.md,
        textAlign: 'center',
    },
    listContent: {
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
    badgeContainer: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#169444',
        alignItems: 'center',
        justifyContent: 'center',
    },
    badge: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700',
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
    archivedDate: {
        fontSize: fontSizes.xs,
        marginTop: spacing.md,
        textAlign: 'right',
    },
});
