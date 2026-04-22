import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { lightColors, darkColors, spacing, fontSizes } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

const AVATAR_OPTIONS = ['😊', '😄', '🥰', '😎', '🤓', '😇', '🥳', '😋'];

export default function RegisterScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [avatarEmoji, setAvatarEmoji] = useState('😊');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;

  const handleRegister = async () => {
    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次密码输入不一致');
      return;
    }
    if (!nickname.trim()) {
      setError('请输入昵称');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await register(username, password, nickname, avatarEmoji);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.surfaceDark }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing[6] }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* 返回按钮 */}
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backText, { color: colors.gold }]}>← 返回</Text>
        </TouchableOpacity>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <View style={[styles.logo, { backgroundColor: colors.gold + '10' }]}>
            <Text style={[styles.logoText, { color: colors.gold }]}>存</Text>
          </View>
          <Text style={[styles.brandName, { color: colors.txtPrimary }]}>一起存</Text>
        </View>

        {/* 标题 */}
        <View style={styles.titleSection}>
          <Text style={[styles.title, { color: colors.txtPrimary }]}>创建账号</Text>
          <Text style={[styles.subtitle, { color: colors.txtMuted }]}>开始你的储蓄之旅</Text>
        </View>

        {/* 表单 */}
        <View style={styles.form}>
          {error && (
            <View style={[styles.errorBox, { backgroundColor: colors.danger + '10', borderColor: colors.danger + '20' }]}>
              <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
            </View>
          )}

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.txtSecondary }]}>用户名</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceDark, borderColor: colors.line, color: colors.txtPrimary }]}
              placeholder="输入用户名"
              placeholderTextColor={colors.txtMuted}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.txtSecondary }]}>密码</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceDark, borderColor: colors.line, color: colors.txtPrimary }]}
              placeholder="输入密码"
              placeholderTextColor={colors.txtMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.txtSecondary }]}>确认密码</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceDark, borderColor: colors.line, color: colors.txtPrimary }]}
              placeholder="再次输入密码"
              placeholderTextColor={colors.txtMuted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
            />
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.txtSecondary }]}>昵称</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceDark, borderColor: colors.line, color: colors.txtPrimary }]}
              placeholder="你的昵称"
              placeholderTextColor={colors.txtMuted}
              value={nickname}
              onChangeText={setNickname}
            />
          </View>

          {/* 头像选择 */}
          <View style={styles.avatarSection}>
            <Text style={[styles.label, { color: colors.txtSecondary }]}>选择头像</Text>
            <View style={styles.avatarGrid}>
              {AVATAR_OPTIONS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  style={[
                    styles.avatarOption,
                    { backgroundColor: colors.surface, borderColor: colors.line },
                    avatarEmoji === emoji && { borderColor: colors.gold, backgroundColor: colors.gold + '10' },
                  ]}
                  onPress={() => setAvatarEmoji(emoji)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.avatarEmoji}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.gold }, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={[styles.buttonText, { color: colors.onGold }]}>
              {loading ? '注册中...' : '注册'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 登录链接 */}
        <View style={styles.linkSection}>
          <Text style={[styles.linkText, { color: colors.txtMuted }]}>
            已有账号？
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.linkHighlight, { color: colors.gold }]}>登录</Text>
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
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing[6],
    paddingBottom: spacing[8],
  },
  backButton: {
    marginBottom: spacing[4],
  },
  backText: {
    fontSize: fontSizes.sm,
    fontWeight: '500',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  logoText: {
    fontSize: fontSizes.sm,
    fontWeight: '700',
  },
  brandName: {
    fontSize: fontSizes.lg,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  titleSection: {
    marginBottom: spacing[6],
  },
  title: {
    fontSize: fontSizes['2xl'],
    fontWeight: '600',
    marginBottom: spacing[1],
  },
  subtitle: {
    fontSize: fontSizes.sm,
  },
  form: {
    gap: spacing[4],
    marginBottom: spacing[6],
  },
  errorBox: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2.5],
    borderRadius: 12,
    borderWidth: 1,
  },
  errorText: {
    fontSize: fontSizes.sm,
  },
  field: {
    gap: spacing[1.5],
  },
  label: {
    fontSize: fontSizes.sm,
  },
  input: {
    width: '100%',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: 12,
    borderWidth: 1,
    fontSize: fontSizes.sm,
  },
  avatarSection: {
    marginTop: spacing[2],
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
    marginTop: spacing[1.5],
  },
  avatarOption: {
    width: 48,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: {
    fontSize: 24,
  },
  button: {
    paddingVertical: spacing[2.5],
    borderRadius: 12,
    alignItems: 'center',
    marginTop: spacing[2],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: fontSizes.sm,
    fontWeight: '600',
  },
  linkSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing[1],
  },
  linkText: {
    fontSize: fontSizes.sm,
  },
  linkHighlight: {
    fontSize: fontSizes.sm,
    fontWeight: '500',
  },
});
