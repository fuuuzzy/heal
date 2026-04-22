import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { savingsService } from '@/services/savingsService';
import { lightColors, darkColors, spacing, fontSizes } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

const CELL_COUNT_OPTIONS = [12, 24, 36, 48, 60, 100];

export default function NewPlanScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [cellCount, setCellCount] = useState(24);
  const [deadline, setDeadline] = useState('');
  const [loading, setLoading] = useState(false);

  const cellAmount = targetAmount ? Math.ceil(Number(targetAmount) / cellCount) : 0;

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('提示', '请输入计划名称');
      return;
    }
    if (!targetAmount || Number(targetAmount) <= 0) {
      Alert.alert('提示', '请输入有效的目标金额');
      return;
    }

    setLoading(true);
    try {
      await savingsService.createPlan({
        name: name.trim(),
        target_amount: Number(targetAmount),
        cell_count: cellCount,
        deadline: deadline || undefined,
      });
      Alert.alert('成功', '计划创建成功！', [
        { text: '好的', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('错误', error.message || '创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.surfaceDark }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.backButton, { color: colors.gold }]}>取消</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.txtPrimary }]}>创建计划</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.txtSecondary }]}>计划名称</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.surface, borderColor: colors.line, color: colors.txtPrimary },
              ]}
              placeholder="例如：旅行基金"
              placeholderTextColor={colors.txtMuted}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.txtSecondary }]}>目标金额 (元)</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.surface, borderColor: colors.line, color: colors.txtPrimary },
              ]}
              placeholder="例如：10000"
              placeholderTextColor={colors.txtMuted}
              value={targetAmount}
              onChangeText={setTargetAmount}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.txtSecondary }]}>格子数量</Text>
            <View style={styles.optionsRow}>
              {CELL_COUNT_OPTIONS.map((count) => (
                <TouchableOpacity
                  key={count}
                  style={[
                    styles.optionButton,
                    cellCount === count && { backgroundColor: colors.gold, borderColor: colors.gold },
                    { backgroundColor: colors.surface, borderColor: colors.line },
                  ]}
                  onPress={() => setCellCount(count)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: cellCount === count ? colors.onGold : colors.txtSecondary },
                    ]}
                  >
                    {count}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.txtSecondary }]}>截止日期（可选）</Text>
            <TextInput
              style={[
                styles.input,
                { backgroundColor: colors.surface, borderColor: colors.line, color: colors.txtPrimary },
              ]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.txtMuted}
              value={deadline}
              onChangeText={setDeadline}
            />
          </View>

          {cellAmount > 0 && (
            <View style={[styles.preview, { backgroundColor: colors.surface, borderColor: colors.line }]}>
              <Text style={[styles.previewLabel, { color: colors.txtMuted }]}>预览</Text>
              <View style={styles.previewRow}>
                <Text style={[styles.previewValue, { color: colors.gold }]}>
                  ¥{cellAmount.toLocaleString()}
                </Text>
                <Text style={[styles.previewText, { color: colors.txtMuted }]}>/ 格</Text>
              </View>
              <Text style={[styles.previewInfo, { color: colors.txtSecondary }]}>
                共 {cellCount} 格，每存一格 ¥{cellAmount.toLocaleString()}
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: colors.gold },
              loading && styles.submitButtonDisabled,
            ]}
            onPress={handleCreate}
            disabled={loading}
          >
            <Text style={[styles.submitButtonText, { color: colors.onGold }]}>
              {loading ? '创建中...' : '创建计划'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    borderRadius: 12,
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
  preview: {
    padding: spacing.lg,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  previewLabel: {
    fontSize: fontSizes.xs,
    marginBottom: spacing.sm,
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
  previewInfo: {
    fontSize: fontSizes.sm,
    marginTop: spacing.sm,
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
