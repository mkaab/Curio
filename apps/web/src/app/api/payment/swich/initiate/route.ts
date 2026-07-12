import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Rate Limit: Max 5 payment initiations per minute per user
    const rateLimitResult = rateLimit(`payment-init-${user.id}`, 5, 60 * 1000);
    if (!rateLimitResult.success) {
      return NextResponse.json({ 
        error: "Too many payment attempts. Please wait a minute before trying again." 
      }, { status: 429 });
    }

    const body = await request.json();
    const { customerTransactionId, payeename, email, msisdn } = body;

    const clientId = process.env.SWICH_CLIENT_ID;
    const secretKey = process.env.SWICH_SECRET_KEY;
    const swichBaseUrl = process.env.SWICH_BASE_URL || 'https://sandbox-payin-pwa.swichnow.com/';
    
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const successRedirectUrl = `${appUrl}/api/payment/swich/callback`;

    if (!clientId || !secretKey) {
      return NextResponse.json({ error: 'Swich credentials are not configured.' }, { status: 500 });
    }

    if (!customerTransactionId || !payeename || !email || !msisdn) {
      return NextResponse.json({ error: 'Missing required payment parameters.' }, { status: 400 });
    }

    // SECURITY FIX: Fetch amount and item from DB, do not trust client
    const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: tx, error: txErr } = await supabaseAdmin
      .from('transaction')
      .select('agreed_amount, shipping_fee, listing:listing_id(title)')
      .eq('id', customerTransactionId)
      .single();

    if (txErr || !tx || !tx.listing) {
      return NextResponse.json({ error: 'Transaction not found.' }, { status: 404 });
    }

    const shipping_fee = tx.shipping_fee || 250;
    const buyer_protection_fee = 150 + Math.round(tx.agreed_amount * 0.05);
    const amount = tx.agreed_amount + shipping_fee + buyer_protection_fee;
    
    const item = Array.isArray(tx.listing) ? tx.listing[0].title : (tx.listing as any).title;

    // Sanitize item to remove special characters AND spaces as per Swich docs
    // to avoid URL encoding issues (+ vs %20) which their backend struggles with.
    const sanitizedItem = item.replace(/[^a-zA-Z0-9]/g, '');

    // Workaround for Swich bug: Their backend calculates the checksum using the URL-encoded 
    // string (where spaces are converted to '+') instead of decoding it first!
    // So we must manually simulate URLSearchParams encoding (spaces to +) for the hash.
    const urlEncodedItem = sanitizedItem.replace(/ /g, '+');

    // Swich requires a unique CustomerTransactionId for every request to avoid duplicate rejection
    // We will append a random suffix, which we will parse out in the callback.
    const randomSuffix = crypto.randomBytes(4).toString('hex'); // e.g. 'adh123kji' equivalent
    const uniqueTransactionId = `${customerTransactionId}-${randomSuffix}`;

    // Swich Checksum logic: HMACSHA256(Swich:customer_transaction_id:item:amount, SecretKey)
    const rawString = `Swich:${uniqueTransactionId}:${urlEncodedItem}:${amount}`;
    const checksum = crypto
      .createHmac('sha256', secretKey)
      .update(rawString)
      .digest('hex')
      .toLowerCase();

    // Swich is very strict: payeename can ONLY contain letters and spaces (e.g. no numbers like 'mkaab23')
    const sanitizedPayeeName = payeename.replace(/[^a-zA-Z\s]/g, '').trim() || 'Customer';

    // Use exact casing from the Swich v1 documentation table
    // Build the query string MANUALLY without URL encoding, because Swich's backend 
    // might be failing to decode %40 (@) and %2F (/) just like it failed with + (space).
    const redirectUrl = `${swichBaseUrl}?clientid=${clientId}&customerTransactionId=${uniqueTransactionId}&item=${sanitizedItem}&amount=${amount.toString()}&channel=0&description=Paymentfor${sanitizedItem}&payeename=${sanitizedPayeeName.substring(0, 50)}&email=${email}&msisdn=${msisdn}&currency=PKR&checksum=${checksum}&successRedirectUrl=${successRedirectUrl}`;
    
    console.log('--- SWICH PAYMENT INITIATION ---');
    console.log('Raw Checksum String:', rawString);
    console.log('Generated Checksum:', checksum);
    console.log('Redirect URL:', redirectUrl);
    console.log('--------------------------------');

    return NextResponse.json({ 
      redirectUrl: redirectUrl
    });
  } catch (error: any) {
    console.error('Error initiating Swich payment:', error);
    return NextResponse.json({ error: 'Failed to initiate payment.' }, { status: 500 });
  }
}
