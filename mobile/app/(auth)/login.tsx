import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useAuth } from '@/hooks/useAuth';
import { lightColors, darkColors, spacing, fontSizes } from '@/constants/theme';
import { useColorScheme } from '@/components/useColorScheme';

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
      setError('请输入用户名和密码');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await login(username, password);
      router.replace('/(tabs)');
    } catch (err: any) {
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
        {/* Logo - 与 Web 端一致 */}
        <View style={styles.logoContainer}>
          <View style={[styles.logo, { backgroundColor: colors.gold + '10' }]}>
            <Text style={[styles.logoText, { color: colors.gold }]}>存</Text>
          </View>
          <Text style={[styles.brandName, { color: colors.txtPrimary }]}>一起存</Text>
        </View>

        {/* 标题 */}
        <View style={styles.titleSection}>
          <Text style={[styles.title, { color: colors.txtPrimary }]}>欢迎回来</Text>
          <Text style={[styles.subtitle, { color: colors.txtMuted }]}>登录你的账号以继续</Text>
        </View>

        {/* 表单 - 与 Web 端 input-field 一致 */}
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
        </View>

        {/* 注册链接 */}
        <View style={styles.linkSection}>
          <Text style={[styles.linkText, { color: colors.txtMuted }]}>
            还没有账号？
          </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={[styles.linkHighlight, { color: colors.gold }]}>注册</Text>
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
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing[8],
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
  },
  input: {
    width: '100%',
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: 12,
    borderWidth: 1,
    fontSize: fontSizes.sm,
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
