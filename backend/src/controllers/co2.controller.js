const factors = require('../../../frontend/src/data/emissionFactors.json');
const prisma = require('../lib/prisma');
const { calculateFood, calculateGrocery, calculateSavings, calculateTravel } = require('../services/co2Calculator');
const { awardWithinDailyCap, canAddTravelLog, foodPoints, isDuplicateTrip, kolkataDayBounds } = require('../services/co2Rules');
const { getDistance, searchPlaces } = require('../services/distance');

const vehicles = Object.keys(factors.travel);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requireString(value, name) {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${name} is required`);
  return value.trim();
}

function requireBoolean(value, name) {
  if (typeof value !== 'boolean') throw new TypeError(`${name} must be a boolean`);
  return value;
}

function validateTravel(body) {
  const origin = requireString(body?.origin, 'origin');
  const destination = requireString(body?.destination, 'destination');
  const selectedVehicle = body?.chosenVehicle || body?.vehicle;
  if (selectedVehicle !== undefined && !vehicles.includes(selectedVehicle)) throw new TypeError('Invalid vehicle');
  return { origin, destination, vehicle: selectedVehicle };
}

async function resolveTravel(body) {
  const request = validateTravel(body);
  const distance = await getDistance(request.origin, request.destination);
  const emissions = Object.fromEntries(vehicles.map((vehicle) => [vehicle, calculateTravel(distance.distanceKm, vehicle)]));
  return { ...request, ...distance, emissions };
}

async function estimateTravel(req, res, next) {
  try { return res.json(await resolveTravel(req.body)); } catch (error) { return next(error); }
}

async function saveTravel(req, res, next) {
  try {
    const result = await resolveTravel(req.body);
    if (!result.vehicle) throw new TypeError('vehicle is required');
    const savings = calculateSavings(result.vehicle, result.distanceKm);
    const { start, end } = kolkataDayBounds();
    const [todayLogs, recentTrips] = await Promise.all([
      prisma.co2Log.findMany({ where: { userId: req.user.id, status: 'logged', createdAt: { gte: start, lt: end } }, select: { type: true, pointsEarned: true } }),
      prisma.co2Log.findMany({ where: { userId: req.user.id, type: 'travel', status: 'logged', createdAt: { gte: new Date(Date.now() - 3 * 60 * 60 * 1000) } }, select: { details: true } })
    ]);
    const duplicate = isDuplicateTrip(recentTrips, { origin: result.origin, destination: result.destination, chosenVehicle: result.vehicle });
    if (duplicate) return res.status(409).json({ error: { code: 'DUPLICATE_TRIP', message: 'This trip was already logged within the last 3 hours.' } });
    if (!canAddTravelLog(todayLogs.filter((log) => log.type === 'travel').length)) {
      return res.status(409).json({ error: { code: 'TRAVEL_LOG_LIMIT', message: 'You can log at most 10 travel trips per day.' } });
    }
    const earnedToday = todayLogs.reduce((total, log) => total + log.pointsEarned, 0);
    const award = awardWithinDailyCap(savings.points, earnedToday);
    const log = await prisma.co2Log.create({ data: {
      userId: req.user.id, type: 'travel', status: 'logged', co2Kg: savings.co2Kg, savedKg: savings.savedKg, pointsEarned: award.pointsEarned, chosenVehicle: result.vehicle, distanceKm: result.distanceKm,
      details: { origin: result.origin, destination: result.destination, vehicle: result.vehicle, chosenVehicle: result.vehicle, baselineKg: savings.baselineKg, approximate: result.approximate },
      loggedAt: new Date()
    } });
    return res.status(201).json({ log, pointsEarned: award.pointsEarned, capReached: award.capReached, ...(award.capReached ? { reason: 'Daily limit reached (5 pts)' } : {}), emissions: { [result.vehicle]: savings.co2Kg }, approximate: result.approximate });
  } catch (error) { return next(error); }
}

function validateFood(body) {
  const items = body?.items;
  const itemCount = Array.isArray(items) ? items.length : items;
  if (!Number.isInteger(itemCount) || itemCount < 0) throw new TypeError('items must be a non-negative integer or array');
  const isVeg = requireBoolean(body?.isVeg, 'isVeg');
  const deliveryKm = body?.deliveryKm === undefined ? 0 : body.deliveryKm;
  if (typeof deliveryKm !== 'number' || !Number.isFinite(deliveryKm) || deliveryKm < 0) throw new TypeError('deliveryKm must be non-negative');
  const packaging = body?.packaging === undefined ? false : requireBoolean(body.packaging, 'packaging');
  const nudges = body?.nudges === undefined ? [] : body.nudges;
  if (!Array.isArray(nudges) || nudges.some((nudge) => typeof nudge !== 'string')) throw new TypeError('nudges must be an array of strings');
  return { items, isVeg, deliveryKm, packaging, nudges };
}

async function createPendingFood(req, res, next) {
  try {
    const food = validateFood(req.body);
    const log = await prisma.co2Log.create({ data: {
      userId: req.user.id, type: 'food', status: 'pending_log', co2Kg: 0,
      details: food
    } });
    return res.status(201).json(log);
  } catch (error) { return next(error); }
}

async function logFood(req, res, next) {
  try {
    if (!uuidPattern.test(req.params.id || '')) return res.status(400).json({ error: 'Log id must be a UUID' });
    const food = validateFood(req.body);
    const co2Kg = calculateFood(food);
    const requestedPoints = foodPoints(food.isVeg, food.nudges);
    const { start, end } = kolkataDayBounds();
    const todayLogs = await prisma.co2Log.findMany({ where: { userId: req.user.id, status: 'logged', createdAt: { gte: start, lt: end } }, select: { pointsEarned: true } });
    const award = awardWithinDailyCap(requestedPoints, todayLogs.reduce((total, log) => total + log.pointsEarned, 0));
    const result = await prisma.co2Log.updateMany({ where: { id: req.params.id, userId: req.user.id, type: 'food', status: 'pending_log' }, data: {
      status: 'logged', co2Kg, savedKg: award.pointsEarned, pointsEarned: award.pointsEarned, details: food, loggedAt: new Date()
    } });
    if (!result.count) return res.status(404).json({ error: 'Pending food log not found' });
    return res.json({ log: await prisma.co2Log.findFirst({ where: { id: req.params.id, userId: req.user.id } }), pointsEarned: award.pointsEarned, capReached: award.capReached, ...(award.capReached ? { reason: 'Daily limit reached (5 pts)' } : {}) });
  } catch (error) { return next(error); }
}

async function saveGrocery(req, res, next) {
  try {
    const { basketSize, productType, animalProducts, bagType } = req.body || {};
    const co2Kg = calculateGrocery({ basketSize, productType, animalProducts, bagType });
    const log = await prisma.co2Log.create({ data: {
      userId: req.user.id,
      type: 'grocery',
      status: 'logged',
      co2Kg,
      savedKg: 0,
      pointsEarned: 0,
      details: { basketSize, productType, animalProducts, bagType, approximate: true },
      loggedAt: new Date()
    } });
    return res.status(201).json({ log, co2Kg, approximate: true });
  } catch (error) { return next(error); }
}

async function listLogs(req, res, next) {
  try {
    const where = { userId: req.user.id };
    if (req.query.status !== undefined) {
      if (!['pending_log', 'logged'].includes(req.query.status)) return res.status(400).json({ error: 'Invalid status' });
      where.status = req.query.status;
    }
    return res.json(await prisma.co2Log.findMany({ where, orderBy: { createdAt: 'desc' } }));
  } catch (error) { return next(error); }
}

async function summary(req, res, next) {
  try {
    const logs = await prisma.co2Log.findMany({ where: { userId: req.user.id, status: 'logged' }, select: { type: true, co2Kg: true } });
    const totals = logs.reduce((result, log) => {
      result.totalKg += log.co2Kg;
      result[`${log.type}Kg`] += log.co2Kg;
      return result;
    }, { totalKg: 0, travelKg: 0, foodKg: 0, groceryKg: 0 });
    return res.json({ ...totals, logCount: logs.length });
  } catch (error) { return next(error); }
}

async function searchLocations(req, res, next) {
  try {
    const q = req.query.q || '';
    const results = await searchPlaces(q);
    return res.json(results);
  } catch (error) {
    return next(error);
  }
}

module.exports = { estimateTravel, saveTravel, createPendingFood, logFood, saveGrocery, listLogs, summary, searchLocations };
