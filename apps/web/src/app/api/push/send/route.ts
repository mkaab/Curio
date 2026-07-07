import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

webpush.setVapidDetails(
  'mailto:support@curio.com', // Need a valid email
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(request: Request) {
  try {
    // Authenticate internal API calls
    const authHeader = request.headers.get('authorization');
    const internalSecret = process.env.INTERNAL_API_SECRET;
    if (internalSecret && authHeader !== `Bearer ${internalSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId, title, message, url } = body;

    if (!userId || !title || !message) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }
    const { data: subs, error } = await supabaseAdmin
      .from('push_subscription')
      .select('*')
      .eq('user_id', userId);

    if (error || !subs) {
      console.error('Failed to fetch subscriptions:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    const payload = JSON.stringify({
      title,
      body: message,
      url: url || '/',
      icon: '/icon.svg'
    });

    const sendPromises = subs.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          auth: sub.auth_key,
          p256dh: sub.p256dh_key
        }
      };

      try {
        await webpush.sendNotification(pushSubscription, payload);
      } catch (err: any) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          // Subscription has expired or is no longer valid
          console.log('Subscription expired. Deleting from database...');
          await supabaseAdmin.from('push_subscription').delete().eq('id', sub.id);
        } else {
          console.error('Error sending push notification:', err);
        }
      }
    });

    await Promise.all(sendPromises);

    return NextResponse.json({ success: true, sentCount: subs.length });
  } catch (error) {
    console.error('Push send error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
