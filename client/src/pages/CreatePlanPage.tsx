import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { savingsService } from '../services/savingsService'

const PRESET_CELLS = [
  { label: '500', value: 500 },
  { label: '1000', value: 1000 },
  { label: '2000', value: 2000 },
  { label: '自定义', value: 0 },
]

const CELL_THEMES = [
  { id: 'default', label: '经典金', preview: 'bg-gold' },
  { id: 'sakura', label: '樱花粉', preview: 'bg-pink-400' },
  { id: 'ocean', label: '海洋蓝', preview: 'bg-blue-400' },
  { id: 'forest', label: '森林绿', preview: 'bg-emerald-400' },
]

export function CreatePlanPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [targetAmount, setTargetAmount] = useState('')
  const [cellPreset, setCellPreset] = useState(2000)
  const [customCells, setCustomCells] = useState('')
  const [cellTheme, setCellTheme] = useState('default')
  const [deadline, setDeadline] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const numericAmount = Number(targetAmount.replace(/,/g, ''))
  const cellCount = cellPreset || Number(customCells) || 0
  const cellAmount = cellCount > 0 && numericAmount > 0
    ? Math.round((numericAmount / cellCount) * 100) / 100
    : 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!name || !numericAmount || cellCount < 10) {
      setError('请填写完整信息')
      return
    }

    setLoading(true)
    try {
      const plan = await savingsService.createPlan({
        name,
        target_amount: numericAmount,
        cell_count: cellCount,
        cell_theme: cellTheme !== 'default' ? cellTheme : undefined,
        deadline: deadline || undefined,
      })
      navigate(`/plan/${plan.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '创建失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-txt-primary">创建储蓄计划</h1>
        <p className="text-sm text-txt-muted mt-0.5">设定目标，划分格子</p>
      </div>

      <form onSubmit={handleSubmit} className="card space-y-5">
        {error && (
          <div className="bg-danger/10 text-danger text-sm px-4 py-2.5 rounded-xl border border-danger/20">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm text-txt-secondary mb-1.5">计划名称</label>
          <input
            type="text"
            placeholder="如：我们的第一套房"
            value={name}
            onChange={e => setName(e.target.value)}
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-txt-secondary mb-1.5">目标金额（元）</label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="如：1,000,000"
            value={targetAmount}
            onChange={e => {
              const raw = e.target.value.replace(/,/g, '')
              if (raw === '' || /^\d+$/.test(raw)) {
                setTargetAmount(raw ? Number(raw).toLocaleString() : '')
              }
            }}
            className="input-field"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-txt-secondary mb-1.5">格子数量</label>
          <div className="flex flex-wrap gap-2">
            {PRESET_CELLS.map(preset => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setCellPreset(preset.value)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  cellPreset === preset.value
                    ? 'bg-gold/10 text-gold border border-gold/30'
                    : 'bg-surface-elevated text-txt-muted border border-line hover:border-line-light'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          {cellPreset === 0 && (
            <input
              type="number"
              placeholder="输入自定义格子数（10-5000）"
              value={customCells}
              onChange={e => setCustomCells(e.target.value)}
              className="input-field mt-2"
              min={10}
              max={5000}
            />
          )}
        </div>

        {/* Theme Selector */}
        <div>
          <label className="block text-sm text-txt-secondary mb-1.5">格子配色</label>
          <div className="flex flex-wrap gap-2">
            {CELL_THEMES.map(theme => (
              <button
                key={theme.id}
                type="button"
                onClick={() => setCellTheme(theme.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  cellTheme === theme.id
                    ? 'bg-surface-hover border border-line-light'
                    : 'bg-surface-elevated text-txt-muted border border-line hover:border-line-light'
                }`}
              >
                <span className={`w-3 h-3 rounded-full ${theme.preview}`} />
                {theme.label}
              </button>
            ))}
          </div>
        </div>

        {/* Deadline */}
        <div>
          <label className="block text-sm text-txt-secondary mb-1.5">目标日期（可选）</label>
          <input
            type="date"
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
            min={new Date().toISOString().slice(0, 10)}
            className="input-field"
          />
          <p className="text-xs text-txt-muted mt-1">设定截止日期，超过后仍可继续存入</p>
        </div>

        {/* Preview */}
        {cellAmount > 0 && (
          <div className="bg-surface-elevated rounded-xl p-4 border border-line">
            <p className="text-xs text-txt-muted uppercase tracking-wider mb-3">预览</p>
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <span className="text-txt-muted">目标金额</span>
              <span className="text-right font-medium text-txt-primary">¥{numericAmount.toLocaleString()}</span>
              <span className="text-txt-muted">格子数量</span>
              <span className="text-right font-medium text-txt-primary">{cellCount} 格</span>
              <span className="text-txt-muted">每格金额</span>
              <span className="text-right font-semibold text-gold">¥{cellAmount.toLocaleString()}</span>
              <span className="text-txt-muted">配色</span>
              <span className="text-right font-medium text-txt-primary">
                {CELL_THEMES.find(t => t.id === cellTheme)?.label}
              </span>
              <span className="text-txt-muted">目标日期</span>
              <span className="text-right font-medium text-txt-primary">
                {deadline || '未设定'}
              </span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || cellAmount <= 0}
          className="btn-primary w-full"
        >
          {loading ? '创建中...' : '创建计划'}
        </button>
      </form>
    </div>
  )
}
