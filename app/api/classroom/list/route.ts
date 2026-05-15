import { NextResponse } from 'next/server';
import { prisma } from '@/lib/persistence/prisma-client';

export async function GET() {
  try {
    const classrooms = await prisma.classroom.findMany({
      where: { status: 'active' },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ success: true, classrooms });
  } catch (error) {
    console.error('Failed to list classrooms:', error);
    return NextResponse.json(
      { error: 'Failed to list classrooms' },
      { status: 500 },
    );
  }
}
