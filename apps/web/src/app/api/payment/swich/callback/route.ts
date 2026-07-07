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
    
    // Log the full URL to see exactly what Swich sent us
    console.log('--- SWICH CALLBACK RECEIVED ---');
    console.log('Full URL:', request.url);
    console.log('-------------------------------');

    // Case-insensitive param extraction
    const params = Object.fromEntries(searchParams.entries());
    const getParam = (key: string) => {
      const foundKey = Object.keys(params).find(k => k.toLowerCase() === key.toLowerCase());
      return foundKey ? params[foundKey] : null;
    };

    // Swich sends these parameters in the callback/redirect
    const status = getParam('status');
    const transactionId = getParam('transactionid'); // Swich ID
    const customerTransactionId = getParam('customertransactionid'); // Our ID
    const checksum = getParam('checksum');
    const amount = getParam('amount');
    const consumerNumber = getParam('consumernumber') || '';
    
    // If we have absolutely no customerTransactionId, fallback to home
    if (!customerTransactionId) {
      console.error('No CustomerTransactionId found in callback. Redirecting to home.');
      return NextResponse.redirect(new URL('/', request.url));
    }

    const secretKey = process.env.SWICH_SECRET_KEY;
    if (!secretKey) {
      console.error('Missing SWICH_SECRET_KEY');
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    // Verify Checksum if provided (HMACSHA256 of SWCallback:CustomerTransactionId:TransactionId:Amount:ConsumerNumber)
    if (checksum && transactionId && amount) {
      const rawString = `SWCallback:${customerTransactionId}:${transactionId}:${amount}:${consumerNumber}`;
      const expectedChecksum = crypto
        .createHmac('sha256', secretKey)
        .update(rawString)
        .digest('hex')
        .toUpperCase();

      if (checksum.toUpperCase() !== expectedChecksum) {
        console.error('Invalid Swich Checksum received');
        return NextResponse.json({ error: 'Invalid checksum' }, { status: 400 });
      }
    }

    // We leave the actual status updates and security checks to the background webhook!
    // This route is purely to handle the user's browser returning from the payment gateway.
    if (customerTransactionId) {
      const realCustomerTransactionId = customerTransactionId.split('-')[0];

      const { data: tx, error: txErr } = await supabaseAdmin
        .from('transaction')
        .select('conversation_id, status, agreed_amount, shipping_fee')
        .eq('id', realCustomerTransactionId)
        .single();

      if (!txErr && tx) {
        // Fallback: If webhook was dropped, update status here
        if (tx.status === 'pending' && status?.toLowerCase() === '0') {
          // Verify amount matches
          const shipping_fee = tx.shipping_fee || 250;
          const buyer_protection_fee = 150 + Math.round(tx.agreed_amount * 0.05);
          const expectedAmount = tx.agreed_amount + shipping_fee + buyer_protection_fee;
          if (amount && parseFloat(amount) === parseFloat(expectedAmount.toString())) {
            await supabaseAdmin
              .from('transaction')
              .update({ status: 'placed', payment_gateway: 'swich' })
              .eq('id', realCustomerTransactionId);
              
            if (tx.conversation_id) {
              await supabaseAdmin.from('chat_message').insert({
                conversation_id: tx.conversation_id,
                sender_id: null,
                type: 'system',
                text: 'Payment was successfully confirmed via Swich.',
                timestamp: new Date().toISOString()
              });
            }
          }
        }
        
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        return NextResponse.redirect(`${appUrl}/chat/${tx.conversation_id}`);
      }
    }

    // If something fails or we don't have conversation_id to redirect to, go to home
    return NextResponse.redirect(new URL('/profile?tab=orders', request.url));

  } catch (error: any) {
    console.error('Error handling Swich callback:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
