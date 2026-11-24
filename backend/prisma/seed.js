const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const users = [
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222'
];

async function main() {
  for (const userId of users) {
    await prisma.profile.upsert({ where: { id: userId }, update: {}, create: { id: userId } });
    await prisma.userApp.createMany({ data: [
      { userId, name: 'Eco Ride', category: 'travel', icon: '🚲', url: 'https://example.com/eco-ride' },
      { userId, name: 'Green Grocery', category: 'grocery', icon: '🛒', url: 'https://example.com/green-grocery' }
    ] });
    await prisma.co2Log.createMany({ data: [
      { userId, type: 'travel', status: 'logged', co2Kg: 1.25, distanceKm: 8, details: { vehicle: 'bus', seed: true }, loggedAt: new Date() },
      { userId, type: 'food', status: 'pending_log', co2Kg: 0, details: { items: 2, isVeg: true, seed: true } }
    ] });
  }
}

main()
  .catch((error) => { console.error(error); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
