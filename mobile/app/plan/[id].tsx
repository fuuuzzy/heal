import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { savingsService } from '@/services/savingsService';
import { lightColors, darkColors, spacing, fontSizes } from '@/constants/theme';
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
      setSelectedCell(cell);
      setShowPledgeModal(true);
    } else {
      // Show cell detail
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
                      loadPlan();
                    } catch (error: any) {
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
                      loadPlan();
                    } catch (error: any) {
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

      if (result.completed) {
        Alert.alert('🎉 恭喜！', '计划已完成！');
      } else if (result.hit_milestone) {
        Alert.alert('🎯 达成里程碑', `完成 ${result.hit_milestone}%！`);
      }
    } catch (error: any) {
      Alert.alert('错误', error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const renderCell = ({ item }: { item: CellState }) => {
    const isMine = item.filled_by === user?.id;
    const isPending = item.status === 'unfill_pending';

    let cellStyle = styles.cellEmpty;
    let textColor = colors.txtMuted;
    let content = String(item.index + 1);

    if (item.status === 'filled' && isMine) {
      cellStyle = [styles.cellMine, { backgroundColor: colors.cellMineBg, borderColor: 'rgba(168, 120, 36, 0.35)' }];
      textColor = colors.gold;
      content = '◆';
    } else if (item.status === 'filled' && !isMine) {
      cellStyle = [styles.cellMate, { backgroundColor: colors.cellMateBg, borderColor: 'rgba(79, 79, 200, 0.35)' }];
      textColor = colors.mate;
      content = '◆';
    } else if (isPending) {
      cellStyle = [styles.cellPending, { backgroundColor: 'rgba(245, 158, 11, 0.06)', borderColor: 'rgba(245, 158, 11, 0.5)' }];
      textColor = '#F59E0B';
      content = '?';
    }

    return (
      <TouchableOpacity
        style={[styles.cell, cellStyle, { borderColor: colors.line }]}
        onPress={() => handleCellPress(item)}
      >
        <Text style={[styles.cellText, { color: textColor }]}>{content}</Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surfaceDark }]}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={[styles.container, { backgroundColor: colors.surfaceDark }]}>
        <Text style={[styles.errorText, { color: colors.txtMuted }]}>计划不存在</Text>
      </View>
    );
  }

  const { stats } = plan;
  const progressPercent = stats.progress_percent;

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceDark, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backButton, { color: colors.gold }]}>← 返回</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={async () => {
            if (plan.created_by !== user?.id) return;
            Alert.alert('操作', '选择操作', [
              {
                text: '归档',
                onPress: async () => {
                  try {
                    await savingsService.archivePlan(plan.id);
                    loadPlan();
                  } catch (error: any) {
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
                    router.back();
                  } catch (error: any) {
                    Alert.alert('错误', error.message);
                  }
                },
              },
              { text: '取消', style: 'cancel' },
            ]);
          }}
        >
          <Text style={[styles.menuButton, { color: colors.txtMuted }]}>⋯</Text>
        </TouchableOpacity>
      </View>

      {/* Info Card */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
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

        <View style={[styles.progressBar, { backgroundColor: colors.lineFaint }]}>
          <View
            style={[styles.progressFill, { backgroundColor: colors.gold, width: `${progressPercent}%` }]}
          />
        </View>
      </View>

      {/* Grid */}
      <FlatList
        data={plan.cells}
        keyExtractor={(item) => item.index.toString()}
        numColumns={8}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={{ gap: 6 }}
        renderItem={renderCell}
      />

      {/* Pledge Modal */}
      <Modal visible={showPledgeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
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
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.surfaceElevated }]}
                onPress={() => {
                  setShowPledgeModal(false);
                  setPledgeContent('');
                  setSelectedCell(null);
                }}
              >
                <Text style={[styles.modalButtonText, { color: colors.txtSecondary }]}>取消</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.gold }]}
                onPress={handleSubmitPledge}
                disabled={submitting}
              >
                <Text style={[styles.modalButtonText, { color: colors.onGold }]}>
                  {submitting ? '提交中...' : '确认存入'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.lg,
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
  progressBar: {
    height: 6,
    borderRadius: 3,
    marginTop: spacing.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  grid: {
    padding: spacing.sm,
  },
  cell: {
    width: 38,
    height: 38,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  cellEmpty: {
    borderStyle: 'dashed',
  },
  cellText: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
  },
  errorText: {
    fontSize: fontSizes.md,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    borderRadius: 20,
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
    textAlignVertical: 'top',
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
  modalButtonText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
});
