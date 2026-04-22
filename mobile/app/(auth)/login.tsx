import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, FadeIn, ZoomIn } from 'react-native-reanimated';
import { useAuth } from '@/hooks/useAuth';
import { lightColors, darkColors, spacing, fontSizes, borderRadius, shadows } from '@/constants/theme';
import { hapticPatterns } from '@/utils/haptics';
import { useColorScheme } from '@/components/useColorScheme';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);
const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      hapticPatterns.errorShake();
      setError('请输入用户名和密码');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await login(username, password);
      hapticPatterns.success();
      router.replace('/(tabs)');
    } catch (err: any) {
      hapticPatterns.errorShake();
      setError(err.message || '登录失败');
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
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing[12] }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <Animated.View entering={ZoomIn.delay(100).duration(400)} style={styles.logoContainer}>
          <View style={[styles.logo, { backgroundColor: colors.gold + '15' }]}>
            <Text style={[styles.logoText, { color: colors.gold }]}>存</Text>
          </View>
          <Text style={[styles.brandName, { color: colors.txtPrimary }]}>一起存</Text>
        </Animated.View>

        {/* Title */}
        <Animated.View entering={FadeInUp.delay(200).duration(400)} style={styles.titleSection}>
          <Text style={[styles.title, { color: colors.txtPrimary }]}>欢迎回来</Text>
          <Text style={[styles.subtitle, { color: colors.txtMuted }]}>登录你的账号以继续</Text>
        </Animated.View>

        {/* Form */}
        <View style={styles.form}>
          {error && (
            <Animated.View entering={FadeIn.duration(200)} style={[styles.errorBox, { backgroundColor: colors.danger + '10', borderColor: colors.danger + '20' }]}>
              <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
            </Animated.View>
          )}

          <Animated.View entering={FadeInUp.delay(300).duration(400)} style={styles.field}>
            <Text style={[styles.label, { color: colors.txtSecondary }]}>用户名</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceDark, borderColor: colors.line, color: colors.txtPrimary }]}
              placeholder="输入用户名"
              placeholderTextColor={colors.txtMuted}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(400).duration(400)} style={styles.field}>
            <Text style={[styles.label, { color: colors.txtSecondary }]}>密码</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceDark, borderColor: colors.line, color: colors.txtPrimary }]}
              placeholder="输入密码"
              placeholderTextColor={colors.txtMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(500).duration(400)}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: colors.gold }, loading && styles.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={[styles.buttonText, { color: colors.onGold }]}>
                {loading ? '登录中...' : '登录'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Register link */}
        <Animated.View entering={FadeInUp.delay(600).duration(400)} style={styles.linkSection}>
          <Text style={[styles.linkText, { color: colors.txtMuted }]}>
            还没有账号？
          </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')} activeOpacity={0.7}>
            <Text style={[styles.linkHighlight, { color: colors.gold }]}>注册</Text>
          </TouchableOpacity>
        </Animated.View>
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[3],
  },
  logoText: {
    fontSize: fontSizes.lg,
    fontWeight: '700',
  },
  brandName: {
    fontSize: fontSizes.xl,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  titleSection: {
    marginBottom: spacing[8],
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
    fontWeight: '500',
  },
  input: {
    width: '100%',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    fontSize: fontSizes.sm,
  },
  button: {
    paddingVertical: spacing[3],
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    marginTop: spacing[2],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: fontSizes.md,
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
