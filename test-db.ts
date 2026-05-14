import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

async function testConnection() {
  try {
    const connectionString = process.env.DATABASE_URL;
    console.log('Connecting with Pool to:', connectionString);
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    await prisma.$connect();
    console.log('Successfully connected via Adapter!');
    await prisma.$disconnect();
  } catch (error) {
    console.error('Connection failed:', error);
  }
}

testConnection();
