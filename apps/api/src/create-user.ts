import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'creator@hdverse.com';
  const password = 'TestPass123!';
  const fullName = 'Test Creator';
  const phone = '+2348012345678';

  console.log('Checking for existing user...');
  
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { phone }] }
  });

  console.log('Hashing password...');
  const passwordHash = await bcrypt.hash(password, 12);

  if (existing) {
    console.log('Updating existing user details and verification status...');
    const updatedUser = await prisma.user.update({
      where: { id: existing.id },
      data: {
        email,
        phone,
        passwordHash,
        fullName,
        phoneVerified: true,
        kycStatus: 'VERIFIED',
        kycTier: 1,
      }
    });
    console.log('User updated successfully:', updatedUser.email);
    return;
  }

  console.log('Creating verified user...');
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName,
      phone,
      phoneVerified: true,
      kycStatus: 'VERIFIED',
      kycTier: 1,
    }
  });

  console.log('User created successfully:', user.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
