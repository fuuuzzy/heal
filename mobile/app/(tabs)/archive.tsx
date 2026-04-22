import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { savingsService } from '@/services/savingsService';
import { lightColors, darkColors, spacing, fontSizes } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';
import type { SavingsPlan } from '@/types';

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
      <View style={[styles.container, { backgroundColor: colors.surfaceDark }]}>
        <ActivityIndicator size="large" color={colors.gold} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceDark, paddingTop: spacing.xl + insets.top }]}>
      <Text style={[styles.title, { color: colors.txtPrimary }]}>归档计划</Text>

      {plans.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: colors.txtPrimary }]}>
            暂无归档计划
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.txtMuted }]}>
            完成或归档的计划会显示在这里
          </Text>
        </View>
      ) : (
        <FlatList
          data={plans}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          renderItem={({ item }) => {
            const filledCells = (item as any).filled_cells || 0;
            const progress = Math.min((filledCells / item.cell_count) * 100, 100);

            return (
              <TouchableOpacity
                style={[styles.planCard, { backgroundColor: colors.surface, borderColor: colors.line }]}
                onPress={() => router.push(`/plan/${item.id}`)}
              >
                <View style={styles.planHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.planName, { color: colors.txtPrimary }]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.planTarget, { color: colors.txtMuted }]}>
                      目标 ¥{item.target_amount.toLocaleString()}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      item.status === 'completed'
                        ? { backgroundColor: 'rgba(22, 148, 68, 0.1)' }
                        : { backgroundColor: 'rgba(168, 120, 36, 0.1)' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        item.status === 'completed'
                          ? { color: colors.success }
                          : { color: '#9333EA' },
                      ]}
                    >
                      {item.status === 'completed' ? '已完成' : '已归档'}
                    </Text>
                  </View>
                </View>

                <View style={styles.progressSection}>
                  <View style={[styles.progressBar, { backgroundColor: colors.lineFaint }]}>
                    <View
                      style={[
                        styles.progressFill,
                        { backgroundColor: colors.gold, width: `${progress}%` },
                      ]}
                    />
                  </View>
                  <View style={styles.progressLabels}>
                    <Text style={[styles.progressText, { color: colors.txtMuted }]}>
                      完成率 {progress.toFixed(0)}%
                    </Text>
                    <Text style={[styles.progressText, { color: colors.txtMuted }]}>
                      {filledCells}/{item.cell_count} 格
                    </Text>
                  </View>
                </View>

                {item.archived_at && (
                  <Text style={[styles.archivedDate, { color: colors.txtMuted }]}>
                    归档于 {new Date(item.archived_at).toLocaleDateString('zh-CN')}
                  </Text>
                )}
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
  archivedDate: {
    fontSize: fontSizes.xs,
    marginTop: spacing.md,
    textAlign: 'right',
  },
});
