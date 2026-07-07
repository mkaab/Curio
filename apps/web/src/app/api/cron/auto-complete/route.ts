import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Setup admin client to bypass RLS for cron jobs
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(req: Request) {
  // Enforce CRON_SECRET to prevent unauthorized execution
  const authHeader = req.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

  try {
    // 1. Find all transactions that have been 'shipped' for more than 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: transactions, error } = await supabaseAdmin
      .from('transaction')
      .select('id, seller_id, buyer_id, conversation_id, listing:listing_id(title), payment_gateway')
      .eq('status', 'shipped')
      .lt('updated_at', sevenDaysAgo.toISOString());

    if (error) throw error;
    if (!transactions || transactions.length === 0) {
      return NextResponse.json({ message: 'No eligible transactions found' });
    }

    let completedCount = 0;
    const errors: any[] = [];

    // 2. Auto-complete each transaction
    for (const tx of transactions) {
      try {
        // We do this manually rather than using server actions here 
        // because server actions expect an authenticated user session (cookies).
        // This is a background service role task.

        // A. Update status to received
        await supabaseAdmin
          .from('transaction')
          .update({ 
            status: 'received',
            updated_at: new Date().toISOString()
          })
          .eq('id', tx.id);

        // B. Add a system message in the chat
        await supabaseAdmin.from('chat_message').insert({
          conversation_id: tx.conversation_id,
          sender_id: tx.seller_id, // System messages often use one of the users or null if schema allows
          type: 'system',
          text: 'Order was automatically marked as received after 7 days.',
          timestamp: new Date().toISOString()
        });

        // C. Create notification for seller
        const listingTitle = (tx.listing as any)?.title || 'Item';
        await supabaseAdmin.from('notification').insert({
          user_id: tx.seller_id,
          type: 'order_received',
          message: `The buyer's order for ${listingTitle} was auto-completed! Earnings will be transferred.`,
          link: `/chat/${tx.conversation_id}`,
          read: false
        });

        // D. Credit the seller's wallet if not COD
        if (tx.payment_gateway !== 'cod') {
          // Import creditSellerEarning dynamically or statically at top. Actually, we can just import it at top. Wait, no, I'll just import it here.
          const { creditSellerEarning } = await import('@/app/actions/wallet');
          await creditSellerEarning(tx.id);
        }

        completedCount++;
      } catch (err: any) {
        errors.push({ id: tx.id, error: err.message });
      }
    }

    return NextResponse.json({ 
      message: `Successfully auto-completed ${completedCount} transactions`,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
