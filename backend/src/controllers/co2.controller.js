const factors = require('../../../frontend/src/data/emissionFactors.json');
const prisma = require('../lib/prisma');
const { calculateFood, calculateTravel } = require('../services/co2Calculator');
const { getDistance } = require('../services/distance');

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
  const selectedVehicle = body?.vehicle;
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
    const co2Kg = result.emissions[result.vehicle];
    const log = await prisma.co2Log.create({ data: {
      userId: req.user.id, type: 'travel', status: 'logged', co2Kg, distanceKm: result.distanceKm,
      details: { origin: result.origin, destination: result.destination, vehicle: result.vehicle, approximate: result.approximate },
      loggedAt: new Date()
    } });
    return res.status(201).json({ ...log, emissions: { [result.vehicle]: co2Kg }, approximate: result.approximate });
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
  return { items, isVeg, deliveryKm, packaging };
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
    const result = await prisma.co2Log.updateMany({ where: { id: req.params.id, userId: req.user.id, type: 'food', status: 'pending_log' }, data: {
      status: 'logged', co2Kg, details: food, loggedAt: new Date()
    } });
    if (!result.count) return res.status(404).json({ error: 'Pending food log not found' });
    return res.json(await prisma.co2Log.findFirst({ where: { id: req.params.id, userId: req.user.id } }));
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
    }, { totalKg: 0, travelKg: 0, foodKg: 0 });
    return res.json({ ...totals, logCount: logs.length });
  } catch (error) { return next(error); }
}

module.exports = { estimateTravel, saveTravel, createPendingFood, logFood, listLogs, summary };
