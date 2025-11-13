import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { type Message, type MessageDocument } from '@/app/types';

function sanitizePhoneNumber(phone: string) {
  return phone.replace(/[^a-zA-Z0-9+]/g, '');
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
) {
  try {
    // Await params (Next.js 15 requirement)
    const { phone } = await params;
    
    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    const sanitizedPhone = sanitizePhoneNumber(phone);
    const docRef = doc(db, 'otp', sanitizedPhone);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();

      // 1. Check for the "Correct" Simulator Array Format
      if (data.messages && Array.isArray(data.messages)) {
        return NextResponse.json(data.messages);
      }

      // 2. ADAPTER: Handle the "Current Server" Format (sim_message string)
      // Your server writes: { sim_message: "123456 is your OTP.", expires_at: ... }
      if (data.sim_message && typeof data.sim_message === 'string') {
        
        // Extract the code (first 6 chars of the string)
        const code = data.sim_message.substring(0, 6);
        
        // Calculate timestamp (Server sets expires_at to 5 mins in future)
        // We assume created_at was 5 mins (300 seconds) ago relative to expiry
        const expiresAtSeconds = data.expires_at || (Date.now() / 1000 + 300);
        const timestampMs = (expiresAtSeconds - 300) * 1000;

        // Create a fake Message object that the UI expects
        const syntheticMessage: Message = {
          id: 'latest-otp', // Static ID since we only have one
          text: data.sim_message,
          type: 'otp',
          timestamp: timestampMs,
          data: {
            code: code,
            validity: '5 minutes'
          }
        };

        // Return it as an array
        return NextResponse.json([syntheticMessage]);
      }

      return NextResponse.json([]);
    } else {
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('Error fetching messages:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to fetch messages', details: errorMessage },
      { status: 500 }
    );
  }
}
