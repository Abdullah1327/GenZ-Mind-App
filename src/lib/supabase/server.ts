import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { queryGet, queryAll, queryRun } from '@/lib/database/sqlite'
import crypto from 'crypto'

export const isSQLiteMode =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('your_') ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.startsWith('your_')

class SQLiteServerQueryBuilder {
  private table: string
  private filters: { col: string; val: any }[] = []
  private isSingle = false
  private head = false
  private orderCol?: string
  private ascending = true

  constructor(table: string) {
    this.table = table
  }

  select(fields?: string, options?: { count?: string; head?: boolean }) {
    if (options?.head) {
      this.head = true
    }
    return this
  }

  eq(col: string, val: any) {
    this.filters.push({ col, val })
    return this
  }

  order(col: string, options?: { ascending?: boolean }) {
    this.orderCol = col
    if (options?.ascending !== undefined) {
      this.ascending = options.ascending
    }
    return this
  }

  single() {
    this.isSingle = true
    return this
  }

  private deserializeRow(row: any) {
    if (!row) return row
    const jsonFieldsMap: Record<string, string[]> = {
      quizzes: ['questions'],
      quiz_results: ['answers'],
      assignments: ['content'],
    }
    const fieldsToParse = jsonFieldsMap[this.table]
    if (fieldsToParse) {
      for (const field of fieldsToParse) {
        if (row[field] && typeof row[field] === 'string') {
          try {
            row[field] = JSON.parse(row[field])
          } catch (e) {
            // Keep as string if parsing fails
          }
        }
      }
    }
    return row
  }

  async execute() {
    try {
      const params: any[] = []
      let whereClause = ''
      if (this.filters.length > 0) {
        whereClause =
          ' WHERE ' +
          this.filters
            .map((f) => {
              params.push(f.val)
              return `${f.col} = ?`
            })
            .join(' AND ')
      }

      if (this.head) {
        const countSql = `SELECT COUNT(*) as cnt FROM ${this.table}${whereClause}`
        const countRow = await queryGet(countSql, params)
        const count = countRow ? countRow.cnt : 0
        return { data: null, count, error: null }
      }

      let orderClause = ''
      if (this.orderCol) {
        orderClause = ` ORDER BY ${this.orderCol} ${this.ascending ? 'ASC' : 'DESC'}`
      }

      const sql = `SELECT * FROM ${this.table}${whereClause}${orderClause}`
      const rows = await queryAll(sql, params)
      const deserializedRows = rows.map((row) => this.deserializeRow(row))

      // get counts
      const countSql = `SELECT COUNT(*) as cnt FROM ${this.table}${whereClause}`
      const countRow = await queryGet(countSql, params)
      const count = countRow ? countRow.cnt : 0

      let result = deserializedRows
      if (this.isSingle) {
        result = deserializedRows.length > 0 ? deserializedRows[0] : null
      }

      return { data: result, count, error: null }
    } catch (err: any) {
      return { data: null, count: 0, error: { message: err.message } }
    }
  }

  async insert(data: any) {
    try {
      const rowsToInsert = Array.isArray(data) ? data : [data]
      const insertedRows = []

      for (const item of rowsToInsert) {
        if (!item.id) {
          item.id = crypto.randomUUID()
        }

        const keys = Object.keys(item)
        const values = keys.map((k) => {
          const val = item[k]
          if (val !== null && typeof val === 'object') {
            return JSON.stringify(val)
          }
          return val
        })

        const placeholders = keys.map(() => '?').join(', ')
        const sql = `INSERT INTO ${this.table} (${keys.join(', ')}) VALUES (${placeholders})`
        await queryRun(sql, values)
        insertedRows.push(item)
      }

      let result = insertedRows
      if (this.isSingle) {
        result = insertedRows.length > 0 ? insertedRows[0] : null
      }
      return { data: result, error: null }
    } catch (err: any) {
      return { data: null, error: { message: err.message } }
    }
  }

  async upsert(data: any) {
    try {
      const rowsToUpsert = Array.isArray(data) ? data : [data]
      const upsertedRows = []

      for (const item of rowsToUpsert) {
        if (!item.id) {
          item.id = crypto.randomUUID()
        }

        const keys = Object.keys(item)
        const values = keys.map((k) => {
          const val = item[k]
          if (val !== null && typeof val === 'object') {
            return JSON.stringify(val)
          }
          return val
        })

        const placeholders = keys.map(() => '?').join(', ')
        const updateClause = keys
          .filter((k) => k !== 'id')
          .map((k) => `${k} = excluded.${k}`)
          .join(', ')

        const sql = `
          INSERT INTO ${this.table} (${keys.join(', ')}) 
          VALUES (${placeholders})
          ON CONFLICT(id) DO UPDATE SET ${updateClause || 'id = excluded.id'}
        `
        await queryRun(sql, values)
        upsertedRows.push(item)
      }

      let result = upsertedRows
      if (this.isSingle) {
        result = upsertedRows.length > 0 ? upsertedRows[0] : null
      }
      return { data: result, error: null }
    } catch (err: any) {
      return { data: null, error: { message: err.message } }
    }
  }

  async delete() {
    try {
      const params: any[] = []
      let whereClause = ''
      if (this.filters.length > 0) {
        whereClause =
          ' WHERE ' +
          this.filters
            .map((f) => {
              params.push(f.val)
              return `${f.col} = ?`
            })
            .join(' AND ')
      }
      const sql = `DELETE FROM ${this.table}${whereClause}`
      await queryRun(sql, params)
      return { data: null, error: null }
    } catch (err: any) {
      return { data: null, error: { message: err.message } }
    }
  }

  then(onfulfilled?: any, onrejected?: any) {
    return this.execute().then(onfulfilled, onrejected)
  }
}

class SQLiteServerClient {
  auth = {
    getUser: async () => {
      try {
        const cookieStore = await cookies()
        const sessionCookie = cookieStore.get('sb-sqlite-session')?.value

        if (!sessionCookie) {
          return { data: { user: null }, error: null }
        }

        const session = JSON.parse(sessionCookie)
        if (session && session.expires_at > Date.now()) {
          return { data: { user: session.user }, error: null }
        }

        return { data: { user: null }, error: null }
      } catch (err: any) {
        if (err?.digest === 'DYNAMIC_SERVER_USAGE' || err?.message?.includes('Dynamic server usage')) {
          throw err
        }
        console.error('SQLite server getUser error:', err)
        return { data: { user: null }, error: null }
      }
    },

    signOut: async () => {
      try {
        const cookieStore = await cookies()
        cookieStore.delete('sb-sqlite-session')
        return { error: null }
      } catch (err: any) {
        return { error: { message: err.message } }
      }
    },
  }

  from(table: string) {
    return new SQLiteServerQueryBuilder(table)
  }
}

export async function createClient() {
  if (isSQLiteMode) {
    return new SQLiteServerClient() as any
  }

  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component — cookies can't be set.
          }
        },
      },
    }
  )
}
