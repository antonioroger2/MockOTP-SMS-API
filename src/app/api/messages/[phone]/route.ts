// src/app/api/messages/[phone]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { type Message } from '@/app/types';

function sanitizePhoneNumber(phone: string) {
  return phone.replace(/[^a-zA-Z0-9+]/g, '');
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
) {
  try {
    // In Next.js 15+, params is a Promise
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

      // 1. Support Standard Simulator Format (Array of messages)
      if (data.messages && Array.isArray(data.messages)) {
        return NextResponse.json(data.messages);
      }

      // 2. Support Your Server's Format (Single string 'sim_message')
      // Server writes: { sim_message: "123456 is your OTP.", expires_at: ... }
      if (data.sim_message && typeof data.sim_message === 'string') {
        
        // Extract the code (assumes format "123456 is your OTP.")
        const code = data.sim_message.split(' ')[0] || '------';
        
        // Estimate timestamp (ExpiresAt - 5 minutes, or just current time)
        // Defaulting to current time for simplicity in display
        const timestamp = Date.now(); 

        const syntheticMessage: Message = {
          id: 'latest-otp-generated', // Static ID as we only have one
          text: data.sim_message,
          type: 'otp',
          timestamp: timestamp,
          data: {
            code: code,
            validity: '5 minutes'
          }
        };

        // Return as an array so the UI dashboard can map over it
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
