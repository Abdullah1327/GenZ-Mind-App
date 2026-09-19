import { createBrowserClient } from '@supabase/ssr'

// Check if we should run in SQLite database mode
export const isSQLiteMode =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('your_') ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.startsWith('your_')

class SQLiteQueryBuilder {
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

  async upsert(data: any) {
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: this.table,
          action: 'upsert',
          data,
          isSingle: this.isSingle,
        }),
      })
      return await res.json()
    } catch (err: any) {
      return { data: null, error: { message: err.message || 'Database error' } }
    }
  }

  async insert(data: any) {
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: this.table,
          action: 'insert',
          data,
          isSingle: this.isSingle,
        }),
      })
      return await res.json()
    } catch (err: any) {
      return { data: null, error: { message: err.message || 'Database error' } }
    }
  }

  async delete() {
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: this.table,
          action: 'delete',
          filters: this.filters,
        }),
      })
      return await res.json()
    } catch (err: any) {
      return { data: null, error: { message: err.message || 'Database error' } }
    }
  }

  async execute() {
    try {
      const res = await fetch('/api/db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: this.table,
          action: 'select',
          filters: this.filters,
          isSingle: this.isSingle,
          head: this.head,
          order: this.orderCol,
          ascending: this.ascending,
        }),
      })
      return await res.json()
    } catch (err: any) {
      return { data: null, error: { message: err.message || 'Database error' } }
    }
  }

  then(onfulfilled?: any, onrejected?: any) {
    return this.execute().then(onfulfilled, onrejected)
  }
}

class SQLiteBrowserClient {
  auth = {
    signUp: async (options: { email: string; password?: string; options?: { data?: any } }) => {
      try {
        const res = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: options.email,
            password: options.password,
            fullName: options.options?.data?.full_name || '',
            role: options.options?.data?.role || 'student',
          }),
        })
        const result = await res.json()
        if (!res.ok) throw new Error(result.error?.message || 'SignUp failed')
        return result
      } catch (err: any) {
        return { data: { user: null }, error: { message: err.message || 'SignUp failed' } }
      }
    },

    signInWithPassword: async (options: { email: string; password?: string }) => {
      try {
        const res = await fetch('/api/auth/signin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: options.email,
            password: options.password,
          }),
        })
        const result = await res.json()
        if (!res.ok) throw new Error(result.error?.message || 'SignIn failed')
        return result
      } catch (err: any) {
        return { data: { user: null }, error: { message: err.message || 'SignIn failed' } }
      }
    },

    signOut: async () => {
      try {
        const res = await fetch('/api/auth/signout', { method: 'POST' })
        return await res.json()
      } catch (err: any) {
        return { error: { message: err.message || 'SignOut failed' } }
      }
    },

    getUser: async () => {
      try {
        const res = await fetch('/api/auth/user')
        return await res.json()
      } catch (err: any) {
        return { data: { user: null }, error: { message: err.message || 'Failed to get user' } }
      }
    },
  }

  from(table: string) {
    return new SQLiteQueryBuilder(table)
  }
}

export function createClient() {
  if (isSQLiteMode) {
    return new SQLiteBrowserClient() as any
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  return createBrowserClient(supabaseUrl, supabaseKey)
}
