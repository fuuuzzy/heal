import initSqlJs, { Database as SqlJsDatabase } from 'sql.js'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const dataDir = path.resolve(__dirname, '../../../data')
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const dbPath = path.join(dataDir, 'heal.sqlite')

let db: SqlJsDatabase

function saveDb() {
  if (!db) return
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(dbPath, buffer)
}

export async function initDatabase(): Promise<SqlJsDatabase> {
  const SQL = await initSqlJs()

  // Load existing database or create new
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath)
    db = new SQL.Database(fileBuffer)
  } else {
    db = new SQL.Database()
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      nickname TEXT NOT NULL,
      avatar_emoji TEXT DEFAULT '🧸',
      partner_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS partnerships (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user1_id INTEGER NOT NULL,
      user2_id INTEGER,
      invite_code TEXT UNIQUE NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user1_id) REFERENCES users(id),
      FOREIGN KEY (user2_id) REFERENCES users(id)
    );
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS savings_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      target_amount REAL NOT NULL,
      cell_count INTEGER NOT NULL,
      cell_amount REAL NOT NULL,
      created_by INTEGER NOT NULL,
      partner_id INTEGER,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS savings_cells (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      plan_id INTEGER NOT NULL,
      cell_index INTEGER NOT NULL,
      filled_by INTEGER NOT NULL,
      amount REAL NOT NULL,
      pledge_content TEXT,
      pledge_signed_at DATETIME,
      note TEXT,
      status TEXT DEFAULT 'filled',
      unfill_requested_by INTEGER,
      unfill_approved_by INTEGER,
      unfill_requested_at DATETIME,
      filled_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (plan_id) REFERENCES savings_plans(id),
      FOREIGN KEY (filled_by) REFERENCES users(id),
      UNIQUE(plan_id, cell_index)
    );
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      plan_id INTEGER NOT NULL,
      action TEXT NOT NULL,
      detail TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (plan_id) REFERENCES savings_plans(id)
    );
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS emoji_reactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cell_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      emoji TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (cell_id) REFERENCES savings_cells(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(cell_id, user_id, emoji)
    );
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS streaks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      plan_id INTEGER NOT NULL,
      current_streak INTEGER DEFAULT 0,
      longest_streak INTEGER DEFAULT 0,
      last_fill_date TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (plan_id) REFERENCES savings_plans(id),
      UNIQUE(user_id, plan_id)
    );
  `)

  // Add cell_theme column to savings_plans if not exists
  try {
    db.run('ALTER TABLE savings_plans ADD COLUMN cell_theme TEXT DEFAULT NULL')
  } catch (_e) { /* column already exists */ }

  // Add deadline column to savings_plans if not exists
  try {
    db.run('ALTER TABLE savings_plans ADD COLUMN deadline TEXT DEFAULT NULL')
  } catch (_e) { /* column already exists */ }

  // Add archived_at column to savings_plans if not exists
  try {
    db.run('ALTER TABLE savings_plans ADD COLUMN archived_at TEXT DEFAULT NULL')
  } catch (_e) { /* column already exists */ }

  saveDb()
  console.log('Database initialized at', dbPath)

  return db
}

export function getDb(): SqlJsDatabase {
  return db
}

export { saveDb }
