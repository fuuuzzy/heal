import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { savingsService } from '../services/savingsService'
import { useAuth } from '../hooks/useAuth'
import { CardSkeleton } from '../components/common/Skeleton'
import { HeatMap } from '../components/common/HeatMap'
import { TrendChart } from '../components/common/TrendChart'
import { StreakIcon, PlusIcon, CalendarIcon, AlertIcon, PersonIcon } from '../components/common/Icons'
import type { SavingsPlan, DashboardData, Activity } from '../types'

const OVERDUE_ENCOURAGEMENTS = [
  '迟到不等于缺席，每一步都算数！',
  '慢慢来，比停下来好 💪',
  '重要的不是速度，而是方向 🌟',
  '坚持就是最大的胜利 🏆',
]

function getDeadlineInfo(deadline: string | null | undefined): { isOverdue: boolean; daysLeft: number | null; label: string } {
  if (!deadline) return { isOverdue: false, daysLeft: null, label: '' }
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const deadlineDate = new Date(deadline)
  deadlineDate.setHours(0, 0, 0, 0)
  const diffDays = Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays < 0) return { isOverdue: true, daysLeft: diffDays, label: `已逾期 ${Math.abs(diffDays)} 天` }
  if (diffDays === 0) return { isOverdue: false, daysLeft: 0, label: '今天是截止日' }
  return { isOverdue: false, daysLeft: diffDays, label: `还剩 ${diffDays} 天` }
}

const ACTION_LABELS: Record<string, string> = {
  create_plan: '创建了计划',
  fill_cell: '存入了',
  unfill_request: '申请撤销',
  unfill_approve: '批准撤销',
  complete_plan: '完成了计划',
  archive_plan: '归档了计划',
  react: '对',
}

type TabKey = 'overview' | 'plans'

export function DashboardPage() {
  const { user } = useAuth()
  const [plans, setPlans] = useState<SavingsPlan[]>([])
  const [dashboard, setDashboard] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabKey>('overview')

  useEffect(() => {
    Promise.all([
      savingsService.getPlans(),
      savingsService.getDashboard(),
    ])
      .then(([plansData, dashData]) => {
        setPlans(plansData)
        setDashboard(dashData)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-7 w-28 bg-line-faint rounded animate-pulse" />
            <div className="h-4 w-40 bg-line-faint rounded animate-pulse mt-1" />
          </div>
        </div>
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  const dash = dashboard!
  const maxStreak = Math.max(...dash.streaks.map(s => s.current_streak), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-txt-primary">
            {user?.nickname ? `${user.nickname}，你好` : '我的计划'}
          </h1>
          <p className="text-sm text-txt-muted mt-0.5">管理你的储蓄目标</p>
        </div>
        <Link to="/plan/new" className="btn-primary text-sm">
          新建计划
        </Link>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 p-1 bg-surface-elevated rounded-xl border border-line">
        {([
          { key: 'overview' as TabKey, label: '概览' },
          { key: 'plans' as TabKey, label: '我的计划' },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.key
                ? 'bg-gold text-on-gold shadow-sm'
                : 'text-txt-muted hover:text-txt-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Stats Overview */}
          <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
            <div className="stat-card">
              <p className="stat-value text-gold">¥{dash.total_saved.toLocaleString()}</p>
              <p className="stat-label">已存入</p>
            </div>
            <div className="stat-card">
              <p className="stat-value">{dash.active_plans}</p>
              <p className="stat-label">活跃计划</p>
            </div>
            <div className="stat-card">
              <p className="stat-value">¥{dash.month_deposits.toLocaleString()}</p>
              <p className="stat-label">本月存入</p>
            </div>
            <div className="stat-card">
              <div className="flex items-center gap-1">
                <p className="stat-value">{maxStreak}</p>
                {maxStreak > 0 && <StreakIcon className="w-4 h-4 text-orange-400" />}
              </div>
              <p className="stat-label">最长连续（天）</p>
            </div>
          </div>

          {/* Heatmap & Trend */}
          <div className="card space-y-5">
            <HeatMap data={dash.heatmap} />
            <div className="divider" />
            <TrendChart data={dash.trend} />
          </div>

          {/* Activity Feed */}
          {dash.activities.length > 0 && (
            <div className="card">
              <h3 className="text-sm font-medium text-txt-secondary mb-3">最近动态</h3>
              <div className="divide-y divide-line-faint">
                {dash.activities.slice(0, 10).map((a: Activity) => (
                  <ActivityItem key={a.id} activity={a} currentUserId={user?.id || 0} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Plans Tab */}
      {activeTab === 'plans' && (
        <>
          {plans.filter(p => p.status !== 'archived').length === 0 ? (
            <div className="card text-center py-16">
              <div className="w-16 h-16 bg-surface-elevated rounded-2xl flex items-center justify-center mx-auto mb-4">
                <PlusIcon className="w-8 h-8 text-txt-muted" />
              </div>
              <h2 className="text-lg font-medium text-txt-primary">还没有储蓄计划</h2>
              <p className="text-sm text-txt-muted mt-1.5">创建第一个计划，开始你的储蓄之旅</p>
              <Link to="/plan/new" className="btn-primary inline-block mt-6 text-sm">
                创建计划
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {plans.filter(p => p.status !== 'archived').map(plan => {
                const filledCells = (plan as unknown as Record<string, unknown>).filled_cells as number || 0
                const progress = Math.min((filledCells / plan.cell_count) * 100, 100)
                const dlInfo = getDeadlineInfo(plan.deadline)
                const isOverdue = dlInfo.isOverdue && plan.status !== 'completed'
                return (
                  <Link
                    key={plan.id}
                    to={`/plan/${plan.id}`}
                    className="card hover:border-line-light transition-all duration-200 group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-txt-primary group-hover:text-gold transition-colors">
                          {plan.name}
                        </h3>
                        <p className="text-sm text-txt-muted mt-0.5">
                          目标 ¥{plan.target_amount.toLocaleString()}
                        </p>
                        <p className="text-xs mt-1 text-txt-muted">
                          {plan.partner_nickname
                            ? <span className="text-mate">{plan.partner_avatar || '👫'} 和 {plan.partner_nickname} 一起存</span>
                            : <span className="flex items-center gap-1"><PersonIcon className="w-3.5 h-3.5" /> 个人计划</span>
                          }
                        </p>
                        {dlInfo.label && (
                          <p className={`text-xs mt-1 flex items-center gap-1 ${isOverdue ? 'text-amber-500' : dlInfo.daysLeft !== null && dlInfo.daysLeft <= 7 ? 'text-orange-400' : 'text-txt-muted'}`}>
                            {isOverdue ? <AlertIcon className="w-3.5 h-3.5" /> : <CalendarIcon className="w-3.5 h-3.5" />} {dlInfo.label}
                          </p>
                        )}
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-md ${
                        plan.status === 'completed'
                          ? 'bg-success/10 text-success'
                          : plan.status === 'archived'
                            ? 'bg-purple-500/10 text-purple-500'
                            : isOverdue
                              ? 'bg-amber-500/10 text-amber-500'
                              : 'bg-gold/10 text-gold'
                      }`}>
                        {plan.status === 'completed' ? '已完成' : plan.status === 'archived' ? '已归档' : isOverdue ? '已逾期' : '进行中'}
                      </span>
                    </div>

                    {isOverdue && (
                      <div className="mb-3 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-600">
                        💛 {OVERDUE_ENCOURAGEMENTS[Math.floor(Math.random() * OVERDUE_ENCOURAGEMENTS.length)]}
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${progress}%` }} />
                      </div>
                      <div className="flex justify-between text-xs text-txt-muted">
                        <span>¥{plan.cell_amount}/格</span>
                        <span>{filledCells}/{plan.cell_count} 格</span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ActivityItem({ activity, currentUserId }: { activity: Activity; currentUserId: number }) {
  const isMe = activity.user_id === currentUserId
  const label = ACTION_LABELS[activity.action] || activity.action
  const timeAgo = getTimeAgo(activity.created_at)

  return (
    <div className="activity-item">
      <div className={`activity-dot ${isMe ? 'bg-gold' : 'bg-mate'}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-txt-primary">
          <span className={`font-medium ${isMe ? 'text-gold' : 'text-mate'}`}>
            {isMe ? '我' : activity.nickname}
          </span>
          {' '}{label}
          {activity.detail && <span className="text-txt-secondary"> {activity.detail}</span>}
          {activity.action === 'react' && <span className="text-txt-secondary"> 发送了表情</span>}
        </p>
        <p className="text-[10px] text-txt-muted mt-0.5">{timeAgo}</p>
      </div>
    </div>
  )
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}天前`
  return new Date(dateStr).toLocaleDateString('zh-CN')
}
