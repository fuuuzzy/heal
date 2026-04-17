import { Router, Request, Response } from 'express'
import { dbHelpers } from '../db/helpers.js'
import { authMiddleware, getUser } from '../middleware/auth.js'

const router = Router()

// Helper: log activity
function logActivity(userId: number, planId: number, action: string, detail?: string) {
  dbHelpers.run(
    'INSERT INTO activity_log (user_id, plan_id, action, detail) VALUES (?, ?, ?, ?)',
    [userId, planId, action, detail || null]
  )
}

// Helper: update streak
function updateStreak(userId: number, planId: number) {
  const today = new Date().toISOString().slice(0, 10)
  const streak = dbHelpers.queryOne<{ id: number; current_streak: number; longest_streak: number; last_fill_date: string }>(
    'SELECT * FROM streaks WHERE user_id = ? AND plan_id = ?',
    [userId, planId]
  )

  if (!streak) {
    dbHelpers.run(
      'INSERT INTO streaks (user_id, plan_id, current_streak, longest_streak, last_fill_date) VALUES (?, ?, 1, 1, ?)',
      [userId, planId, today]
    )
    return
  }

  const lastDate = streak.last_fill_date
  let newCurrent = 1
  if (lastDate) {
    const last = new Date(lastDate)
    const now = new Date(today)
    const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 1) {
      newCurrent = streak.current_streak + 1
    } else if (diffDays === 0) {
      newCurrent = streak.current_streak
    }
  }

  const newLongest = Math.max(streak.longest_streak, newCurrent)
  dbHelpers.run(
    'UPDATE streaks SET current_streak = ?, longest_streak = ?, last_fill_date = ? WHERE id = ?',
    [newCurrent, newLongest, today, streak.id]
  )
}

// POST /api/plans
router.post('/', authMiddleware, (req: Request, res: Response) => {
  const { userId } = getUser(req)
  const { name, target_amount, cell_count, cell_theme, deadline } = req.body

  if (!name || !target_amount || !cell_count) {
    return res.status(400).json({ error: '请填写计划名称、目标金额和格子数' })
  }

  // Check plan name uniqueness per user
  const existingPlan = dbHelpers.queryOne<{ id: number }>(
    'SELECT id FROM savings_plans WHERE name = ? AND created_by = ? AND status != ?',
    [name, userId, 'deleted']
  )
  if (existingPlan) {
    return res.status(400).json({ error: '计划名称已存在，请使用不同的名称' })
  }

  if (deadline) {
    const deadlineDate = new Date(deadline)
    if (isNaN(deadlineDate.getTime()) || deadlineDate <= new Date()) {
      return res.status(400).json({ error: '截止日期必须晚于今天' })
    }
  }

  if (cell_count < 10 || cell_count > 5000) {
    return res.status(400).json({ error: '格子数需在10-5000之间' })
  }

  const cellAmount = Math.round((target_amount / cell_count) * 100) / 100

  const user = dbHelpers.queryOne<{ partner_id: number | null }>('SELECT partner_id FROM users WHERE id = ?', [userId])

  const id = dbHelpers.runReturningId(
    'INSERT INTO savings_plans (name, target_amount, cell_count, cell_amount, created_by, partner_id, cell_theme, deadline) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [name, target_amount, cell_count, cellAmount, userId, user?.partner_id || null, cell_theme || null, deadline || null]
  )

  const plan = dbHelpers.queryOne('SELECT * FROM savings_plans WHERE id = ?', [id])
  logActivity(userId, id, 'create_plan', name)
  res.status(201).json(plan)
})

// GET /api/plans
router.get('/', authMiddleware, (req: Request, res: Response) => {
  const { userId } = getUser(req)
  const user = dbHelpers.queryOne<{ partner_id: number | null }>('SELECT partner_id FROM users WHERE id = ?', [userId])

  const plans = dbHelpers.queryAll(
    'SELECT * FROM savings_plans WHERE (created_by = ? OR partner_id = ?) AND status != ? ORDER BY created_at DESC',
    [userId, userId, 'deleted']
  )

  const allPlans = [...plans]
  if (user?.partner_id) {
    const partnerPlans = dbHelpers.queryAll(
      'SELECT * FROM savings_plans WHERE created_by = ? AND status != ? ORDER BY created_at DESC',
      [user.partner_id, 'deleted']
    )

    const existingIds = new Set(plans.map((p: Record<string, unknown>) => p.id))
    for (const pp of partnerPlans) {
      if (!existingIds.has(pp.id)) {
        allPlans.push(pp)
      }
    }
  }

  // Add filled_cells count and partner info for each plan
  const plansWithStats = allPlans.map(plan => {
    const p = plan as Record<string, unknown>
    const result = dbHelpers.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM savings_cells WHERE plan_id = ? AND status = ?',
      [p.id, 'filled']
    )

    // Partner info
    let partner_nickname: string | null = null
    let partner_avatar: string | null = null
    if (p.partner_id) {
      const partnerUser = dbHelpers.queryOne<{ nickname: string; avatar_emoji: string }>(
        'SELECT nickname, avatar_emoji FROM users WHERE id = ?', [p.partner_id]
      )
      partner_nickname = partnerUser?.nickname || null
      partner_avatar = partnerUser?.avatar_emoji || null
    }

    return { ...plan, filled_cells: result?.count ?? 0, partner_nickname, partner_avatar }
  })

  res.json(plansWithStats)
})

// GET /api/plans/dashboard
router.get('/dashboard', authMiddleware, (req: Request, res: Response) => {
  const { userId } = getUser(req)
  const user = dbHelpers.queryOne<{ partner_id: number | null }>('SELECT partner_id FROM users WHERE id = ?', [userId])

  // All plans for this user (excluding deleted)
  const plans = dbHelpers.queryAll<{ id: number; target_amount: number; cell_count: number; cell_amount: number; status: string }>(
    'SELECT * FROM savings_plans WHERE (created_by = ? OR partner_id = ?) AND status != ? ORDER BY created_at DESC',
    [userId, userId, 'deleted']
  )

  let allPlans = [...plans]
  if (user?.partner_id) {
    const partnerPlans = dbHelpers.queryAll<{ id: number; target_amount: number; cell_count: number; cell_amount: number; status: string }>(
      'SELECT * FROM savings_plans WHERE created_by = ? AND status != ? ORDER BY created_at DESC',
      [user.partner_id, 'deleted']
    )
    const existingIds = new Set(plans.map(p => p.id))
    for (const pp of partnerPlans) {
      if (!existingIds.has(pp.id)) allPlans.push(pp)
    }
  }

  // Total stats
  let totalSaved = 0
  let totalTarget = 0
  let activePlans = 0
  let totalFilled = 0
  let totalCells = 0

  for (const plan of allPlans) {
    const filled = dbHelpers.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM savings_cells WHERE plan_id = ? AND status = ?',
      [plan.id, 'filled']
    )
    const filledCount = filled?.count ?? 0
    totalSaved += filledCount * plan.cell_amount
    totalTarget += plan.target_amount
    totalFilled += filledCount
    totalCells += plan.cell_count
    if (plan.status === 'active') activePlans++
  }

  // This month's deposits
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)
  const monthStartStr = monthStart.toISOString()

  const planIds = allPlans.map(p => p.id)
  let monthDeposits = 0
  if (planIds.length > 0) {
    const placeholders = planIds.map(() => '?').join(',')
    const monthResult = dbHelpers.queryOne<{ total: number }>(
      `SELECT COALESCE(SUM(amount), 0) as total FROM savings_cells WHERE plan_id IN (${placeholders}) AND status = 'filled' AND filled_at >= ?`,
      [...planIds, monthStartStr]
    )
    monthDeposits = monthResult?.total ?? 0
  }

  // Activity log (recent 20)
  const activities = dbHelpers.queryAll<{ id: number; user_id: number; plan_id: number; action: string; detail: string | null; created_at: string }>(
    `SELECT al.* FROM activity_log al
     JOIN savings_plans sp ON al.plan_id = sp.id
     WHERE sp.created_by = ? OR sp.partner_id = ?
     ORDER BY al.created_at DESC LIMIT 20`,
    [userId, userId]
  )

  // Enrich activities with user nicknames
  const enrichedActivities = activities.map(a => {
    const u = dbHelpers.queryOne<{ nickname: string }>('SELECT nickname FROM users WHERE id = ?', [a.user_id])
    const p = dbHelpers.queryOne<{ name: string }>('SELECT name FROM savings_plans WHERE id = ?', [a.plan_id])
    return { ...a, nickname: u?.nickname || '未知', plan_name: p?.name || '' }
  })

  // Streaks
  const streaks = dbHelpers.queryAll<{ plan_id: number; current_streak: number; longest_streak: number }>(
    'SELECT * FROM streaks WHERE user_id = ?',
    [userId]
  )

  // Heatmap: daily fill counts for last 90 days
  const heatStart = new Date()
  heatStart.setDate(heatStart.getDate() - 90)
  const heatStartStr = heatStart.toISOString()

  let heatmap: { date: string; count: number }[] = []
  if (planIds.length > 0) {
    const placeholders = planIds.map(() => '?').join(',')
    heatmap = dbHelpers.queryAll<{ date: string; count: number }>(
      `SELECT DATE(filled_at) as date, COUNT(*) as count FROM savings_cells
       WHERE plan_id IN (${placeholders}) AND status = 'filled' AND filled_at >= ?
       GROUP BY DATE(filled_at) ORDER BY date`,
      [...planIds, heatStartStr]
    )
  }

  // Trend: cumulative deposits by week (last 12 weeks)
  const trendStart = new Date()
  trendStart.setDate(trendStart.getDate() - 84)
  const trendStartStr = trendStart.toISOString()

  let trend: { week: string; amount: number }[] = []
  if (planIds.length > 0) {
    const placeholders = planIds.map(() => '?').join(',')
    trend = dbHelpers.queryAll<{ week: string; amount: number }>(
      `SELECT strftime('%Y-W%W', filled_at) as week, SUM(amount) as amount
       FROM savings_cells
       WHERE plan_id IN (${placeholders}) AND status = 'filled' AND filled_at >= ?
       GROUP BY week ORDER BY week`,
      [...planIds, trendStartStr]
    )
  }

  res.json({
    total_saved: totalSaved,
    total_target: totalTarget,
    active_plans: activePlans,
    month_deposits: monthDeposits,
    total_filled: totalFilled,
    total_cells: totalCells,
    activities: enrichedActivities,
    streaks,
    heatmap,
    trend,
  })
})

// GET /api/plans/:id
router.get('/:id', authMiddleware, (req: Request, res: Response) => {
  const { userId } = getUser(req)
  const planId = Number(req.params.id)

  const plan = dbHelpers.queryOne<{ id: number; name: string; cell_count: number; cell_amount: number; target_amount: number; created_by: number; partner_id: number | null; cell_theme: string | null; status: string; deadline: string | null; archived_at: string | null }>(
    'SELECT * FROM savings_plans WHERE id = ?', [planId]
  )
  if (!plan || (plan as Record<string, unknown>).status === 'deleted') {
    return res.status(404).json({ error: '计划不存在' })
  }

  if (plan.created_by !== userId && plan.partner_id !== userId) {
    return res.status(403).json({ error: '无权查看此计划' })
  }

  const cells = dbHelpers.queryAll<{ id: number; cell_index: number; filled_by: number; pledge_content: string; filled_at: string; status: string; unfill_requested_by: number | null }>(
    'SELECT id, cell_index, filled_by, pledge_content, filled_at, status, unfill_requested_by FROM savings_cells WHERE plan_id = ?',
    [planId]
  )

  // Build cell state map with reactions
  const cellMap: Record<number, Record<string, unknown>> = {}
  for (const cell of cells) {
    // Get reactions for this cell
    const reactions = dbHelpers.queryAll<{ emoji: string; user_id: number }>(
      'SELECT emoji, user_id FROM emoji_reactions WHERE cell_id = ?',
      [cell.id]
    )
    cellMap[cell.cell_index] = {
      id: cell.id,
      index: cell.cell_index,
      status: cell.status === 'unfill_pending' ? 'unfill_pending' : 'filled',
      filled_by: cell.filled_by,
      pledge_content: cell.pledge_content,
      filled_at: cell.filled_at,
      unfill_requested_by: cell.unfill_requested_by,
      reactions,
    }
  }

  // Build full cell array
  const cellStates = []
  for (let i = 0; i < plan.cell_count; i++) {
    cellStates.push(cellMap[i] || { index: i, status: 'empty', reactions: [] })
  }

  // Get stats
  const filledCount = cells.filter(c => c.status === 'filled').length
  const user2 = dbHelpers.queryOne<{ partner_id: number | null }>('SELECT partner_id FROM users WHERE id = ?', [userId])
  const myFilled = cells.filter(c => c.filled_by === userId && c.status === 'filled').length
  const partnerFilled = user2?.partner_id
    ? cells.filter(c => c.filled_by === user2.partner_id && c.status === 'filled').length
    : 0

  // Get streak for this plan
  const streak = dbHelpers.queryOne<{ current_streak: number; longest_streak: number }>(
    'SELECT current_streak, longest_streak FROM streaks WHERE user_id = ? AND plan_id = ?',
    [userId, planId]
  )

  const stats = {
    total_cells: plan.cell_count,
    filled_cells: filledCount,
    total_amount: plan.target_amount,
    filled_amount: filledCount * plan.cell_amount,
    progress_percent: Math.round((filledCount / plan.cell_count) * 10000) / 100,
    my_filled: myFilled,
    partner_filled: partnerFilled,
  }

  // Partner info
  let partnerNickname: string | null = null
  let partnerAvatar: string | null = null
  if (plan.partner_id) {
    const partnerUser = dbHelpers.queryOne<{ nickname: string; avatar_emoji: string }>(
      'SELECT nickname, avatar_emoji FROM users WHERE id = ?', [plan.partner_id]
    )
    partnerNickname = partnerUser?.nickname || null
    partnerAvatar = partnerUser?.avatar_emoji || null
  }

  // Creator info
  const creator = dbHelpers.queryOne<{ nickname: string; avatar_emoji: string }>(
    'SELECT nickname, avatar_emoji FROM users WHERE id = ?', [plan.created_by]
  )

  res.json({
    ...plan,
    cells: cellStates,
    stats,
    streak: streak || { current_streak: 0, longest_streak: 0 },
    partner_nickname: partnerNickname,
    partner_avatar: partnerAvatar,
    creator_nickname: creator?.nickname || null,
    creator_avatar: creator?.avatar_emoji || null,
  })
})

// POST /api/plans/:id/cells/:index/fill
router.post('/:id/cells/:index/fill', authMiddleware, (req: Request, res: Response) => {
  const { userId } = getUser(req)
  const planId = Number(req.params.id)
  const cellIndex = Number(req.params.index)
  const { pledge_content, note } = req.body

  if (!pledge_content) {
    return res.status(400).json({ error: '请填写承诺书内容' })
  }

  const plan = dbHelpers.queryOne<{ id: number; name: string; cell_count: number; cell_amount: number; target_amount: number; created_by: number; partner_id: number | null }>(
    'SELECT * FROM savings_plans WHERE id = ?', [planId]
  )
  if (!plan) {
    return res.status(404).json({ error: '计划不存在' })
  }

  if (plan.created_by !== userId && plan.partner_id !== userId) {
    return res.status(403).json({ error: '无权操作此计划' })
  }

  if (cellIndex < 0 || cellIndex >= plan.cell_count) {
    return res.status(400).json({ error: '格子序号无效' })
  }

  const existing = dbHelpers.queryOne('SELECT id FROM savings_cells WHERE plan_id = ? AND cell_index = ?', [planId, cellIndex])
  if (existing) {
    return res.status(400).json({ error: '该格子已被填充' })
  }

  const now = new Date().toISOString()
  dbHelpers.run(
    'INSERT INTO savings_cells (plan_id, cell_index, filled_by, amount, pledge_content, pledge_signed_at, note, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [planId, cellIndex, userId, plan.cell_amount, pledge_content, now, note || null, 'filled']
  )

  // Log activity & update streak
  logActivity(userId, planId, 'fill_cell', `第 ${cellIndex + 1} 格`)
  updateStreak(userId, planId)

  // Check if plan is completed
  const filledResult = dbHelpers.queryOne<{ count: number }>('SELECT COUNT(*) as count FROM savings_cells WHERE plan_id = ? AND status = ?', [planId, 'filled'])
  const filledCount = filledResult?.count ?? 0
  let completed = false
  if (filledCount >= plan.cell_count) {
    dbHelpers.run('UPDATE savings_plans SET status = ? WHERE id = ?', ['completed', planId])
    logActivity(userId, planId, 'complete_plan', plan.name)
    completed = true
  }

  // Check milestones
  const progress = filledCount / plan.cell_count
  const milestones = [25, 50, 75, 100]
  const hitMilestone = milestones.find(m => progress * 100 >= m && (progress - plan.cell_amount / plan.target_amount) * 100 < m)

  res.json({ success: true, completed, hit_milestone: hitMilestone || null, filled_count: filledCount, total_count: plan.cell_count })
})

// POST /api/plans/:id/cells/:index/unfill-request
router.post('/:id/cells/:index/unfill-request', authMiddleware, (req: Request, res: Response) => {
  const { userId } = getUser(req)
  const planId = Number(req.params.id)
  const cellIndex = Number(req.params.index)

  const plan = dbHelpers.queryOne<{ id: number; partner_id: number | null }>(
    'SELECT id, partner_id FROM savings_plans WHERE id = ?', [planId]
  )
  if (!plan) {
    return res.status(404).json({ error: '计划不存在' })
  }

  const cell = dbHelpers.queryOne<{ id: number }>(
    'SELECT * FROM savings_cells WHERE plan_id = ? AND cell_index = ? AND status = ?',
    [planId, cellIndex, 'filled']
  )
  if (!cell) {
    return res.status(404).json({ error: '格子不存在或未填充' })
  }

  // Solo plan (no partner): auto-approve unfill
  if (!plan.partner_id) {
    dbHelpers.run('DELETE FROM emoji_reactions WHERE cell_id = ?', [cell.id])
    dbHelpers.run('DELETE FROM savings_cells WHERE id = ?', [cell.id])
    dbHelpers.run('UPDATE savings_plans SET status = ? WHERE id = ?', ['active', planId])
    logActivity(userId, planId, 'unfill_approve', `第 ${cellIndex + 1} 格`)
    return res.json({ success: true, auto_approved: true })
  }

  // Partner plan: require approval
  const now = new Date().toISOString()
  dbHelpers.run(
    'UPDATE savings_cells SET status = ?, unfill_requested_by = ?, unfill_requested_at = ? WHERE id = ?',
    ['unfill_pending', userId, now, cell.id]
  )

  logActivity(userId, planId, 'unfill_request', `第 ${cellIndex + 1} 格`)
  res.json({ success: true })
})

// POST /api/plans/:id/cells/:index/unfill-approve
router.post('/:id/cells/:index/unfill-approve', authMiddleware, (req: Request, res: Response) => {
  const { userId } = getUser(req)
  const planId = Number(req.params.id)
  const cellIndex = Number(req.params.index)

  const cell = dbHelpers.queryOne<{ id: number; unfill_requested_by: number }>(
    'SELECT * FROM savings_cells WHERE plan_id = ? AND cell_index = ? AND status = ?',
    [planId, cellIndex, 'unfill_pending']
  )
  if (!cell) {
    return res.status(404).json({ error: '无待审批的撤销请求' })
  }

  if (cell.unfill_requested_by === userId) {
    return res.status(400).json({ error: '不能批准自己的撤销请求' })
  }

  // Delete the cell (restore to empty)
  dbHelpers.run('DELETE FROM emoji_reactions WHERE cell_id = ?', [cell.id])
  dbHelpers.run('DELETE FROM savings_cells WHERE id = ?', [cell.id])

  // Restore plan status if was completed
  dbHelpers.run('UPDATE savings_plans SET status = ? WHERE id = ?', ['active', planId])

  logActivity(userId, planId, 'unfill_approve', `第 ${cellIndex + 1} 格`)
  res.json({ success: true })
})

// POST /api/plans/:id/cells/:index/react
router.post('/:id/cells/:index/react', authMiddleware, (req: Request, res: Response) => {
  const { userId } = getUser(req)
  const planId = Number(req.params.id)
  const cellIndex = Number(req.params.index)
  const { emoji } = req.body

  if (!emoji) {
    return res.status(400).json({ error: '请选择表情' })
  }

  const cell = dbHelpers.queryOne<{ id: number }>(
    'SELECT id FROM savings_cells WHERE plan_id = ? AND cell_index = ? AND status = ?',
    [planId, cellIndex, 'filled']
  )
  if (!cell) {
    return res.status(404).json({ error: '格子不存在' })
  }

  // Toggle: if exists, remove; otherwise add
  const existing = dbHelpers.queryOne(
    'SELECT id FROM emoji_reactions WHERE cell_id = ? AND user_id = ? AND emoji = ?',
    [cell.id, userId, emoji]
  )

  if (existing) {
    dbHelpers.run('DELETE FROM emoji_reactions WHERE id = ?', [existing.id])
  } else {
    dbHelpers.run(
      'INSERT INTO emoji_reactions (cell_id, user_id, emoji) VALUES (?, ?, ?)',
      [cell.id, userId, emoji]
    )
    logActivity(userId, planId, 'react', `第 ${cellIndex + 1} 格 ${emoji}`)
  }

  res.json({ success: true })
})

// POST /api/plans/:id/archive
router.post('/:id/archive', authMiddleware, (req: Request, res: Response) => {
  const { userId } = getUser(req)
  const planId = Number(req.params.id)

  const plan = dbHelpers.queryOne<{ id: number; created_by: number; status: string; name: string }>(
    'SELECT id, created_by, status, name FROM savings_plans WHERE id = ?', [planId]
  )
  if (!plan) {
    return res.status(404).json({ error: '计划不存在' })
  }

  if (plan.created_by !== userId) {
    return res.status(403).json({ error: '只有计划创建者可以归档' })
  }

  if (plan.status === 'deleted') {
    return res.status(400).json({ error: '计划已删除' })
  }

  const now = new Date().toISOString()
  dbHelpers.run(
    'UPDATE savings_plans SET status = ?, archived_at = ? WHERE id = ?',
    ['archived', now, planId]
  )

  logActivity(userId, planId, 'archive_plan', plan.name)
  res.json({ success: true, archived_at: now })
})

// DELETE /api/plans/:id
router.delete('/:id', authMiddleware, (req: Request, res: Response) => {
  const { userId } = getUser(req)
  const planId = Number(req.params.id)

  const plan = dbHelpers.queryOne<{ id: number; created_by: number; status: string }>(
    'SELECT id, created_by, status FROM savings_plans WHERE id = ?', [planId]
  )
  if (!plan) {
    return res.status(404).json({ error: '计划不存在' })
  }

  if (plan.created_by !== userId) {
    return res.status(403).json({ error: '只有计划创建者可以删除' })
  }

  if (plan.status === 'deleted') {
    return res.status(400).json({ error: '计划已删除' })
  }

  // Soft delete: mark as deleted
  dbHelpers.run(
    'UPDATE savings_plans SET status = ? WHERE id = ?',
    ['deleted', planId]
  )

  logActivity(userId, planId, 'delete_plan')
  res.json({ success: true })
})

// GET /api/plans/:id/stats
router.get('/:id/stats', authMiddleware, (req: Request, res: Response) => {
  const { userId } = getUser(req)
  const planId = Number(req.params.id)

  const plan = dbHelpers.queryOne<{ id: number; cell_count: number; cell_amount: number; target_amount: number }>(
    'SELECT * FROM savings_plans WHERE id = ?', [planId]
  )
  if (!plan) {
    return res.status(404).json({ error: '计划不存在' })
  }

  const filledResult = dbHelpers.queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM savings_cells WHERE plan_id = ? AND status = ?', [planId, 'filled']
  )
  const filledCount = filledResult?.count ?? 0

  const user2 = dbHelpers.queryOne<{ partner_id: number | null }>('SELECT partner_id FROM users WHERE id = ?', [userId])

  const myFilledResult = dbHelpers.queryOne<{ count: number }>(
    'SELECT COUNT(*) as count FROM savings_cells WHERE plan_id = ? AND filled_by = ? AND status = ?',
    [planId, userId, 'filled']
  )
  const myFilled = myFilledResult?.count ?? 0

  let partnerFilled = 0
  if (user2?.partner_id) {
    const partnerFilledResult = dbHelpers.queryOne<{ count: number }>(
      'SELECT COUNT(*) as count FROM savings_cells WHERE plan_id = ? AND filled_by = ? AND status = ?',
      [planId, user2.partner_id, 'filled']
    )
    partnerFilled = partnerFilledResult?.count ?? 0
  }

  res.json({
    total_cells: plan.cell_count,
    filled_cells: filledCount,
    total_amount: plan.target_amount,
    filled_amount: filledCount * plan.cell_amount,
    progress_percent: Math.round((filledCount / plan.cell_count) * 10000) / 100,
    my_filled: myFilled,
    partner_filled: partnerFilled,
  })
})

export default router
