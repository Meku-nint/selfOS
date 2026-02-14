import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

export const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['query'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function initializeDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Create default categories
    const defaultCategories = [
      { name: 'Work', color: '#3b82f6', icon: 'briefcase' },
      { name: 'Personal', color: '#10b981', icon: 'user' },
      { name: 'Health', color: '#f59e0b', icon: 'heart' },
      { name: 'Learning', color: '#8b5cf6', icon: 'book' },
      { name: 'Shopping', color: '#ef4444', icon: 'cart' },
    ];

    for (const category of defaultCategories) {
      await prisma.category.upsert({
        where: { name: category.name },
        update: {},
        create: category,
      });
    }
    
    console.log('✅ Default categories initialized');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}

export async function closeDatabase() {
  await prisma.$disconnect();
}
