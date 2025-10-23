import { describe, it, expect, beforeEach } from 'vitest'
import { validateEnv } from '../src/env'

describe('env validation', () => {
  beforeEach(() => {
    process.env = {}
  })

  it('should validate correct environment variables', () => {
    const env = {
      NODE_ENV: 'development',
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      API_PORT: '4000',
      API_HOST: 'localhost',
    }

    const result = validateEnv(env)

    expect(result.NODE_ENV).toBe('development')
    expect(result.DATABASE_URL).toBe(
      'postgresql://user:pass@localhost:5432/db'
    )
    expect(result.API_PORT).toBe(4000)
    expect(result.API_HOST).toBe('localhost')
  })

  it('should use default values for optional fields', () => {
    const env = {
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    }

    const result = validateEnv(env)

    expect(result.NODE_ENV).toBe('development')
    expect(result.API_PORT).toBe(4000)
    expect(result.API_HOST).toBe('localhost')
  })

  it('should throw error for missing required fields', () => {
    const env = {
      NODE_ENV: 'development',
    }

    expect(() => validateEnv(env)).toThrow('Invalid environment variables')
  })

  it('should throw error for invalid DATABASE_URL', () => {
    const env = {
      DATABASE_URL: 'not-a-url',
      NODE_ENV: 'development',
    }

    expect(() => validateEnv(env)).toThrow('Invalid environment variables')
  })

  it('should coerce API_PORT to number', () => {
    const env = {
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      API_PORT: '3000',
    }

    const result = validateEnv(env)

    expect(result.API_PORT).toBe(3000)
    expect(typeof result.API_PORT).toBe('number')
  })

  it('should validate NODE_ENV enum values', () => {
    const env = {
      DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
      NODE_ENV: 'production',
    }

    const result = validateEnv(env)

    expect(result.NODE_ENV).toBe('production')
  })
})
