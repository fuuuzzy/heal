import {useEffect, useState} from 'react'
import {Link} from 'react-router-dom'
import {savingsService} from '../services/savingsService'
import {CardSkeleton} from '../components/common/Skeleton'
import {EmptyArchiveIcon, PersonIcon, ScrollIcon} from '../components/common/Icons'
import type {SavingsPlan} from '../types'

export function ArchivedPlansPage() {
    const [plans, setPlans] = useState<SavingsPlan[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        savingsService.getPlans()
            .then(data => {
                setPlans(data.filter(p => p.status === 'archived'))
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-7 w-28 bg-line-faint rounded animate-pulse"/>
                <div className="grid gap-4 sm:grid-cols-2">
                    {Array.from({length: 2}).map((_, i) => <CardSkeleton key={i}/>)}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-txt-primary">归档计划</h1>
                <p className="text-sm text-txt-muted mt-0.5">保留的美好回忆</p>
            </div>

            {plans.length === 0 ? (
                <div className="card text-center py-16">
                    <div
                        className="w-16 h-16 bg-surface-elevated rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <EmptyArchiveIcon className="w-8 h-8 text-txt-muted"/>
                    </div>
                    <h2 className="text-lg font-medium text-txt-primary">还没有归档的计划</h2>
                    <p className="text-sm text-txt-muted mt-1.5">归档的计划会保存在这里，作为美好的纪念</p>
                </div>
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    {plans.map(plan => {
                        const filledCells = (plan as unknown as Record<string, unknown>).filled_cells as number || 0
                        const progress = Math.min((filledCells / plan.cell_count) * 100, 100)
                        return (
                            <Link
                                key={plan.id}
                                to={`/plan/${plan.id}`}
                                className="card bg-gradient-to-br from-purple-500/5 to-gold/5 border-purple-500/20 hover:border-purple-500/40 transition-all duration-200 group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="font-semibold text-txt-primary group-hover:text-purple-500 transition-colors">
                                            {plan.name}
                                        </h3>
                                        <p className="text-sm text-txt-muted mt-0.5">
                                            目标 ¥{plan.target_amount.toLocaleString()}
                                        </p>
                                        <p className="text-xs mt-1 text-txt-muted">
                                            {plan.partner_nickname
                                                ? <span
                                                    className="text-mate">{plan.partner_avatar || '👫'} 和 {plan.partner_nickname} 一起存</span>
                                                : <span className="flex items-center gap-1"><PersonIcon
                                                    className="w-3.5 h-3.5"/> 个人计划</span>
                                            }
                                        </p>
                                        {plan.archived_at && (
                                            <p className="text-xs mt-1 text-purple-400">
                                                归档于 {new Date(plan.archived_at).toLocaleDateString('zh-CN')}
                                            </p>
                                        )}
                                    </div>
                                    <span
                                        className="text-xs font-medium px-2.5 py-1 rounded-md bg-purple-500/10 text-purple-500">
                    已归档
                  </span>
                                </div>

                                <div className="text-center py-2">
                                    <ScrollIcon className="w-8 h-8 text-purple-400 mx-auto"/>
                                </div>

                                <div className="space-y-2">
                                    <div className="progress-track">
                                        <div className="progress-fill" style={{width: `${progress}%`}}/>
                                    </div>
                                    <div className="flex justify-between text-xs text-txt-muted">
                                        <span>¥{plan.cell_amount}/格</span>
                                        <span>{filledCells}/{plan.cell_count} 格 · {Math.round(progress)}%</span>
                                    </div>
                                </div>
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
