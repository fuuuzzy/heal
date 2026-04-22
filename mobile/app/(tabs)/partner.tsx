import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { partnerService } from '@/services/partnerService';
import { lightColors, darkColors, spacing, fontSizes } from '@/constants/theme';
import { DefaultAvatar } from '@/components/DefaultAvatar';
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
      const result = await partnerService.generateInviteCode();
      setInviteCode(result.code);
    } catch (error: any) {
      Alert.alert('错误', error.message || '生成邀请码失败');
    }
  };

  const handleBindPartner = async () => {
    if (!inputCode.trim()) {
      Alert.alert('提示', '请输入邀请码');
      return;
    }

    try {
      await partnerService.bindPartner(inputCode.trim());
      Alert.alert('成功', '伴侣绑定成功！');
      loadPartner();
    } catch (error: any) {
      Alert.alert('错误', error.message || '绑定失败');
    }
  };

  const handleUnbind = () => {
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
              setPartner(null);
              Alert.alert('成功', '已解绑');
            } catch (error: any) {
              Alert.alert('错误', error.message || '解绑失败');
            }
          },
        },
      ]
    );
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
      <Text style={[styles.title, { color: colors.txtPrimary }]}>伴侣</Text>

      {partner ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
          <View style={styles.partnerInfo}>
            {partner.avatar_emoji ? (
              <View style={[styles.avatarContainer, { backgroundColor: colors.gold + '15' }]}>
                <Text style={styles.avatarEmoji}>{partner.avatar_emoji}</Text>
              </View>
            ) : (
              <DefaultAvatar size={50} />
            )}
            <View style={styles.partnerDetails}>
              <Text style={[styles.partnerName, { color: colors.txtPrimary }]}>
                {partner.nickname}
              </Text>
              <Text style={[styles.partnerUsername, { color: colors.txtMuted }]}>
                @{partner.username}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.unbindButton, { borderColor: colors.danger }]}
            onPress={handleUnbind}
          >
            <Text style={[styles.unbindText, { color: colors.danger }]}>解绑</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.bindSection}>
          <Text style={[styles.sectionTitle, { color: colors.txtSecondary }]}>
            邀请伴侣一起存
          </Text>

          <TouchableOpacity
            style={[styles.generateButton, { backgroundColor: colors.gold }]}
            onPress={handleGenerateCode}
          >
            <Text style={[styles.generateButtonText, { color: colors.onGold }]}>
              生成邀请码
            </Text>
          </TouchableOpacity>

          {inviteCode && (
            <View style={[styles.codeBox, { backgroundColor: colors.surface, borderColor: colors.line }]}>
              <Text style={[styles.codeLabel, { color: colors.txtMuted }]}>你的邀请码：</Text>
              <Text style={[styles.code, { color: colors.gold }]}>{inviteCode}</Text>
            </View>
          )}

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.line }]} />
            <Text style={[styles.dividerText, { color: colors.txtMuted }]}>或</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.line }]} />
          </View>

          <Text style={[styles.sectionTitle, { color: colors.txtSecondary }]}>
            输入对方的邀请码
          </Text>

          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.line, color: colors.txtPrimary }]}
            placeholder="输入6位邀请码"
            placeholderTextColor={colors.txtMuted}
            value={inputCode}
            onChangeText={setInputCode}
            maxLength={6}
            autoCapitalize="characters"
          />

          <TouchableOpacity
            style={[styles.bindButton, { backgroundColor: colors.gold }]}
            onPress={handleBindPartner}
          >
            <Text style={[styles.bindButtonText, { color: colors.onGold }]}>
              绑定伴侣
            </Text>
          </TouchableOpacity>
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
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.lg,
  },
  partnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarEmoji: {
    fontSize: 26,
  },
  partnerName: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
  },
  partnerUsername: {
    fontSize: fontSizes.sm,
    marginTop: 2,
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
