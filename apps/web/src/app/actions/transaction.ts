'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateTransactionStatusSecure(transactionId: number, newStatus: string) {
  const userClient = await createClient()
  const { data: { user }, error: authError } = await userClient.auth.getUser()
  
  if (authError || !user) throw new Error("Unauthorized")
  const userId = user.id

  const adminClient = await createAdminClient()

  // Fetch transaction to verify roles
  const { data: tx, error: txError } = await adminClient
    .from('transaction')
    .select('*')
    .eq('id', transactionId)
    .single()

  if (txError || !tx) throw new Error("Transaction not found")

  // Authorization Checks
  const isBuyer = userId === tx.buyer_id
  const isSeller = userId === tx.seller_id

  if (!isBuyer && !isSeller) {
    throw new Error("Unauthorized: You are not part of this transaction")
  }

  // State Machine Validation
  if (newStatus === 'accepted') {
    if (!isSeller) throw new Error("Only the seller can accept the order")
    if (tx.status !== 'pending_seller_approval' && tx.status !== 'placed') throw new Error("Invalid state transition")
  } 
  else if (newStatus === 'shipped') {
    if (!isSeller) throw new Error("Only the seller can mark as shipped")
    if (tx.status !== 'accepted' && tx.status !== 'placed') throw new Error("Invalid state transition")
  }
  else if (newStatus === 'received') {
    if (!isBuyer) throw new Error("Only the buyer can mark as received")
    if (tx.status !== 'shipped') throw new Error("Order must be shipped before it can be received")
  }
  else if (newStatus === 'disputed') {
    if (!isBuyer) throw new Error("Only the buyer can open a dispute")
    if (tx.status !== 'shipped' && tx.status !== 'received') throw new Error("Order must be shipped before you can open a dispute")
  }
  else if (newStatus === 'completed') {
    if (tx.status !== 'received') throw new Error("Order must be received before it can be completed")
  }
  else {
    throw new Error("Invalid status update")
  }

  // Update transaction status
  const { error: updateError } = await adminClient
    .from('transaction')
    .update({ status: newStatus })
    .eq('id', transactionId)

  if (updateError) throw new Error("Failed to update status")

  return { success: true }
}
