import { prisma } from './prisma-client';

export interface SaveClassroomData {
  id: string;
  stage: any;
  scenes: any;
  outlines?: any;
  title?: string;
  status?: string;
  userId?: string;
  ltiContextId?: string;
}

export async function saveClassroom(data: SaveClassroomData) {
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
}

export async function clearAllClassrooms() {
  return await prisma.classroom.deleteMany();
}

export async function getClassroom(id: string) {
  return await prisma.classroom.findUnique({
    where: { id },
  });
}

export async function listClassrooms(options?: { userId?: string; status?: string }) {
  return await prisma.classroom.findMany({
    where: {
      ...(options?.userId && { userId: options.userId }),
      ...(options?.status && { status: options.status }),
    },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      title: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      userId: true,
    },
  });
}
