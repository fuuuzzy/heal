/**
 * Haptic feedback utilities
 * Provides consistent haptic feedback across the app
 */
import * as Haptics from 'expo-haptics';

export const haptics = {
  /** Light impact - for subtle feedback */
  light: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),

  /** Medium impact - for standard interactions */
  medium: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium),

  /** Heavy impact - for significant actions */
  heavy: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),

  /** Success notification - for completed actions */
  success: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),

  /** Warning notification - for caution states */
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),

  /** Error notification - for failed actions */
  error: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),

  /** Selection changed - for picker/segment changes */
  selection: () => Haptics.selectionAsync(),
};

// Convenience functions for common patterns
export const hapticPatterns = {
  /** Cell tap - light feedback */
  cellTap: () => haptics.light(),

  /** Cell fill - success feedback */
  cellFill: () => haptics.success(),

  /** Button press - medium feedback */
  buttonPress: () => haptics.medium(),

  /** Tab switch - selection feedback */
  tabSwitch: () => haptics.selection(),

  /** Light impact - for subtle feedback */
  light: () => haptics.light(),

  /** Medium impact - for standard interactions */
  medium: () => haptics.medium(),

  /** Success notification */
  success: () => haptics.success(),

  /** Selection changed */
  selection: () => haptics.selection(),

  /** Milestone reached - heavy + success */
  milestone: async () => {
    await haptics.heavy();
    await haptics.success();
  },

  /** Error shake - error feedback */
  errorShake: () => haptics.error(),
};
