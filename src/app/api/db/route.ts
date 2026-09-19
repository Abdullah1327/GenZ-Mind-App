import { NextRequest, NextResponse } from 'next/server'
import { queryGet, queryAll, queryRun } from '@/lib/database/sqlite'
import crypto from 'crypto'

// Helper to deserialize JSON fields in rows
function deserializeRow(table: string, row: any) {
  if (!row) return row
  const jsonFieldsMap: Record<string, string[]> = {
    quizzes: ['questions'],
    quiz_results: ['answers'],
    assignments: ['content'],
  }
  const fieldsToParse = jsonFieldsMap[table]
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { table, action, filters, data, isSingle, head } = body

    if (!table || !action) {
      return NextResponse.json({ data: null, error: 'Table and Action are required' }, { status: 400 })
    }

    // Build WHERE clause for filters
    const params: any[] = []
    let whereClause = ''
    if (filters && filters.length > 0) {
      whereClause =
        ' WHERE ' +
        filters
          .map((f: any) => {
            params.push(f.val)
            return `${f.col} = ?`
          })
          .join(' AND ')
    }

    // --- SELECT ---
    if (action === 'select') {
      if (head) {
        // Return only counts
        const countSql = `SELECT COUNT(*) as cnt FROM ${table}${whereClause}`
        const countRow = await queryGet(countSql, params)
        const count = countRow ? countRow.cnt : 0
        return NextResponse.json({ data: null, count, error: null })
      }

      let orderClause = ''
      if (body.order) {
        orderClause = ` ORDER BY ${body.order} ${body.ascending === false ? 'DESC' : 'ASC'}`
      }

      const sql = `SELECT * FROM ${table}${whereClause}${orderClause}`
      const rows = await queryAll(sql, params)
      const deserializedRows = rows.map((row) => deserializeRow(table, row))

      // Get count as well
      const countSql = `SELECT COUNT(*) as cnt FROM ${table}${whereClause}`
      const countRow = await queryGet(countSql, params)
      const count = countRow ? countRow.cnt : 0

      let result = deserializedRows
      if (isSingle) {
        result = deserializedRows.length > 0 ? deserializedRows[0] : null
      }

      return NextResponse.json({ data: result, count, error: null })
    }

    // --- INSERT ---
    if (action === 'insert') {
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
        const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`
        await queryRun(sql, values)

        insertedRows.push(item)
      }

      let result = insertedRows
      if (isSingle) {
        result = insertedRows.length > 0 ? insertedRows[0] : null
      }

      return NextResponse.json({ data: result, error: null })
    }

    // --- UPSERT ---
    if (action === 'upsert') {
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
          INSERT INTO ${table} (${keys.join(', ')}) 
          VALUES (${placeholders})
          ON CONFLICT(id) DO UPDATE SET ${updateClause || 'id = excluded.id'}
        `
        await queryRun(sql, values)
        upsertedRows.push(item)
      }

      let result = upsertedRows
      if (isSingle) {
        result = upsertedRows.length > 0 ? upsertedRows[0] : null
      }

      return NextResponse.json({ data: result, error: null })
    }

    // --- DELETE ---
    if (action === 'delete') {
      const sql = `DELETE FROM ${table}${whereClause}`
      await queryRun(sql, params)
      return NextResponse.json({ data: null, error: null })
    }

    return NextResponse.json({ data: null, error: 'Unsupported action' }, { status: 400 })
  } catch (err: any) {
    console.error('Database API error:', err)
    return NextResponse.json({ data: null, error: err.message || 'Database error' }, { status: 500 })
  }
}
