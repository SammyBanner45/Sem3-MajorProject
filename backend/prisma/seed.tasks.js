const prisma = require('../src/lib/prisma');
const activities = require('../src/data/activities.json');
const challenges = require('../src/data/challenges.json');

/**
 * Generates midnight UTC representing start of day (00:00:00) in Asia/Kolkata timezone.
 * Asia/Kolkata is UTC+05:30.
 */
function getKolkataDate(offsetDays = 0) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.format(new Date()).split('-');
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10) + offsetDays;

  return new Date(Date.UTC(y, m, d, 0, 0, 0) - (5.5 * 60 * 60 * 1000));
}

async function seedTasks() {
  console.log('Seeding activities...');
  for (const activity of activities) {
    const existing = await prisma.task.findFirst({
      where: {
        title: activity.title,
        type: 'activity'
      }
    });

    if (!existing) {
      await prisma.task.create({
        data: {
          title: activity.title,
          description: activity.description,
          type: 'activity',
          points: activity.points,
          challengeDate: null
        }
      });
    }
  }

  console.log('Seeding daily challenges for the next 30 days (Asia/Kolkata)...');
  for (let i = 0; i < 30; i++) {
    const challengeDate = getKolkataDate(i);
    const nextDay = new Date(challengeDate.getTime() + 24 * 60 * 60 * 1000);
    const challengeTemplate = challenges[i % challenges.length];

    const existing = await prisma.task.findFirst({
      where: {
        type: 'challenge',
        challengeDate: {
          gte: challengeDate,
          lt: nextDay
        }
      }
    });

    if (!existing) {
      await prisma.task.create({
        data: {
          title: challengeTemplate.title,
          description: challengeTemplate.description,
          type: 'challenge',
          points: challengeTemplate.points,
          challengeDate
        }
      });
    }
  }

  console.log('Task seeding completed successfully.');
}

if (require.main === module) {
  seedTasks()
    .catch((error) => {
      console.error('Error seeding tasks:', error);
      process.exitCode = 1;
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { seedTasks, getKolkataDate };
