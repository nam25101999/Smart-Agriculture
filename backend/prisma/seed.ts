import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding Smart Agriculture Database ---');

  // 1. Seed Roles
  const roles = [
    { code: 'SUPER_ADMIN', name: 'Quản trị viên toàn hệ thống', description: 'Toàn quyền quản trị hệ sinh thái Smart Agriculture' },
    { code: 'FARM_OWNER', name: 'Chủ nông trại', description: 'Toàn quyền sở hữu và quản lý một hoặc nhiều nông trại' },
    { code: 'FARM_MANAGER', name: 'Quản lý nông trại', description: 'Điều hành hoạt động, phân công công việc và theo dõi canh tác' },
    { code: 'TECHNICIAN', name: 'Kỹ thuật viên IoT', description: 'Cài đặt, bảo trì, cấu hình thiết bị ESP32 và cảm biến' },
    { code: 'FARM_WORKER', name: 'Nhân viên nông trại', description: 'Xem trạng thái, nhận việc và theo dõi cảnh báo' },
    { code: 'VIEWER', name: 'Người quan sát', description: 'Chỉ có quyền xem dữ liệu telemetry và báo cáo tổng quan' },
  ];

  for (const roleData of roles) {
    await prisma.role.upsert({
      where: { code: roleData.code },
      update: { name: roleData.name, description: roleData.description },
      create: roleData,
    });
  }
  console.log(`✓ Seeded ${roles.length} roles`);

  // 2. Seed Default Super Admin
  const adminEmail = 'admin@smartagri.vn';
  const superAdminRole = await prisma.role.findUnique({ where: { code: 'SUPER_ADMIN' } });

  if (superAdminRole) {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Admin@123456', salt);

    const adminUser = await prisma.user.upsert({
      where: { email: adminEmail },
      update: { fullName: 'Hệ thống Quản trị Smart Agriculture' },
      create: {
        email: adminEmail,
        passwordHash,
        fullName: 'Hệ thống Quản trị Smart Agriculture',
        phone: '0900000000',
        status: 'ACTIVE',
      },
    });

    await prisma.userRole.upsert({
      where: {
        userId_roleId: {
          userId: adminUser.id,
          roleId: superAdminRole.id,
        },
      },
      update: {},
      create: {
        userId: adminUser.id,
        roleId: superAdminRole.id,
      },
    });

    console.log(`✓ Seeded Default Super Admin: ${adminEmail} (Password: Admin@123456)`);
  }

  console.log('--- Seed Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Error during database seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

