import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const AVATAR_COLORS = [
  '#C9963B', '#6366F1', '#EF4444', '#10B981',
  '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4',
  '#F97316', '#84CC16', '#E11D48', '#0EA5E9',
]

export function RegisterPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [avatarColor, setAvatarColor] = useState(AVATAR_COLORS[0]!)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(username, password, nickname, avatarColor)
      navigate('/')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '注册失败')
    } finally {
      setLoading(false)
    }
  }

  const initial = nickname.charAt(0) || '?'

  return (
    <div className="min-h-screen bg-surface-dark flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-surface-elevated border-r border-line flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.03]" style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }} />
        <div className="relative">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gold/10 rounded-lg flex items-center justify-center">
              <span className="text-gold font-bold text-sm">存</span>
            </div>
            <span className="text-lg font-semibold text-txt-primary tracking-tight">一起存</span>
          </div>
        </div>
        <div className="relative space-y-4">
          <h2 className="text-4xl font-serif font-semibold text-txt-primary leading-tight">
            开始你们的<br />储蓄之旅
          </h2>
          <p className="text-txt-secondary max-w-sm leading-relaxed">
            创建账号，邀请伴侣，一起制定储蓄计划，用承诺填满每一个格子。
          </p>
        </div>
        <div className="relative">
          <p className="text-xs text-txt-muted">&copy; 2026 一起存</p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-txt-primary">创建账号</h1>
            <p className="text-sm text-txt-muted">填写信息以注册新账号</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-danger/10 text-danger text-sm px-4 py-2.5 rounded-xl border border-danger/20">
                {error}
              </div>
            )}

            {/* Avatar color picker */}
            <div>
              <label className="block text-sm text-txt-secondary mb-2">头像颜色</label>
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0 transition-all"
                  style={{ backgroundColor: avatarColor }}
                >
                  {initial}
                </div>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_COLORS.map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setAvatarColor(color)}
                      className={`w-7 h-7 rounded-full transition-all ${
                        avatarColor === color ? 'ring-2 ring-offset-2 ring-offset-surface-dark scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm text-txt-secondary mb-1.5">用户名</label>
              <input
                type="text"
                placeholder="3-20个字符"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="input-field"
                minLength={3}
                maxLength={20}
                required
              />
            </div>

            <div>
              <label className="block text-sm text-txt-secondary mb-1.5">昵称</label>
              <input
                type="text"
                placeholder="显示名称"
                value={nickname}
                onChange={e => setNickname(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-txt-secondary mb-1.5">密码</label>
              <input
                type="password"
                placeholder="至少6个字符"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-field"
                minLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? '注册中...' : '注册'}
            </button>
          </form>

          <p className="text-center text-sm text-txt-muted">
            已有账号？
            <Link to="/login" className="text-gold hover:text-gold-light ml-1 transition-colors">
              登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
