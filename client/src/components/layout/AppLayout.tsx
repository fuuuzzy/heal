import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../hooks/useTheme'
import { SavingsIcon, HeartPeopleIcon, MemoryBookIcon, SunIcon, MoonIcon } from '../common/Icons'

export function AppLayout() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const initial = user?.nickname?.charAt(0) || '?'

  return (
    <div className="min-h-screen bg-surface-dark">
      {/* Desktop sidebar */}
      <nav className="hidden lg:flex fixed left-0 top-0 bottom-0 w-60 bg-surface border-r border-line flex-col z-20">
        <div className="px-6 py-6 border-b border-line">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gold/10 rounded-lg flex items-center justify-center">
              <span className="text-gold font-bold text-sm">存</span>
            </div>
            <span className="text-lg font-semibold text-txt-primary tracking-tight">一起存</span>
          </div>
        </div>

        <div className="flex-1 px-3 py-4 space-y-1">
          <SidebarLink to="/" label="我的计划" icon={<SavingsIcon />} />
          <SidebarLink to="/archive" label="归档计划" icon={<MemoryBookIcon />} />
          <SidebarLink to="/partner" label="伴侣" icon={<HeartPeopleIcon />} />
        </div>

        <div className="px-3 py-4 border-t border-line">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-9 h-9 bg-surface-elevated rounded-full flex items-center justify-center text-sm font-semibold text-gold">
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-txt-primary truncate">{user?.nickname}</p>
              <p className="text-xs text-txt-muted truncate">@{user?.username}</p>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="w-full text-left text-sm text-txt-muted hover:text-txt-secondary px-3 py-1.5 mt-1 rounded-lg hover:bg-surface-hover transition-colors flex items-center gap-2"
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            {theme === 'dark' ? '浅色模式' : '深色模式'}
          </button>
          <button
            onClick={handleLogout}
            className="w-full text-left text-sm text-txt-muted hover:text-txt-secondary px-3 py-1.5 mt-1 rounded-lg hover:bg-surface-hover transition-colors"
          >
            退出登录
          </button>
        </div>
      </nav>

      {/* Main content */}
      <main className="lg:ml-60 pb-24 lg:pb-0">
        <div className="max-w-4xl mx-auto p-5 lg:p-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile bottom tab */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface/90 backdrop-blur-xl border-t border-line flex z-20 safe-area-bottom">
        <MobileTab to="/" label="计划" icon={<SavingsIcon />} />
        <MobileTab to="/partner" label="伴侣" icon={<HeartPeopleIcon />} />
        <MobileTab to="/archive" label="归档" icon={<MemoryBookIcon />} />
        <button
          onClick={toggleTheme}
          className="flex-1 flex flex-col items-center gap-0.5 py-3 transition-colors text-txt-muted"
        >
          <span className="w-5 h-5">{theme === 'dark' ? <SunIcon /> : <MoonIcon />}</span>
          <span className="text-[10px] font-medium">{theme === 'dark' ? '浅色' : '深色'}</span>
        </button>
      </nav>
    </div>
  )
}

function SidebarLink({ to, label, icon }: { to: string; label: string; icon: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
          isActive
            ? 'bg-gold/8 text-gold'
            : 'text-txt-muted hover:text-txt-secondary hover:bg-surface-hover'
        }`
      }
    >
      <span className="w-5 h-5 flex items-center justify-center">{icon}</span>
      <span className="text-sm font-medium">{label}</span>
    </NavLink>
  )
}

function MobileTab({ to, label, icon }: { to: string; label: string; icon: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex-1 flex flex-col items-center gap-0.5 py-3 transition-colors ${
          isActive ? 'text-gold' : 'text-txt-muted'
        }`
      }
    >
      <span className="w-5 h-5">{icon}</span>
      <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
  )
}

