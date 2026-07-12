import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Tesseract from 'tesseract.js';
import { rateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Rate Limit: Max 3 OCR attempts per 5 minutes per user
    const rateLimitResult = rateLimit(`cnic-verify-${user.id}`, 3, 5 * 60 * 1000);
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
    const { imageBase64 } = body;

    if (!imageBase64) {
      return NextResponse.json({ success: false, error: "No image provided." }, { status: 400 });
    }

    // Initialize Tesseract and extract text
    // Tesseract handles base64 data URIs automatically
    const { data: { text } } = await Tesseract.recognize(
      imageBase64,
      'eng',
      { logger: m => console.log(m) }
    );

    console.log("OCR Extracted Text:", text);

    // Regex to match Pakistani CNIC: 5 digits, optional hyphen/space, 7 digits, optional hyphen/space, 1 digit
    // e.g. 35202-1234567-1 or 35202 1234567 1
    const cnicRegex = /(\d{5})[\s-]?(\d{7})[\s-]?(\d{1})/;
    const match = text.match(cnicRegex);

    if (match) {
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
         throw error;
      }

      return NextResponse.json({ 
        success: true, 
        cnic: formattedCnic,
        message: "Identity verified successfully." 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: "Could not detect a valid CNIC number. Please ensure the image is clear, well-lit, and the ID is fully visible." 
      }, { status: 400 });
    }

  } catch (error: any) {
    console.error("OCR Error:", error);
    return NextResponse.json({ success: false, error: "Internal server error during verification." }, { status: 500 });
  }
}
