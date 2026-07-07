import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
      refresh: vi.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  }
}))

// Mock Next.js headers/cookies
vi.mock('next/headers', () => ({
  cookies() {
    return {
      get: vi.fn(),
      set: vi.fn(),
      getAll: vi.fn(),
    }
  }
}))
