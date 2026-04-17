interface Props {
  planName: string
  targetAmount: number
  partner1: string
  partner2: string
  completedAt: string
  onClose: () => void
}

export function CompletionCertificate({ planName, targetAmount, partner1, partner2, completedAt, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="certificate-card max-w-sm w-full" onClick={e => e.stopPropagation()}>
        <div className="certificate-inner">
          {/* Ornament top */}
          <div className="text-center text-gold/40 text-xs tracking-[0.6em] mb-4">✦ ✧ ✦ ✧ ✦</div>

          <h2 className="text-center text-xl font-serif text-gold mb-1">储蓄成就证书</h2>
          <p className="text-center text-xs text-txt-muted mb-6">Certificate of Achievement</p>

          <div className="text-center space-y-3">
            <p className="text-sm text-txt-secondary">
              恭喜 <span className="text-gold font-semibold">{partner1}</span> 与 <span className="text-mate font-semibold">{partner2}</span>
            </p>
            <p className="text-sm text-txt-secondary">
              共同完成储蓄计划
            </p>
            <p className="text-lg font-serif font-bold text-txt-primary">「{planName}」</p>
            <p className="text-2xl font-bold text-gold">¥{targetAmount.toLocaleString()}</p>
          </div>

          <div className="flex justify-center items-center gap-6 mt-6 pt-4 border-t border-line/50">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center text-gold font-bold text-sm">
                {partner1.charAt(0)}
              </div>
              <span className="text-[10px] text-txt-muted mt-1 block">{partner1}</span>
            </div>
            <div className="text-gold text-lg">♥</div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-mate/10 flex items-center justify-center text-mate font-bold text-sm">
                {partner2.charAt(0)}
              </div>
              <span className="text-[10px] text-txt-muted mt-1 block">{partner2}</span>
            </div>
          </div>

          <p className="text-center text-[10px] text-txt-muted mt-4">
            {new Date(completedAt).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          {/* Ornament bottom */}
          <div className="text-center text-gold/40 text-xs tracking-[0.6em] mt-4">✦ ✧ ✦ ✧ ✦</div>
        </div>

        <div className="px-6 pb-6 pt-2">
          <button onClick={onClose} className="btn-primary w-full text-sm">太棒了！</button>
        </div>
      </div>
    </div>
  )
}
