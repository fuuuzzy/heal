import type { CellState } from '../../types'
import { EmojiReactions } from '../common/EmojiReactions'
import { ClockIcon } from '../common/Icons'

interface CellDetailModalProps {
  cell: CellState
  planId: number
  cellAmount: number
  currentUserId: number
  hasPartner: boolean
  onReact: (emoji: string) => void
  onUnfillRequest: () => Promise<void>
  onUnfillApprove: () => Promise<void>
  onClose: () => void
}

export function CellDetailModal({
  cell,
  cellAmount,
  currentUserId,
  hasPartner,
  onReact,
  onUnfillRequest,
  onUnfillApprove,
  onClose,
}: CellDetailModalProps) {
  const isMine = cell.filled_by === currentUserId
  const isPending = cell.status === 'unfill_pending'
  const isRequester = cell.unfill_requested_by === currentUserId

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-surface rounded-2xl border border-line max-w-sm w-full shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header with decorative number */}
        <div className="px-6 pt-6 pb-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-serif text-gold/20 font-bold leading-none">
                {String(cell.index + 1).padStart(2, '0')}
              </span>
              <div>
                <h2 className="text-lg font-semibold text-txt-primary leading-tight">第 {cell.index + 1} 格</h2>
                <p className="text-sm text-gold font-medium">¥{cellAmount}</p>
              </div>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-md ${
              isMine ? 'badge-gold' : 'badge-mate'
            }`}>
              {isMine ? '我' : '伴侣'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-3">
          {cell.filled_at && (
            <div className="flex items-center gap-2 text-sm text-txt-muted">
              <ClockIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{new Date(cell.filled_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
          )}

          {cell.pledge_content && (
            <div className="pledge-document">
              <div className="pledge-document-inner">
                <div className="pledge-ornament mb-2">◆ ◇ ◆</div>
                <div className="font-serif text-txt-secondary leading-[2] text-sm whitespace-pre-line">
                  {cell.pledge_content}
                </div>
                <div className="pledge-ornament mt-2">◆ ◇ ◆</div>
              </div>
            </div>
          )}

          {/* Emoji Reactions */}
          {cell.status === 'filled' && (
            <div className="pt-2 border-t border-line/50">
              <p className="text-[11px] text-txt-muted mb-2">发送鼓励</p>
              <EmojiReactions
                reactions={cell.reactions || []}
                currentUserId={currentUserId}
                onReact={onReact}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 space-y-2">
          {isPending && !isRequester && hasPartner && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
              <p className="text-sm text-amber-500 mb-3">有人申请撤销此格子</p>
              <button onClick={onUnfillApprove} className="btn-primary w-full text-sm">
                同意撤销
              </button>
            </div>
          )}

          {isPending && isRequester && hasPartner && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
              <p className="text-sm text-amber-500">撤销请求已发送，等待伴侣确认</p>
            </div>
          )}

          {!isPending && (
            <button
              onClick={onUnfillRequest}
              className="text-sm text-txt-muted/60 hover:text-danger transition-colors w-full text-center py-2"
            >
              {hasPartner ? '申请撤销此格子' : '撤销此格子'}
            </button>
          )}

          <button onClick={onClose} className="btn-secondary w-full text-sm">
            关闭
          </button>
        </div>
      </div>
    </div>
  )
}
