'use server';

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function checkIsAdmin() {
  const userClient = await createClient();
  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) return false;

  const adminClient = await createAdminClient();
  const { data: dbUser } = await adminClient
    .from('user')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  return dbUser?.is_admin === true;
}

export async function markWithdrawalCompleted(transactionId: string) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) throw new Error("Unauthorized: Admin access required");

  const adminClient = await createAdminClient();

  const { data: tx, error: fetchError } = await adminClient
    .from('wallet_transaction')
    .select('*, wallet(user_id)')
    .eq('id', transactionId)
    .single();

  if (fetchError || !tx) throw new Error("Transaction not found");
  if (tx.type !== 'withdrawal') throw new Error("Not a withdrawal");
  if (tx.status !== 'pending') throw new Error(`Withdrawal is already ${tx.status}`);

  const { error: updateError } = await adminClient
    .from('wallet_transaction')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', transactionId);

  if (updateError) throw new Error(`Failed to update: ${updateError.message}`);

  await adminClient.from('notification').insert({
    user_id: tx.wallet.user_id,
    type: 'payout_completed',
    message: `Your withdrawal of Rs ${Math.abs(tx.amount).toLocaleString()} has been processed and transferred to your bank!`,
    link: '/profile?tab=wallet',
    is_read: false,
    created_at: new Date().toISOString()
  });

  revalidatePath('/admin');
  revalidatePath('/profile');
  return { success: true };
}

export async function rejectWithdrawal(transactionId: string, reason: string = 'Invalid bank details') {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) throw new Error("Unauthorized: Admin access required");

  const adminClient = await createAdminClient();

  const { data: tx, error: fetchError } = await adminClient
    .from('wallet_transaction')
    .select('*, wallet(user_id)')
    .eq('id', transactionId)
    .single();

  if (fetchError || !tx) throw new Error("Transaction not found");
  if (tx.type !== 'withdrawal') throw new Error("Not a withdrawal");
  if (tx.status !== 'pending') throw new Error(`Withdrawal is already ${tx.status}`);

  // Update status to failed
  const { error: updateError } = await adminClient
    .from('wallet_transaction')
    .update({ status: 'failed', updated_at: new Date().toISOString() })
    .eq('id', transactionId);

  if (updateError) throw new Error(`Failed to update: ${updateError.message}`);

  // Create refund transaction to return funds
  await adminClient.from('wallet_transaction').insert({
    wallet_id: tx.wallet_id,
    type: 'refund',
    amount: Math.abs(tx.amount), // positive amount to add back to balance
    status: 'completed',
    reference_id: tx.id.toString(),
    reference_note: `Refund for rejected withdrawal: ${reason}`
  });

  // Notify the user
  await adminClient.from('notification').insert({
    user_id: tx.wallet.user_id,
    type: 'payout_rejected',
    message: `Your withdrawal of Rs ${Math.abs(tx.amount).toLocaleString()} was rejected: ${reason}. Funds have been returned to your wallet.`,
    link: '/profile?tab=wallet',
    is_read: false,
    created_at: new Date().toISOString()
  });

  revalidatePath('/admin');
  revalidatePath('/profile');
  return { success: true };
}

export async function resolveDispute(disputeId: number, decision: 'refund_buyer' | 'pay_seller', adminNotes: string) {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) throw new Error("Unauthorized: Admin access required");

  const adminClient = await createAdminClient();

  const { data: dispute, error: disputeError } = await adminClient
    .from('dispute')
    .select('*, transaction:transaction_id(*, listing:listing_id(title))')
    .eq('id', disputeId)
    .single();

  if (disputeError || !dispute) throw new Error("Dispute not found");
  if (dispute.status !== 'open') throw new Error("Dispute is already resolved");

  const tx = dispute.transaction;

  // 1. Update dispute status
  await adminClient.from('dispute').update({
    status: 'resolved',
    resolution_notes: adminNotes,
    updated_at: new Date().toISOString()
  }).eq('id', disputeId);

  // 2. Resolve transaction and handle funds
  if (decision === 'refund_buyer') {
    // Transaction cancelled
    await adminClient.from('transaction').update({ status: 'cancelled' }).eq('id', tx.id);
    
    // Credit buyer wallet
    if (tx.payment_gateway !== 'cod') {
      const { data: buyerWallet } = await adminClient.from('wallet').select('id').eq('user_id', tx.buyer_id).single();
      if (buyerWallet) {
        await adminClient.from('wallet_transaction').insert({
          wallet_id: buyerWallet.id,
          type: 'refund',
          amount: tx.agreed_amount,
          status: 'completed',
          reference_id: tx.id.toString(),
          reference_note: `Refund for disputed order: ${tx.listing.title}`
        });
      }
    }
  } else {
    // Pay Seller
    await adminClient.from('transaction').update({ status: 'received' }).eq('id', tx.id);
    const { creditSellerEarning } = await import('@/app/actions/wallet');
    await creditSellerEarning(tx.id);
  }

  // 3. Notify both parties
  await adminClient.from('notification').insert([
    {
      user_id: tx.buyer_id,
      type: 'dispute_resolved',
      message: `Your dispute for ${tx.listing.title} has been resolved. Action: ${decision === 'refund_buyer' ? 'You have been refunded.' : 'Funds released to seller.'}`,
      link: `/chat/${tx.conversation_id}`,
      is_read: false,
      created_at: new Date().toISOString()
    },
    {
      user_id: tx.seller_id,
      type: 'dispute_resolved',
      message: `The dispute for ${tx.listing.title} has been resolved. Action: ${decision === 'pay_seller' ? 'Funds have been released to your wallet.' : 'Buyer has been refunded.'}`,
      link: `/chat/${tx.conversation_id}`,
      is_read: false,
      created_at: new Date().toISOString()
    }
  ]);

  revalidatePath('/admin');
  return { success: true };
}
