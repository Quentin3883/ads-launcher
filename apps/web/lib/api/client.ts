import { z } from 'zod'

const API_URL = process.env.NEXT_PUBLIC_API_URL

export class APIError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: any
  ) {
    super(`API Error ${status}: ${statusText}`)
    this.name = 'APIError'
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit,
  schema?: z.ZodSchema<T>
): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new APIError(response.status, response.statusText, errorData)
  }

  const data = await response.json()

  if (schema) {
    return schema.parse(data)
  }

  return data
}

export const api = {
  get: <T>(endpoint: string, schema?: z.ZodSchema<T>) =>
    apiRequest(endpoint, { method: 'GET' }, schema),

  post: <T>(endpoint: string, body?: any, schema?: z.ZodSchema<T>) =>
    apiRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    }, schema),

  put: <T>(endpoint: string, body?: any, schema?: z.ZodSchema<T>) =>
    apiRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    }, schema),

  delete: <T>(endpoint: string, schema?: z.ZodSchema<T>) =>
    apiRequest(endpoint, { method: 'DELETE' }, schema),
}
