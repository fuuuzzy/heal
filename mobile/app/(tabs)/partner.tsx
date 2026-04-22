import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useAuth } from '@/hooks/useAuth';
import { partnerService } from '@/services/partnerService';
import { lightColors, darkColors, spacing, fontSizes, borderRadius, shadows } from '@/constants/theme';
import { hapticPatterns } from '@/utils/haptics';
import { useColorScheme } from '@/components/useColorScheme';
import type { User } from '@/types';

export default function PartnerScreen() {
  const { user } = useAuth();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const insets = useSafeAreaInsets();

  const [partner, setPartner] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [inputCode, setInputCode] = useState('');

  useEffect(() => {
    loadPartner();
  }, []);

  const loadPartner = async () => {
    try {
      const partnerData = await partnerService.getPartner();
      setPartner(partnerData);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    try {
      hapticPatterns.buttonPress();
      const result = await partnerService.generateInviteCode();
      setInviteCode(result.code);
    } catch (error: any) {
      hapticPatterns.errorShake();
      Alert.alert('错误', error.message || '生成邀请码失败');
    }
  };

  const handleBindPartner = async () => {
    if (!inputCode.trim()) {
      hapticPatterns.errorShake();
      Alert.alert('提示', '请输入邀请码');
      return;
    }

    try {
      hapticPatterns.buttonPress();
      await partnerService.bindPartner(inputCode.trim());
      hapticPatterns.milestone();
      Alert.alert('成功', '伴侣绑定成功！');
      loadPartner();
    } catch (error: any) {
      hapticPatterns.errorShake();
      Alert.alert('错误', error.message || '绑定失败');
    }
  };

  const handleUnbind = () => {
    hapticPatterns.medium();
    Alert.alert(
      '确认解绑',
      '解绑后将无法再一起储蓄，确定要解绑吗？',
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          style: 'destructive',
          onPress: async () => {
            try {
              await partnerService.unbindPartner();
              hapticPatterns.success();
              setPartner(null);
              Alert.alert('成功', '已解绑');
            } catch (error: any) {
              hapticPatterns.errorShake();
              Alert.alert('错误', error.message || '解绑失败');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surfaceDark, paddingTop: spacing.xl + insets.top }]}>
      <Animated.Text entering={FadeInUp.duration(300)} style={[styles.title, { color: colors.txtPrimary }]}>
        伴侣
      </Animated.Text>

      {partner ? (
        <Animated.View entering={ZoomIn.delay(100).duration(400)} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <View style={styles.partnerInfo}>
            <View style={[styles.avatarContainer, { backgroundColor: colors.gold + '15' }]}>
              <Text style={styles.avatarEmoji}>{partner.avatar_emoji || '😊'}</Text>
            </View>
            <View style={styles.partnerDetails}>
              <Text style={[styles.partnerName, { color: colors.txtPrimary }]}>
                {partner.nickname}
              </Text>
              <Text style={[styles.partnerUsername, { color: colors.txtMuted }]}>
                @{partner.username}
              </Text>
            </View>
            <Animated.Text entering={ZoomIn.delay(300).duration(200)} style={styles.heartIcon}>
              💕
            </Animated.Text>
          </View>

          <TouchableOpacity
            style={[styles.unbindButton, { borderColor: colors.danger }]}
            onPress={handleUnbind}
            activeOpacity={0.7}
          >
            <Text style={[styles.unbindText, { color: colors.danger }]}>解绑</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <View style={styles.bindSection}>
          <Animated.Text entering={FadeInUp.delay(100).duration(300)} style={[styles.sectionTitle, { color: colors.txtSecondary }]}>
            邀请伴侣一起存
          </Animated.Text>

          <Animated.View entering={FadeInUp.delay(200).duration(300)}>
            <TouchableOpacity
              style={[styles.generateButton, { backgroundColor: colors.gold }]}
              onPress={handleGenerateCode}
              activeOpacity={0.8}
            >
              <Text style={[styles.generateButtonText, { color: colors.onGold }]}>
                生成邀请码
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {inviteCode && (
            <Animated.View entering={ZoomIn.duration(300)} style={[styles.codeBox, { backgroundColor: colors.surface, borderColor: colors.line }]}>
              <Text style={[styles.codeLabel, { color: colors.txtMuted }]}>你的邀请码：</Text>
              <Text style={[styles.code, { color: colors.gold }]}>{inviteCode}</Text>
            </Animated.View>
          )}

          <Animated.View entering={FadeInUp.delay(300).duration(300)} style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.line }]} />
            <Text style={[styles.dividerText, { color: colors.txtMuted }]}>或</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.line }]} />
          </Animated.View>

          <Animated.Text entering={FadeInUp.delay(400).duration(300)} style={[styles.sectionTitle, { color: colors.txtSecondary }]}>
            输入对方的邀请码
          </Animated.Text>

          <Animated.View entering={FadeInUp.delay(450).duration(300)}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.line, color: colors.txtPrimary }]}
              placeholder="输入6位邀请码"
              placeholderTextColor={colors.txtMuted}
              value={inputCode}
              onChangeText={setInputCode}
              maxLength={6}
              autoCapitalize="characters"
            />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(500).duration(300)}>
            <TouchableOpacity
              style={[styles.bindButton, { backgroundColor: colors.gold }]}
              onPress={handleBindPartner}
              activeOpacity={0.8}
            >
              <Text style={[styles.bindButtonText, { color: colors.onGold }]}>
                绑定伴侣
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
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
  card: {
    borderRadius: borderRadius['2xl'],
    borderWidth: 1,
    padding: spacing.lg,
    ...shadows.card,
  },
  partnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  partnerDetails: {
    flex: 1,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarEmoji: {
    fontSize: 28,
  },
  partnerName: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
  },
  partnerUsername: {
    fontSize: fontSizes.sm,
    marginTop: 2,
  },
  heartIcon: {
    fontSize: 24,
    marginLeft: 'auto',
  },
  unbindButton: {
    paddingVertical: spacing.sm + 2,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  unbindText: {
    fontSize: fontSizes.md,
    fontWeight: '500',
  },
  bindSection: {
    gap: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSizes.md,
    textAlign: 'center',
  },
  generateButton: {
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  generateButtonText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  codeBox: {
    padding: spacing.lg,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  codeLabel: {
    fontSize: fontSizes.sm,
    marginBottom: spacing.xs,
  },
  code: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 4,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    fontSize: fontSizes.sm,
  },
  input: {
    width: '100%',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: fontSizes.lg,
    textAlign: 'center',
    letterSpacing: 4,
  },
  bindButton: {
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  bindButtonText: {
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
});
