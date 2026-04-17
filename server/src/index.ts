import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { initDatabase } from './db'
import authRoutes from './routes/auth'
import partnerRoutes from './routes/partner'
import savingsRoutes from './routes/savings'
import { errorHandler } from './middleware/errorHandler'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const app = express()
const PORT = process.env.PORT || 4000

// Middleware
app.use(cors())
app.use(express.json())

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/partner', partnerRoutes)
app.use('/api/plans', savingsRoutes)

// Serve static frontend in production
const clientDist = path.resolve(__dirname, '../../client/dist')
app.use(express.static(clientDist))
app.get('*', (_req, res) => {
  res.sendFile(path.join(clientDist, 'index.html'))
})

// Error handler
app.use(errorHandler)

async function start() {
  await initDatabase()
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

start().catch(err => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
