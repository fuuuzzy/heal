import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import { dbHelpers } from '../db/helpers.js'
import { generateToken, authMiddleware, getUser } from '../middleware/auth.js'

const router = Router()

// POST /api/auth/register
router.post('/register', (req: Request, res: Response) => {
  const { username, password, nickname, avatar_emoji } = req.body

  if (!username || !password || !nickname) {
    return res.status(400).json({ error: '请填写用户名、密码和昵称' })
  }
  if (username.length < 3 || username.length > 20) {
    return res.status(400).json({ error: '用户名长度3-20个字符' })
  }
  if (password.length < 6) {
    return res.status(400).json({ error: '密码至少6个字符' })
  }

  const existing = dbHelpers.queryOne('SELECT id FROM users WHERE username = ?', [username])
  if (existing) {
    return res.status(400).json({ error: '用户名已存在' })
  }

  const passwordHash = bcrypt.hashSync(password, 10)
  const emoji = avatar_emoji || '🧸'

  const userId = dbHelpers.runReturningId(
    'INSERT INTO users (username, password_hash, nickname, avatar_emoji) VALUES (?, ?, ?, ?)',
    [username, passwordHash, nickname, emoji]
  )

  const token = generateToken({ userId, username })

  const user = dbHelpers.queryOne(
    'SELECT id, username, nickname, avatar_emoji, partner_id, created_at FROM users WHERE id = ?',
    [userId]
  )

  res.status(201).json({ token, user })
})

// POST /api/auth/login
router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body

  if (!username || !password) {
    return res.status(400).json({ error: '请填写用户名和密码' })
  }

  const user = dbHelpers.queryOne<{ id: number; username: string; password_hash: string; nickname: string; avatar_emoji: string; partner_id: number | null; created_at: string }>(
    'SELECT * FROM users WHERE username = ?',
    [username]
  )
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: '用户名或密码错误' })
  }

  const token = generateToken({ userId: user.id, username: user.username })
  const { password_hash, ...safeUser } = user

  res.json({ token, user: safeUser })
})

// GET /api/auth/me
router.get('/me', authMiddleware, (req: Request, res: Response) => {
  const { userId } = getUser(req)
  const user = dbHelpers.queryOne(
    'SELECT id, username, nickname, avatar_emoji, partner_id, created_at FROM users WHERE id = ?',
    [userId]
  )

  if (!user) {
    return res.status(404).json({ error: '用户不存在' })
  }

  res.json(user)
})

export default router
