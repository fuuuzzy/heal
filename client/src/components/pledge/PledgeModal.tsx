import { useState } from 'react'

const PLEDGE_TEMPLATES = [
  '我承诺于今日存入 ¥{amount}，为实现我们的梦想迈出坚实一步。',
  '我在此郑重承诺，今日存入 ¥{amount}，绝不食言。',
  '为了我们共同的未来，我承诺存入 ¥{amount}，说到做到。',
]

interface PledgeModalProps {
  cellAmount: number
  cellIndex: number
  onSubmit: (pledgeContent: string, note?: string) => Promise<void>
  onClose: () => void
}

export function PledgeModal({ cellAmount, cellIndex, onSubmit, onClose }: PledgeModalProps) {
  const [templateIdx, setTemplateIdx] = useState(0)
  const [customPledge, setCustomPledge] = useState('')
  const [note, setNote] = useState('')
  const [signName, setSignName] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [sealAnimating, setSealAnimating] = useState(false)

  const pledgeContent = customPledge || PLEDGE_TEMPLATES[templateIdx % PLEDGE_TEMPLATES.length]!.replace('{amount}', cellAmount.toString())

  const handleConfirm = async () => {
    if (!signName.trim()) return
    setSealAnimating(true)
    setLoading(true)
    try {
      await onSubmit(pledgeContent + `\n——${signName}`, note || undefined)
    } finally {
      setLoading(false)
      setSealAnimating(false)
    }
  }

  const handleSignConfirm = () => {
    if (!signName.trim()) return
    setConfirmed(true)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-surface rounded-2xl border border-line max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-0">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-semibold text-txt-primary">存钱承诺书</h2>
            <span className="text-xs text-txt-muted font-mono">No.{String(cellIndex + 1).padStart(3, '0')}</span>
          </div>
          <p className="text-sm text-gold font-medium">¥{cellAmount}</p>
        </div>

        {/* Pledge Document */}
        <div className="px-6 py-4">
          <div className="pledge-document">
            <div className="pledge-document-inner">
              <div className="pledge-ornament mb-3">◆ ◇ ◆</div>
              <div className="font-serif text-txt-primary leading-[2] text-[15px] whitespace-pre-line">
                {pledgeContent}
              </div>
              <div className="pledge-ornament mt-3">◆ ◇ ◆</div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-line/50">
                <span className="text-[11px] text-txt-muted">
                  {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
                <span className="text-[11px] text-txt-muted font-serif">承诺书</span>
              </div>
            </div>
          </div>
        </div>

        {/* Template Selector */}
        <div className="px-6">
          {!customPledge ? (
            <div className="flex gap-1.5 mb-3">
              {PLEDGE_TEMPLATES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setTemplateIdx(i)}
                  className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                    templateIdx === i
                      ? 'bg-gold/10 text-gold border border-gold/30'
                      : 'bg-surface-elevated text-txt-muted border border-line hover:border-line-light'
                  }`}
                >
                  模板 {i + 1}
                </button>
              ))}
            </div>
          ) : null}

          <button
            onClick={() => setCustomPledge(prev => prev ? '' : pledgeContent)}
            className="text-xs text-txt-muted hover:text-txt-secondary transition-colors mb-3"
          >
            {customPledge ? '← 使用模板' : '自定义承诺内容'}
          </button>
          {customPledge && (
            <textarea
              value={customPledge}
              onChange={e => setCustomPledge(e.target.value)}
              className="input-field mt-1 text-sm min-h-[80px] resize-none font-serif"
              placeholder="写下你的承诺..."
            />
          )}
        </div>

        {/* Note */}
        <div className="px-6 mt-1">
          <input
            type="text"
            value={note}
            onChange={e => setNote(e.target.value)}
            className="input-field text-sm"
            placeholder="备注（可选）"
          />
        </div>

        {/* Signature & Confirm */}
        <div className="px-6 pb-6 pt-4">
          {!confirmed ? (
            <div className="space-y-4">
              <div className="border-t border-line pt-4">
                <label className="block text-sm text-txt-secondary mb-3 text-center">签名确认</label>
                <input
                  type="text"
                  value={signName}
                  onChange={e => setSignName(e.target.value)}
                  className="signature-input"
                  placeholder="你的名字"
                />
              </div>
              <div className="flex gap-2">
                <button onClick={onClose} className="btn-secondary flex-1 text-sm">取消</button>
                <button
                  onClick={handleSignConfirm}
                  disabled={!signName.trim()}
                  className="btn-primary flex-1 text-sm disabled:opacity-40"
                >
                  签署
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 text-center">
              {/* Wax Seal */}
              <div className={`wax-seal ${sealAnimating ? 'wax-seal-animate' : 'stamp-animate'}`}>
                <span className="text-lg font-bold">{signName.charAt(0)}</span>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-txt-primary">
                  确认存入 <span className="text-gold font-semibold">¥{cellAmount}</span>
                </p>
                <p className="text-xs text-txt-muted">签署后需伴侣同意才能撤销</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setConfirmed(false)} className="btn-secondary flex-1 text-sm">再想想</button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="btn-primary flex-1 text-sm disabled:opacity-40"
                >
                  {loading ? '提交中...' : '确认存入'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
