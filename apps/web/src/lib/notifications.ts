import { SupabaseClient } from "@supabase/supabase-js";

export async function createNotification(
  supabase: SupabaseClient,
  userId: string,
  type: 'offer_received' | 'order_accepted' | 'order_shipped' | 'order_received' | 'review_left' | 'dispute_opened',
  message: string,
  link: string
) {
  try {
    await supabase.from("notification").insert({
      user_id: userId,
      type,
      message,
      link,
      is_read: false,
      created_at: new Date().toISOString()
    });

    // Fire and forget push notification
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    fetch(`${appUrl}/api/push/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        title: 'Curio',
        message,
        url: link
      })
    }).catch(e => console.error('Failed to trigger push API:', e));

  } catch (err) {
    console.error("Failed to create notification:", err);
  }
}
