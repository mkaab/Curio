import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Rate Limit: Max 5 verification attempts per 5 minutes per user
    const rateLimitResult = rateLimit(`cnic-verify-${user.id}`, 5, 5 * 60 * 1000);
    if (!rateLimitResult.success) {
      return NextResponse.json({ 
        success: false, 
        error: "Too many verification attempts. Please wait 5 minutes before trying again." 
      }, { status: 429 });
    }

    // Block re-verification — once verified, CNIC cannot be changed
    const { data: existingUser } = await supabase
      .from('user')
      .select('verification_status')
      .eq('id', user.id)
      .single();

    if (existingUser?.verification_status === 'verified') {
      return NextResponse.json({ success: false, error: "Your identity is already verified." }, { status: 400 });
    }

    const body = await request.json();
    const { cnic } = body;

    // Pakistani CNIC format: 5 digits, optional separator, 7 digits, optional separator, 1 digit
    // e.g. 35202-1234567-1 or 3520212345671
    const cnicRegex = /(\d{5})[\s-]?(\d{7})[\s-]?(\d{1})/;
    const candidateString = (cnic || "").trim();
    const match = candidateString.match(cnicRegex);

    if (!match) {
      return NextResponse.json({ 
        success: false, 
        error: "Please enter a valid 13-digit Pakistani CNIC number (e.g. 35202-1234567-1)." 
      }, { status: 400 });
    }

    const formattedCnic = `${match[1]}-${match[2]}-${match[3]}`;
    
    // Update user in database
    const { error } = await supabase
      .from('user')
      .update({
        cnic_number: formattedCnic,
        verification_status: 'verified'
      })
      .eq('id', user.id);

    if (error) {
       console.error("DB Update Error:", error);
       if (error.code === '23505') {
         return NextResponse.json({
           success: false,
           error: "This CNIC is already registered to another account."
         }, { status: 400 });
       }
       throw error;
    }

    return NextResponse.json({ 
      success: true, 
      cnic: formattedCnic,
      message: "Identity verified successfully." 
    });

  } catch (error: any) {
    console.error("Verification Error:", error);
    return NextResponse.json({ success: false, error: "Internal server error during verification." }, { status: 500 });
  }
}

