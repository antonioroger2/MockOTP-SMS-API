import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { type Message, type MessageDocument } from '@/app/types';

function sanitizePhoneNumber(phone: string) {
  return phone.replace(/[^a-zA-Z0-9+]/g, '');
}

export async function GET(
  req: NextRequest,
  { params }: { params: { phone: string } }
) {
  try {
    const phone = params.phone;
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
      const data = docSnap.data() as MessageDocument;
      // The messages are already stored in descending order of timestamp
      return NextResponse.json(data.messages || []);
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
