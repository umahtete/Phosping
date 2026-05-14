import { NextResponse } from 'next/server';
import { saveClassroom, getClassroom } from '@/lib/persistence/storage-service';

export async function POST(req: Request) {
  const body = await req.json();
  try {
    const classroom = await saveClassroom(body);
    return NextResponse.json({ success: true, classroom });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to save classroom' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const classroom = await getClassroom(id);
  if (!classroom) return NextResponse.json({ error: 'Classroom not found' }, { status: 404 });
  
  return NextResponse.json({ success: true, classroom });
}
