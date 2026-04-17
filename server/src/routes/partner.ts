import { Router, Request, Response } from 'express'
import crypto from 'crypto'
import { dbHelpers } from '../db/helpers'
import { authMiddleware, getUser } from '../middleware/auth'

const router = Router()

function generateInviteCode(): string {
  return crypto.randomBytes(3).toString('hex').toUpperCase()
}

// POST /api/partner/invite
router.post('/invite', authMiddleware, (req: Request, res: Response) => {
  const { userId } = getUser(req)

  const user = dbHelpers.queryOne<{ partner_id: number | null }>('SELECT partner_id FROM users WHERE id = ?', [userId])
  if (user?.partner_id) {
    return res.status(400).json({ error: '你已经绑定了伴侣' })
  }

  const existing = dbHelpers.queryOne('SELECT * FROM partnerships WHERE user1_id = ? AND status = ?', [userId, 'pending'])
  if (existing) {
    return res.json(existing)
  }

  const inviteCode = generateInviteCode()
  const id = dbHelpers.runReturningId(
    'INSERT INTO partnerships (user1_id, invite_code, status) VALUES (?, ?, ?)',
    [userId, inviteCode, 'pending']
  )

  const partnership = dbHelpers.queryOne('SELECT * FROM partnerships WHERE id = ?', [id])
  res.status(201).json(partnership)
})

// POST /api/partner/bind
router.post('/bind', authMiddleware, (req: Request, res: Response) => {
  const { userId } = getUser(req)
  const { invite_code } = req.body

  if (!invite_code) {
    return res.status(400).json({ error: '请输入邀请码' })
  }

  const user = dbHelpers.queryOne<{ partner_id: number | null }>('SELECT partner_id FROM users WHERE id = ?', [userId])
  if (user?.partner_id) {
    return res.status(400).json({ error: '你已经绑定了伴侣' })
  }

  const partnership = dbHelpers.queryOne<{ id: number; user1_id: number; user2_id: number | null; invite_code: string; status: string }>(
    'SELECT * FROM partnerships WHERE invite_code = ? AND status = ?',
    [invite_code, 'pending']
  )
  if (!partnership) {
    return res.status(404).json({ error: '邀请码无效或已过期' })
  }

  // Check that the inviter doesn't already have a partner
  const inviter = dbHelpers.queryOne<{ partner_id: number | null }>('SELECT partner_id FROM users WHERE id = ?', [partnership.user1_id])
  if (inviter?.partner_id) {
    return res.status(400).json({ error: '对方已绑定了其他伴侣' })
  }

  if (partnership.user1_id === userId) {
    return res.status(400).json({ error: '不能绑定自己' })
  }

  // Bind partner in transaction
  dbHelpers.runInTransaction((_db) => {
    dbHelpers.run('UPDATE partnerships SET user2_id = ?, status = ? WHERE id = ?', [userId, 'active', partnership.id])
    dbHelpers.run('UPDATE users SET partner_id = ? WHERE id = ?', [partnership.user1_id, userId])
    dbHelpers.run('UPDATE users SET partner_id = ? WHERE id = ?', [userId, partnership.user1_id])
  })

  const updated = dbHelpers.queryOne('SELECT * FROM partnerships WHERE id = ?', [partnership.id])
  res.json(updated)
})

// GET /api/partner/status
router.get('/status', authMiddleware, (req: Request, res: Response) => {
  const { userId } = getUser(req)

  const partnership = dbHelpers.queryOne(
    'SELECT * FROM partnerships WHERE (user1_id = ? OR user2_id = ?) ORDER BY created_at DESC LIMIT 1',
    [userId, userId]
  )

  res.json(partnership || null)
})

export default router
