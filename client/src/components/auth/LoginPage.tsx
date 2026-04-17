import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(username, password)
      navigate('/')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

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
            共同储蓄，<br />实现每一个目标
          </h2>
          <p className="text-txt-secondary max-w-sm leading-relaxed">
            与伴侣一起制定储蓄计划，用承诺填满每一个格子，见证梦想一步步成真。
          </p>
        </div>
        <div className="relative">
          <p className="text-xs text-txt-muted">&copy; 2026 一起存</p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5">
            <div className="w-9 h-9 bg-gold/10 rounded-lg flex items-center justify-center">
              <span className="text-gold font-bold text-sm">存</span>
            </div>
            <span className="text-lg font-semibold text-txt-primary tracking-tight">一起存</span>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-txt-primary">欢迎回来</h1>
            <p className="text-sm text-txt-muted">登录你的账号以继续</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-danger/10 text-danger text-sm px-4 py-2.5 rounded-xl border border-danger/20">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm text-txt-secondary mb-1.5">用户名</label>
              <input
                type="text"
                placeholder="输入用户名"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-txt-secondary mb-1.5">密码</label>
              <input
                type="password"
                placeholder="输入密码"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input-field"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          <p className="text-center text-sm text-txt-muted">
            还没有账号？
            <Link to="/register" className="text-gold hover:text-gold-light ml-1 transition-colors">
              注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
