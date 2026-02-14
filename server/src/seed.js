import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default categories
  const categories = [
    { name: 'Work', color: '#3b82f6', icon: 'briefcase' },
    { name: 'Personal', color: '#10b981', icon: 'user' },
    { name: 'Health', color: '#f59e0b', icon: 'heart' },
    { name: 'Learning', color: '#8b5cf6', icon: 'book' },
    { name: 'Shopping', color: '#ef4444', icon: 'cart' },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: category,
      create: category,
    });
  }

  console.log('✅ Categories seeded successfully');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
