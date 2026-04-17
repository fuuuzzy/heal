import { useState, useEffect } from 'react'
import { savingsService } from '../services/savingsService'
import { useAuth } from '../hooks/useAuth'
import { StarIcon } from '../components/common/Icons'
import type { Partnership } from '../types'

export function PartnerPage() {
  const { user } = useAuth()
  const [partnership, setPartnership] = useState<Partnership | null>(null)
  const [inviteCode, setInviteCode] = useState('')
  const [inputCode, setInputCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    savingsService.getPartnerStatus()
      .then(setPartnership)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const handleGenerateCode = async () => {
    try {
      setError('')
      const p = await savingsService.generateInviteCode()
      setPartnership(p)
      setInviteCode(p.invite_code)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '生成邀请码失败')
    }
  }

  const handleBind = async () => {
    if (!inputCode.trim()) return
    try {
      setError('')
      const p = await savingsService.bindPartner(inputCode.trim().toUpperCase())
      setPartnership(p)
      setSuccess('绑定成功')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '绑定失败')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    )
  }

  // Already bound
  if (partnership?.status === 'active') {
    return (
      <div className="max-w-md mx-auto">
        <div className="card text-center py-10">
          <div className="flex justify-center items-center gap-6 mb-6">
            <div className="text-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white mx-auto"
                style={{ backgroundColor: user?.avatar_emoji || '#C9963B' }}
              >
                {user?.nickname?.charAt(0) || '?'}
              </div>
              <span className="text-sm text-txt-secondary mt-2 block">{user?.nickname}</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-8 h-px bg-line-light" />
              <div className="w-5 h-5 rounded-full bg-gold/10 flex items-center justify-center">
                <StarIcon className="w-3 h-3 text-gold" />
              </div>
              <div className="w-8 h-px bg-line-light" />
            </div>
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-mate/20 flex items-center justify-center text-xl font-bold text-mate mx-auto">
                伴
              </div>
              <span className="text-sm text-txt-secondary mt-2 block">伴侣</span>
            </div>
          </div>
          <p className="text-sm text-txt-muted">你们已绑定，可以一起存钱了</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-txt-primary">伴侣绑定</h1>
        <p className="text-sm text-txt-muted mt-0.5">绑定后可一起管理储蓄计划</p>
      </div>

      {error && <div className="bg-danger/10 text-danger text-sm px-4 py-2.5 rounded-xl border border-danger/20">{error}</div>}
      {success && <div className="bg-success/10 text-success text-sm px-4 py-2.5 rounded-xl border border-success/20">{success}</div>}

      {/* Generate invite code */}
      <div className="card">
        <h3 className="font-medium text-txt-primary mb-3">邀请伴侣</h3>
        {!inviteCode ? (
          <button onClick={handleGenerateCode} className="btn-primary text-sm">
            生成邀请码
          </button>
        ) : (
          <div className="text-center">
            <p className="text-sm text-txt-muted mb-3">将此邀请码分享给伴侣</p>
            <div className="bg-surface-dark rounded-xl py-5 px-6 inline-block border border-line">
              <span className="text-3xl font-bold text-gold tracking-[0.4em] font-mono">
                {inviteCode}
              </span>
            </div>
            <p className="text-xs text-txt-muted mt-3">邀请码有效期至对方绑定</p>
          </div>
        )}
      </div>

      {/* Input invite code */}
      <div className="card">
        <h3 className="font-medium text-txt-primary mb-1.5">输入邀请码</h3>
        <p className="text-sm text-txt-muted mb-3">输入伴侣分享的邀请码完成绑定</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={inputCode}
            onChange={e => setInputCode(e.target.value.toUpperCase())}
            className="input-field flex-1 tracking-[0.2em] text-center font-bold font-mono uppercase"
            placeholder="6位邀请码"
            maxLength={6}
          />
          <button
            onClick={handleBind}
            disabled={inputCode.length !== 6}
            className="btn-secondary text-sm disabled:opacity-40"
          >
            绑定
          </button>
        </div>
      </div>
    </div>
  )
}
