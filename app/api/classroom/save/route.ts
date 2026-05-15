import { NextResponse } from 'next/server';
import { saveClassroom } from '@/lib/persistence/storage-service';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const result = await saveClassroom(data);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error saving classroom:', error);
    return NextResponse.json({ error: 'Failed to save classroom' }, { status: 500 });
  }
}
