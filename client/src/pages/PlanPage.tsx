import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { FixedSizeGrid as Grid } from 'react-window'
import { savingsService } from '../services/savingsService'
import { useAuth } from '../hooks/useAuth'
import type { PlanDetail, CellState, FillResult } from '../types'
import { PledgeModal } from '../components/pledge/PledgeModal'
import { CellDetailModal } from '../components/pledge/CellDetailModal'
import { Confetti } from '../components/common/Confetti'
import { CompletionCertificate } from '../components/common/CompletionCertificate'
import { ProgressThermometer } from '../components/common/ProgressThermometer'
import { EncouragementQuote, getRandomQuote } from '../components/common/EncouragementQuotes'
import { GridSkeleton } from '../components/common/Skeleton'
import { StreakIcon, CalendarIcon, AlertIcon, MenuDotsIcon, ArchiveActionIcon, DeleteIcon, ScrollIcon } from '../components/common/Icons'

const MILESTONES = [25, 50, 75, 100]

const OVERDUE_ENCOURAGEMENTS = [
  '迟到不等于缺席，每一步都算数！',
  '慢慢来，比停下来好 💪',
  '重要的不是速度，而是方向 🌟',
  '每多存一格，离目标就近一步！',
  '坚持就是最大的胜利 🏆',
  '不是赛跑，是旅程，继续前行 ✨',
]

function getDeadlineInfo(deadline: string | null | undefined): { isOverdue: boolean; daysLeft: number | null; label: string } {
  if (!deadline) return { isOverdue: false, daysLeft: null, label: '' }
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const deadlineDate = new Date(deadline)
  deadlineDate.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) {
    return { isOverdue: true, daysLeft: diffDays, label: `已逾期 ${Math.abs(diffDays)} 天` }
  }
  if (diffDays === 0) return { isOverdue: false, daysLeft: 0, label: '今天是截止日' }
  if (diffDays <= 7) return { isOverdue: false, daysLeft: diffDays, label: `还剩 ${diffDays} 天` }
  if (diffDays <= 30) return { isOverdue: false, daysLeft: diffDays, label: `还剩 ${diffDays} 天` }
  return { isOverdue: false, daysLeft: diffDays, label: `还剩 ${diffDays} 天` }
}

export function PlanPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [plan, setPlan] = useState<PlanDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedCell, setSelectedCell] = useState<CellState | null>(null)
  const [showPledge, setShowPledge] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'archive' | 'delete' | null>(null)

  // Celebration states
  const [confettiActive, setConfettiActive] = useState(false)
  const [milestoneReached, setMilestoneReached] = useState<number | null>(null)
  const [showCertificate, setShowCertificate] = useState(false)
  const [encouragement, setEncouragement] = useState<string | null>(null)

  const loadPlan = useCallback(async () => {
    if (!id) return
    try {
      const data = await savingsService.getPlan(Number(id))
      setPlan(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { loadPlan() }, [loadPlan])

  const handleCellClick = (cell: CellState) => {
    if (plan?.status === 'archived') return
    if (cell.status === 'empty') {
      setSelectedCell(cell)
      setShowPledge(true)
    } else {
      setSelectedCell(cell)
      setShowDetail(true)
    }
  }

  const triggerMilestone = (milestone: number) => {
    setMilestoneReached(milestone)
    setConfettiActive(true)
    setTimeout(() => {
      setConfettiActive(false)
      setMilestoneReached(null)
    }, 4000)
  }

  const handlePledgeSubmit = async (pledgeContent: string, note?: string) => {
    if (!plan || !selectedCell) return

    // Optimistic update
    const optimisticPlan: PlanDetail = {
      ...plan,
      cells: plan.cells.map((c, i) =>
        i === selectedCell.index
          ? { ...c, status: 'filled' as const, filled_by: user?.id, pledge_content: pledgeContent, reactions: [] }
          : c
      ),
      stats: {
        ...plan.stats,
        filled_cells: plan.stats.filled_cells + 1,
        filled_amount: plan.stats.filled_amount + plan.cell_amount,
        progress_percent: Math.round(((plan.stats.filled_cells + 1) / plan.stats.total_cells) * 10000) / 100,
        my_filled: plan.stats.my_filled + 1,
      },
    }
    setPlan(optimisticPlan)
    setShowPledge(false)
    setSelectedCell(null)

    // Show encouragement
    setEncouragement(getRandomQuote())
    setTimeout(() => setEncouragement(null), 4000)

    try {
      const result: FillResult = await savingsService.fillCell(plan.id, selectedCell.index, { pledge_content: pledgeContent, note })

      // Check milestones
      if (result.hit_milestone) {
        triggerMilestone(result.hit_milestone)
      }

      // Check completion
      if (result.completed) {
        setShowCertificate(true)
        triggerMilestone(100)
      }

      // Reload for accurate state
      loadPlan()
    } catch {
      // Rollback on error
      setPlan(plan)
    }
  }

  const handleReact = async (cellIndex: number, emoji: string) => {
    if (!plan) return
    try {
      await savingsService.reactCell(plan.id, cellIndex, emoji)
      loadPlan()
    } catch (err) {
      console.error(err)
    }
  }

  const handleArchive = async () => {
    if (!plan) return
    try {
      await savingsService.archivePlan(plan.id)
      loadPlan()
    } catch (err) {
      console.error(err)
    } finally {
      setConfirmAction(null)
      setShowMenu(false)
    }
  }

  const handleDelete = async () => {
    if (!plan) return
    try {
      await savingsService.deletePlan(plan.id)
      navigate('/')
    } catch (err) {
      console.error(err)
    } finally {
      setConfirmAction(null)
      setShowMenu(false)
    }
  }

  const cellSize = 40
  const gap = 3

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="card">
          <div className="h-6 w-40 bg-line-faint rounded animate-pulse mb-3" />
          <div className="h-2 w-full bg-line-faint rounded-full animate-pulse" />
        </div>
        <GridSkeleton />
      </div>
    )
  }

  if (!plan) {
    return <div className="text-center py-20 text-txt-muted">计划不存在</div>
  }

  const columns = Math.min(Math.floor((window.innerWidth - 80) / (cellSize + gap)), 50)
  const rows = Math.ceil(plan.cell_count / columns)

  const { stats } = plan
  const progressPercent = stats.progress_percent
  const deadlineInfo = getDeadlineInfo(plan.deadline)
  const hasPartner = !!plan.partner_id

  return (
    <div className="space-y-4">
      {/* Confetti */}
      <Confetti active={confettiActive} />

      {/* Certificate */}
      {showCertificate && (
        <CompletionCertificate
          planName={plan.name}
          targetAmount={plan.target_amount}
          partner1={plan.creator_nickname || user?.nickname || '我'}
          partner2={hasPartner ? (plan.partner_nickname || '伴侣') : ''}
          completedAt={new Date().toISOString()}
          onClose={() => setShowCertificate(false)}
        />
      )}

      {/* Milestone Toast */}
      {milestoneReached && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 milestone-badge text-sm">
          {milestoneReached === 100 ? '🎉 计划完成！' : `🎯 达成 ${milestoneReached}%！`}
        </div>
      )}

      {/* Encouragement */}
      {encouragement && (
        <div className="encouragement-banner">
          <EncouragementQuote quote={encouragement} />
        </div>
      )}

      {/* Header with stats + thermometer */}
      <div className="card">
        <div className="flex items-start justify-between mb-5">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-txt-primary">{plan.name}</h1>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-md ${
                plan.status === 'completed'
                  ? 'bg-success/10 text-success'
                  : plan.status === 'archived'
                    ? 'bg-purple-500/10 text-purple-500'
                    : 'bg-gold/10 text-gold'
              }`}>
                {plan.status === 'completed' ? '已完成' : plan.status === 'archived' ? '已归档' : '进行中'}
              </span>
            </div>
            <p className="text-sm text-txt-muted mt-0.5">¥{plan.cell_amount} / 格</p>

            {/* Plan type / Partner info */}
            <div className="mt-1.5 flex items-center gap-1.5">
              {hasPartner ? (
                <span className="text-xs text-mate flex items-center gap-1">
                  <span>{plan.partner_avatar || '👫'}</span>
                  <span>和 {plan.partner_nickname || '伴侣'} 一起存</span>
                </span>
              ) : (
                <span className="text-xs text-txt-muted">个人计划</span>
              )}
            </div>

            {/* Streak */}
            {plan.streak.current_streak > 0 && (
              <div className="streak-fire mt-2">
                <StreakIcon className="w-4 h-4 text-orange-400 inline-block" /> 连续 {plan.streak.current_streak} 天
                {plan.streak.longest_streak > plan.streak.current_streak && (
                  <span className="text-xs text-txt-muted font-normal ml-1">
                    （最长 {plan.streak.longest_streak} 天）
                  </span>
                )}
              </div>
            )}

            {/* Deadline */}
            {deadlineInfo.label && (
              <div className={`mt-2 flex items-center gap-1.5 text-sm ${
                deadlineInfo.isOverdue ? 'text-amber-500' : deadlineInfo.daysLeft !== null && deadlineInfo.daysLeft <= 7 ? 'text-orange-400' : 'text-txt-muted'
              }`}>
                <span>{deadlineInfo.isOverdue ? <AlertIcon className="w-4 h-4" /> : <CalendarIcon className="w-4 h-4" />}</span>
                <span>{deadlineInfo.label}</span>
              </div>
            )}

            {/* Overdue Encouragement */}
            {deadlineInfo.isOverdue && plan.status !== 'completed' && (
              <div className="mt-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-600">
                💛 {OVERDUE_ENCOURAGEMENTS[Math.floor(Math.random() * OVERDUE_ENCOURAGEMENTS.length)]}
              </div>
            )}
          </div>

          {/* Right side: thermometer + menu */}
          <div className="flex flex-col items-end gap-1">
            <ProgressThermometer percent={progressPercent} height={80} />
            {plan.created_by === user?.id && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1.5 rounded-lg hover:bg-surface-elevated transition-colors text-txt-muted"
                >
                  <MenuDotsIcon className="w-4 h-4" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-8 bg-surface border border-line rounded-xl shadow-lg py-1 z-20 min-w-[140px]">
                    {plan.status !== 'archived' && (
                      <button
                        onClick={() => { setConfirmAction('archive'); setShowMenu(false) }}
                        className="w-full px-4 py-2.5 text-sm text-left hover:bg-surface-elevated transition-colors text-txt-secondary"
                      >
                        <span className="flex items-center gap-2"><ArchiveActionIcon className="w-4 h-4" /> 归档计划</span>
                      </button>
                    )}
                    <button
                      onClick={() => { setConfirmAction('delete'); setShowMenu(false) }}
                      className="w-full px-4 py-2.5 text-sm text-left hover:bg-surface-elevated transition-colors text-danger"
                    >
                      <span className="flex items-center gap-2"><DeleteIcon className="w-4 h-4" /> 删除计划</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-3">
          <div className="flex items-end justify-between">
            <div>
              <span className="text-2xl font-semibold text-txt-primary">
                ¥{stats.filled_amount.toLocaleString()}
              </span>
              <span className="text-sm text-txt-muted ml-2">
                / ¥{stats.total_amount.toLocaleString()}
              </span>
            </div>
            <span className="text-lg font-semibold text-gold">
              {progressPercent}%
            </span>
          </div>
          <div className="progress-track h-2">
            <div className="progress-fill h-2" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        {/* Partner Comparison Bar - only for partner plans */}
        {hasPartner && stats.my_filled + stats.partner_filled > 0 && (
          <div className="mt-4 space-y-1.5">
            <div className="comparison-bar">
              <div
                className="comparison-me"
                style={{ width: `${(stats.my_filled / (stats.my_filled + stats.partner_filled)) * 100}%` }}
              >
                {stats.my_filled}
              </div>
              <div
                className="comparison-partner"
                style={{ width: `${(stats.partner_filled / (stats.my_filled + stats.partner_filled)) * 100}%` }}
              >
                {stats.partner_filled}
              </div>
            </div>
            <div className="flex justify-between text-xs text-txt-muted">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-gold inline-block" /> 我 {stats.my_filled} 格
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-mate inline-block" /> 伴侣 {stats.partner_filled} 格
              </span>
            </div>
          </div>
        )}

        {/* Milestone Progress Dots */}
        <div className="flex items-center gap-2 mt-4">
          {MILESTONES.map(m => (
            <div
              key={m}
              className={`flex items-center gap-1 text-[10px] ${
                progressPercent >= m ? 'text-gold' : 'text-txt-muted'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${progressPercent >= m ? 'bg-gold' : 'bg-line'}`} />
              {m}%
            </div>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="card overflow-hidden p-3">
        <Grid
          columnCount={columns}
          columnWidth={cellSize + gap}
          height={Math.min(rows * (cellSize + gap), 500)}
          rowCount={rows}
          rowHeight={cellSize + gap}
          width={Math.min(columns * (cellSize + gap) + 20, window.innerWidth - 80)}
        >
          {({ columnIndex, rowIndex, style }) => {
            const cellIndex = rowIndex * columns + columnIndex
            if (cellIndex >= plan.cell_count) return null
            const cell: CellState = plan.cells[cellIndex] ?? { index: cellIndex, status: 'empty' }
            const isMine = cell.filled_by === user?.id
            const isPending = cell.status === 'unfill_pending'

            let cellClass = 'bg-surface-elevated border border-line text-txt-muted'
            let content = String(cellIndex + 1)

            if (cell.status === 'filled' && isMine) {
              cellClass = 'cell-mine'
              content = '◆'
            } else if (cell.status === 'filled' && !isMine) {
              cellClass = 'cell-mate'
              content = '◆'
            } else if (cell.status === 'empty') {
              cellClass = 'cell-empty'
            } else if (isPending) {
              cellClass = 'cell-pending'
              content = '?'
            }

            // Show reaction count indicator
            const reactionCount = cell.reactions?.length || 0

            return (
              <div style={style} className="relative">
                <button
                  onClick={() => handleCellClick(cell)}
                  className={`cell w-[40px] h-[40px] ${cellClass}`}
                >
                  {content}
                </button>
                {reactionCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-gold text-[8px] font-bold text-on-gold flex items-center justify-center">
                    {reactionCount}
                  </div>
                )}
              </div>
            )
          }}
        </Grid>
      </div>

      {/* Modals */}
      {showPledge && selectedCell && (
        <PledgeModal
          cellAmount={plan.cell_amount}
          cellIndex={selectedCell.index}
          onSubmit={handlePledgeSubmit}
          onClose={() => { setShowPledge(false); setSelectedCell(null) }}
        />
      )}

      {showDetail && selectedCell && plan && (
        <CellDetailModal
          cell={selectedCell}
          planId={plan.id}
          cellAmount={plan.cell_amount}
          currentUserId={user?.id || 0}
          hasPartner={hasPartner}
          onReact={(emoji: string) => handleReact(selectedCell.index, emoji)}
          onUnfillRequest={async () => {
            await savingsService.requestUnfill(plan.id, selectedCell.index)
            setShowDetail(false)
            setSelectedCell(null)
            loadPlan()
          }}
          onUnfillApprove={async () => {
            await savingsService.approveUnfill(plan.id, selectedCell.index)
            setShowDetail(false)
            setSelectedCell(null)
            loadPlan()
          }}
          onClose={() => { setShowDetail(false); setSelectedCell(null) }}
        />
      )}

      {/* Confirm Action Dialog */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmAction(null)}>
          <div className="bg-surface rounded-2xl border border-line max-w-sm w-full shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            {confirmAction === 'archive' ? (
              <>
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <ArchiveActionIcon className="w-6 h-6 text-purple-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-txt-primary">归档计划</h3>
                  <p className="text-sm text-txt-muted mt-1">
                    归档后计划将转为纪念状态，保留所有记录作为美好回忆
                  </p>
                </div>
                <div className="space-y-2">
                  <button onClick={handleArchive} className="btn-primary w-full text-sm">
                    确认归档
                  </button>
                  <button onClick={() => setConfirmAction(null)} className="btn-secondary w-full text-sm">
                    取消
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-center mb-4">
                  <div className="w-12 h-12 bg-danger/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <DeleteIcon className="w-6 h-6 text-danger" />
                  </div>
                  <h3 className="text-lg font-semibold text-txt-primary">删除计划</h3>
                  <p className="text-sm text-txt-muted mt-1">
                    删除后无法恢复，所有存入记录将被清除。建议先归档保留纪念
                  </p>
                </div>
                <div className="space-y-2">
                  <button onClick={handleDelete} className="w-full text-sm py-2.5 px-4 rounded-xl bg-danger text-white font-medium hover:bg-danger/90 transition-colors">
                    确认删除
                  </button>
                  <button onClick={() => setConfirmAction(null)} className="btn-secondary w-full text-sm">
                    取消
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Archived Memorial View */}
      {plan.status === 'archived' && (
        <div className="card bg-gradient-to-br from-purple-500/5 to-gold/5 border-purple-500/20">
          <div className="text-center py-4">
            <div className="flex justify-center mb-2"><ScrollIcon className="w-8 h-8 text-purple-400" /></div>
            <h3 className="text-lg font-serif text-txt-primary">纪念证书</h3>
            <p className="text-sm text-txt-muted mt-1">「{plan.name}」</p>
            <div className="mt-3 space-y-1 text-sm">
              <p className="text-gold font-medium">目标 ¥{plan.target_amount.toLocaleString()}</p>
              <p className="text-txt-secondary">已存入 ¥{stats.filled_amount.toLocaleString()}（{stats.filled_cells}/{stats.total_cells} 格）</p>
              <p className="text-txt-muted text-xs">完成 {stats.progress_percent}%</p>
            </div>
            {hasPartner && (
              <p className="text-xs text-mate mt-2">
                {plan.creator_nickname || '我'} & {plan.partner_nickname || '伴侣'} 一起走过
              </p>
            )}
            <div className="pledge-ornament mt-3">◆ ◇ ◆</div>
            <p className="text-[10px] text-txt-muted mt-1">
              归档于 {plan.archived_at ? new Date(plan.archived_at).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
