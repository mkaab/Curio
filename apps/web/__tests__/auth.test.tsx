import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import LoginPage from '../src/app/(auth)/login/page'
import SignupPage from '../src/app/(auth)/signup/page'

// Mock Supabase
const mockSignInWithPassword = vi.fn()
const mockSignUp = vi.fn()
const mockSignInWithOAuth = vi.fn()
const mockSelect = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      signInWithOAuth: mockSignInWithOAuth,
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: mockSelect
        })
      })
    })
  })
}))

describe('Auth Pages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('LoginPage', () => {
    it('renders login form correctly', () => {
      render(<LoginPage />)
      expect(screen.getByText('Log in to your account')).toBeInTheDocument()
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument()
      expect(screen.getByLabelText('Password')).toBeInTheDocument()
    })

    it('handles successful login', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        data: { session: { user: { id: 'user-1' } } },
        error: null
      })
      mockSelect.mockResolvedValueOnce({
        data: { id: 'user-1', name: 'Test' },
        error: null
      })

      render(<LoginPage />)
      
      fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'test@example.com' } })
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
      fireEvent.click(screen.getByRole('button', { name: /Log In/i }))

      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })

      await waitFor(() => {
        expect(screen.getByText('Welcome back! Redirecting to feed...')).toBeInTheDocument()
      })
    })

    it('handles login errors', async () => {
      mockSignInWithPassword.mockResolvedValueOnce({
        data: null,
        error: { message: 'Invalid credentials' }
      })

      render(<LoginPage />)
      
      fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'wrong@example.com' } })
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrongpass' } })
      fireEvent.click(screen.getByRole('button', { name: /Log In/i }))

      await waitFor(() => {
        expect(screen.getByText('Error: Invalid credentials')).toBeInTheDocument()
      })
    })
  })

  describe('SignupPage', () => {
    it('handles successful signup', async () => {
      mockSignUp.mockResolvedValueOnce({
        data: { user: { id: 'user-2' } },
        error: null
      })

      render(<SignupPage />)
      
      fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'New User' } })
      fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'new@example.com' } })
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
      fireEvent.click(screen.getByRole('button', { name: /Create Account/i }))

      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'new@example.com',
        password: 'password123',
        options: {
          data: {
            name: 'New User',
          }
        }
      })

      await waitFor(() => {
        expect(screen.getByText('Success! Please check your email to verify your account.')).toBeInTheDocument()
      })
    })
  })
})
