interface SupabaseError {
  message: string
  details?: string
  hint?: string
  code?: string
}

export function logSupabaseError(operation: string, error: SupabaseError | any) {
  console.error(`Supabase ${operation} error:`, {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code,
  })
}

export function formatSupabaseError(error: SupabaseError | any): string {
  if (!error) return 'Unknown error'

  const parts: string[] = []

  if (error.message) {
    parts.push(error.message)
  }

  if (error.hint) {
    parts.push(`Hint: ${error.hint}`)
  }

  if (error.details) {
    parts.push(`Details: ${error.details}`)
  }

  return parts.join(' | ')
}

export function isSupabaseError(error: any): error is SupabaseError {
  return error && typeof error.message === 'string'
}
