const { randomBytes } = require('node:crypto');
const { getMyStreak, kolkataDateKey } = require('./streak.service');

const FIXED_MILESTONES = [7, 15, 30];
const SERIALIZATION_RETRIES = 4;

function getEligibleMilestones(currentStreak) {
  if (!Number.isInteger(currentStreak) || currentStreak < 0) {
    throw new TypeError('Current streak must be a non-negative integer.');
  }

  const milestones = FIXED_MILESTONES.filter((milestone) => milestone <= currentStreak);
  for (let milestone = 60; milestone <= currentStreak; milestone += 60) {
    milestones.push(milestone);
  }
  return milestones;
}

function createCouponCode() {
  return `ECO-${randomBytes(8).toString('hex').toUpperCase()}`;
}

async function findCouponTemplate(tx, milestoneDay) {
  const fixed = await tx.coupon.findFirst({
    where: { milestoneDays: milestoneDay, isRecurring: false },
    orderBy: { createdAt: 'asc' },
  });
  if (fixed) return fixed;

  if (milestoneDay >= 60) {
    const recurring = await tx.coupon.findFirst({
      where: { milestoneDays: 60, isRecurring: true },
      orderBy: { createdAt: 'asc' },
    });
    if (recurring) return recurring;
  }

  return tx.coupon.findFirst({
    where: { milestoneDays: milestoneDay },
    orderBy: { createdAt: 'asc' },
  });
}

async function findExistingCoupon(prisma, userId, milestoneDay) {
  return prisma.userCoupon.findFirst({
    where: { userId, milestoneDay },
    include: { coupon: true },
  });
}

function addKolkataDays(dayKey, amount) {
  const [year, month, day] = dayKey.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + amount));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
}

function getHistoricalMilestones(submissions) {
  if (!Array.isArray(submissions)) throw new TypeError('Approved submissions must be an array.');
  const dayKeys = new Set();
  for (const submission of submissions) {
    const day = kolkataDateKey(submission?.createdAt);
    if (!day) throw new TypeError('Approved submission has an invalid createdAt date.');
    dayKeys.add(day);
  }

  let longestRun = 0;
  let run = 0;
  let previous = null;
  for (const day of [...dayKeys].sort()) {
    run = previous === null || day === addKolkataDays(previous, 1) ? run + 1 : 1;
    longestRun = Math.max(longestRun, run);
    previous = day;
  }
  return getEligibleMilestones(longestRun);
}

async function awardMilestoneInTransaction(tx, userId, milestoneDay, codeFactory = createCouponCode) {
  const existing = await tx.userCoupon.findFirst({
    where: { userId, milestoneDay },
    include: { coupon: true },
  });
  if (existing) return existing;

  const template = await findCouponTemplate(tx, milestoneDay);
  return tx.userCoupon.create({
    data: { userId, couponId: template?.id ?? null, milestoneDay, code: codeFactory() },
    include: { coupon: true },
  });
}

async function awardMilestone(prisma, userId, milestoneDay, codeFactory = createCouponCode) {
  for (let attempt = 0; attempt < SERIALIZATION_RETRIES; attempt += 1) {
    try {
      return await prisma.$transaction(
        (tx) => awardMilestoneInTransaction(tx, userId, milestoneDay, codeFactory),
        { isolationLevel: 'Serializable' },
      );
    } catch (error) {
      if (error?.code !== 'P2034' && error?.code !== 'P2002') throw error;

      // A serializable retry either observes the concurrent award or retries
      // after an unrelated generated-code collision.
      const existing = await findExistingCoupon(prisma, userId, milestoneDay);
      if (existing) return existing;
      if (attempt === SERIALIZATION_RETRIES - 1) throw error;
    }
  }

  throw new Error('Could not award the milestone coupon.');
}

async function awardHistoricalMilestonesInTransaction(tx, userId, codeFactory = createCouponCode) {
  const submissions = await tx.submission.findMany({
    where: { userId, status: 'approved' },
    select: { createdAt: true },
  });
  const milestones = getHistoricalMilestones(submissions);
  for (const milestoneDay of milestones) {
    await awardMilestoneInTransaction(tx, userId, milestoneDay, codeFactory);
  }
  return milestones;
}

async function recoverHistoricalMilestones(prisma, userId, { codeFactory = createCouponCode } = {}) {
  const submissions = await prisma.submission.findMany({
    where: { userId, status: 'approved' },
    select: { createdAt: true },
  });
  const milestones = getHistoricalMilestones(submissions);
  for (const milestoneDay of milestones) {
    await awardMilestone(prisma, userId, milestoneDay, codeFactory);
  }
  return milestones;
}

function mapCoupon(userCoupon) {
  const milestoneDay = userCoupon.milestoneDay;
  const coupon = userCoupon.coupon;
  return {
    code: userCoupon.code,
    milestoneDay,
    awardedAt: userCoupon.awardedAt,
    isRedeemed: userCoupon.isRedeemed,
    title: coupon?.title || `${milestoneDay}-Day Streak Reward`,
    description: coupon?.description || 'An EcoSync demo reward for your streak milestone.',
    discount: coupon?.discount || 'Demo reward code — not a partner discount.',
  };
}

async function getMyCoupons(prisma, userId, { now = new Date(), codeFactory = createCouponCode } = {}) {
  const streak = await getMyStreak(prisma, userId, now);
  await recoverHistoricalMilestones(prisma, userId, { codeFactory });

  const userCoupons = await prisma.userCoupon.findMany({
    where: { userId },
    include: { coupon: true },
    orderBy: [{ milestoneDay: 'asc' }, { awardedAt: 'asc' }],
  });

  return {
    currentStreak: streak.currentStreak,
    coupons: userCoupons.map(mapCoupon),
  };
}

module.exports = {
  FIXED_MILESTONES,
  getEligibleMilestones,
  getHistoricalMilestones,
  createCouponCode,
  awardMilestoneInTransaction,
  awardMilestone,
  awardHistoricalMilestonesInTransaction,
  recoverHistoricalMilestones,
  getMyCoupons,
};
