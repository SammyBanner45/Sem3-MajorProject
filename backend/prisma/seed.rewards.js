require('dotenv').config();
const prisma = require('../src/lib/prisma');
const rewards = [
  { brand: 'Campus Cafe', title: '₹50 off', description: 'A demo campus cafe voucher (demo)', kind: 'voucher', cost: 10, stock: 20, icon: '☕', terms: 'Valid at the demo Campus Cafe.', validDays: 30 },
  { brand: 'Reel Cinema', title: '₹100 off', description: 'A demo cinema voucher (demo)', kind: 'voucher', cost: 20, stock: 15, icon: '🎬', terms: 'Valid at the demo Reel Cinema.', validDays: 30 },
  { brand: 'Eco Tote Co.', title: 'Jute bag', description: 'A demo reusable physical reward (demo)', kind: 'physical', cost: 30, stock: 5, icon: '👜', terms: 'Collect from the demo Eco Tote Co. desk.', validDays: 30 },
  { brand: 'Green Roots', title: 'Sponsor a tree', description: 'A demo tree donation (demo)', kind: 'donation', cost: 50, stock: 10, icon: '🌳', terms: 'Donation is a demo impact record.', validDays: 30 }
];

async function main() { await prisma.reward.createMany({ data: rewards }); }
main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
