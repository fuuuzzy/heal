import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import type { JwtPayload } from '../types'

const JWT_SECRET = process.env.JWT_SECRET || 'heal-savings-secret-key-change-in-prod'

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' })
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录' })
  }

  try {
    const token = header.slice(7)
    const payload = jwt.verify(token, JWT_SECRET) as JwtPayload
    ;(req as any).user = payload
    next()
  } catch {
    return res.status(401).json({ error: '登录已过期' })
  }
}

export function getUser(req: Request): JwtPayload {
  return (req as any).user
}
