import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { useAuth } from '@/hooks/useAuth';
import { savingsService } from '@/services/savingsService';
import { lightColors, darkColors, spacing, fontSizes, shadows, borderRadius } from '@/constants/theme';
import { hapticPatterns } from '@/utils/haptics';
import { Cell } from '@/components/Cell';
import { AnimatedProgressBar } from '@/components/AnimatedProgressBar';
import { BottomSheet } from '@/components/BottomSheet';
import { Celebration } from '@/components/Celebration';
import { useColorScheme } from '@/components/useColorScheme';
import type { PlanDetail, CellState } from '@/types';

export default function PlanDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
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
          { text: '关闭', style: 'cancel' },
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

  const renderCell = ({ item, index }: { item: CellState; index: number }) => {
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
      <View style={[styles.container, { backgroundColor: colors.surfaceDark, paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.backButton, { color: colors.gold }]}>← 返回</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.errorText, { color: colors.txtMuted }]}>计划不存在</Text>
        </View>
      </View>
    );
  }

  const { stats } = plan;
  const progressPercent = stats.progress_percent;

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceDark, paddingTop: insets.top }]}>
      {/* Header */}
      <Animated.View entering={FadeIn.duration(200)} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={[styles.backButton, { color: colors.gold }]}>← 返回</Text>
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
              { text: '取消', style: 'cancel' },
            ]);
          }}
          activeOpacity={0.7}
        >
          <Text style={[styles.menuButton, { color: colors.txtMuted }]}>⋯</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Info Card */}
      <Animated.View entering={FadeInUp.delay(100).duration(300)} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
        <Text style={[styles.planName, { color: colors.txtPrimary }]}>{plan.name}</Text>
        <Text style={[styles.cellAmount, { color: colors.txtMuted }]}>
          ¥{plan.cell_amount} / 格
        </Text>

        <View style={styles.progressSection}>
          <View style={styles.progressRow}>
            <Text style={[styles.amount, { color: colors.txtPrimary }]}>
              ¥{stats.filled_amount.toLocaleString()}
            </Text>
            <Text style={[styles.amountTarget, { color: colors.txtMuted }]}>
              / ¥{stats.total_amount.toLocaleString()}
            </Text>
          </View>
          <Text style={[styles.percent, { color: colors.gold }]}>{progressPercent}%</Text>
        </View>

        <AnimatedProgressBar progress={progressPercent} showMilestones />
      </Animated.View>

      {/* Grid */}
      <Animated.View entering={FadeInUp.delay(200).duration(300)} style={styles.gridContainer}>
        <FlatList
          data={plan.cells}
          keyExtractor={(item) => item.index.toString()}
          numColumns={8}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={{ gap: 6 }}
          renderItem={renderCell}
          scrollEnabled={false}
        />
      </Animated.View>

      {/* Pledge Modal */}
      <BottomSheet visible={showPledgeModal} onClose={() => setShowPledgeModal(false)} snapHeight={320}>
        <View style={styles.modalContent}>
          <Text style={[styles.modalTitle, { color: colors.txtPrimary }]}>
            存入 ¥{plan.cell_amount}
          </Text>
          <Text style={[styles.modalSubtitle, { color: colors.txtMuted }]}>
            写下你的承诺
          </Text>

          <TextInput
            style={[
              styles.pledgeInput,
              { backgroundColor: colors.surfaceDark, borderColor: colors.line, color: colors.txtPrimary },
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
              style={[styles.modalButton, { backgroundColor: colors.surfaceElevated }]}
              onPress={() => {
                setShowPledgeModal(false);
                setPledgeContent('');
                setSelectedCell(null);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.modalButtonText, { color: colors.txtSecondary }]}>取消</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.gold }, submitting && styles.modalButtonDisabled]}
              onPress={handleSubmitPledge}
              disabled={submitting}
              activeOpacity={0.8}
            >
              <Text style={[styles.modalButtonText, { color: colors.onGold }]}>
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
  planName: {
    fontSize: fontSizes.xl,
    fontWeight: '600',
  },
  cellAmount: {
    fontSize: fontSizes.sm,
    marginTop: 2,
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
