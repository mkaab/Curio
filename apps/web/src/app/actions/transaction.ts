'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { calculatePricing } from '@/lib/pricing'

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

export async function placeOrderCOD(transactionId: number) {
  const userClient = await createClient()
  const { data: { user }, error: authError } = await userClient.auth.getUser()
  if (authError || !user) throw new Error("Unauthorized")

  const adminClient = await createAdminClient()

  // Fetch transaction
  const { data: tx, error: txError } = await adminClient
    .from('transaction')
    .select('*')
    .eq('id', transactionId)
    .single()

  if (txError || !tx) throw new Error("Transaction not found")
  if (tx.buyer_id !== user.id) throw new Error("Unauthorized: Only the buyer can place the order")
  if (tx.status !== 'pending') throw new Error("Order is not in pending state")

  // Atomic update: only succeeds if status is still 'pending', preventing race conditions
  // where two buyers could place the same order simultaneously
  const { data: updated, error: updateError } = await adminClient
    .from('transaction')
    .update({ status: 'placed', payment_gateway: 'cod' })
    .eq('id', transactionId)
    .eq('status', 'pending')
    .select('id')

  if (updateError) throw new Error("Failed to place order")
  if (!updated || updated.length === 0) throw new Error("Order was already placed or is no longer available")

  // Lock Inventory — also atomic: only lock if listing is still 'active'
  await adminClient
    .from('listing')
    .update({ status: 'sold' })
    .eq('id', tx.listing_id)
    .eq('status', 'active')

  return { success: true }
}

export async function createTransaction(conversationId: number, amount: number) {
  const userClient = await createClient()
  const { data: { user }, error: authError } = await userClient.auth.getUser()
  if (authError || !user) throw new Error("Unauthorized")

  const adminClient = await createAdminClient()

  // Fetch conversation to verify seller
  const { data: conv, error: convError } = await adminClient
    .from('conversation')
    .select('*')
    .eq('id', conversationId)
    .single()

  if (convError || !conv) throw new Error("Conversation not found")
  if (conv.seller_id !== user.id) throw new Error("Unauthorized: Only the seller can accept offers")

  const pricing = calculatePricing(amount)

  const { error: txErr } = await adminClient.from("transaction").insert({
    listing_id: conv.listing_id,
    conversation_id: conversationId,
    buyer_id: conv.buyer_id,
    seller_id: conv.seller_id,
    agreed_amount: amount,
    platform_fee: 0, // Listing is free — no seller commission
    seller_payout: pricing.sellerPayout,
    shipping_fee: pricing.shippingFee,
    status: 'pending',
    payment_gateway: 'cod' // default, updated when they actually pay
  })

  if (txErr) throw new Error("Failed to create transaction: " + txErr.message)
  return { success: true }
}
