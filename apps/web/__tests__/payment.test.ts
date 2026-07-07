import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST as initiatePayment } from '../src/app/api/payment/swich/initiate/route'
import { GET as webhookPayment } from '../src/app/api/payment/swich/webhook/route'

// Mock crypto
vi.mock('crypto', () => ({
  default: {
    randomBytes: () => ({ toString: () => 'random123' }),
    createHmac: () => ({
      update: () => ({
        digest: () => 'mocked-checksum'
      })
    })
  }
}))

// Mock Supabase
vi.mock('@supabase/supabase-js', () => {
  return {
    createClient: () => ({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                agreed_amount: 1000,
                status: 'pending',
                listing: { title: 'Test Item' }
              },
              error: null
            })
          })
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      })
    })
  }
})

describe('Swich Payment API Routes', () => {
  beforeEach(() => {
    process.env.SWICH_CLIENT_ID = 'test-client-id'
    process.env.SWICH_SECRET_KEY = 'test-secret-key'
    vi.clearAllMocks()
  })

  describe('POST /api/payment/swich/initiate', () => {
    it('should return 400 if parameters are missing', async () => {
      const request = new Request('http://localhost:3000/api/payment/swich/initiate', {
        method: 'POST',
        body: JSON.stringify({
          customerTransactionId: '123'
          // missing payeename, email, etc.
        })
      })

      const response = await initiatePayment(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data.error).toBe('Missing required payment parameters.')
    })

    it('should initiate payment and return redirectUrl if valid', async () => {
      const request = new Request('http://localhost:3000/api/payment/swich/initiate', {
        method: 'POST',
        body: JSON.stringify({
          customerTransactionId: '123',
          payeename: 'Test User',
          email: 'test@example.com',
          msisdn: '03000000000'
        })
      })

      const response = await initiatePayment(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.redirectUrl).toContain('clientid=test-client-id')
      expect(data.redirectUrl).toContain('amount=1000') // Value from DB mock
      expect(data.redirectUrl).toContain('checksum=mocked-checksum')
    })
  })

  describe('GET /api/payment/swich/webhook', () => {
    it('should return 400 on invalid checksum', async () => {
      // Missing checksum
      const request = new Request('http://localhost:3000/api/payment/swich/webhook?CustomerTransactionId=123-random123&Status=success&TransactionId=SW123&Amount=1000&Checksum=INVALID')
      
      const response = await webhookPayment(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid checksum')
    })

    it('should update transaction status to placed on success', async () => {
      const request = new Request('http://localhost:3000/api/payment/swich/webhook?CustomerTransactionId=123-random123&Status=success&TransactionId=SW123&Amount=1000&Checksum=MOCKED-CHECKSUM')
      
      const response = await webhookPayment(request)
      const data = await response.json()

      // The webhook should return 200 with success true, even if db mocked
      expect(response.status).toBe(200)
      expect(data.status).toBe('success')
    })

    it('should return 400 if amount mismatches DB', async () => {
      // Mocked DB returns 1000, but request says 500
      const request = new Request('http://localhost:3000/api/payment/swich/webhook?CustomerTransactionId=123-random123&Status=success&TransactionId=SW123&Amount=500&Checksum=MOCKED-CHECKSUM')
      
      const response = await webhookPayment(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Amount mismatch')
    })
  })
})
