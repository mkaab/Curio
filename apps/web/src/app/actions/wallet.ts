'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Enums matching our DB schema
export type WalletTxType = 'deposit' | 'withdrawal' | 'sale_earning' | 'refund' | 'platform_fee'
export type WalletTxStatus = 'pending' | 'completed' | 'failed'

export interface WalletTransaction {
  id: string
  wallet_id: string
  transaction_id: number | null
  type: WalletTxType
  amount: number
  status: WalletTxStatus
  reference_note: string | null
  created_at: string
}

export interface Wallet {
  id: string
  user_id: string
  balance: number
  created_at: string
  updated_at: string
}

/**
 * Fetches the user's wallet. If they don't have one, creates it.
 */
export async function getWalletBalance(userId: string) {
  // Use admin client to bypass RLS for internal wallet operations
  const supabase = await createAdminClient()
  
  // Try to fetch existing wallet
  let { data: wallet, error: fetchError } = await supabase
    .from('wallet')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (fetchError && fetchError.code === 'PGRST116') {
    // Wallet doesn't exist, create it
    const { data: newWallet, error: insertError } = await supabase
      .from('wallet')
      .insert({ user_id: userId, balance: 0 })
      .select()
      .single()
      
    if (insertError) throw new Error(`Failed to create wallet: ${insertError.message}`)
    wallet = newWallet
  } else if (fetchError) {
    throw new Error(`Failed to fetch wallet: ${fetchError.message}`)
  }

  // Fetch recent transactions
  const { data: transactions, error: txError } = await supabase
    .from('wallet_transaction')
    .select('*')
    .eq('wallet_id', wallet.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (txError) throw new Error(`Failed to fetch transactions: ${txError.message}`)

  return { wallet, transactions }
}

/**
 * Initiates a withdrawal request.
 * amount must be a positive number. In DB, it will be negative to deduct balance.
 */
export async function requestWithdrawal(userId: string, amount: number) {
  if (amount <= 0) throw new Error("Withdrawal amount must be greater than 0")

  // First verify the logged-in user matches the userId to prevent CSRF/spoofing
  const userClient = await createClient()
  const { data: { user }, error: authError } = await userClient.auth.getUser()
  if (authError || !user || user.id !== userId) throw new Error("Unauthorized")

  const supabase = await createAdminClient()
  
  // 1. Get wallet
  const { data: wallet, error: walletError } = await supabase
    .from('wallet')
    .select('id, balance')
    .eq('user_id', userId)
    .single()

  if (walletError || !wallet) throw new Error("Wallet not found")
  if (wallet.balance < amount) throw new Error("Insufficient balance")

  // 2. Insert pending withdrawal transaction
  // Trigger will automatically deduct balance because status='pending' and amount is negative
  const { error: insertError } = await supabase
    .from('wallet_transaction')
    .insert({
      wallet_id: wallet.id,
      type: 'withdrawal',
      amount: -amount, // Negative to deduct
      status: 'pending',
      reference_note: 'User initiated withdrawal'
    })

  if (insertError) {
    if (insertError.message.includes('wallet_balance_check')) {
       throw new Error("Insufficient balance")
    }
    throw new Error(`Failed to process withdrawal: ${insertError.message}`)
  }

  revalidatePath('/profile')
  return { success: true }
}

/**
 * Automatically credits the seller when an order is marked as received.
 * Should be called securely after the transaction status is confirmed.
 */
export async function creditSellerEarning(transactionId: number) {
  const supabase = await createAdminClient()
  
  // 1. Fetch transaction details
  const { data: tx, error: txError } = await supabase
    .from('transaction')
    .select('*, listing!inner(*)')
    .eq('id', transactionId)
    .single()

  if (txError || !tx) throw new Error("Transaction not found")
    
  if (tx.status !== 'received') throw new Error("Transaction must be received to credit seller")
  if (tx.payment_gateway === 'cod') throw new Error("COD transactions do not credit digital wallet")

  // 2. Get Seller Wallet (Create if doesn't exist)
  const { wallet } = await getWalletBalance(tx.seller_id)

  // 3. Insert earning
  // Idempotency: The DB constraint UNIQUE(wallet_id, transaction_id, type) ensures this only succeeds once.
  const { error: creditError } = await supabase
    .from('wallet_transaction')
    .insert({
      wallet_id: wallet.id,
      transaction_id: tx.id,
      type: 'sale_earning',
      amount: tx.seller_payout,
      status: 'completed',
      reference_note: `Earning from listing: ${tx.listing.title}`
    })

  if (creditError) {
    // If it's a unique violation, we already credited them. That's fine.
    if (creditError.code === '23505') {
       return { success: true, already_credited: true }
    }
    throw new Error(`Failed to credit seller: ${creditError.message}`)
  }

  return { success: true }
}
