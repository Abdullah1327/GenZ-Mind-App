import sqlite3 from 'sqlite3'
import path from 'path'
import crypto from 'crypto'

const dbPath = path.resolve(process.cwd(), 'local_database.sqlite')

// Open the database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening local SQLite database:', err.message)
  } else {
    console.log('Connected to the local SQLite database at:', dbPath)
  }
})

// Promise wrappers for SQL operations
export function queryAll(sql: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err)
      else resolve(rows)
    })
  })
}

export function queryRun(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err)
      else resolve({ lastID: this.lastID, changes: this.changes })
    })
  })
}

export function queryGet(sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err)
      else resolve(row)
    })
  })
}

// Enable foreign keys and initialize tables sequentially
db.serialize(() => {
  db.run('PRAGMA foreign_keys = ON')

  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'instructor')),
      avatar_url TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY(id) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      course TEXT NOT NULL,
      topic TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      quiz_type TEXT NOT NULL,
      number_of_questions INTEGER NOT NULL,
      questions TEXT NOT NULL, -- JSON string
      google_form_url TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS quiz_results (
      id TEXT PRIMARY KEY,
      quiz_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      score INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      percentage REAL NOT NULL,
      answers TEXT NOT NULL, -- JSON string
      completed_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY(quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
      FOREIGN KEY(student_id) REFERENCES profiles(id) ON DELETE CASCADE
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS assignments (
      id TEXT PRIMARY KEY,
      instructor_id TEXT NOT NULL,
      course TEXT NOT NULL,
      topic TEXT NOT NULL,
      student_level TEXT NOT NULL,
      assignment_type TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      content TEXT NOT NULL, -- JSON string
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      updated_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY(instructor_id) REFERENCES profiles(id) ON DELETE CASCADE
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_path TEXT NOT NULL,
      content TEXT,
      created_at TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY(user_id) REFERENCES profiles(id) ON DELETE CASCADE
    )
  `)

  // Safe schema migrations for existing databases
  db.run(`ALTER TABLE documents ADD COLUMN content TEXT`, () => {})
  db.run(`ALTER TABLE quizzes ADD COLUMN google_form_url TEXT`, () => {})

  // Seed default instructor account
  const instructorEmail = 'abdullahkhalid7231@gmail.com'
  const instructorPassword = 'Abdullah1327!'
  const instructorId = 'instructor-default-001'
  const hashedPassword = crypto.createHash('sha256').update(instructorPassword).digest('hex')

  db.run(
    `INSERT OR IGNORE INTO users (id, email, password) VALUES (?, ?, ?)`,
    [instructorId, instructorEmail, hashedPassword],
    (err) => {
      if (!err) {
        db.run(
          `INSERT OR IGNORE INTO profiles (id, full_name, email, role) VALUES (?, ?, ?, ?)`,
          [instructorId, 'Abdullah Khalid', instructorEmail, 'instructor']
        )
      }
    }
  )
})
