const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash('admin123456', 10);
  await prisma.user.upsert({
    where: { email: 'admin@flexedu.com' },
    update: {},
    create: {
      email: 'admin@flexedu.com',
      password: adminPassword,
      name: 'System Admin',
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log('✅ Admin account created: admin@flexedu.com / admin123456');
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await prisma.$disconnect());