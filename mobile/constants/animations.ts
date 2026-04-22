/**
 * Animation configurations for the mobile app
 * Corresponds to web client CSS animations
 */

// Spring animation configs (for react-native-reanimated)
export const springConfig = {
  gentle: {
    damping: 20,
    stiffness: 150,
    mass: 1,
  },
  bouncy: {
    damping: 12,
    stiffness: 180,
    mass: 0.8,
  },
  snappy: {
    damping: 25,
    stiffness: 300,
    mass: 1,
  },
} as const;

// Timing configs (in ms)
export const timing = {
  instant: 100,
  fast: 200,
  normal: 300,
  slow: 500,
  verySlow: 700,
} as const;

// Cell animations
export const cellAnimations = {
  // Breathing animation for empty cells
  breathe: {
    scaleRange: [1, 1.02, 1] as const,
    opacityRange: [0.6, 0.85, 0.6] as const,
    duration: 3000,
  },
  // Shimmer effect for filled cells
  shimmer: {
    duration: 1500,
  },
  // Pending pulse animation
  pendingPulse: {
    scaleRange: [1, 1.05, 1] as const,
    duration: 2000,
  },
  // Press feedback
  press: {
    scaleDown: 0.96,
    scaleUp: 1.15,
    duration: 150,
  },
} as const;

// Progress bar animations
export const progressAnimations = {
  fillDuration: 700,
  staggerDelay: 50, // ms between items
} as const;

// Staggered reveal
export const staggerConfig = {
  itemDelay: 50, // ms between each item
  initialDelay: 100, // ms before first item
} as const;

// Celebration animations
export const celebrationAnimations = {
  confetti: {
    count: 50,
    duration: 2000,
  },
  milestone: {
    scale: [0, 1.15, 1],
    duration: 500,
  },
} as const;
