import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/firebase';
import {
  doc,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { type Message, type MessageDocument } from '@/app/types';
import { randomUUID } from 'crypto';

const otpSchema = z.object({
  code: z.string(),
  validity: z.string().default('5 minutes'),
});

const jobRequestSchema = z.object({
  role: z.string(),
  locality: z.string(),
  date: z.string(),
  time: z.string(),
  hours: z.number(),
  rate: z.number(),
  description: z.string(),
});

const bodySchema = z.object({
  to: z.string(),
  type: z.enum(['otp', 'job_request']),
  data: z.union([otpSchema, jobRequestSchema]),
});

function sanitizePhoneNumber(phone: string) {
  return phone.replace(/[^a-zA-Z0-9+]/g, '');
}

function formatMessage(
  type: 'otp' | 'job_request',
  data: any
): string {
  if (type === 'otp') {
    return `Your OTP for Kaarya is: ${data.code}. It is valid for ${data.validity}.`;
  }
  if (type === 'job_request') {
    return `New job request: ${data.role} at ${data.locality} on ${data.date} at ${data.time}. ${data.hours} hours at $${data.rate}/hr. Desc: ${data.description}.`;
  }
  return '';
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-secret-key');
  if (secret !== process.env.SMS_SIMULATOR_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const rawBody = await req.json();
    const parsedBody = bodySchema.safeParse(rawBody);

    if (!parsedBody.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: parsedBody.error.errors },
        { status: 400 }
      );
    }

    const { to, type, data } = parsedBody.data;
    const sanitizedPhone = sanitizePhoneNumber(to);
    const docRef = doc(db, 'otp', sanitizedPhone);

    const text = formatMessage(type, data);

    const newMessage: Message = {
      id: randomUUID(),
      text,
      type,
      data,
      timestamp: Date.now(),
    };

    await runTransaction(db, async (transaction) => {
      const sfDoc = await transaction.get(docRef);
      if (!sfDoc.exists()) {
        transaction.set(docRef, { messages: [newMessage] });
      } else {
        const existingData = sfDoc.data() as MessageDocument;
        const messages = existingData.messages || [];
        const newMessages = [newMessage, ...messages].slice(0, 10);
        transaction.update(docRef, { messages: newMessages });
      }
    });

    return NextResponse.json({
      success: true,
      message: 'SMS simulated successfully',
    });
  } catch (error) {
    console.error('Error sending SMS:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to send SMS', details: errorMessage },
      { status: 500 }
    );
  }
}
