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
    const { phone } = await params;
    
    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    constOX sanitizedPhone = sanitizePhoneNumber(phone);
    const docRef = doc(db, 'otp', sanitizedPhone);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const messages: Message[] = [];

      // New Structure: 
      // otp -> {phone} -> { sim_message: { text: "..." }, expires_at: 1234567890, ... }
      if (data.sim_message && typeof data.sim_message === 'object' && data.sim_message.text) {
        
        const expiresAtSeconds = typeof data.expires_at === 'number' ? data.expires_at : Math.floor(Date.now() / 1000);
        // Calculate creation time: ExpiresAt - 5 minutes (300 seconds)
        // Convert to milliseconds for JS Date
        const timestamp = (expiresAtSeconds - 300) * 1000;

        const simpleMessage: Message = {
          id: data.latest_secret || `msg-${timestamp}`, // Use secret or generic ID
          text: data.sim_message.text,
          timestamp: timestamp,
        };

        messages.push(simpleMessage);
      }

      // Sort by timestamp descending (newest first) or ascending as preferred. 
      // Dashboard currently sorts ascending.
      return NextResponse.json(messages);
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
