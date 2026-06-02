"use server";

import { createClient } from "@/lib/supabase/server";

export async function joinWaitlist(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const phone = formData.get("phone") as string;

  if (!name || !email || !phone) {
    return { error: "All fields are required." };
  }

  const supabase = await createClient();
  
  const { error } = await supabase
    .from("waitlist")
    .insert({ name, email, phone_number: phone });

  if (error) {
    if (error.code === '23505') {
      return { error: "This email is already on the waitlist!" };
    }
    return { error: error.message || "Something went wrong. Please try again." };
  }

  return { success: true };
}

export async function getWaitlistCount() {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("waitlist")
    .select('*', { count: 'exact', head: true });
    
  if (error) {
    return 0;
  }
  
  return count || 0;
}
