import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export async function saveClassroom(data: any) {
  return await prisma.classroom.upsert({
    where: { id: data.id },
    update: { stage: data.stage, scenes: data.scenes, outlines: data.outlines },
    create: { id: data.id, stage: data.stage, scenes: data.scenes, outlines: data.outlines },
  });
}
export async function getClassroom(id: string) {
  return await prisma.classroom.findUnique({ where: { id } });
}
