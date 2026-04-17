/**
 * Themed icons for 一起存 — soft, rounded, warm aesthetic.
 * All icons use viewBox="0 0 24 24" with stroke-based design for consistency.
 */

interface IconProps {
  className?: string
}

/** 储蓄罐 — 用于"我的计划"导航 */
export function SavingsIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M6 10c0-3.3 2.7-6 6-6 2.5 0 4.6 1.5 5.5 3.7" />
      <path d="M17.5 7.7C19.5 9 21 11 21 13.5c0 1.5-.5 2.5-1.5 3" />
      <path d="M3 13.5C3 11 4.5 9 6.5 7.7" />
      <ellipse cx="12" cy="14" rx="8" ry="5" />
      <circle cx="9.5" cy="13" r={0.8} fill="currentColor" stroke="none" />
      <path d="M14 12.5c.5-.3 1.2-.3 1.5 0" />
      <path d="M8 19c0 1 .5 2 2 2s2-1 2-2" />
      <path d="M14 19c0 1 .5 2 2 2s2-1 2-2" />
      <path d="M19 11h1.5c.8 0 1.5.7 1.5 1.5s-.7 1.5-1.5 1.5H19" />
    </svg>
  )
}

/** 双心 — 用于"伴侣"导航 */
export function HeartPeopleIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 21C12 21 4 16 4 10.5 4 7.5 6.5 5 9.5 5c1.7 0 2.5 1 2.5 1s.8-1 2.5-1c3 0 5.5 2.5 5.5 5.5C20 16 12 21 12 21z" />
      <path d="M18.5 7c.8-.5 1.5-1.3 1.5-2.5 0-1.7-1.3-3-3-3-1 0-1.8.5-2.3 1.2" />
    </svg>
  )
}

/** 记忆本 — 用于"归档计划"导航 */
export function MemoryBookIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      <path d="M8 7h8" />
      <path d="M8 11h5" />
      <circle cx="16" cy="16" r={2.5} strokeWidth={1.5} />
      <path d="M15 14.5l.5-.5 1 1" strokeWidth={1.2} />
    </svg>
  )
}

/** 太阳 */
export function SunIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r={4} />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="M4.93 4.93l1.41 1.41" />
      <path d="M17.66 17.66l1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="M6.34 17.66l-1.41 1.41" />
      <path d="M19.07 4.93l-1.41 1.41" />
    </svg>
  )
}

/** 月亮 */
export function MoonIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  )
}

/** 柔和加号 — 用于空状态 */
export function PlusIcon({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r={10} />
      <path d="M12 8v8" />
      <path d="M8 12h8" />
    </svg>
  )
}

/** 柔和删除 — 替换 🗑 */
export function DeleteIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 6h18" />
      <path d="M8 6V4c0-1.1.9-2 2-2h4c1.1 0 2 .9 2 2v2" />
      <path d="M19 6l-.7 12.5c-.1 1.4-1.3 2.5-2.7 2.5H8.4c-1.4 0-2.6-1.1-2.7-2.5L5 6" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  )
}

/** 归档动作 — 替换 📦 */
export function ArchiveActionIcon({ className = 'w-5 h-5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 8v13H3V8" />
      <path d="M1 3h22v5H1z" />
      <path d="M10 12h4" />
      <path d="M12 3v5" />
    </svg>
  )
}

/** 时钟 — 用于日期 */
export function ClockIcon({ className = 'w-3.5 h-3.5' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r={10} />
      <path d="M12 6v6l4 2" />
    </svg>
  )
}

/** 日历 — 用于截止日期 */
export function CalendarIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4" />
      <path d="M8 2v4" />
      <path d="M3 10h18" />
      <circle cx="12" cy="15" r={1.2} fill="currentColor" stroke="none" />
    </svg>
  )
}

/** 警告 — 用于逾期 */
export function AlertIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <path d="M12 9v4" />
      <circle cx="12" cy="16" r={0.5} fill="currentColor" stroke="none" />
    </svg>
  )
}

/** 火焰 — 用于连续天数，替换 🔥 emoji */
export function StreakIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 23c-4.4 0-8-3.1-8-7 0-2.5 1.5-4.8 3-6.3.3-.3.8-.2 1 .2.4 1 1.2 1.8 2 2.3.2-2.2 1.2-4.2 3-5.7.3-.3.8-.1 1 .2C15.5 9.2 18 11.5 18 16c0 3.9-3.6 7-6 7z" />
    </svg>
  )
}

/** 三点菜单 — 用于操作菜单 */
export function MenuDotsIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <circle cx="12" cy="5" r={2} />
      <circle cx="12" cy="12" r={2} />
      <circle cx="12" cy="19" r={2} />
    </svg>
  )
}

/** 空归档状态 — 空盒子 */
export function EmptyArchiveIcon({ className = 'w-8 h-8' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 8v13H3V8" />
      <path d="M1 3h22v5H1z" />
      <path d="M10 12h4" />
      <path d="M3 8l9-3 9 3" />
    </svg>
  )
}

/** 星星 — 用于伴侣之间的装饰 */
export function StarIcon({ className = 'w-3 h-3' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth={1} className={className}>
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 16.8l-6.2 4.5 2.4-7.4L2 9.4h7.6z" />
    </svg>
  )
}

/** 个人 — 替换 👤 */
export function PersonIcon({ className = 'w-4 h-4' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="8" r={4} />
      <path d="M4 21c0-3.3 3.6-6 8-6s8 2.7 8 6" />
    </svg>
  )
}

/** 错误 — 用于 ErrorBoundary */
export function WarningCircleIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r={10} />
      <path d="M12 8v4" />
      <circle cx="12" cy="16" r={0.5} fill="currentColor" stroke="none" />
    </svg>
  )
}

/** 纪念卷轴 — 替换 📜 */
export function ScrollIcon({ className = 'w-6 h-6' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 5c0-1.1.9-2 2-2h1a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V5z" />
      <path d="M7 3h10a2 2 0 012 2v14a2 2 0 01-2 2H7" />
      <path d="M10 8h4" />
      <path d="M10 12h3" />
      <path d="M17 5c0-1.1.9-2 2-2h-1a2 2 0 00-2 2" />
    </svg>
  )
}
