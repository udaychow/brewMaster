import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@brewmaster.ai' },
    update: {},
    create: {
      email: 'admin@brewmaster.ai',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN',
    },
  });

  // Create sample brewer
  const brewerPassword = await bcrypt.hash('brewer123', 10);
  const brewer = await prisma.user.upsert({
    where: { email: 'brewer@brewmaster.ai' },
    update: {},
    create: {
      email: 'brewer@brewmaster.ai',
      password: brewerPassword,
      firstName: 'John',
      lastName: 'Brewer',
      role: 'BREWER',
    },
  });

  // Create sample recipe
  const recipe = await prisma.recipe.upsert({
    where: { name: 'American IPA' },
    update: {},
    create: {
      name: 'American IPA',
      style: 'IPA',
      description: 'A hoppy American IPA with citrus and pine notes',
      targetVolume: 500,
      targetABV: 6.5,
      targetIBU: 65,
      grainBill: {
        'Pale Malt': '85%',
        'Crystal 60': '10%',
        'Munich': '5%'
      },
      hopSchedule: {
        '60min': 'Magnum 20g',
        '10min': 'Centennial 30g',
        '5min': 'Citra 40g',
        'Dry Hop': 'Simcoe 50g'
      },
      yeastStrain: 'Safale US-05',
      fermentationTemp: 18.5,
      estimatedDays: 14,
    },
  });

  // Create sample batch
  const batch = await prisma.batch.upsert({
    where: { batchNumber: 'BATCH-001' },
    update: {},
    create: {
      batchNumber: 'BATCH-001',
      recipeId: recipe.id,
      brewerId: brewer.id,
      status: 'PLANNED',
      plannedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Next week
      volume: 500,
      notes: 'First test batch of American IPA',
    },
  });

  // Create sample suppliers
  const hopsSupplier = await prisma.supplier.upsert({
    where: { name: 'Premium Hops Co.' },
    update: {},
    create: {
      name: 'Premium Hops Co.',
      contactName: 'Sarah Hopkins',
      email: 'orders@premiumhops.com',
      phone: '+1-555-0101',
      address: '123 Hop Farm Rd, Yakima, WA 98901',
      leadTime: 7,
    },
  });

  const grainSupplier = await prisma.supplier.upsert({
    where: { name: 'Artisan Malts' },
    update: {},
    create: {
      name: 'Artisan Malts',
      contactName: 'Mike Grainer',
      email: 'sales@artisanmalts.com',
      phone: '+1-555-0102',
      address: '456 Barley Lane, Denver, CO 80202',
      leadTime: 14,
    },
  });

  // Create sample ingredients
  const ingredients = [
    {
      name: 'Pale Malt',
      category: 'GRAIN',
      unit: 'kg',
      currentStock: 1000,
      minimumStock: 100,
      reorderPoint: 200,
      costPerUnit: 2.50,
      supplierId: grainSupplier.id,
    },
    {
      name: 'Centennial Hops',
      category: 'HOPS',
      unit: 'g',
      currentStock: 5000,
      minimumStock: 500,
      reorderPoint: 1000,
      costPerUnit: 0.05,
      supplierId: hopsSupplier.id,
    },
    {
      name: 'Citra Hops',
      category: 'HOPS',
      unit: 'g',
      currentStock: 3000,
      minimumStock: 500,
      reorderPoint: 1000,
      costPerUnit: 0.06,
      supplierId: hopsSupplier.id,
    },
    {
      name: 'Safale US-05',
      category: 'YEAST',
      unit: 'pack',
      currentStock: 50,
      minimumStock: 10,
      reorderPoint: 20,
      costPerUnit: 4.99,
      supplierId: null,
    },
  ];

  for (const ingredient of ingredients) {
    await prisma.ingredient.upsert({
      where: { name: ingredient.name },
      update: {},
      create: ingredient as any,
    });
  }

  // Create sample customer
  const customer = await prisma.customer.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      firstName: 'Jane',
      lastName: 'Beer Lover',
      phone: '+1-555-0123',
      loyaltyPoints: 150,
      preferences: {
        favoriteStyles: ['IPA', 'Stout'],
        allergies: [],
      },
    },
  });

  // Create sample licenses
  await prisma.license.upsert({
    where: { licenseNumber: 'BRW-2024-001' },
    update: {},
    create: {
      licenseNumber: 'BRW-2024-001',
      type: 'BREWERY_LICENSE',
      issuingAuthority: 'State Alcohol Control Board',
      issueDate: new Date('2024-01-01'),
      expiryDate: new Date('2024-12-31'),
      status: 'ACTIVE',
      renewalReminder: new Date('2024-11-01'),
      notes: 'Annual brewery operation license',
    },
  });

  await prisma.license.upsert({
    where: { licenseNumber: 'TTB-2024-001' },
    update: {},
    create: {
      licenseNumber: 'TTB-2024-001',
      type: 'TTB_PERMIT',
      issuingAuthority: 'TTB Federal',
      issueDate: new Date('2024-01-15'),
      expiryDate: new Date('2026-01-15'),
      status: 'ACTIVE',
      renewalReminder: new Date('2025-11-15'),
      notes: 'Federal brewing permit',
    },
  });

  // Create sample transactions
  await prisma.transaction.create({
    data: {
      transactionNumber: 'TXN-001',
      type: 'EXPENSE',
      category: 'Ingredients',
      amount: 750.00,
      date: new Date(),
      description: 'Monthly ingredient order',
      paymentMethod: 'Bank Transfer',
      referenceId: 'ORDER-001',
    },
  });

  await prisma.transaction.create({
    data: {
      transactionNumber: 'TXN-002',
      type: 'INCOME',
      category: 'Beer Sales',
      amount: 2500.00,
      date: new Date(),
      description: 'Taproom sales - weekend',
      paymentMethod: 'Mixed',
      referenceId: 'SALES-001',
    },
  });

  console.log('✅ Database seeded successfully');
  console.log('🔐 Admin login: admin@brewmaster.ai / admin123');
  console.log('👨‍🍺 Brewer login: brewer@brewmaster.ai / brewer123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });