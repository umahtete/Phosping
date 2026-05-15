import { createPrismaClient } from './prisma-client';
import type { SaveClassroomData } from './storage-service';

export async function saveClassroom(data: SaveClassroomData) {
  const prisma = createPrismaClient();
  try {
    const { id, stage, scenes, outlines, title, status, userId, ltiContextId } = data;
    return await prisma.classroom.upsert({
      where: { id },
      update: {
        stage,
        scenes,
        ...(outlines !== undefined && { outlines }),
        ...(title !== undefined && { title }),
        ...(status !== undefined && { status }),
        ...(userId !== undefined && { userId }),
        ...(ltiContextId !== undefined && { ltiContextId }),
      },
      create: {
        id,
        stage,
        scenes,
        outlines: outlines ?? {},
        title: title ?? null,
        status: status ?? 'active',
        userId: userId ?? null,
        ltiContextId: ltiContextId ?? null,
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}

export async function getClassroom(id: string) {
  const prisma = createPrismaClient();
  try {
    return await prisma.classroom.findUnique({ where: { id } });
  } finally {
    await prisma.$disconnect();
  }
}
