import { NextResponse } from 'next/server';
import { prisma } from '@/lib/persistence/prisma-client';

/** Extract a readable title from the stage JSON when the title column is null. */
function deriveTitle(stage: unknown, id: string): string {
  if (!stage || typeof stage !== 'object') return id;
  const s = stage as Record<string, unknown>;
  // stage.name is set during generation: outlines[0]?.title || requirement.slice(0,50)
  if (typeof s.name === 'string' && s.name.trim()) return s.name.trim();
  return id;
}

export async function GET() {
  try {
    const classrooms = await prisma.classroom.findMany({
      where: { status: 'active' },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        stage: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const enriched = classrooms.map((c) => ({
      id: c.id,
      title: c.title || deriveTitle(c.stage, c.id),
      status: c.status,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));

    return NextResponse.json({ success: true, classrooms: enriched });
  } catch (error) {
    console.error('Failed to list classrooms:', error);
    return NextResponse.json(
      { error: 'Failed to list classrooms' },
      { status: 500 },
    );
  }
}
