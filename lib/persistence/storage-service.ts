import { prisma } from './prisma-client';

export async function saveClassroom(data: { id: string; stage: any; scenes: any; outlines: any }) {
  return await prisma.classroom.upsert({
    where: { id: data.id },
    update: { stage: data.stage, scenes: data.scenes, outlines: data.outlines },
    create: { id: data.id, stage: data.stage, scenes: data.scenes, outlines: data.outlines },
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
