// We use a global variable to instantiate the Prisma client only once on the server side.
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

// Lazy proxy — creates PrismaClient only on first property access.
// This prevents DB connection attempts during Next.js build-time module evaluation.
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop: string | symbol) {
    return Reflect.get(getClient(), prop);
  },
});

export { createPrismaClient };
