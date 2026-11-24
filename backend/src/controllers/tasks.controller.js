const prisma = require('../lib/prisma');
const activitiesData = require('../data/activities.json');
const challengesData = require('../data/challenges.json');

// Precompute title-to-icon mapping to guarantee icon availability
const iconMap = new Map();
activitiesData.forEach((item) => iconMap.set(item.title, item.icon));
challengesData.forEach((item) => iconMap.set(item.title, item.icon));

function enrichTask(task) {
  if (!task) return null;
  return {
    ...task,
    icon: task.icon || iconMap.get(task.title) || '🌱'
  };
}

function getKolkataDayBounds() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.format(new Date()).split('-');
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);

  const startOfDay = new Date(Date.UTC(y, m, d, 0, 0, 0) - (5.5 * 60 * 60 * 1000));
  const endOfDay = new Date(Date.UTC(y, m, d + 1, 0, 0, 0) - (5.5 * 60 * 60 * 1000) - 1);
  return { startOfDay, endOfDay };
}

/**
 * GET /api/tasks?type=activity|challenge
 */
async function getTasks(req, res, next) {
  try {
    const { type } = req.query;
    const where = {};

    if (type) {
      if (type !== 'activity' && type !== 'challenge') {
        return res.status(400).json({ error: "type must be 'activity' or 'challenge'" });
      }
      where.type = type;
    }

    const tasks = await prisma.task.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });

    return res.json(tasks.map(enrichTask));
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/tasks/daily-challenge
 */
async function getDailyChallenge(req, res, next) {
  try {
    const { startOfDay, endOfDay } = getKolkataDayBounds();

    const challenge = await prisma.task.findFirst({
      where: {
        type: 'challenge',
        challengeDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    if (!challenge) {
      return res.status(404).json({ error: 'No daily challenge found for today' });
    }

    return res.json(enrichTask(challenge));
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getTasks,
  getDailyChallenge,
  getKolkataDayBounds,
  enrichTask
};
