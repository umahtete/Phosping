import { createPrismaClient } from './prisma-client';

export async function saveClassroom(data: any) {
  const prisma = createPrismaClient();
  try {
    return await prisma.classroom.upsert({
      where: { id: data.id },
      update: { stage: data.stage, scenes: data.scenes, outlines: data.outlines },
      create: { id: data.id, stage: data.stage, scenes: data.scenes, outlines: data.outlines },
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
