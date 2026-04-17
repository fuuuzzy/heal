import { getDb, saveDb } from './index.js'
import type { Database } from 'sql.js'

let inTransaction = false

function queryAll<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T[] {
  const db = getDb()
  const stmt = db.prepare(sql)
  if (params.length > 0) stmt.bind(params as (string | number | null | Uint8Array)[])

  const results: T[] = []
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T)
  }
  stmt.free()
  return results
}

function queryOne<T = Record<string, unknown>>(sql: string, params: unknown[] = []): T | undefined {
  const results = queryAll<T>(sql, params)
  return results[0]
}

function run(sql: string, params: unknown[] = []): void {
  const db = getDb()
  db.run(sql, params as (string | number | null | Uint8Array)[])
  if (!inTransaction) {
    saveDb()
  }
}

function runReturningId(sql: string, params: unknown[] = []): number {
  const db = getDb()
  db.run(sql, params as (string | number | null | Uint8Array)[])
  // Get rowid BEFORE saveDb() which may reset it
  const stmt = db.prepare('SELECT last_insert_rowid() as id')
  const hasResult = stmt.step()
  let id = 0
  if (hasResult) {
    const row = stmt.getAsObject() as { id: number }
    id = row.id
  }
  stmt.free()
  if (!inTransaction) {
    saveDb()
  }
  return id
}

function runInTransaction(fn: (db: Database) => void): void {
  const db = getDb()
  inTransaction = true
  db.run('BEGIN TRANSACTION')
  try {
    fn(db)
    db.run('COMMIT')
    saveDb()
  } catch (err) {
    db.run('ROLLBACK')
    saveDb()
    throw err
  } finally {
    inTransaction = false
  }
}

export const dbHelpers = {
  queryAll,
  queryOne,
  run,
  runReturningId,
  runInTransaction,
}
