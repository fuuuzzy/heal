import { StyleSheet } from 'react-native';

// Light theme colors (与 Web 端 CSS variables 一致)
export const lightColors = {
  surface: '#FFFFFF',
  surfaceDark: '#F5F5F8',
  surfaceElevated: '#F0F0F4',
  surfaceHover: '#E8E8ED',
  line: '#E2E2E8',
  lineLight: '#D0D0D8',
  lineFaint: '#EBEBF0',
  gold: '#A87824',
  goldLight: '#BC8E38',
  goldDark: '#8A621C',
  mate: '#4F4FC8',
  mateLight: '#6E6EDE',
  txtPrimary: '#1A1A22',
  txtSecondary: '#6B6B78',
  txtMuted: '#9494A0',
  danger: '#D22626',
  success: '#169444',
  onGold: '#FFFFFF',
  cellMineBg: 'rgba(168, 120, 36, 0.10)',
  cellMateBg: 'rgba(79, 79, 200, 0.10)',
};

// Dark theme colors
export const darkColors = {
  surface: '#1A1A20',
  surfaceDark: '#0F0F12',
  surfaceElevated: '#222228',
  surfaceHover: '#2A2A32',
  line: '#2D2D35',
  lineLight: '#3A3A42',
  lineFaint: '#1F1F26',
  gold: '#C9963B',
  goldLight: '#DBA94E',
  goldDark: '#A67B2E',
  mate: '#6366F1',
  mateLight: '#818CF8',
  txtPrimary: '#EDEDEF',
  txtSecondary: '#9494A0',
  txtMuted: '#62626E',
  danger: '#EF4444',
  success: '#34D399',
  onGold: '#0F0F12',
  cellMineBg: 'rgba(201, 150, 59, 0.15)',
  cellMateBg: 'rgba(99, 102, 241, 0.15)',
};

// Common styles (与 Web 端 Tailwind 类对应)
export const commonStyles = StyleSheet.create({
  // 卡片: card = bg-surface rounded-2xl border border-line p-6
  card: {
    backgroundColor: lightColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: lightColors.line,
    padding: 24,
  },
  // 主按钮: btn-primary = bg-gold text-on-gold font-semibold py-2.5 px-6 rounded-xl
  btnPrimary: {
    backgroundColor: lightColors.gold,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 次按钮: btn-secondary = bg-surface-elevated text-txt-secondary font-medium py-2.5 px-6 rounded-xl border border-line
  btnSecondary: {
    backgroundColor: lightColors.surfaceElevated,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: lightColors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // 输入框: input-field = px-4 py-3 rounded-xl bg-surface-dark border border-line
  inputField: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: lightColors.surfaceDark,
    borderWidth: 1,
    borderColor: lightColors.line,
    fontSize: 14,
    color: lightColors.txtPrimary,
  },
  // 进度条轨道: progress-track = h-1.5 bg-line-faint rounded-full overflow-hidden
  progressTrack: {
    height: 6,
    backgroundColor: lightColors.lineFaint,
    borderRadius: 999,
    overflow: 'hidden',
  },
  // 进度条填充: progress-fill = h-full bg-gold rounded-full
  progressFill: {
    height: '100%',
    backgroundColor: lightColors.gold,
    borderRadius: 999,
  },
  // 分割线: divider = border-t border-line
  divider: {
    borderTopWidth: 1,
    borderTopColor: lightColors.line,
  },
  // 格子
  cell: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellEmpty: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: lightColors.lineLight,
    backgroundColor: 'transparent',
  },
  cellMine: {
    borderWidth: 1.5,
    borderColor: 'rgba(168, 120, 36, 0.35)',
    backgroundColor: lightColors.cellMineBg,
  },
  cellMate: {
    borderWidth: 1.5,
    borderColor: 'rgba(79, 79, 200, 0.35)',
    backgroundColor: lightColors.cellMateBg,
  },
  cellPending: {
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.5)',
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
  },
  // 统计卡片: stat-card = bg-surface rounded-2xl border border-line p-4
  statCard: {
    backgroundColor: lightColors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: lightColors.line,
    padding: 16,
  },
  // 统计值: stat-value = text-xl font-bold text-txt-primary
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: lightColors.txtPrimary,
  },
  // 统计标签: stat-label = text-xs text-txt-muted mt-0.5
  statLabel: {
    fontSize: 12,
    color: lightColors.txtMuted,
    marginTop: 2,
  },
});

// Spacing constants (与 Tailwind spacing 对应)
export const spacing = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  12: 48,
  16: 64,
  // 别名
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

// Font sizes (与 Tailwind text-* 对应)
export const fontSizes = {
  '10': 10,   // text-[10px]
  xs: 12,     // text-xs
  sm: 14,     // text-sm
  base: 16,   // text-base
  lg: 18,     // text-lg
  xl: 20,     // text-xl
  '2xl': 24,  // text-2xl
  '3xl': 30,  // text-3xl
  '4xl': 36,  // text-4xl
};

// Border radius (与 Tailwind rounded-* 对应)
export const borderRadius = {
  none: 0,
  sm: 2,
  DEFAULT: 4,
  md: 6,
  lg: 8,
  xl: 12,
  '2xl': 16,
  '3xl': 24,
  full: 9999,
};
