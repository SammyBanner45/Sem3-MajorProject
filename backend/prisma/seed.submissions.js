const fs = require('fs');
const path = require('path');
const prisma = require('../src/lib/prisma');

const SAMPLE_USER_ID = '11111111-1111-4111-8111-111111111111';
const SAMPLE_ADMIN_ID = '99999999-9999-4999-8999-999999999999';

// Ensure sample photo files exist in backend/src/uploads/
function ensureSamplePhotos() {
  const uploadsDir = path.join(__dirname, '../src/uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const sampleFiles = [
    'sample-pending.jpg',
    'sample-approved.jpg',
    'sample-rejected.jpg'
  ];

  for (const filename of sampleFiles) {
    const filePath = path.join(uploadsDir, filename);
    if (!fs.existsSync(filePath)) {
      // 1x1 dummy JPEG header bytes
      const dummyJpg = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
        0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43,
        0x00, 0xff, 0xd9
      ]);
      fs.writeFileSync(filePath, dummyJpg);
    }
  }
}

async function seedSubmissions() {
  console.log('Ensuring sample upload files exist...');
  ensureSamplePhotos();

  console.log('Ensuring sample user and admin profiles exist...');
  // Upsert sample regular user
  await prisma.profile.upsert({
    where: { id: SAMPLE_USER_ID },
    update: {},
    create: {
      id: SAMPLE_USER_ID,
      email: 'user@example.com',
      passwordHash: '$2a$10$abcdefghijklmnopqrstuv',
      displayName: 'Eco Pioneer',
      role: 'user'
    }
  });

  // Upsert sample admin user
  await prisma.profile.upsert({
    where: { id: SAMPLE_ADMIN_ID },
    update: {},
    create: {
      id: SAMPLE_ADMIN_ID,
      email: 'admin@example.com',
      passwordHash: '$2a$10$abcdefghijklmnopqrstuv',
      displayName: 'Admin Officer',
      role: 'admin'
    }
  });

  // Ensure tasks exist to link submissions to
  let tasks = await prisma.task.findMany({ take: 3 });
  if (tasks.length === 0) {
    console.log('No tasks found, creating baseline tasks...');
    const t1 = await prisma.task.create({
      data: {
        title: 'Bicycle Commute',
        description: 'Cycle to work or school.',
        type: 'activity',
        points: 20
      }
    });
    const t2 = await prisma.task.create({
      data: {
        title: 'Proper Garbage Disposal',
        description: 'Segregate waste responsibly.',
        type: 'activity',
        points: 15
      }
    });
    const t3 = await prisma.task.create({
      data: {
        title: 'Zero Single-Use Plastic Day',
        description: 'Avoid single-use plastic all day.',
        type: 'challenge',
        points: 50,
        challengeDate: new Date()
      }
    });
    tasks = [t1, t2, t3];
  }

  console.log('Seeding submissions across all 3 statuses (pending, approved, rejected)...');

  // Sample pending submission (oldest created)
  const pendingPhoto = 'uploads/sample-pending.jpg';
  const existingPending = await prisma.submission.findFirst({
    where: { photoUrl: pendingPhoto }
  });
  if (!existingPending) {
    await prisma.submission.create({
      data: {
        userId: SAMPLE_USER_ID,
        taskId: tasks[0].id,
        photoUrl: pendingPhoto,
        status: 'pending',
        createdAt: new Date(Date.now() - 3 * 3600 * 1000) // 3 hours ago
      }
    });
  }

  // Sample approved submission
  const approvedPhoto = 'uploads/sample-approved.jpg';
  const existingApproved = await prisma.submission.findFirst({
    where: { photoUrl: approvedPhoto }
  });
  if (!existingApproved) {
    await prisma.submission.create({
      data: {
        userId: SAMPLE_USER_ID,
        taskId: tasks[1].id,
        photoUrl: approvedPhoto,
        status: 'approved',
        reviewedAt: new Date(Date.now() - 1 * 3600 * 1000),
        reviewedBy: SAMPLE_ADMIN_ID,
        createdAt: new Date(Date.now() - 5 * 3600 * 1000)
      }
    });
  }

  // Sample rejected submission
  const rejectedPhoto = 'uploads/sample-rejected.jpg';
  const existingRejected = await prisma.submission.findFirst({
    where: { photoUrl: rejectedPhoto }
  });
  if (!existingRejected) {
    await prisma.submission.create({
      data: {
        userId: SAMPLE_USER_ID,
        taskId: tasks[2] ? tasks[2].id : tasks[0].id,
        photoUrl: rejectedPhoto,
        status: 'rejected',
        reviewedAt: new Date(Date.now() - 30 * 60 * 1000),
        reviewedBy: SAMPLE_ADMIN_ID,
        rejectionReason: 'Photo is too blurry and does not clearly show the completed activity.',
        createdAt: new Date(Date.now() - 2 * 3600 * 1000)
      }
    });
  }

  console.log('Sample submissions seeded successfully.');
}

if (require.main === module) {
  seedSubmissions()
    .catch((error) => {
      console.error('Error seeding submissions:', error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { seedSubmissions };
