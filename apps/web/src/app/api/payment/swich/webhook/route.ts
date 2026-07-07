import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin client to bypass RLS for server-side updates
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const searchParams = requestUrl.searchParams;
    
    // Case-insensitive param extraction
    const params = Object.fromEntries(searchParams.entries());
    const getParam = (key: string) => {
      const foundKey = Object.keys(params).find(k => k.toLowerCase() === key.toLowerCase());
      return foundKey ? params[foundKey] : null;
    };

    // Swich sends these parameters in the webhook
    const status = getParam('status');
    const transactionId = getParam('transactionid'); // Swich ID
    const customerTransactionId = getParam('customertransactionid'); // Our ID
    const checksum = getParam('checksum');
    const amount = getParam('amount');
    const consumerNumber = getParam('consumernumber') || '';

    // Webhooks must return 2xx for success. If essential params are missing, it's a bad request.
    if (!customerTransactionId || !status || !transactionId || !amount || !checksum) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const secretKey = process.env.SWICH_SECRET_KEY;
    if (!secretKey) {
      console.error('Missing SWICH_SECRET_KEY');
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    // Verify Checksum (HMACSHA256 of SWCallback:CustomerTransactionId:TransactionId:Amount:ConsumerNumber)
    const rawString = `SWCallback:${customerTransactionId}:${transactionId}:${amount}:${consumerNumber}`;
    const expectedChecksum = crypto
      .createHmac('sha256', secretKey)
      .update(rawString)
      .digest('hex')
      .toUpperCase();

    if (checksum.toUpperCase() !== expectedChecksum) {
      console.error('Invalid Swich Webhook Checksum received');
      return NextResponse.json({ error: 'Invalid checksum' }, { status: 400 });
    }

    if (status.toLowerCase() === 'success') {
      // Parse out the random suffix we added in initiate/route.ts to get the real DB ID
      const realCustomerTransactionId = customerTransactionId.split('-')[0];

      // Security check: Verify amount matches the database
      const { data: tx, error: fetchErr } = await supabaseAdmin
        .from('transaction')
        .select('agreed_amount, shipping_fee, status, conversation_id, buyer_id')
        .eq('id', realCustomerTransactionId)
        .single();

      if (fetchErr || !tx) {
        console.error('Transaction not found or error fetching:', fetchErr);
        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
      }

      // Check if amount matches to prevent price tampering
      const shipping_fee = tx.shipping_fee || 250;
      const buyer_protection_fee = 150 + Math.round(tx.agreed_amount * 0.05);
      const expectedAmount = tx.agreed_amount + shipping_fee + buyer_protection_fee;
      
      if (parseFloat(amount) !== parseFloat(expectedAmount.toString())) {
        console.error(`Amount mismatch! Swich amount: ${amount}, DB expected: ${expectedAmount}`);
        return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 });
      }

      // Idempotent update: Only update if it is currently pending
      if (tx.status === 'pending') {
        const { error: updateErr } = await supabaseAdmin
          .from('transaction')
          .update({ status: 'placed', payment_gateway: 'swich' })
          .eq('id', realCustomerTransactionId);

        if (updateErr) {
          console.error('Failed to update transaction status:', updateErr);
          return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
        }

        // Insert a system message into the chat so both parties see the payment confirmation
        if (tx.conversation_id) {
          await supabaseAdmin.from('chat_message').insert({
            conversation_id: tx.conversation_id,
            sender_id: tx.buyer_id, // We use buyer_id so it shows up cleanly, or it can be null if your schema allows
            type: 'system',
            text: 'Payment was successfully confirmed via Swich.',
            timestamp: new Date().toISOString()
          });
        }
      } else {
        console.log(`Transaction ${realCustomerTransactionId} is already in status: ${tx.status}, skipping update.`);
      }
    }

    // Always return a 200 JSON response to acknowledge the webhook, 
    // otherwise Swich will keep retrying every 5 minutes.
    return NextResponse.json({ status: 'success' });

  } catch (error: any) {
    console.error('Error handling Swich webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
